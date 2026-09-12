# Buntok Core Backend Framework Roadmap

Status: proposed
Target: production-ready beta -> stable backend framework
Scope: `packages/buntok-core`

This document defines the work required for `@buntok/core` to present a reliable, secure, observable, and testable backend framework for Bun. It covers runtime behavior, security, operational contracts, integrations, CLI quality, documentation, and release validation.

This is an implementation plan. It does not claim that the planned behavior is already shipped.

## 1. Current Position

`@buntok/core` already has broad backend framework coverage:

- AOT routing with static and dynamic routes.
- Functional routing and controller/decorator APIs.
- Middleware, groups, guards, CORS, compression, rate limiting, request IDs, timeout, body-size limits, and security headers.
- Zod validation for body, query, params, multipart, form-urlencoded, text, XML, and binary bodies.
- Standard `Response` helpers and flexible handler return values.
- `app.request()` for portless tests and `app.fetch()` for fetch-based adapters.
- IoC container, constructor factories, controller registration, and dependency metadata.
- JWT authentication and OAuth helpers.
- File uploads, static files, SSE, WebSockets, cache, queues, scheduler, mailer, payments, OpenAPI, and health checks.
- CLI commands for initialization, build, type checking, generators, database delegation, route inspection, and test scaffolding.
- TypeScript declarations and a large unit/middleware test suite.

The main gap is not feature breadth. The main gap is the strength of the production contract around those features:

- What happens during shutdown?
- What survives a process crash?
- Which defaults are safe in a multi-instance deployment?
- How are requests correlated across logs and traces?
- Which external integrations are actually tested?
- Does the package test command validate the real test suite?
- Are all public docs and exports aligned with runtime behavior?

## 2. Goals

### 2.1 Framework goals

1. Provide a predictable lifecycle from startup through graceful shutdown.
2. Make secure deployment the default or clearly document every unsafe tradeoff.
3. Provide reliable health, readiness, logging, tracing, and metrics primitives.
4. Define durable behavior for queues and external drivers instead of only exposing adapters.
5. Make `bun test`, type checking, package build, CLI validation, and release checks reproducible.
6. Keep the functional API and controller API consistent with one runtime contract.
7. Make generated projects compile, test, build, and start without manual repair.
8. Ensure documentation and AI skill guidance describe shipped behavior only.

### 2.2 Non-goals

The following are not required for the next production milestone:

- Replacing Bun's HTTP server.
- Building a browser playground.
- Providing a universal ORM abstraction that hides every ORM difference.
- Supporting every cloud provider with a first-party deployment adapter.
- Adding a second CLI implementation outside `buntok-core`.
- Guaranteeing distributed behavior for process-local drivers.

## 3. Release Gates

A release may be called production-ready only when all P0 gates pass.

### Gate A: package validation

- `bun run typecheck` passes.
- `bun test tests` passes.
- `bun run build` passes.
- ESM, CJS, and declaration exports resolve from a temporary consumer project.
- CLI entry point runs from the built package.
- No generated artifact is required from a developer's local `dist` directory.

### Gate B: runtime lifecycle

- Startup failures return a non-zero exit code.
- Port conflicts are deterministic and documented.
- `app.close()` is idempotent.
- Shutdown drains HTTP, WebSocket, SSE, queues, schedulers, and plugin resources according to configured timeouts.
- Repeated app instances do not share accidental global signal-handler state.
- Shutdown tests pass under SIGINT and SIGTERM.

### Gate C: security

- Forwarded headers require explicit trusted-proxy configuration.
- Authentication validates token claims and algorithm expectations.
- Cookie and CSRF behavior is documented and tested.
- Body, upload, request, and timeout limits are enforced.
- Logs redact secrets and sensitive request data by default.

### Gate D: distributed behavior

- Queue acknowledgment, retry, crash recovery, and dead-letter behavior are documented per driver.
- Process-local drivers are explicitly marked single-process.
- External driver integration tests run in CI or are clearly separated as opt-in tests.

### Gate E: documentation

- README, CLI docs, `SKILL.md`, and generated templates agree.
- Every documented command is verified against the CLI implementation.
- Every documented public import exists in `src/core-exports.ts` or the relevant package export.
- Known limitations appear next to the affected feature.

## 4. Priority Model

### P0: release blockers

Work that affects correctness, data safety, security, package validation, or the basic production lifecycle.

### P1: production capability

Work that improves reliable deployment, observability, security posture, and external integrations.

### P2: framework maturity

Work that improves ergonomics, documentation, consistency, and long-term maintainability after the production contract is stable.

## 5. Workstream P0-A: Test and Release Reliability

### Problem

The current package test script points at `test/src/index.ts`, which starts a test server. It does not represent the actual `tests/` suite as the canonical package test command. A package can therefore appear healthy while important tests are not executed.

### Deliverables

Update `packages/buntok-core/package.json` with explicit scripts:

```json
{
  "typecheck": "tsc --noEmit",
  "test": "bun test tests",
  "test:watch": "bun test --watch tests",
  "test:unit": "bun test tests/helpers tests/middlewares",
  "test:integration": "bun test tests/combinations.test.ts tests/app.test.ts",
  "build": "...existing build command...",
  "ci": "bun run typecheck && bun test tests && bun run build"
}
```

Keep any server fixture script under a name that describes its purpose, such as `test:server`.

### Test layers

1. Unit tests for pure helpers and normalizers.
2. Integration tests for routing, middleware, context, and response contracts.
3. Lifecycle tests for startup, port conflict, close, SIGINT, and SIGTERM.
4. External-driver tests for Redis, BullMQ, RabbitMQ, database adapters, and OTel.
5. Package-consumer tests for ESM, CJS, type declarations, and CLI installation.
6. CLI fixture tests for `init`, `create`, `check`, `build`, `debug:routes`, and generators.

### Required CI matrix

At minimum:

| Job | Checks |
|-----|--------|
| `typecheck` | Core TypeScript and declaration compatibility |
| `unit` | Pure helpers and middleware |
| `integration` | App, routing, validation, controllers, and lifecycle |
| `package` | Build, ESM/CJS import, declarations, and CLI |
| `docs-contract` | Examples and generated project smoke test |
| `external` | Redis/RabbitMQ/OTel tests when services are available |

### Acceptance criteria

- Running `bun test` from `packages/buntok-core` executes the real suite.
- The test command does not start a long-running server.
- A clean checkout can run the CI command after dependency installation.
- A temporary consumer can import `@buntok/core`, `@buntok/core/client`, and supported plugin exports.

## 6. Workstream P0-B: Application Lifecycle and Shutdown

### Problem

A backend framework must provide a lifecycle contract. The current server starts and handles requests, but shutdown behavior, resource ownership, and cleanup are not expressed as one public API.

### Public API proposal

```ts
interface ShutdownOptions {
  timeout?: number;
  force?: boolean;
}

class App {
  listen(port?: number, callback?: () => void): void;
  close(options?: ShutdownOptions): Promise<void>;
  shutdown(options?: ShutdownOptions): Promise<void>;
}
```

`close()` should be the canonical method. `shutdown()` may be an alias if compatibility requires it.

### Resource registry

Add an internal lifecycle registry with explicit ownership:

```ts
interface Disposable {
  close?: () => void | Promise<void>;
  dispose?: () => void | Promise<void>;
  name?: string;
}
```

Resources should be registered by:

- HTTP server.
- WebSocket server resources.
- SSE broadcasters.
- Queue workers and producers that maintain connections.
- Scheduler timers and cron jobs.
- Cache/database clients created by framework integrations.
- Plugin resources.
- OpenTelemetry providers/exporters.

### Shutdown order

1. Stop accepting new HTTP connections.
2. Stop accepting new WebSocket connections and close or drain existing connections according to configuration.
3. Stop accepting new queue jobs.
4. Stop scheduler execution.
5. Finish in-flight HTTP requests up to the configured deadline.
6. Finish or cancel SSE streams according to policy.
7. Close queue, cache, database, and telemetry resources.
8. Run plugin disposal hooks.
9. Resolve `close()` when complete.
10. Force exit only after the timeout and only when configured by the host process.

### Signal handling

- Install signal handling at most once per application process.
- Do not use a global flag that prevents later app instances from being cleaned up in tests.
- Make signal registration optional for embedded/serverless usage.
- Expose `app.close()` for test runners and hosts that own signals.
- Ensure repeated `close()` calls are safe.

### Acceptance criteria

- `await app.close()` can be called before `listen()` and after `listen()`.
- Calling `close()` twice does not throw.
- A shutdown timeout produces a structured warning and a deterministic result.
- No timer, worker, or signal listener remains after shutdown in tests.
- SIGINT and SIGTERM integration tests pass.

## 7. Workstream P0-C: Queue Reliability Contract

### Problem

Queue breadth is useful, but queue reliability depends on acknowledgment, ownership, retries, crash recovery, and dead-letter behavior. A driver adapter is not automatically a durable queue.

### Contract to define

Every queue driver must document:

- Delivery semantics: at-most-once, at-least-once, or best effort.
- Acknowledgment timing.
- Retry count and delay.
- Backoff strategy.
- Visibility timeout or lease duration.
- Crash recovery behavior.
- Dead-letter behavior.
- Concurrency model.
- Ordering guarantees.
- Idempotency expectations.
- Maximum payload size.
- `size()` semantics.
- Close/drain behavior.

### Required queue API capabilities

```ts
interface Queue<T> {
  add(job: T, options?: JobOptions): Promise<JobHandle>;
  process(handler: JobHandler<T>, options?: WorkerOptions): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  drain(options?: DrainOptions): Promise<void>;
  close(options?: CloseOptions): Promise<void>;
  size(): Promise<number | null>;
}
```

`null` is preferable to returning a false `0` when a driver cannot determine queue size.

### Redis drivers

Implement or verify:

- Processing lease/visibility timeout.
- Recovery of jobs left in processing after worker crash.
- Atomic claim operation.
- Retry metadata stored with the job.
- Idempotent acknowledgment.
- Shutdown drain.
- Integration tests with a real Redis service.

### RabbitMQ driver

Implement or verify:

- Queue declaration and consumer acknowledgment mode.
- Prefetch/concurrency configuration.
- Retry exchange or retry queue.
- Dead-letter exchange and dead-letter queue configuration.
- Requeue policy.
- Connection and channel recovery.
- Graceful consumer cancellation.

A `nack` call alone must not be documented as dead-letter support unless a dead-letter exchange is configured.

### BullMQ driver

Document that BullMQ owns durability and retry semantics, then expose only settings Buntok can guarantee. Add tests for worker close, stalled jobs, retry, and failed jobs.

### Acceptance criteria

- Each driver has a capability table in docs.
- Crash recovery and retry behavior have integration tests.
- Queue workers participate in `app.close()`.
- The default docs do not imply durability for memory queues.

## 8. Workstream P0-D: Security Baseline

### 8.1 Trusted proxies

#### Problem

`x-forwarded-for` must not be trusted from arbitrary clients. Otherwise client IP, rate-limit keys, audit records, and security decisions can be spoofed.

#### API proposal

```ts
app.setTrustedProxy({
  addresses: ["127.0.0.1", "10.0.0.0/8"],
  depth: 1,
});
```

Alternative naming is acceptable, but the behavior must be explicit.

#### Requirements

- Default: do not trust forwarding headers.
- Support loopback, CIDR, exact address, and proxy depth where practical.
- Document behavior for `x-forwarded-for`, `x-real-ip`, and direct socket address.
- Use the same resolved client IP in context, rate limiter, audit log, and health diagnostics.
- Add spoofing tests.

### 8.2 JWT hardening

Add or document:

- Explicit algorithm allow-list.
- `iss` issuer validation.
- `aud` audience validation.
- `nbf` not-before validation.
- Clock tolerance.
- Secret/key strength requirements.
- Key rotation through key IDs or a key resolver.
- Refresh-token guidance.
- Revocation strategy.
- Cookie mode security flags.
- CSRF mitigation when authentication uses cookies.

Do not add a refresh-token API until storage, revocation, rotation, and failure semantics are defined.

### 8.3 Request and upload limits

Verify and document limits for:

- Maximum request body.
- Multipart field count.
- Multipart file size.
- Total upload size.
- JSON nesting or parser limits where applicable.
- Route timeout.
- Header size where Bun controls it.
- WebSocket message size.
- SSE connection count.

### 8.4 Sensitive data handling

- Redact authorization headers, cookies, tokens, passwords, and database URLs in logs.
- Add configurable redaction paths for structured payloads.
- Never log full request bodies by default.
- Add tests that assert secrets do not appear in formatted logs.

## 9. Workstream P1-A: Health, Readiness, and Metrics

### Health endpoint model

Separate process health from dependency readiness:

```txt
GET /health/live   -> process is alive
GET /health/ready  -> process can accept traffic
GET /metrics       -> metrics exposition
```

Keep the existing health API compatible where possible, but document the distinction.

### Readiness checks

Each check must support:

```ts
interface ReadinessCheck {
  name: string;
  timeout?: number;
  check: () => boolean | Promise<boolean>;
}
```

Requirements:

- Per-check timeout.
- Overall timeout.
- No hanging readiness request.
- Structured result with check name, status, and duration.
- `503` while not ready.
- No database credentials or internal error details in public responses.

### Metrics

Provide a minimal metrics abstraction independent of a specific exporter:

- Request count by method, route template, and status class.
- Request duration histogram or bucketed timing.
- In-flight request count.
- Error count.
- Queue job count and duration.
- Queue failures and retries.
- WebSocket active connections.
- SSE active connections.
- Readiness check result.

Avoid using raw URL values as metric labels to prevent unbounded cardinality.

### Request correlation

Every request should have one request ID:

1. Accept a request ID only according to a documented trust policy.
2. Generate one when absent.
3. Put it in the response header.
4. Store it in context.
5. Include it in logs and traces.
6. Preserve it across queue jobs when explicitly propagated.

## 10. Workstream P1-B: Logging and OpenTelemetry

### Logger requirements

- Structured fields for request ID, method, route, status, duration, and error.
- Error serialization with name, message, stack, and cause where safe.
- Redaction before output.
- Log level filtering.
- Text and JSON formats.
- File output with rotation/retention or explicit limitation.
- External sink interface.
- Flush/close lifecycle integration.

### OpenTelemetry requirements

- Declare optional SDK/exporter dependencies accurately as peer dependencies.
- Avoid installing process-global signal handlers without opt-in.
- Create HTTP server spans with method, route template, status, and request ID.
- Propagate trace context.
- Record exceptions and span status.
- Support exporter shutdown through `app.close()`.
- Document the exact minimum Bun and OTel versions.
- Add a test exporter for deterministic integration tests.

### Acceptance criteria

- A request can be followed from response header to log line to trace.
- Shutdown flushes telemetry within the configured timeout.
- Missing optional OTel dependencies produce a clear installation error.

## 11. Workstream P1-C: Authentication and Authorization

### Authentication contract

Document and test:

- Header mode: `Authorization: Bearer <token>`.
- Cookie mode: cookie name, `HttpOnly`, `Secure`, `SameSite`, and domain/path behavior.
- What `ctx.user` contains and when it is `undefined`.
- Error responses for missing, malformed, expired, and invalid tokens.
- Required secret length and algorithm.

### Authorization contract

- Guard execution order.
- Whether a guard can return `false` or a response.
- Standard `403` response shape.
- Public route metadata behavior.
- Controller and functional API parity.

### CSRF

If cookie authentication is supported, provide one documented CSRF strategy:

- SameSite policy plus origin checking, or
- CSRF token middleware, or
- an explicit statement that cookie mode requires an application-level CSRF layer.

Do not imply that JWT cookie storage alone prevents CSRF.

## 12. Workstream P1-D: Lifecycle Integration for Plugins, Scheduler, Cache, and DB

### Plugins

Add an optional teardown hook:

```ts
interface Plugin<DI> {
  name: string;
  install(app: App<DI>): void | Promise<void>;
  dispose?: (app: App<DI>) => void | Promise<void>;
}
```

Plugin names remain private implementation state unless a supported inspection API is intentionally added.

### Scheduler

Define:

- Ownership of timers.
- Whether duplicate schedules are allowed.
- Time zone behavior.
- Missed-run behavior after process downtime.
- Overlap policy.
- Shutdown cancellation.
- Distributed lock requirements.

### Cache

Define per driver:

- Atomicity of `getOrSet`.
- TTL precision.
- Serialization behavior.
- Stampede protection.
- Process-local versus distributed scope.
- Close behavior.

### Database and ORM adapters

For each ORM:

- Document supported CRUD methods.
- Document lifecycle hook differences.
- Document transaction support.
- Document migration ownership.
- Add integration tests with a real test database.
- Do not present adapter-specific methods as universal when implementations differ.

## 13. Workstream P1-E: CLI and Generated Project Contract

### `buntok init`

The generated project must satisfy this smoke workflow:

```bash
mkdir fixture && cd fixture
bun init -y
bun add @buntok/core
bunx buntok init
bun run check
bun run dev
bun run build
bun run start
```

The smoke test should verify:

- Files created.
- Scripts created.
- `server.ts` starts.
- `/` responds.
- `buntok build` creates `.buntok/server.js`.
- `buntok start` runs the output.
- `buntok init` is idempotent and does not overwrite user files.

### `buntok check`

Improve diagnostics:

- Capture stdout and stderr.
- Preserve TypeScript exit code.
- Support JSON with stable schema.
- Include file, line, column, code, message, and optional source excerpt.
- Avoid silently truncating machine-readable output.
- Add CI formats only after the JSON schema is stable.

### Generators

Every generator must have:

- Dry-run test.
- Existing-file test.
- Generated-output typecheck.
- Generated-output format check.
- ORM-specific behavior test.
- Idempotency test.

Generated tests must contain meaningful assertions. A placeholder test must be named as a scaffold and must not be presented as a complete test.

### Database CLI

Keep ORM delegation explicit:

- Detect ORM and show the detected driver.
- Reject ambiguous multiple-ORM projects unless the user selects one.
- Reject unsupported operations with a clear message.
- Separate development migration creation from production migration deployment.
- Require confirmation for destructive reset.
- Provide `--dry-run` before executing an external command.
- Use argument arrays instead of shell interpolation where possible.

## 14. Workstream P1-F: Package and Export Correctness

Run an export inventory against `src/core-exports.ts` and all subpath exports.

For every documented example:

1. Resolve the import.
2. Typecheck the snippet.
3. Run it when it depends on runtime behavior.
4. Verify defaults against source.
5. Verify status codes and headers against tests.

Known contract issues to resolve:

- `@All` decorator route support must match `app.all()` behavior or be removed from supported claims.
- `@Redirect` behavior must either avoid executing the handler or be documented as executing it.
- Binary return types must be added to `HandlerReturn` or removed from typed examples.
- `sqliteStore` must be exported from `@buntok/core` or omitted from the main-package examples.
- `Factory.ref()` must either become lazy or be documented as eager.
- All deprecated aliases must identify the correct current API.

## 15. Workstream P2: Documentation and AI Agent Experience

### Documentation structure

Maintain three layers:

1. Getting started: install, init, first route, test, build.
2. Concept guides: routing, middleware, validation, auth, DI, queues, deployment.
3. Reference: exports, options, status codes, driver capabilities, CLI flags.

### AI agent rules

`SKILL.md` should instruct agents to:

- Inspect the repository before editing.
- Preserve the project's chosen API style.
- Verify exports before writing imports.
- Use `app.request()` for tests.
- Run focused validation after each code change.
- Avoid `app.listen()` in modules that must be imported by tests or serverless adapters.
- Distinguish process-local features from distributed drivers.
- State unsupported boundaries instead of inventing behavior.

### Documentation contract tests

Add a small script that checks:

- Every command in the skill guide exists in CLI usage or implementation.
- Every main-package import resolves.
- No stale output path appears.
- No deprecated API is presented as the preferred API.
- Examples use the current `server.ts` and `.buntok/server.js` flow.

## 16. Workstream P2: Performance and Benchmark Integrity

Performance claims must be reproducible and separated from correctness claims.

### Benchmark requirements

- Run each framework in randomized order.
- Warm up before measuring.
- Run multiple iterations.
- Report median and variance, not one run.
- Pin server and client CPU affinity consistently.
- Record Bun version, kernel, CPU model, core count, and memory.
- Do not include a zero-valued closing tick in time series.
- Use equivalent route implementations across frameworks.
- Report whether the route returns a raw value or an explicitly constructed `Response`.

### Framework optimization priorities

After correctness and lifecycle work:

1. Measure AOT generated route dispatch.
2. Measure response construction separately from network throughput.
3. Compare functional routes and controller routes separately.
4. Benchmark with and without global middleware.
5. Avoid optimizing based on one noisy run.

## 17. Implementation Phases

### Phase 0: contract freeze and inventory

Duration target: 1 week.

Tasks:

- Freeze the current public API list.
- Inventory exports, CLI commands, and package subpaths.
- Mark docs claims as verified, stale, or proposed.
- Add issue labels: `p0`, `p1`, `p2`, `security`, `lifecycle`, `queue`, `docs`.
- Decide compatibility policy for version 2.x.

Exit criteria:

- Public API inventory reviewed.
- Known contract mismatches tracked.
- Release gates accepted by maintainers.

### Phase 1: test and lifecycle foundation

Duration target: 1-2 weeks.

Tasks:

- Fix package test scripts.
- Add CI commands.
- Implement `app.close()`.
- Refactor signal handling.
- Add resource registry.
- Add lifecycle and shutdown tests.

Exit criteria:

- A clean package run executes the real tests.
- Applications can start and close deterministically.
- No known test process leaks remain.

### Phase 2: security baseline

Duration target: 1-2 weeks.

Tasks:

- Add trusted proxy configuration.
- Apply resolved IP consistently.
- Add JWT claim and algorithm validation.
- Document cookie and CSRF boundaries.
- Add redaction and upload/body limit tests.

Exit criteria:

- Forwarded-header spoofing tests pass.
- Authentication failure cases are stable and documented.
- Secrets are absent from default logs.

### Phase 3: readiness and observability

Duration target: 1-2 weeks.

Tasks:

- Separate liveness and readiness.
- Add bounded dependency checks.
- Add metrics abstraction and endpoint integration.
- Correlate request IDs, logs, and traces.
- Make OTel optional dependencies explicit.
- Integrate flush/close with lifecycle.

Exit criteria:

- Operators can determine alive versus ready.
- A request can be traced through logs and telemetry.
- Telemetry shuts down cleanly.

### Phase 4: durable integrations

Duration target: 2-4 weeks.

Tasks:

- Define queue capability matrix.
- Implement queue close/drain.
- Add Redis lease recovery.
- Add RabbitMQ dead-letter configuration.
- Add external-driver integration tests.
- Document process-local limitations.

Exit criteria:

- Queue semantics are explicit per driver.
- Crash/retry/dead-letter behavior is tested.
- Queue resources participate in shutdown.

### Phase 5: CLI, generators, and docs contract

Duration target: 1-2 weeks.

Tasks:

- Add init smoke project.
- Test all generators.
- Fix check output and exit behavior.
- Add database CLI safety.
- Add docs contract checker.
- Regenerate and verify `SKILL.md`.

Exit criteria:

- A new project can check, test, build, and start.
- Generated files are valid or explicitly marked as scaffolds.
- Docs examples match exports and runtime.

### Phase 6: beta release hardening

Duration target: 1 week.

Tasks:

- Run full CI matrix.
- Run security review.
- Run dependency audit.
- Test supported Bun versions.
- Build ESM, CJS, and declaration artifacts.
- Publish release notes and migration notes.
- Tag a release candidate.

Exit criteria:

- All P0 gates pass.
- P1 gaps are either complete or explicitly documented.
- No release-blocking known issue remains.

## 17.1 Copy-ready Agent Prompts by Phase

Use one prompt at a time. Do not give an agent all phases in one task. Each prompt below intentionally limits the files and behavior that may change.

### Prompt: Phase 0 - contract inventory

```md
Repository: /home/pitok/Projects/framework-bun
Scope: packages/buntok-core only.

Read packages/buntok-core/BACKEND-FRAMEWORK-ROADMAP.md and perform Phase 0 only.

Goal:
Create a verified inventory of the current public contract before implementation begins.

Inspect:
- packages/buntok-core/package.json
- packages/buntok-core/src/core-exports.ts
- packages/buntok-core/src/app.ts
- packages/buntok-core/src/context.ts
- packages/buntok-core/src/middlewares/**
- packages/buntok-core/src/queue-drivers/**
- packages/buntok-core/src/cli/**
- packages/buntok-core/tests/**
- packages/buntok-core/scripts/buntok-skill/SKILL.md

Tasks:
1. Inventory public package exports, subpath exports, CLI commands, and package scripts.
2. Compare documented signatures, defaults, status codes, and runtime behavior with source and tests.
3. Record every mismatch in a new or existing issue-style section of the roadmap. Do not fix implementation yet.
4. Classify findings as docs-only, code-required, test-required, or release-blocking.

Boundaries:
- Do not modify runtime source.
- Do not change public APIs.
- Do not modify packages outside packages/buntok-core.
- Do not commit or push.

Validation:
- Run git diff --check.
- Report the files inspected, verified contracts, mismatches, and recommended next phase.
```

### Prompt: Phase 1 - test and lifecycle foundation

```md
Repository: /home/pitok/Projects/framework-bun
Scope: packages/buntok-core only.

Implement Phase 1 from BACKEND-FRAMEWORK-ROADMAP.md: package test reliability and application lifecycle.

Primary goals:
1. Make the canonical package test command execute packages/buntok-core/tests/**.
2. Add an idempotent app.close() lifecycle API.
3. Refactor signal handling so it is instance-safe and testable.
4. Add focused lifecycle tests.

Allowed files:
- packages/buntok-core/package.json
- packages/buntok-core/src/app.ts
- packages/buntok-core/src/plugin.ts if lifecycle hooks require it
- packages/buntok-core/src/logger.ts if close/flush integration is required
- packages/buntok-core/src/queue/** and packages/buntok-core/src/queue-drivers/** only when close/drain is required by existing APIs
- packages/buntok-core/tests/**
- packages/buntok-core/README.md and SKILL.md only for verified behavior changes

Required behavior:
- await app.close() is safe before listen().
- await app.close() is safe when called repeatedly.
- close does not call process.exit() directly.
- signal handlers do not duplicate across repeated app instances.
- embedded/serverless/test usage can disable signal registration.
- shutdown honors a bounded timeout.
- existing listen(), request(), fetch(), and benchmark behavior remain compatible.

Required tests:
- close before listen;
- close after listen;
- repeated close;
- shutdown timeout;
- signal registration cleanup;
- no request accepted after close;
- existing response and routing tests.

Boundaries:
- Do not implement trusted proxy, JWT changes, queue durability, metrics, or new health endpoints in this phase.
- Do not refactor unrelated routing or response code.
- Do not change API names without documenting a compatibility reason.
- Do not commit or push.

Validation before reporting:
- bun run typecheck
- bun test tests
- bun run build
- git diff --check

Report changed files, lifecycle semantics, tests, command output summary, and residual risks.
```

### Prompt: Phase 2 - security baseline

```md
Repository: /home/pitok/Projects/framework-bun
Scope: packages/buntok-core only.

Implement Phase 2 from BACKEND-FRAMEWORK-ROADMAP.md: trusted proxy and security baseline.

Primary goals:
1. Stop trusting x-forwarded-for by default.
2. Add explicit trusted-proxy configuration.
3. Make ctx.ip, rate limiting, and audit logging use one consistent client-IP resolver.
4. Audit JWT validation, cookie security, CSRF boundaries, and sensitive-data logging.

Allowed files:
- packages/buntok-core/src/context.ts
- packages/buntok-core/src/middlewares/rate-limiter.ts
- packages/buntok-core/src/helpers/network.ts
- packages/buntok-core/src/auth.ts
- packages/buntok-core/src/logger.ts
- packages/buntok-core/src/app.ts only for configuration plumbing
- packages/buntok-core/src/core-exports.ts
- packages/buntok-core/tests/**
- security-related docs and SKILL.md only after behavior is verified

Required behavior:
- default configuration does not trust forwarded headers;
- trusted proxy supports the simplest safe form first, with explicit documentation;
- spoofed forwarded headers do not change the client IP when the sender is untrusted;
- rate limiter uses the same resolved IP as context;
- JWT algorithm and claim behavior is explicit and tested;
- cookie mode documents Secure, HttpOnly, SameSite, and CSRF requirements;
- authorization headers, cookies, tokens, and passwords are redacted from logs.

Boundaries:
- Do not add refresh-token storage or key rotation unless the repository already has a coherent storage contract.
- Do not change queue, scheduler, metrics, or shutdown behavior.
- Preserve existing auth API where possible; add compatibility notes for breaking changes.
- Do not commit or push.

Validation:
- focused security tests first;
- bun run typecheck;
- bun test tests;
- bun run build;
- git diff --check.
```

### Prompt: Phase 3 - readiness and observability

```md
Repository: /home/pitok/Projects/framework-bun
Scope: packages/buntok-core only.

Implement Phase 3 from BACKEND-FRAMEWORK-ROADMAP.md: health, readiness, metrics, logging correlation, and OpenTelemetry lifecycle.

Primary goals:
1. Distinguish liveness from readiness.
2. Add bounded dependency checks.
3. Add low-overhead request metrics with bounded route labels.
4. Correlate request IDs across response headers, context, logs, and traces.
5. Make OpenTelemetry optional and closeable.

Allowed files:
- packages/buntok-core/src/health.ts and health middleware/routes
- packages/buntok-core/src/logger.ts
- packages/buntok-core/src/middlewares/request-id.ts
- packages/buntok-core/src/plugins/opentelemetry.ts
- packages/buntok-core/src/app.ts
- packages/buntok-core/src/core-exports.ts
- packages/buntok-core/tests/**
- relevant docs and SKILL.md after source verification

Required behavior:
- readiness checks have per-check and overall timeouts;
- liveness does not depend on external services;
- readiness returns a stable non-ready status without leaking secrets;
- metrics do not use raw unbounded URLs as labels;
- observability is disabled or low-overhead unless explicitly enabled;
- request ID is generated once and reused;
- logger and telemetry resources participate in app.close().

Boundaries:
- Do not add a mandatory metrics vendor dependency.
- Do not enable tracing or body logging by default.
- Do not redesign the logger unrelated to correlation/redaction/lifecycle.
- Do not change queue semantics in this phase.
- Do not commit or push.

Validation:
- focused health, metrics, request-ID, logger, and OTel tests;
- bun run typecheck;
- bun test tests;
- bun run build;
- compare a minimal route benchmark with observability disabled.
```

### Prompt: Phase 4 - durable integrations

```md
Repository: /home/pitok/Projects/framework-bun
Scope: packages/buntok-core only.

Implement Phase 4 from BACKEND-FRAMEWORK-ROADMAP.md: queue capability contracts, close/drain, crash recovery, retry, and dead-letter behavior.

Primary goals:
1. Define a capability matrix for memory, Redis, Bun Redis, BullMQ, and RabbitMQ drivers.
2. Make unsupported guarantees explicit.
3. Add queue close() and drain() integration with app.close().
4. Verify Redis lease/recovery behavior.
5. Configure RabbitMQ dead-letter behavior rather than implying nack alone is enough.

Allowed files:
- packages/buntok-core/src/queue/**
- packages/buntok-core/src/queue-drivers/**
- packages/buntok-core/src/app.ts only for lifecycle registration
- packages/buntok-core/src/core-exports.ts
- packages/buntok-core/tests/**
- queue docs and SKILL.md after behavior is verified

Required behavior:
- each driver documents delivery semantics;
- retry and acknowledgment behavior is explicit;
- processing leases recover jobs after worker failure where supported;
- dead-letter behavior is configured and tested where supported;
- queue workers stop accepting work during shutdown;
- queue close/drain is bounded and idempotent;
- size() returns a truthful value or null when unavailable, never a misleading zero.

Boundaries:
- Do not claim exactly-once delivery.
- Do not silently emulate durability in memory drivers.
- Do not change HTTP routing or response hot paths.
- External service tests may be opt-in, but unit tests must cover failure paths.
- Do not commit or push.

Validation:
- driver unit tests;
- Redis/RabbitMQ/BullMQ integration tests when services are available;
- bun run typecheck;
- bun test tests;
- bun run build.
```

### Prompt: Phase 5 - CLI, generators, and documentation contract

```md
Repository: /home/pitok/Projects/framework-bun
Scope: packages/buntok-core only.

Implement Phase 5 from BACKEND-FRAMEWORK-ROADMAP.md: generated-project smoke tests, CLI diagnostics, generator correctness, database CLI safety, and documentation contract checks.

Primary goals:
1. Verify buntok init -> check -> test -> build -> start in a temporary fixture.
2. Test init idempotency and non-overwrite behavior.
3. Test create and make:* generators, including dry-run and existing-file behavior.
4. Stabilize buntok check JSON output and exit codes.
5. Make database delegation explicit, safe, and dry-runnable.
6. Verify SKILL.md and docs examples against exports and CLI usage.

Allowed files:
- packages/buntok-core/src/cli/**
- packages/buntok-core/src/cli/generators/**
- packages/buntok-core/package.json
- packages/buntok-core/tests/**
- packages/buntok-core/scripts/buntok-skill/SKILL.md
- packages/buntok-core/README.md only for verified CLI changes

Required behavior:
- generated project compiles and starts;
- generated output is either valid or explicitly labeled as a scaffold;
- destructive database commands require confirmation;
- unsupported or ambiguous ORM operations fail clearly;
- external commands use safe argument handling;
- check --json has stable machine-readable output and preserves exit code;
- every documented command and public import is verified.

Boundaries:
- Do not modify the standalone buntok-cli package.
- Do not change framework runtime behavior unless a generator contract requires it.
- Do not add undocumented CLI flags.
- Do not commit or push.

Validation:
- CLI integration tests;
- generated fixture typecheck and build;
- bun run typecheck;
- bun test tests;
- bun run build;
- docs contract checker output.
```

### Prompt: Phase 6 - beta release hardening

```md
Repository: /home/pitok/Projects/framework-bun
Scope: release validation for packages/buntok-core only. Do not implement new feature breadth.

Run Phase 6 from BACKEND-FRAMEWORK-ROADMAP.md as a release-readiness review.

Tasks:
1. Run the complete CI command.
2. Run package export tests for ESM, CJS, and declarations.
3. Test the built CLI from a temporary consumer project.
4. Run dependency and security audits.
5. Test supported Bun versions if the environment provides them.
6. Review lifecycle, security, queue, observability, and docs gates.
7. Produce release notes and migration notes for any breaking change.

Boundaries:
- Do not silently fix unrelated failures.
- Do not change public behavior during the audit without reporting it first.
- Do not claim release readiness if a P0 gate fails.
- Do not commit or push.

Required report:
- gate-by-gate pass/fail table;
- exact commands run;
- failed tests and confirmed causes;
- known risks and unsupported guarantees;
- required follow-up issues;
- release recommendation: ready, release candidate, or blocked.
```

### Shared agent reporting format

Every phase agent must finish with:

```md
## Phase result

Status: complete | partial | blocked

### Changed files
- path/to/file

### Behavior changes
- ...

### Tests and validation
- `command`: pass/fail

### Acceptance criteria
- [x] ...
- [ ] ...

### Known limitations
- ...

### Recommended next phase
- ...
```

## 18. Suggested Issue Breakdown

### P0 issues

- `core: make package test run tests directory`
- `core: add idempotent app.close API`
- `core: refactor signal handling and resource ownership`
- `core: define queue durability and shutdown contract`
- `core: add queue crash recovery tests`
- `core: add trusted proxy configuration`
- `core: add release CI for package exports and CLI`

### P1 issues

- `core: add liveness and readiness endpoints`
- `core: add metrics abstraction`
- `core: correlate request IDs with logs and traces`
- `core: harden JWT claims and key configuration`
- `core: add CSRF guidance and tests for cookie auth`
- `core: add OTel exporter lifecycle tests`
- `core: add external queue driver integration matrix`
- `core: add init-to-build-to-start smoke test`
- `core: stabilize buntok check JSON diagnostics`

### P2 issues

- `core: add plugin dispose lifecycle`
- `core: document cache atomicity and process scope`
- `core: document scheduler overlap and missed-run policy`
- `core: add docs contract checker`
- `core: add randomized benchmark runner`
- `core: align README and package Bun requirements`

## 19. Definition of Done

A work item is complete only when:

1. The public behavior is implemented or explicitly documented as unsupported.
2. The TypeScript API and runtime behavior agree.
3. Unit and integration tests cover the success and failure paths.
4. Shutdown and resource ownership are addressed when the feature opens a connection or timer.
5. Logs do not expose secrets.
6. Documentation includes defaults, limitations, and deployment scope.
7. CLI and generated templates use the same current contract.
8. ESM, CJS, and declaration builds remain valid.
9. The change passes focused tests before the full CI suite.
10. The release notes describe breaking changes and migration steps.

## 20. Recommended First Sprint

Do these tasks before adding more feature breadth:

1. Change the canonical package test command to run `tests/`.
2. Add `app.close()` with an idempotent implementation.
3. Add lifecycle tests for HTTP startup, port conflicts, SIGINT, SIGTERM, and repeated close.
4. Add trusted proxy configuration and use it in `ctx.ip` and rate limiting.
5. Add an `init -> check -> test -> build -> start` fixture test.
6. Create a queue capability matrix and mark unsupported guarantees.
7. Resolve the known `@All`, `@Redirect`, binary handler type, and `sqliteStore` contract mismatches.
8. Commit the resulting release gate changes before starting new feature work.

## 21. Decision Log Template

Use this template for decisions that affect public behavior:

```md
### Decision: <title>

Date: YYYY-MM-DD
Status: proposed | accepted | rejected | superseded
Owner: <name>

Context:

Decision:

Alternatives considered:

Compatibility impact:

Security impact:

Operational impact:

Tests:

Documentation:
```

## 22. Final Position

Buntok already has enough feature surface to be presented as a backend framework. The next milestone should not be another collection of integrations. It should make existing behavior dependable:

- real package validation;
- explicit lifecycle and shutdown;
- safe proxy and authentication behavior;
- observable health and requests;
- defined queue durability;
- tested CLI and generated projects;
- documentation that never overstates runtime guarantees.

Once the P0 gates pass and the major P1 contracts are implemented or documented, Buntok can credibly move from a broad beta framework to a stable production backend framework.
