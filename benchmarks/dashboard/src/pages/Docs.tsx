
import { useState, useEffect } from 'react';
import { CodeBlock } from '../components/CodeBlock';
import { Zap, ShieldAlert, Database, Layers } from 'lucide-react';

export function DocsPage({ isDark }: { isDark: boolean }) {
  const [activeSection, setActiveSection] = useState('quick-start');

  const groups: { label: string; items: { id: string; label: string }[] }[] = [
    {
      label: 'Getting Started',
      items: [
        { id: 'quick-start', label: 'Quick Start' },
        { id: 'initialization', label: 'Server Initialization' },
      ],
    },
    {
      label: 'Routing',
      items: [
        { id: 'controllers', label: 'Controllers & RouteContext' },
        { id: 'groups', label: 'Route Groups' },
        { id: 'context', label: 'Context Object' },
        { id: 'body-query', label: 'Body & Query Params' },
      ],
    },
    {
      label: 'Advanced',
      items: [
        { id: 'di', label: 'Dependency Injection' },
        { id: 'middlewares', label: 'Global Middlewares' },
        { id: 'built-in', label: 'Built-in Middlewares' },
        { id: 'websockets', label: 'WebSockets' },
        { id: 'sse', label: 'Server-Sent Events' },
        { id: 'advanced-methods', label: 'QUERY Method' },
      ],
    },
    {
      label: 'Utilities',
      items: [
        { id: 'static-files', label: 'Static Files & SPA' },
        { id: 'cookies', label: 'Cookie Helpers' },
        { id: 'uploads', label: 'File Uploads' },
        { id: 'health', label: 'Health Check' },
        { id: 'enterprise', label: 'Enterprise Features' },
        { id: 'ai', label: 'AI & LLM Integration' },
        { id: 'cli', label: 'Code Generation' },
        { id: 'api-docs', label: 'OpenAPI / Swagger' },
      ],
    },
    {
      label: 'Examples',
      items: [
        { id: 'examples', label: 'Full CRUD API' },
        { id: 'error-handling', label: 'Error Handling' },
      ],
    },
  ];

  const allItems = groups.flatMap(g => g.items);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: '-15% 0px -75% 0px' }
    );
    allItems.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="animate-fade-up flex flex-col md:flex-row gap-8 items-start pt-8">

      {/* Mobile select */}
      <div className="w-full md:hidden">
        <select
          value={activeSection}
          onChange={e => scrollTo(e.target.value)}
          className="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-border-hover"
        >
          {allItems.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      {/* Sidebar */}
      <aside className="hidden md:block w-52 shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
        <nav className="space-y-5">
          {groups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1.5 px-2">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollTo(item.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                        activeSection === item.id
                          ? 'text-text-primary font-medium bg-bg-secondary border-l-2 border-[#f97316] pl-[7px]'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-3xl space-y-14 pb-16">
        <div className="pb-6 border-b border-border-primary">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Documentation</h1>
          <p className="text-text-secondary">
            Complete reference for Buntok — the decorator-first Bun framework.
          </p>
        </div>

        <DocSection id="quick-start" title="Quick Start">
          <p className="text-text-secondary leading-relaxed mb-4">Scaffold a Buntok project in seconds with the official CLI. It sets up TypeScript, Biome linting, and all standard configs.</p>
          <CodeBlock language="bash" isDark={isDark}>{`bun create buntok@latest my-app
cd my-app && bun install
bun run dev`}</CodeBlock>
          <p className="text-text-secondary leading-relaxed mt-4">Dev server launches on <code>http://localhost:1212</code> with hot-reload enabled.</p>
        </DocSection>

        <DocSection id="initialization" title="Server Initialization">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok listens on port <code>1212</code> by default or reads from <code>PORT</code> env.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { App } from "buntok";

const app = new App();

app.listen(1212, () => {
  console.log("🚀 Server running on http://localhost:1212");
});`}</CodeBlock>
        </DocSection>

        <DocSection id="controllers" title="Controllers & RouteContext">
          <p className="text-text-secondary leading-relaxed mb-4">
            Controllers group route handlers using ES classes and decorators. At startup, Buntok's AOT compiler
            resolves all decorators into an optimized switch-case router — zero per-request overhead.
          </p>
          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Why RouteContext?</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            TypeScript decorators cannot mutate method parameter types at the type level. <code>RouteContext&lt;Path, Body, DI&gt;</code> solves this — it gives you automatic type inference for path params, request body, and DI container without any extra boilerplate.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Controller, Get, Post, RouteContext } from 'buntok';

@Controller('/users')
export class UserController {

  // Path params are automatically extracted from the string literal
  @Get('/:id/posts/:postId')
  getById(ctx: RouteContext<"/:id/posts/:postId">) {
    const { id, postId } = ctx.params; // fully typed strings ✓
    return ctx.json({ id, postId });
  }

  // Pass BodyType as second generic for typed body parsing
  @Post('/')
  async create(ctx: RouteContext<"/", { name: string; age: number }>) {
    const body = await ctx.body(); // { name: string; age: number } ✓
    return ctx.json({ created: true, data: body }, 201);
  }
}`}</CodeBlock>
          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Registering Controllers</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`import { App } from 'buntok';
import { UserController } from './controllers/user';

const app = new App();
app.registerController(new UserController());
app.listen(1212);`}</CodeBlock>
        </DocSection>

        <DocSection id="groups" title="Route Groups">
          <p className="text-text-secondary leading-relaxed mb-4">Create modular route groups with shared prefixes and nested middlewares.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`const api = app.group("/api");
api.use(loggerMiddleware); // applied to all /api/* routes

const v1 = api.group("/v1");
v1.get("/users", handler); // GET /api/v1/users

const admin = api.group("/admin");
admin.use(adminAuthMiddleware);
admin.get("/dashboard", dashboardHandler); // GET /api/admin/dashboard`}</CodeBlock>
        </DocSection>

        <DocSection id="context" title="The Context Object">
          <p className="text-text-secondary leading-relaxed mb-4">Every handler receives a lightweight <code>Context</code> — a zero-overhead wrapper around the native Bun <code>Request</code>.</p>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">ctx.request & ctx.params</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`app.get("/users/:id", (ctx) => {
  const ua = ctx.request.headers.get("User-Agent");
  const { id } = ctx.params; // string
  return ctx.json({ id, ua });
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">ctx.store — inter-middleware state</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`app.use(async (ctx, next) => {
  ctx.store.user = await db.getUserFromToken(ctx.getCookie("token"));
  return next();
});

app.get("/profile", (ctx) => {
  return ctx.json({ user: ctx.store.user });
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Response helpers</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`return ctx.json({ error: "Invalid input" }, 400); // JSON
return ctx.text("Hello, World!");                    // Plain text
return ctx.status(204);                              // No content`}</CodeBlock>
        </DocSection>

        <DocSection id="body-query" title="Body & Query Parsing">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-0 mb-3">Query Params</h3>
          <p className="text-text-secondary leading-relaxed mb-4">Parsed automatically into <code>ctx.query</code>. All values are strings — convert manually if needed.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`// GET /search?q=buntok&limit=10
app.get('/search', (ctx) => {
  const { q, limit } = ctx.query;
  return ctx.json({ q, limit: Number(limit) });
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">JSON Body</h3>
          <p className="text-text-secondary leading-relaxed mb-4"><code>ctx.body&lt;T&gt;()</code> parses JSON and throws a 400 if malformed.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`@Post('/create')
async create(ctx: RouteContext<"/", { name: string; email: string }>) {
  const body = await ctx.body(); // { name: string; email: string }
  return ctx.json({ success: true, data: body });
}`}</CodeBlock>
        </DocSection>

        <DocSection id="di" title="Dependency Injection">
          <p className="text-text-secondary leading-relaxed mb-4">Type-safe DI via generics. Register services once and access them with full autocomplete.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`type Container = {
  db: Database;
  logger: Logger;
};

const app = new App<Container>();
app.set("db", new Database());
app.set("logger", new Logger());

// ctx.di is fully typed!
app.get("/users", async (ctx) => {
  const users = await ctx.di.db.findMany();
  ctx.di.logger.info("Fetched users");
  return ctx.json({ data: users });
});`}</CodeBlock>
        </DocSection>

        <DocSection id="middlewares" title="Global Middlewares">
          <p className="text-text-secondary leading-relaxed mb-4">Asynchronous onion-style middleware using <code>next()</code>. Must return the response.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`app.use(async (ctx, next) => {
  const start = performance.now();
  const response = await next();
  const ms = (performance.now() - start).toFixed(2);
  console.log(\`[\${ctx.req.method}] \${ctx.req.url} — \${ms}ms\`);
  return response;
});`}</CodeBlock>
        </DocSection>

        <DocSection id="built-in" title="Built-in Middlewares">
          <p className="text-text-secondary leading-relaxed mb-4">Production-ready middlewares included out of the box.</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              { color: 'text-[#f97316]', icon: <Zap className="w-4 h-4"/>, name: 'CORS', desc: 'Customizable origins, headers, and credentials support.', import: 'buntok/middlewares/cors' },
              { color: 'text-red-500', icon: <ShieldAlert className="w-4 h-4"/>, name: 'zValidator', desc: 'Schema validation with Zod, Valibot, or Yup.', import: 'buntok' },
              { color: 'text-yellow-500', icon: <Database className="w-4 h-4"/>, name: 'Rate Limiter', desc: 'Sliding-window rate limiting with auto retry-after headers.', import: 'buntok/middlewares/rate-limiter' },
              { color: 'text-blue-500', icon: <Layers className="w-4 h-4"/>, name: 'Request ID', desc: 'Auto-attach unique UUIDs for distributed tracing.', import: 'buntok/middlewares/request-id' },
            ].map(mw => (
              <div key={mw.name} className="border border-border-primary rounded-lg p-4 bg-bg-secondary">
                <div className={`flex items-center gap-2 font-semibold text-sm mb-1.5 ${mw.color}`}>
                  {mw.icon} {mw.name}
                </div>
                <p className="text-xs text-text-secondary mb-2">{mw.desc}</p>
                <code className="text-[10px] text-blue-400">import from "{mw.import}"</code>
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Validator — Functional vs Decorator</h3>
          <p className="text-text-secondary leading-relaxed mb-4"><code>zValidator</code> works the same way in both routing styles.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { zValidator, Controller, Post, Use, RouteContext } from "buntok";
import { z } from "zod";

const UserSchema = z.object({ name: z.string(), email: z.string().email() });
type UserDTO = z.infer<typeof UserSchema>;

// ── Functional ──────────────────────────────────────────
app.post("/users", zValidator("body", UserSchema), async (ctx) => {
  const data = ctx.valid("body"); // UserDTO ✓
  return ctx.json({ created: true, data });
});

// ── Class-Based ──────────────────────────────────────────
@Controller("/api/users")
export class UserController {
  @Post("/")
  @Use(zValidator("body", UserSchema))
  async create(ctx: RouteContext<"/", UserDTO>) {
    const data = ctx.valid("body"); // UserDTO ✓
    return ctx.json({ created: true, data });
  }
}`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">CORS & Rate Limiter</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`import { cors } from "buntok/middlewares/cors";
import { rateLimiter } from "buntok/middlewares/rate-limiter";
import { requestId } from "buntok/middlewares/request-id";

app.use(cors({ origin: ["https://example.com"], credentials: true }));
app.use(rateLimiter({ max: 100, windowMs: 60_000 })); // 100 req/min
app.use(requestId()); // attaches x-request-id header`}</CodeBlock>
        </DocSection>

        <DocSection id="websockets" title="WebSockets">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok exposes Bun's native WebSocket server — RFC 6455, no wrappers, maximum throughput.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`app.ws("/ws", {
  open: (ws) => {
    ws.subscribe(\`room:\${ws.data.roomId}\`);
    ws.send(JSON.stringify({ event: "connected" }));
  },
  message: (ws, msg) => {
    const { event, data } = JSON.parse(String(msg));
    if (event === "chat") {
      app.server?.publish(\`room:\${ws.data.roomId}\`, JSON.stringify({ event, data }));
    }
  },
  close: (ws) => {
    ws.unsubscribe(\`room:\${ws.data.roomId}\`);
  }
});`}</CodeBlock>
        </DocSection>

        <DocSection id="sse" title="Server-Sent Events (SSE)">
          <p className="text-text-secondary leading-relaxed mb-4">Real-time one-directional streaming from server to client, without WebSocket complexity.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { SSE } from "buntok";

app.get("/events/live", (ctx) => {
  const sse = new SSE(ctx.request, {
    sendInitial: true,
    initialEvent: "connected",
    retry: 5000, // auto-reconnect in 5s if disconnected
  });

  // Send various event types
  sse.sendEvent("message", { text: "Hello from Buntok!" });
  sse.sendData("plain-string-data");
  sse.sendWithId(1, { id: 1, status: "processing" });

  return sse.connect(); // hold the stream open
});`}</CodeBlock>
        </DocSection>

        <DocSection id="advanced-methods" title="QUERY Method (RFC 10008)">
          <p className="text-text-secondary leading-relaxed mb-4">
            Need complex search filters but don't want to abuse <code>POST</code> for read-only operations?
            Buntok natively supports the upcoming <strong>QUERY</strong> HTTP method — idempotent, cacheable,
            and accepts a JSON body.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`app.query("/orders", async (ctx) => {
  const filters = await ctx.body<{
    select: string[];
    where: Record<string, unknown>;
    limit: number;
    sort: { field: string; order: "asc" | "desc" }[];
  }>();

  const results = await db.query(filters);
  return ctx.json({ data: results });
});`}</CodeBlock>
        </DocSection>

        <DocSection id="static-files" title="Static Files & SPA">
          <p className="text-text-secondary leading-relaxed mb-4">Serve static assets and Single Page Applications with zero configuration.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`// Serve ./public directory at /assets
app.static("/assets", "./public");

// Custom favicon
app.icon("./assets/favicon.ico");

// SPA catch-all — serve index.html for all unmatched routes
app.get("*", () => new Response(Bun.file("./public/index.html")));`}</CodeBlock>
        </DocSection>

        <DocSection id="cookies" title="Cookie Helpers">
          <p className="text-text-secondary leading-relaxed mb-4">First-class cookie support — read, set, and delete without external packages.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { setCookie, deleteCookie } from "buntok/helpers/cookie";

// Set a secure, httpOnly cookie on login
app.post("/login", async (ctx) => {
  const response = ctx.json({ success: true });
  return setCookie(response, "auth_token", "jwt_here", {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400,
  });
});

// Read a single cookie
app.get("/me", (ctx) => {
  const token = ctx.getCookie("auth_token");
  return ctx.json({ token });
});

// Read all cookies as a Record<string, string>
const all = ctx.getCookies();

// Clear on logout
app.post("/logout", (ctx) => {
  return deleteCookie(ctx.json({ success: true }), "auth_token");
});`}</CodeBlock>
        </DocSection>

        <DocSection id="health" title="Health Check">
          <p className="text-text-secondary leading-relaxed mb-4">Kubernetes/Docker-ready health checks with multi-dependency validation.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { healthCheck, createDatabaseCheck, createHealthCheck } from "buntok/middlewares/health-check";

// Simple ping
healthCheck(app, { path: "/health" });

// With DB + Redis checks
healthCheck(app, {
  path: "/api/health",
  check: createHealthCheck([
    { name: "database", check: async () => { await db.query("SELECT 1"); return true; } },
    { name: "redis",    check: async () => { await redis.ping(); return true; } },
  ]),
});
// → { status: "healthy", checks: { database: { status: "up", duration: 2 }, ... } }`}</CodeBlock>
        </DocSection>

        <DocSection id="uploads" title="File Uploads">
          <p className="text-text-secondary leading-relaxed mb-4">
            Parse and validate <code className="text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded text-sm">multipart/form-data</code> uploads securely using built-in Storage Drivers. Validates file size and MIME-types out of the box.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { uploader, LocalDiskStorage, parseUploads } from "buntok";

// Method 1: Automatic parsing via Middleware
app.post("/avatar", 
  uploader({
    storage: new LocalDiskStorage("./uploads"),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png"]
  }),
  (ctx) => {
    // Access uploaded files directly from store
    const file = ctx.store.files[0];
    return ctx.json({ success: true, file: file.filename });
  }
);

// Method 2: Manual parsing for maximum flexibility
app.post("/documents", async (ctx) => {
  const result = await parseUploads(ctx, {
    storage: new LocalDiskStorage("./storage/docs"),
    maxFileSize: 10 * 1024 * 1024
  });

  if (!result.success) return ctx.error(result.error);

  // Standard text inputs are separated into fields
  const { title } = result.fields;
  return ctx.json({ title, files: result.files });
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-text-secondary mt-6 mb-3">Custom Driver (Cloudinary, AWS S3)</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            Since Buntok uses a driver pattern, you can write 1 function to stream files directly to cloud providers.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { StorageDriver, UploadedFile, uploader } from "buntok";
import { v2 as cloudinary } from "cloudinary";

export class CloudinaryStorage implements StorageDriver {
  async handleFile(file: File, filename: string): Promise<UploadedFile> {
    const buffer = Buffer.from(await file.arrayBuffer());
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ public_id: filename }, (err, result) => {
        if (err) return reject(err);
        resolve({
          originalName: file.name,
          filename: result!.public_id,
          size: file.size,
          type: file.type,
          path: result!.secure_url, // Directly mapped to cloud URL!
        });
      }).end(buffer);
    });
  }
}

// Just drop it into the uploader!
app.post("/avatar", uploader({ storage: new CloudinaryStorage() }), (ctx) => {
  return ctx.json({ imageUrl: ctx.store.files[0].path });
});`}</CodeBlock>
        </DocSection>

        <DocSection id="enterprise" title="Enterprise Features">
          <p className="text-text-secondary leading-relaxed mb-4">
            Caching, background queues, and cron jobs — all built around a swappable <strong>Driver Pattern</strong>.
            Use the in-memory drivers locally, swap to Redis for production with a single line change.
          </p>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-0 mb-3">Cache: Atomic & Pattern Deletion</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Cache, MemoryCacheDriver } from "buntok";

const cache = new Cache(new MemoryCacheDriver());

// getOrSet: fetch from DB if missing, then cache for 5 mins
const user = await cache.getOrSet("user:1", () => db.findUser(1), 300);

// Atomic counters (great for rate limiting / views)
const views = await cache.increment("post:1:views");

// Pattern deletion (e.g., clear all sessions)
await cache.deletePattern("session:*");`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-6 mb-3">Queue: Retries, Delays & Priorities</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Queue } from "buntok";

// Initialize with advanced options
const emailQueue = new Queue("email", { 
  maxRetries: 3, 
  retryDelay: 1000, 
  backoff: "exponential" 
});

emailQueue.process(async (job) => {
  console.log(\`[Attempt \${job.attempt + 1}]\`, job.data);
});

// Delay job by 5 seconds, and process before priority 0 jobs
await emailQueue.add(
  { to: "admin@example.com" }, 
  { delay: 5000, priority: 10 }
);`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-6 mb-3">OOP + DI + Cron Integration</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            The full power of Buntok — inject Queue and Cache into a Controller via DI,
            and declare background jobs with <code>@CronJob</code> right inside the class. <code>this</code> context is safely bound!
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { App, Controller, Post, RouteContext, CronJob } from "buntok";
import { cache, emailQueue } from "./infrastructure";

type Container = {
  cache: typeof cache;
  emailQueue: typeof emailQueue;
};

@Controller("/notifications")
export class NotificationController {

  @Post("/send")
  async send(ctx: RouteContext<"/send", { email: string }, Container>) {
    const { email } = await ctx.body();
    await ctx.di.emailQueue.add({ to: email, subject: "Welcome to Buntok!" });
    return ctx.json({ queued: true });
  }

  // Runs every day at midnight
  @CronJob("0 0 * * *")
  async dailyCleanup() {
    await cache.deletePattern("tmp:*");
    console.log("Cache cleaned.");
  }
}

const app = new App<Container>();
app.set("cache", cache);
app.set("emailQueue", emailQueue);
app.registerController(new NotificationController());
app.listen(1212);`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-red-500 mt-6 mb-3">Auth Guards</h3>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Controller, Get, UseGuard, type GuardFn } from "buntok";

const IsAdmin: GuardFn = async (ctx) => {
  const user = ctx.store.user;
  return user?.role === "admin"; // false → 403 Forbidden
};

@Controller("/admin")
export class AdminController {
  @Get("/dashboard")
  @UseGuard(IsAdmin)
  dashboard(ctx) {
    return ctx.json({ message: "Welcome, Admin." });
  }
}`}</CodeBlock>
        </DocSection>

        <DocSection id="ai" title="AI & LLM Integration">
          <p className="text-text-secondary leading-relaxed mb-4">
            Buntok natively supports the <strong>Vercel AI SDK Data Stream Protocol</strong>, making it the perfect backend for Generative UI, modern chatbots, and autonomous agents. Instead of dealing with raw <code>ReadableStreams</code> and parsing SSE formats manually, Buntok provides high-level utilities that let you focus entirely on your AI logic.
          </p>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-0 mb-3">AI Streaming & Guardrails (System Prompts)</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            When building AI applications, securing your AI from "prompt injection attacks" is critical. You must ensure the user cannot override your AI's core instructions. Buntok provides <code>injectSystemPrompt()</code> which safely scrubs rogue system prompts sent by the user and enforces your official system instruction at the very top.
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            Combined with <code>streamAI()</code>, Buntok automatically transforms OpenAI's raw output into the strict <code>0:"text"</code> chunk format required by Vercel AI SDK's frontend hooks (<code>useChat</code>, <code>useCompletion</code>).
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { Router, streamAI, injectSystemPrompt } from "buntok";
import { OpenAI } from "openai";

const app = new Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chat", async (ctx) => {
  const { messages } = await ctx.body();
  
  // Guardrails: Forcefully inject our system prompt and prevent prompt-injection attacks
  const securedMessages = injectSystemPrompt(messages, \`
    You are BuntokAI, a specialized customer support assistant.
    1. Only answer questions related to our store operations.
    2. If the user asks about unrelated topics, politely decline.
    3. Keep responses concise, friendly, and under 3 sentences.
  \`);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2, // Lower temperature for more focused, deterministic answers
    stream: true,
    messages: securedMessages,
  });

  // Automatically parses OpenAI chunks and streams Vercel AI Protocol (0:"text")
  return streamAI(ctx, response); 
});`}</CodeBlock>

          <h3 className="font-semibold text-sm uppercase tracking-widest text-[#f97316] mt-8 mb-3">Semantic AI Cache (Cost Saver)</h3>
          <p className="text-text-secondary leading-relaxed mb-4">
            LLM API calls (like OpenAI or Anthropic) are expensive and slow. If hundreds of users ask the exact same common question, you shouldn't pay for the AI to generate the same answer repeatedly.
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            Buntok provides an <code>AICache</code> utility that hooks into your existing <strong>Cache Driver</strong>. It hashes the conversation history and serves instant cached responses for identical queries, saving you 100% of the API cost and returning results in milliseconds.
          </p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { AICache, MemoryCacheDriver, streamAI } from "buntok";

// Initialize AI Cache using Buntok's standard CacheDriver architecture
const aiCache = new AICache(new MemoryCacheDriver());

app.post("/api/chat", async (ctx) => {
  const { messages } = await ctx.body();
  
  // 1. Instant Cache Hit: Check if we've seen this exact conversation history recently
  const cached = await aiCache.get(messages);
  if (cached) {
    console.log("⚡ AI Cache Hit! Returning instant response and saving OpenAI tokens.");
    
    // Serve the cached text instantly, perfectly formatted for Vercel AI SDK
    return new Response(\`0:\${JSON.stringify(cached)}\\n\`, {
      headers: { "x-vercel-ai-data-stream": "v1" }
    });
  }

  // 2. Cache Miss: Fetch fresh response from OpenAI
  const response = await openai.chat.completions.create({ 
    model: "gpt-4o-mini", 
    stream: true, 
    messages 
  });

  // 3. Stream back to user, and cache the complete response automatically when done
  return streamAI(ctx, response, {
    onCompletion: async (fullText) => {
      // Store the generated response in the cache for 1 hour (3600 seconds)
      await aiCache.set(messages, fullText, 3600); 
    }
  });
});`}</CodeBlock>
        </DocSection>

        <DocSection id="cli" title="Code Generation (CLI)">
          <p className="text-text-secondary leading-relaxed mb-4">
            The Buntok CLI generates a full layered architecture (Controller → Service → Repository → Drizzle Schema).
            By default all layers are wired together, but each flag makes the CLI generate only what you need — no forced coupling.
          </p>
          <CodeBlock language="bash" isDark={isDark}>{`# 1. All layers (Controller + Service + Repo + Schema)
bunx buntok create user

# 2. Controller only (no Service import generated)
bunx buntok create auth --controller

# 3. Controller + Service, no Repo
bunx buntok create payment --controller --service

# 4. Repo + Schema only
bunx buntok create audit --repo --schema`}</CodeBlock>
        </DocSection>

        <DocSection id="api-docs" title="OpenAPI / Swagger Docs">
          <p className="text-text-secondary leading-relaxed mb-4">
            Buntok can auto-generate a full <strong>OpenAPI 3.0</strong> spec and serve a <strong>Scalar UI</strong> dashboard
            by scanning your routes and Zod schemas.
          </p>
          <CodeBlock language="bash" isDark={isDark}>{`# Scan routes & output swagger.json + docs.html to /public
bunx buntok make:docs`}</CodeBlock>
          <CodeBlock language="typescript" isDark={isDark}>{`// src/index.ts — export is required for the CLI to scan it
export const app = new App();
app.static("/", "./public"); // serve the generated docs
app.listen(1212);
// → visit http://localhost:1212/docs.html`}</CodeBlock>
        </DocSection>

        <DocSection id="examples" title="Full Example: CRUD API">
          <p className="text-text-secondary leading-relaxed mb-4">A complete RESTful CRUD API in a single file.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`import { App } from "buntok";

const app = new App();
const users: Array<{ id: string; name: string; email: string }> = [];

app.get("/users",       (ctx) => ctx.json({ data: users }));

app.get("/users/:id",   (ctx) => {
  const user = users.find(u => u.id === ctx.params.id);
  if (!user) return ctx.json({ error: "Not found" }, 404);
  return ctx.json({ data: user });
});

app.post("/users", async (ctx) => {
  const body = await ctx.body<{ name: string; email: string }>();
  const user = { id: crypto.randomUUID(), ...body };
  users.push(user);
  return ctx.json({ data: user }, 201);
});

app.put("/users/:id", async (ctx) => {
  const idx = users.findIndex(u => u.id === ctx.params.id);
  if (idx === -1) return ctx.json({ error: "Not found" }, 404);
  users[idx] = { ...users[idx], ...await ctx.body<{ name: string; email: string }>() };
  return ctx.json({ data: users[idx] });
});

app.delete("/users/:id", (ctx) => {
  const idx = users.findIndex(u => u.id === ctx.params.id);
  if (idx === -1) return ctx.json({ error: "Not found" }, 404);
  users.splice(idx, 1);
  return ctx.status(204);
});

app.listen(1212, () => console.log("Running on :1212"));`}</CodeBlock>
        </DocSection>

        <DocSection id="error-handling" title="Error Handling">
          <p className="text-text-secondary leading-relaxed mb-4">Buntok catches all unhandled errors and missing routes, letting you define consistent JSON responses.</p>
          <CodeBlock language="typescript" isDark={isDark}>{`// Global exception handler
app.onError((err, ctx) => {
  console.error("Exception:", err.message);
  return ctx.json({ success: false, message: "Internal Server Error" }, 500);
});

// 404 not-found handler
app.notFound((ctx) => {
  return ctx.json({
    success: false,
    error: \`Route \${new URL(ctx.request.url).pathname} not found\`,
  }, 404);
});`}</CodeBlock>
        </DocSection>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
export function DocSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-6 flex items-center gap-3">
        <span className="w-1 h-6 bg-[#f97316] rounded-full shrink-0" />
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
