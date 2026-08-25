---
name: buntok-skill
description: Use when the user is building, coding, or asking questions about a project that uses @buntok/core. Covers routing, controllers, decorators, validation, file upload, middleware, helpers, error handling, IoC container, SSE, WebSocket, and all utility functions.
---

# @buntok/core Skill Guide

Complete reference for building applications with `@buntok/core`.

## Install

```bash
bun add @buntok/core
# or
npm install @buntok/core
```

Requirement: Bun >= 1.0.0

---

## Quick Start

```ts
import { App } from "@buntok/core";

const app = new App();

app.get("/", (ctx) => {
  return ctx.json({ message: "Hello, Buntok!" });
});

app.listen(3000);
```

---

## App

### Creating Instance

```ts
import { App } from "@buntok/core";
const app = new App();
```

### API

| Method | Signature | Description |
|--------|-----------|-------------|
| `app.get` | `(path, ...handlers)` | Register GET route |
| `app.post` | `(path, ...handlers)` | Register POST route |
| `app.put` | `(path, ...handlers)` | Register PUT route |
| `app.patch` | `(path, ...handlers)` | Register PATCH route |
| `app.delete` | `(path, ...handlers)` | Register DELETE route |
| `app.options` | `(path, ...handlers)` | Register OPTIONS route |
| `app.head` | `(path, ...handlers)` | Register HEAD route |
| `app.all` | `(path, ...handlers)` | Register all methods |
| `app.query` | `(path, ...handlers)` | Register QUERY (RFC 10008) |
| `app.use` | `(middleware)` | Add global middleware |
| `app.group` | `(prefix)` | Create route group |
| `app.static` | `(routePath, directory)` | Serve static files |
| `app.ws` | `(path, handler)` | Register WebSocket endpoint |
| `app.listen` | `(port?, callback?)` | Start server |
| `app.request` | `(input, init?)` | Dispatch request (testing) |
| `app.onError` | `(handler)` | Override global error handler |
| `app.notFound` | `(handler)` | Override 404 handler |
| `app.set` | `(key, value)` | Store value in DI store |
| `app.setContainer` | `(container)` | Attach IoC Container |
| `app.registerController` | `(ControllerClass)` | Register controller with decorators |
| `app.validateEnv` | `(schema)` | Validate env vars with Zod |
| `app.disable` | `("x-powered-by")` | Disable built-in features |
| `app.enable` | `("x-powered-by")` | Re-enable disabled features |
| `app.enableReusePort` | `(enabled?)` | SO_REUSEPORT for multi-process (Linux) |
| `app.icon` | `(path)` | Set custom favicon path |

### validateEnv()

Type-safe env validation with Zod. Exits on failure.

```ts
const env = app.validateEnv({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(1212),
});
// env is fully typed
```

### disable() / enable()

```ts
app.disable("x-powered-by");  // Remove X-Powered-By header
app.enable("x-powered-by");   // Re-enable
```

### app.request()

Test routes without binding a port.

```ts
const res = await app.request("/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Alice" }),
});
const data = await res.json();
```

---

## Context

`ctx` is the single argument passed to every handler.

### Request

| Property / Method | Type | Description |
|-------------------|------|-------------|
| `ctx.request` | `Request` | Raw Bun Request object |
| `ctx.params` | `Record<string, string>` | Route parameters (`:id`, `*`) |
| `ctx.query` | `Record<string, string>` | Parsed query string (lazy, cached) |
| `ctx.ip` | `string` | Client IP — respects `x-forwarded-for` |
| `ctx.store` | `Record<string, any>` | Key-value store between middleware |
| `await ctx.body<T>()` | `Promise<T>` | Parse JSON body (cached) |
| `await ctx.formData()` | `Promise<FormData>` | Parse multipart form data (cached) |
| `ctx.getCookie(name)` | `string \| undefined` | Get one cookie |
| `ctx.getCookies()` | `Record<string, string>` | Get all cookies |
| `ctx.valid<T>(target)` | `T` | Get data validated by `zValidator` |

### Response

| Method | Return | Description |
|--------|--------|-------------|
| `ctx.json(data, status?)` | `Response` | JSON response |
| `ctx.text(text, status?)` | `Response` | Plain text response |
| `ctx.html(html, status?)` | `Response` | HTML response |
| `ctx.redirect(url, status?)` | `Response` | Redirect (default 302) |
| `ctx.status(code)` | `Response` | Empty response with status code |
| `ctx.success(data?, message?, status?)` | `Response` | Standard success envelope |
| `ctx.error(message, status?, details?)` | `Response` | Standard error envelope |
| `ctx.paginate(data, total, page, limit)` | `Response` | Offset pagination |
| `ctx.cursorPaginate(data, nextCursor)` | `Response` | Cursor pagination |
| `ctx.sse(callback, options?)` | `Response` | SSE stream |

---

## Routing

### Route Parameters

```ts
// Named param
app.get("/users/:id", (ctx) => {
  return ctx.json({ id: ctx.params.id });
});

// Catch-all wildcard
app.get("/files/*", (ctx) => {
  return ctx.text(`File: ${ctx.params["*"]}`);
});
```

### Route Group

```ts
const api = app.group("/api/v1");
api.get("/users", listUsers);
api.post("/users", createUser);

// Nested group with middleware
const admin = api.group("/admin");
admin.use(adminGuard);
admin.get("/stats", getStats);
```

### Static Files

```ts
app.static("/assets", "./public");
```

### HTTP Methods

```ts
app.get("/users", listUsers);
app.post("/users", createUser);
app.put("/users/:id", updateUser);
app.delete("/users/:id", deleteUser);
app.patch("/users/:id", patchUser);
app.head("/users", headUsers);
app.options("/users", optionsUser);
app.query("/users", queryUsers);  // RFC 10008
app.all("/users", allHandler);    // All methods
```

---

## Middleware

Signature: `(ctx, next) => Response | Promise<Response>`

**Must `return next()`** to pass to next handler.

```ts
// Global middleware
app.use(async (ctx, next) => {
  const start = performance.now();
  const res = await next();
  console.log(`${ctx.request.method} - ${(performance.now() - start).toFixed(2)}ms`);
  return res;
});

// Per-route middleware
app.get("/protected", authMiddleware, (ctx) => {
  return ctx.json({ data: "secret" });
});

// Group middleware
const api = app.group("/api");
api.use(rateLimiter({ max: 100, windowMs: 60_000 }));
```

---

## Built-in Middleware

### CORS

```ts
import { cors } from "@buntok/core";

app.use(cors({
  origin: ["http://localhost:3000", "https://myapp.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  headers: ["Content-Type", "Authorization"],
  credentials: true,
}));
```

### Compress

```ts
import { compress } from "@buntok/core";

app.use(compress({
  threshold: 1024,
  brotliLevel: 4,
}));
```

### Rate Limiter

```ts
import { rateLimiter, slidingWindowRateLimiter } from "@buntok/core";

// Fixed window
app.use(rateLimiter({ max: 100, windowMs: 60_000 }));

// Sliding window
app.use(slidingWindowRateLimiter({ max: 100, windowMs: 60_000 }));
```

### Request ID

```ts
import { requestId } from "@buntok/core";
app.use(requestId());
```

### Response Time

```ts
import { responseTime } from "@buntok/core";
app.use(responseTime());
```

### Helmet (Security Headers)

```ts
import { helmet } from "@buntok/core";
app.use(helmet());
```

### Timeout

```ts
import { timeout } from "@buntok/core";
app.get("/slow", timeout(5000), async (ctx) => {
  await longOperation();
  return ctx.json({ ok: true });
});
```

---

## Validation (zValidator)

```ts
import { zValidator } from "@buntok/core";
import { z } from "zod";
```

### Body Validation

```ts
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post("/users", zValidator("body", schema), (ctx) => {
  const data = ctx.valid("body");
  return ctx.json(data, 201);
});
```

### Query Validation

```ts
const paginationSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

app.get("/users", zValidator("query", paginationSchema), (ctx) => {
  const { page, limit } = ctx.valid("query");
  return ctx.json({ page, limit });
});
```

### Params Validation

```ts
const idSchema = z.object({ id: z.string().uuid() });

app.get("/users/:id", zValidator("params", idSchema), (ctx) => {
  const { id } = ctx.valid("params");
  return ctx.json({ id });
});
```

### Shortcuts

```ts
import { validateBody, validateParams } from "@buntok/core";

app.post("/users", validateBody(schema), handler);
app.get("/users/:id", validateParams(idSchema), handler);
```

---

## Decorators

Stage 3 TC39 decorators — no `experimentalDecorators` needed.

### Route Decorators

| Decorator | Method |
|-----------|--------|
| `@Get(path)` | GET |
| `@Post(path)` | POST |
| `@Put(path)` | PUT |
| `@Patch(path)` | PATCH |
| `@Delete(path)` | DELETE |
| `@Options(path)` | OPTIONS |
| `@Head(path)` | HEAD |
| `@All(path)` | All methods |

### Middleware & Guard Decorators

```ts
import { Use, UseGuard } from "@buntok/core";

@Use(authMiddleware)
@Get("/profile")
async getProfile(ctx: Context) { ... }

@UseGuard(async (ctx) => {
  return ctx.request.headers.has("x-api-key");
})
@Get("/secret")
async secret(ctx: Context) { ... }
```

### DI Decorators

```ts
import { Injectable, Inject } from "@buntok/core";

@Injectable()
@Injectable({ scope: "transient" })

@Inject(UserService) private userService: UserService;
```

### Full Controller Example

```ts
import { Controller, Get, Post, Put, Delete, Use } from "@buntok/core";
import type { Context } from "@buntok/core";
import { zValidator } from "@buntok/core";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

@Controller("/users")
export class UserController {
  @Get("/")
  async list(ctx: Context) {
    return ctx.json([]);
  }

  @Get("/:id")
  async getById(ctx: Context) {
    return ctx.json({ id: ctx.params.id });
  }

  @Post("/")
  @Use(zValidator("body", createSchema))
  async create(ctx: Context) {
    const data = ctx.valid("body");
    return ctx.json(data, 201);
  }

  @Put("/:id")
  async update(ctx: Context) {
    return ctx.json({ updated: true });
  }

  @Delete("/:id")
  async remove(ctx: Context) {
    return ctx.status(204);
  }
}

app.registerController(UserController);
```

---

## Error Handling

### Built-in Error Classes

Throw directly from handler — framework auto-catches and returns proper response.

| Class | Status | Description |
|-------|--------|-------------|
| `HttpError` | base | Base class for all errors |
| `BadRequestError` | 400 | Invalid request |
| `UnauthorizedError` | 401 | Authentication missing |
| `ForbiddenError` | 403 | No access |
| `NotFoundError` | 404 | Resource not found |
| `MethodNotAllowedError` | 405 | HTTP method not allowed |
| `ConflictError` | 409 | Data conflict |
| `UnprocessableEntityError` | 422 | Business logic validation |
| `TooManyRequestsError` | 429 | Rate limit exceeded |
| `InternalServerError` | 500 | Server error |
| `ServiceUnavailableError` | 503 | Service unavailable |

```ts
import { NotFoundError, BadRequestError } from "@buntok/core";

app.get("/users/:id", async (ctx) => {
  const user = await findUser(ctx.params.id);
  if (!user) throw new NotFoundError("User not found");
  return ctx.json(user);
});
```

### Override Error Handler

```ts
app.onError((err, ctx) => {
  if (err instanceof HttpError) {
    return ctx.json({ error: err.message }, err.status);
  }
  return ctx.json({ error: "Internal Server Error" }, 500);
});
```

### asyncHandler

Auto-catch errors and return proper response:

```ts
import { asyncHandler } from "@buntok/core";

app.get("/users/:id", asyncHandler(async (ctx) => {
  const user = await findUser(ctx.params.id);
  return ctx.json(user);
}));
```

---

## IoC Container

```ts
import { Container, Injectable, Inject } from "@buntok/core";

@Injectable()
class UserRepository {
  async findAll() { return []; }
}

@Injectable()
class UserService {
  @Inject(UserRepository) private repo: UserRepository;
  async getAll() { return this.repo.findAll(); }
}

const container = new Container();
container.registerClass(UserRepository);
container.registerClass(UserService);
app.setContainer(container);
```

### Container API

| Method | Description |
|--------|-------------|
| `container.register(token, provider)` | Register provider manually |
| `container.registerClass(cls, scope?)` | Auto-register class provider |
| `container.resolve(token)` | Resolve instance with DI |
| `container.get(token)` | Resolve or `undefined` |
| `container.has(token)` | Check if registered |
| `container.clear()` | Reset all providers |

---

## File Upload

```ts
import {
  uploader, parseUploads, deleteUploadedFile,
  LocalDiskStorage, MemoryStorage,
} from "@buntok/core";
```

### Upload Options

| Option | Type | Description |
|--------|------|-------------|
| `storage` | `StorageDriver` | **Required** — `LocalDiskStorage`, `MemoryStorage`, or custom |
| `filename` | `(original, file) => string` | Global default filename generator |
| `fields` | `Record<string, UploadFieldConfig>` | Whitelist & per-field validation |

### Upload Field Config

| Option | Type | Description |
|--------|------|-------------|
| `required` | `boolean` | Required or not (default: false) |
| `maxFileSize` | `number` | Max file size in bytes |
| `allowedMimeTypes` | `string[]` | Allowed MIME types |
| `filename` | `(original, file) => string` | Custom filename for this field |

### Middleware Approach (Recommended)

```ts
app.post("/upload",
  uploader({
    storage: new LocalDiskStorage("./uploads"),
    fields: {
      avatar: {
        required: true,
        maxFileSize: 2 * 1024 * 1024,
        allowedMimeTypes: ["image/png", "image/jpeg"],
      },
    },
  }),
  async (ctx) => {
    const files = ctx.store.files;
    return ctx.json({ uploaded: files.length });
  }
);
```

### Manual Approach

`parseUploads` throws `BadRequestError` on validation failure:

```ts
app.post("/upload", asyncHandler(async (ctx) => {
  const result = await parseUploads(ctx, {
    storage: new LocalDiskStorage("./uploads"),
    fields: {
      avatar: { required: true, maxFileSize: 2 * 1024 * 1024 },
    },
  });
  return ctx.json({ files: result.files });
}));
```

### Custom Filename

```ts
// Global
filename: (name, file) => `${Date.now()}-${name}`

// Per-field
fields: {
  avatar: { filename: (name) => `avatars/${Date.now()}-${name}` }
}
```

> Auto-extension: if filename callback doesn't include extension, framework auto-appends from original file.

### Custom Storage Driver (S3, GCS, R2)

```ts
import type { StorageDriver, UploadedFile } from "@buntok/core";

class S3Storage implements StorageDriver {
  constructor(private bucket: string) {}

  async handleFile(file: File, filename: string): Promise<UploadedFile> {
    const buffer = await file.arrayBuffer();
    await s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: filename,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    }));
    return {
      originalName: file.name,
      filename,
      size: file.size,
      type: file.type,
    };
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: filename }));
      return true;
    } catch {
      return false;
    }
  }
}
```

### File Deletion

```ts
import { deleteUploadedFile } from "@buntok/core";

const result = await parseUploads(ctx, options);
const avatar = result.fileMap.avatar;

// Delete file
const deleted = await deleteUploadedFile(options.storage, avatar);
```

### UploadedFile Object

```ts
{
  originalName: string;   // original filename from client
  filename: string;       // generated filename
  size: number;           // size in bytes
  type: string;           // MIME type
  buffer?: ArrayBuffer;   // present if MemoryStorage
  path?: string;          // present if LocalDiskStorage (absolute path)
}
```

---

## SSE (Server-Sent Events)

```ts
app.get("/events", (ctx) => {
  return ctx.sse(async (sse) => {
    sse.send({ event: "message", data: "Hello!" });
    sse.sendEvent("update", { count: 42 });
    sse.onClose(() => { clearInterval(timer); });
  });
});
```

---

## WebSocket

```ts
app.ws("/chat", {
  open(ws) {
    ws.subscribe("room-general");
    ws.send("Welcome!");
  },
  message(ws, message) {
    ws.publish("room-general", message);
  },
  close(ws, code, reason) {
    console.log("Disconnected", code);
  },
});
```

---

## Logger

```ts
import { logger, Logger, LogLevel } from "@buntok/core";

logger.info("Server started", { port: 3000 });
logger.warn("High memory usage", { mb: 512 });
logger.error("DB connection failed");
```

---

## Crypto Helpers

```ts
import {
  hash, sha256, sha512, md5, hmac, hashVerify,
  randomBytes, randomHex, randomAlphaNumeric, randomToken,
  encrypt, decrypt,
} from "@buntok/core";

// Hashing
const digest = await hash("password", "SHA-256");
const d2 = await sha256("password");
const valid = await hashVerify("password", digest);

// Random
randomBytes(16);
randomHex(32);
randomAlphaNumeric(16);
randomToken(32);

// Encrypt/Decrypt
const { ciphertext, iv } = await encrypt("secret data", "my-key");
const plain = await decrypt(ciphertext, "my-key", iv);
```

---

## Password Helpers

Memory-hard password hashing using **scrypt** (built-in, zero dependencies). Also supports legacy PBKDF2 hashes for backward compatibility.

```ts
import { hashPassword, verifyPassword } from "@buntok/core";

// Hash a password (returns scrypt format)
const hashed = await hashPassword("mypassword");
// "scrypt:a1b2c3d4...:e5f6g7h8..."

// Verify a password
const valid = await verifyPassword("mypassword", hashed);  // true
const wrong = await verifyPassword("wrong", hashed);        // false

// Also works with legacy PBKDF2 hashes (backward compatible)
const legacyHash = "100000:salt:hash"; // old format
await verifyPassword("password", legacyHash); // still works
```

**Config:**
- Algorithm: scrypt (memory-hard)
- Memory: 16 MB (N=16384)
- Block size: r=8
- Key length: 64 bytes
- Salt: 16 bytes (random)

---

## String Helpers

```ts
import { slugify, truncate, capitalize, camelCase, snakeCase, kebabCase } from "@buntok/core";

slugify("Hello World!");            // "hello-world"
truncate("Lorem ipsum dolor", 10); // "Lorem ipsu..."
capitalize("hello");                // "Hello"
camelCase("hello-world");          // "helloWorld"
snakeCase("helloWorld");           // "hello_world"
kebabCase("helloWorld");           // "hello-world"
```

---

## Object Helpers

```ts
import { pick, omit, groupBy, uniq, flatten, chunk, deepMerge, flattenObject } from "@buntok/core";

pick({ a: 1, b: 2, c: 3 }, ["a", "c"]);   // { a: 1, c: 3 }
omit({ a: 1, b: 2, c: 3 }, ["b"]);        // { a: 1, c: 3 }
uniq([1, 2, 2, 3]);                        // [1, 2, 3]
chunk([1, 2, 3, 4, 5], 2);                // [[1, 2], [3, 4], [5]]
flatten([[1, 2], [3, [4, 5]]]);           // [1, 2, 3, 4, 5]
deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });  // { a: 1, b: { c: 2, d: 3 } }
flattenObject({ a: { b: { c: 1 } } });    // { "a.b.c": 1 }
```

---

## Number Helpers

```ts
import { clamp, random, randomFloat, formatNumber, formatBytes, formatCurrency } from "@buntok/core";

clamp(15, 0, 10);              // 10
random(1, 100);                // 42
formatNumber(1000000);         // "1,000,000"
formatBytes(1048576);          // "1 MB"
formatCurrency(1000, "USD");   // "$1,000.00"
```

---

## Date Helpers

```ts
import { formatDate, timeAgo } from "@buntok/core";

formatDate(new Date());                    // "2024-01-15T10:30:00.000Z"
timeAgo(new Date(Date.now() - 180000));   // "3 minutes ago"
```

---

## ID & Code Generators

```ts
import { generateCode, nanoid, ulid, resetCounter } from "@buntok/core";

generateCode("T");       // "T0001"
generateCode("T");       // "T0002"
nanoid();                // "V1StGXR8_Z5jdHi6B-myT"
ulid();                  // "01ARZ3NDEKTSV4RRFFQ69G5FAV"
```

---

## Network Helpers

```ts
import { getClientIP, isPrivateIP, parseUserAgent } from "@buntok/core";

const ip = getClientIP(request);
isPrivateIP("192.168.1.1");  // true
const ua = parseUserAgent(request);
```

---

## Async Helpers

```ts
import { delay, retry } from "@buntok/core";

await delay(1000);

const data = await retry(
  () => fetch("https://api.example.com/data").then(r => r.json()),
  { retries: 3, delay: 1000, backoff: "exponential" }
);
```

---

## Cookie Helpers

```ts
import { getCookie, setCookie, deleteCookie } from "@buntok/core";

const token = ctx.getCookie("token");
const response = setCookie(ctx.json({ ok: true }), "token", "abc123", {
  httpOnly: true, secure: true, sameSite: "lax", maxAge: 86_400,
});
```

---

## Testing

```ts
import { App } from "@buntok/core";

const app = new App();
app.get("/ping", (ctx) => ctx.json({ pong: true }));

const res = await app.request("/ping");
const data = await res.json();
console.assert(res.status === 200);
```

---

## Layered Architecture

`@buntok/core` supports Repository → Service → Controller pattern with base classes.

### ORM Packages

| Package | ORM |
|---------|-----|
| `@buntok/prisma` | Prisma |
| `@buntok/drizzle` | Drizzle |
| `@buntok/typeorm` | TypeORM |

### Example (Prisma)

```ts
// Repository
import { BaseRepository } from "@buntok/prisma";
export class UserRepository extends BaseRepository<User, CreateUserInput, UpdateUserInput> {
  constructor(prisma: PrismaClient) {
    super(prisma, "user");
  }
}

// Service
import { BaseService } from "@buntok/core";
export class UserService extends BaseService<User, CreateUserInput, UpdateUserInput> {
  constructor(private userRepo: UserRepository) {
    super(userRepo);
  }
}

// Controller
import { BaseController, Controller } from "@buntok/core";
@Controller("/users")
export class UserController extends BaseController<User, CreateUserInput, UpdateUserInput> {
  constructor(private userService: UserService) {
    super(userService);
  }
}

// Register
const app = new App();
app.registerController(new UserController(new UserService(new UserRepository(prisma))));
app.listen(3000);
```

---

## Environment Variables

| Variable | Effect |
|----------|--------|
| `NODE_ENV=production` | JSON format logs, WARN level |
| `LOG_DIR=./logs` | Write logs to file |
| `LOG_REQUESTS=false` | Disable request logging |
| `PORT=3000` | Server port (default: 3000) |

---

## Authentication (JWT)

Zero-dependency JWT implementation using WebCrypto (built-in). Supports HMAC-SHA256 with expiration.

```ts
import { JwtService, requireAuth } from "@buntok/core";
```

### JwtService

```ts
const jwt = new JwtService("your-secret-key");

// Sign token (expires in 1 hour)
const token = await jwt.sign({ userId: 1, role: "admin" }, 3600);

// Verify token
const payload = await jwt.verify(token);
// { userId: 1, role: "admin", exp: 1700000000 }
```

### requireAuth Middleware

Extracts and verifies JWT from cookie or Authorization header. Injects payload into `ctx.user`.

```ts
const secret = "your-secret-key";

app.get("/protected", requireAuth(secret), (ctx) => {
  const user = ctx.user as { userId: number; role: string };  // cast required
  return ctx.json({ user });
});
```

**Cookie-based Auth:** Set `AUTH_STORE=cookie` in `.env` (created by `buntok init`) to enable cookie-based authentication. When enabled, `requireAuth` reads JWT from the HttpOnly cookie named in `AUTH_COOKIE`, then falls back to the Authorization header.

```ts
# .env
AUTH_STORE=cookie
AUTH_COOKIE=session

# Login — set HttpOnly cookie
app.post("/login", async (ctx) => {
  const { email, password } = await ctx.body();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !await verifyPassword(password, user.password)) {
    return ctx.json({ error: "Invalid credentials" }, 401);
  }

  const token = await jwt.sign({ userId: user.id, role: user.role }, 86400);
  const response = ctx.json({ success: true });
  return setCookie(response, process.env.AUTH_COOKIE!, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
});

# Logout — clear cookie
app.post("/logout", (ctx) => {
  const response = ctx.json({ success: true });
  return deleteCookie(response, process.env.AUTH_COOKIE!, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
});
```

| Env Variable | Default | Description |
|--------------|---------|-------------|
| `AUTH_STORE` | `header` | Where to read JWT: `header` or `cookie` |
| `AUTH_COOKIE` | `session` | Cookie name (only used when `AUTH_STORE=cookie`) |

**Note:** `ctx.user` is typed as `Record<string, unknown>`. Cast it to your JWT payload shape.

**Error responses:**
- 401 `{ error: "Unauthorized", message: "Missing or invalid authentication token" }`
- 401 `{ error: "Unauthorized", message: "Token is invalid or expired" }`

---

## OAuth Social Login

Built-in OAuth 2.0 support for Google, GitHub, and Apple with PKCE and automatic state management.

```ts
import { createOAuth, storeOAuthState, verifyOAuthState, getCodeVerifier, clearOAuthCookies } from "@buntok/core";
```

### Built-in Providers

| Provider | Type | PKCE | User ID |
|----------|------|------|---------|
| Google | OIDC | ✅ | `sub` |
| GitHub | OAuth2 | ❌ | `id` |
| Apple | OIDC | ✅ | `sub` |

### Quick Start

```ts
const google = createOAuth.google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectURI: "http://localhost:1212/auth/google/callback",
});

// Start flow — framework handles state/cookie
app.get("/auth/google", async (ctx) => {
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const url = google.createAuthorizationURL(state, codeVerifier);

  let response = ctx.redirect(url);
  response = storeOAuthState(response, state, codeVerifier);
  return response;
});

// Callback — cookies cleaned up automatically
app.get("/auth/google/callback", async (ctx) => {
  const code = ctx.req.query("code")!;
  const state = ctx.req.query("state")!;

  if (!verifyOAuthState(ctx.request, state)) {
    return ctx.json({ error: "Invalid state" }, 400);
  }

  const codeVerifier = getCodeVerifier(ctx.request)!;
  const tokens = await google.validateAuthorizationCode(code, ctx.req.url, codeVerifier);
  const user = await google.getUserInfo(tokens);

  let response = ctx.json({ user });
  response = clearOAuthCookies(response);
  return response;
});
```

### Provider Setup

**Google:** Create OAuth 2.0 Client ID at [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Add redirect URI.

**GitHub:** Create OAuth App at [GitHub Developer Settings](https://github.com/settings/developers). Set callback URL. Use `user:email` scope for email.

**Apple:** Create App ID + Services ID + Key at [Apple Developer Console](https://developer.apple.com). Apple requires JWT-based client secret (private key + team ID + key ID). Name is only sent on FIRST auth.

### Custom Providers

```ts
import { createOAuth2AuthorizationURL, validateOAuth2AuthorizationCode } from "@buntok/core";

// Use generic helpers for any OAuth2 provider
const url = createOAuth2AuthorizationURL("https://provider.com/authorize", {
  clientId: "...", redirectURI: "...", scopes: [...], state, codeChallenge,
});

const tokens = await validateOAuth2AuthorizationCode({
  code, redirectURI: "...", clientId: "...", clientSecret: "...", codeVerifier, tokenEndpoint: "https://provider.com/token",
});
```

### User Info

```ts
interface OAuthUser {
  id: string;           // Unique identifier (sub claim) — always use this
  name?: string;
  email?: string;
  emailVerified?: boolean;
  image?: string;
  [key: string]: unknown;  // Provider-specific fields
}
```

### Error Classes

| Error | Cause |
|-------|-------|
| `OAuthStateError` | State mismatch — CSRF attack |
| `OAuthTokenError` | Token exchange failed |
| `OAuthProviderError` | Provider returned error |

---

## RBAC (Role-Based Access Control)

```ts
import { requireRole, requirePermission } from "@buntok/core";
```

### requireRole

Requires user to have at least one of the specified roles. Must be used AFTER `requireAuth`.

```ts
// With middleware chain
app.get("/admin", requireAuth(secret), requireRole("admin"), adminHandler);

// Multiple roles (OR logic - any match)
app.get("/mod", requireAuth(secret), requireRole("admin", "moderator"), modHandler);

// Custom resolver (for different JWT payload structures)
app.get("/admin", requireAuth(secret), requireRole({
  roles: ["admin"],
  resolver: (user) => user.claims.roles,
}), adminHandler);

// Custom error message
app.get("/admin", requireAuth(secret), requireRole({
  roles: ["superadmin"],
  message: "Hanya superadmin yang boleh akses",
}), adminHandler);
```

### Decorator Usage

```ts
// ⚠️ Decorators execute dari bawah ke atas (karena internal pakai unshift)
//    Jadi @Use(requireAuth) harus DI ATAS @Use(requireRole)

@Get("/admin")
@Use(requireAuth(secret))    // ← execute PERTAMA
@Use(requireRole("admin"))   // ← execute KEDUA
async getAdmin(ctx: Context) {
  const user = ctx.user as { userId: number; role: string };
  return ctx.json({ admin: true });
}
```

**Auto-detection:** Looks for `user.role` (string) or `user.roles` (string[]) by default.

### requirePermission

Requires user to have ALL specified permissions.

```ts
// Require ALL permissions
app.delete("/users/:id",
  requireAuth(secret),
  requirePermission("users:delete"),
  deleteUser
);

// Multiple permissions
app.post("/posts",
  requireAuth(secret),
  requirePermission("posts:create", "posts:publish"),
  createPost
);

// Custom resolver
app.delete("/users/:id",
  requireAuth(secret),
  requirePermission({
    permissions: ["posts:edit", "posts:delete"],
    resolver: (user) => user.scope,
  }),
  deleteUser
);
```

### Decorator Usage

```ts
// Same as requireAuth — decorators execute dari bawah ke atas

@Delete("/users/:id")
@Use(requireAuth(secret))                        // ← execute PERTAMA
@Use(requirePermission("users:delete"))          // ← execute KEDUA
async deleteUser(ctx: Context) {
  // ...
}

// Multiple permissions (harus semua)
@Post("/posts")
@Use(requireAuth(secret))
@Use(requirePermission("posts:create", "posts:publish"))
async createPost(ctx: Context) {
  // ...
}
```

**Difference from requireRole:**
| | `requireRole` | `requirePermission` |
|--|---------------|---------------------|
| Logic | **OR** (salah satu cukup) | **AND** (harus semua) |
| Default field | `user.role` / `user.roles` | `user.permissions` |

**Error responses:**
- 401 `{ success: false, message: "Authentication required" }`
- 403 `{ success: false, error: "Forbidden", message: "Requires one of: admin, moderator" }`
- 403 `{ success: false, error: "Forbidden", message: "Missing permissions: users:delete" }`

---

## Event Emitter

```ts
import { emitter, EventEmitter, AppEvents } from "@buntok/core";
```

### Basic Usage

```ts
// Listen to events
emitter.on("user:created", (user) => {
  console.log("New user:", user);
});

// Emit events
await emitter.emit("user:created", { id: 1, name: "John" });

// Once listener
emitter.once("user:deleted", (user) => {
  console.log("User deleted:", user);
});

// Remove listener
emitter.off("user:created", listener);

// Check listener count
const count = emitter.listenerCount("user:created");
```

### Custom Events

```ts
// Define event types
interface AppEvents {
  "user:created": { id: number; name: string };
  "user:deleted": { id: number };
  "order:placed": { orderId: string; total: number };
}

// Typed emitter
const emitter = new EventEmitter<AppEvents>();
```

---

## Cache

In-memory cache with LRU eviction. Zero dependencies.

```ts
import { Cache, MemoryCacheDriver } from "@buntok/core";
```

### Usage

```ts
const cache = new Cache();

// Set with TTL (seconds)
await cache.set("user:1", { id: 1, name: "John" }, 300);

// Get
const user = await cache.get("user:1");

// Check existence
if (await cache.has("user:1")) { ... }

// Cache-aside pattern
const data = await cache.getOrSet("key", () => expensiveQuery(), 300);

// Atomic counter
await cache.increment("page:views", 1, 3600);
await cache.decrement("counter", 1);

// Batch operations
await cache.mset([["a", 1], ["b", 2]], 300);
const [a, b] = await cache.mget(["a", "b"]);

// Pattern delete
await cache.deletePattern("session:*");

// List keys
const keys = await cache.keys();
```

### Custom Driver

```ts
import type { CacheDriver } from "@buntok/core";

class RedisCacheDriver implements CacheDriver {
  async get(key: string) { ... }
  async set(key: string, value: any, ttl?: number) { ... }
  async delete(key: string) { ... }
  async clear() { ... }
}
```

---

## Mailer

Email sending with SMTP support.

```ts
import { Mailer } from "@buntok/core";
```

### Usage

```ts
const mailer = new Mailer({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "your@gmail.com",
    pass: "your-password",
  },
});

// Send email
await mailer.send({
  from: "sender@gmail.com",
  to: "recipient@example.com",
  subject: "Welcome!",
  html: "<h1>Hello!</h1><p>Welcome to our platform.</p>",
});

// Send with attachments
await mailer.send({
  from: "sender@gmail.com",
  to: "recipient@example.com",
  subject: "Report",
  text: "Please find the report attached.",
  attachments: [
    { filename: "report.pdf", content: pdfBuffer },
  ],
});
```

---

## Queue

In-memory job queue with pluggable drivers.

```ts
import { Queue, MemoryQueueDriver } from "@buntok/core";
```

### Usage

```ts
const queue = new Queue(new MemoryQueueDriver(), {
  concurrency: 5,
});

// Define job handler
queue.process("send-email", async (job) => {
  await sendEmail(job.data.to, job.data.subject);
  return { sent: true };
});

// Add jobs
await queue.add("send-email", { to: "user@example.com", subject: "Welcome" });

// With delay
await queue.add("send-email", { to: "user@example.com" }, { delay: 5000 });

// With retry
await queue.add("send-email", { to: "user@example.com" }, { attempts: 3 });
```

### Custom Driver

```ts
import type { QueueDriver, Job } from "@buntok/core";

class RedisQueueDriver implements QueueDriver {
  async add(name: string, data: any, opts?: any): Promise<Job> { ... }
  async process(name: string, handler: JobHandler): Promise<void> { ... }
}
```

---

## Scheduler / CronJob

Cron-based task scheduling with pluggable drivers.

```ts
import { Scheduler, CronJob, MemorySchedulerDriver } from "@buntok/core";
```

### CronJob

```ts
// Run every minute
const job = new CronJob("* * * * *", async () => {
  console.log("Task executed");
});
job.start();

// Run every 5 minutes with context
const job = new CronJob("*/5 * * * *", async () => {
  console.log("Task executed");
}, { timezone: "Asia/Jakarta" });
job.start();

// Stop
job.stop();
```

### Scheduler

```ts
const scheduler = new Scheduler(new MemorySchedulerDriver());

// Add cron job
scheduler.add("cleanup", "0 2 * * *", async () => {
  await cleanupOldFiles();
});

// Start all jobs
scheduler.start();

// Stop all jobs
scheduler.stop();
```

---

## Audit Log

Request logging middleware with customizable storage.

```ts
import { auditLog } from "@buntok/core";
```

### Usage

```ts
// Basic usage
app.use(auditLog());

// With options
app.use(auditLog({
  excludePaths: ["/health", "/ping"],
  excludeMethods: ["OPTIONS"],
  logBody: true,
  logQuery: true,
  storage: async (entry) => {
    await db.auditLog.create({ data: entry });
  },
}));
```

### AuditLogEntry

```ts
interface AuditLogEntry {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  ip: string;
  userAgent: string;
  body?: any;
  query?: any;
  error?: string;
}
```

---

## Health Check

```ts
import { healthCheck, createHealthCheck, createDatabaseCheck } from "@buntok/core";
```

### Basic Usage

```ts
app.get("/health", healthCheck({
  checks: {
    database: createDatabaseCheck(async () => {
      await db.$queryRaw`SELECT 1`;
    }),
    redis: createHealthCheck(async () => {
      await redis.ping();
    }),
  },
}));
```

### Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": { "status": "healthy", "duration": 12 },
    "redis": { "status": "unhealthy", "error": "Connection refused", "duration": 5000 }
  }
}
```

---

## Timezone Helpers

```ts
import {
  parseTime, formatInTimezone, toTimezoneParts,
  toISOWithTimezone, nowInTimezone, getTimezoneOffset,
  getTimezoneOffsetString, isValidTimezone,
  groupByTimezone, getGroupLabels, formatGroupLabel,
} from "@buntok/core";
```

### parseTime

Parse time string in any timezone:

```ts
const date = parseTime("14:30", "Asia/Jakarta");
const date2 = parseTime("2024-01-15 14:30", "America/New_York");
```

### formatInTimezone

Format date in specific timezone:

```ts
const formatted = formatInTimezone(new Date(), "Asia/Jakarta", "HH:mm:ss");
// "17:30:00" (if current time in Jakarta is 17:30)
```

### toTimezoneParts

Get date parts in timezone:

```ts
const parts = toTimezoneParts(new Date(), "Asia/Jakarta");
// { year: 2024, month: 1, day: 15, hour: 17, minute: 30, second: 0 }
```

### nowInTimezone

Get current time in timezone:

```ts
const now = nowInTimezone("Asia/Jakarta");
```

### getTimezoneOffset

Get offset in minutes:

```ts
const offset = getTimezoneOffset("Asia/Jakarta");  // 420 (7 hours)
```

### isValidTimezone

```ts
isValidTimezone("Asia/Jakarta");  // true
isValidTimezone("Invalid/Zone");  // false
```

### groupByTimezone

Group dates by timezone:

```ts
const grouped = groupByTimezone(dates, {
  timezones: ["Asia/Jakarta", "America/New_York"],
});
```

---

## FFI / Native

Bun native FFI integration for calling native libraries.

```ts
import { getBackend, isNativeAvailable } from "@buntok/core";
```

### Usage

```ts
if (isNativeAvailable()) {
  const backend = getBackend();
  // Use native backend for better performance
} else {
  // Fallback to JavaScript implementation
}
```

---

## AI Module

Built-in AI integration with caching and streaming support.

```ts
import { streamAI, AICache, injectSystemPrompt } from "@buntok/core";
```

### streamAI

Stream AI responses:

```ts
app.post("/chat", async (ctx) => {
  const { message } = await ctx.body();
  
  return ctx.sse(async (sse) => {
    await streamAI({
      messages: [{ role: "user", content: message }],
      onChunk: (chunk) => {
        sse.send({ data: chunk });
      },
    });
  });
});
```

### AICache

Cache AI responses:

```ts
const cache = new AICache({ ttl: 3600_000 });  // 1 hour

const cached = await cache.get(messages);
if (cached) return cached;

const response = await generateAI(messages);
await cache.set(messages, response);
```

### injectSystemPrompt

Inject system prompt into messages:

```ts
const messages = injectSystemPrompt("You are a helpful assistant.", userMessages);
```
