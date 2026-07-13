<p align="center">
  <img src="https://github.com/PitokDf/framework-bun/blob/master/public/logo.svg" alt="Buntok" width="140">
</p>

<h1 align="center">Buntok</h1>

<p align="center">
  High-performance, batteries-included web framework for <a href="https://bun.sh">Bun</a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a>
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| ⚡ **Lightning Fast** | Built on Bun runtime for maximum performance |
| 🔌 **Middleware Support** | Global, per-route, and group-level middleware with chaining |
| 🛣️ **Dynamic Routing** | Route parameters (`:id`), wildcards (`*`), and route groups |
| 📁 **Static File Serving** | Serve files from any directory with automatic MIME detection |
| 📝 **Built-in Logger** | Colored output, JSON mode, and file rotation |
| 🎨 **Custom Favicon** | Easy favicon configuration with fallback |
| 🔒 **TypeScript First** | Full type safety out of the box |
| ✅ **Request Validation** | Validate body and params with any schema library |
| 🌐 **CORS Built-in** | Cross-origin support with automatic headers |
| 💉 **Type-Safe DI** | Dependency injection with full autocomplete support |
| 📡 **SSE Support** | Built-in Server-Sent Events helper for real-time data |
| 🚦 **Rate Limiting** | In-memory rate limiter with sliding window support |
| 🆔 **Request ID** | Automatic unique request ID generation |
| ⏱️ **Response Time** | Automatic response time measurement |
| 🏥 **Health Check** | Built-in health check endpoint helper |
| 🍪 **Cookie Helpers** | Parse, set, and delete cookies easily |
| 📦 **Code Generation** | CLI tool for generating schema, repo, service, controller |
| 🧠 **Cache System** | Built-in driver-based Cache manager |
| 🔄 **Queue System** | Built-in driver-based background Queues |
| ⏱️ **Task Scheduler** | Native CRON job support via `@CronJob` |
| 🛡️ **Auth Guards** | Granular access control via `@UseGuard` |
| 📁 **File Uploads** | Configurable multipart parser with storage drivers |
| 🤖 **AI Ready** | Native Vercel AI SDK Support (Data Stream Protocol) & Semantic Caching |

## Requirements

- [Bun](https://bun.sh) v1.0 or higher
- TypeScript 5.0 or higher (optional, recommended)

## Installation

### Quick Start with CLI (Recommended)

The fastest way to start a new Buntok project:

```bash
bunx create-buntok my-app
cd my-app
bun run dev
```

This will:
1. Create a new directory with project scaffolding
2. Install all dependencies
3. Set up TypeScript, Biome, and VS Code config
4. Include a default favicon

### Manual Installation

If you prefer to set up manually:

```bash
# Create project directory
mkdir my-app && cd my-app

# Initialize package.json
bun init

# Install Buntok
bun add buntok

# Install dev dependencies
bun add -D @biomejs/biome @types/bun typescript
```

---

## Quick Start

### Minimal Example

```typescript
// src/index.ts
import { App } from "buntok";

const app = new App();

app.get("/", (ctx) => {
  return ctx.json({ message: "Hello from Buntok!" });
});

// Server auto-starts on port 1212 (or PORT env var)
```

That's it! No `app.listen()` required. Buntok auto-starts the server after all routes are registered.

### Step-by-Step Breakdown

```typescript
// 1. Import the App class
import { App } from "buntok";

// 2. Create application instance
const app = new App();

// 3. Register routes
app.get("/", (ctx) => {
  // ctx = Context object (request, params, helpers)
  return ctx.json({ message: "Hello!" });
});

// 4. Optional: Explicitly start server
app.listen(3000);
```

### Run Your Server

```bash
# Development (with hot reload)
bun run dev

# Production
bun run start
```

---

## Core Concepts

### App

The `App` class is the heart of Buntok. It manages:
- Route registration
- Middleware pipeline
- Server lifecycle
- Dependency injection

```typescript
import { App } from "buntok";

// Without DI
const app = new App();

// With DI (type-safe)
type Container = { db: Database; config: Config };
const app = new App<Container>();
```

### Router

Buntok uses a custom radix tree router for fast route matching:
- **Static routes**: `/users` — exact match
- **Dynamic routes**: `/users/:id` — captures URL segments
- **Wildcard routes**: `/files/*` — catches everything after

Route matching order:
1. Static routes (fastest)
2. Dynamic routes
3. Wildcard routes (slowest)

### Context

The `Context` object is passed to every handler and middleware:

```typescript
app.get("/example", (ctx) => {
  ctx.request  // Raw Request object
  ctx.params   // Route parameters
  ctx.store    // Shared data between middleware
  ctx.di       // Dependencies (DI)
});
```

#### Strongly-Typed Context for Decorators (`RouteContext`)

When using class controllers and decorators, TypeScript cannot automatically infer `ctx.params` from the `@Get("/:id")` string due to language limitations. To fix this DX issue, you can use the `RouteContext` helper:

```typescript
import { Controller, Get, Post, RouteContext, Use, zValidator } from "buntok";
import { z } from "zod";

const createUserSchema = z.object({ name: z.string(), age: z.number() });
type CreateUserBody = z.infer<typeof createUserSchema>;

@Controller("/users")
export class UserController {
  // 1. Path Parameters Inference
  @Get("/:id/posts/:postId")
  async getPost(ctx: RouteContext<"/:id/posts/:postId">) {
    // TypeScript knows these exist and are strings!
    const { id, postId } = ctx.params;
  }

  // 2. Body Inference from zValidator
  @Post("/")
  @Use(zValidator("body", createUserSchema))
  async create(ctx: RouteContext<"/", CreateUserBody>) {
    // ALWAYS use ctx.valid() when a validator is used to avoid stream locks
    const body = ctx.valid("body");
  }

  // 3. Query Inference (Order: Path, Body, DI, Query, Params)
  @Get("/search")
  @Use(zValidator("query", z.object({ q: z.string() })))
  async search(ctx: RouteContext<"/search", unknown, any, { q: string }>) {
    const query = ctx.valid("query"); // Fully typed!
  }
}

### Validation (`zValidator`)

Buntok provides a built-in `zValidator` middleware to cleanly validate incoming requests against Zod schemas.

```typescript
import { zValidator } from "buntok";
import { z } from "zod";

// Validating JSON Body (Default)
app.post("/users", zValidator("body", z.object({ name: z.string() })), (ctx) => {
  const data = ctx.valid("body"); // Type inferred safely!
  return ctx.json(data);
});
```

#### Content-Type Support & File Uploads
By default, `zValidator` expects `application/json`. You can validate different content types by passing a third argument. 
With Zod v4, you can also natively validate `File` objects directly in `multipart/form-data`!

```typescript
const uploadSchema = z.object({
  title: z.string(),
  file: z.file().max(5 * 1024 * 1024) // 5MB max
});

app.post("/upload", zValidator("body", uploadSchema, { contentType: "multipart/form-data" }), (ctx) => {
  const { title, file } = ctx.valid("body");
  
  return ctx.json({
    message: "Valid upload!",
    title: title,
    fileName: file.name
  });
});
```
*Note: Always use `ctx.valid("body")` to read data parsed by `zValidator`. Using `await ctx.body()` will throw a `Body already used` error because the request stream is already consumed by the validator.*
```

> **Note:** If you use the functional chaining API (e.g., `app.get("/:id", (ctx) => {})`), path parameters are inferred 100% automatically without needing `RouteContext`!

### Middleware

Middleware functions process requests before/after handlers:

```typescript
// Middleware signature
type Middleware = (ctx: Context, next: () => Promise<Response>) => Response | Promise<Response>;
```

Execution order:
```
Request → Global Middleware → Route Middleware → Handler → Response
```

---

## API Reference

### `new App<DI>()`

Creates a new application instance.

```typescript
// Without DI
const app = new App();

// With DI (type-safe dependency injection)
type Container = {
  db: Database;
  config: { port: number };
};

const app = new App<Container>();
```

**Behavior:**
- Initializes router
- Registers default favicon route
- Sets up auto-start (server starts when event loop is idle)

---

### HTTP Methods

#### `app.get(path, ...handlers)`

Register a GET route handler.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | Route path pattern |
| `...handlers` | `Middleware[] \| Handler` | Yes | Middleware(s) + final handler |

**Path Patterns:**

| Pattern | Example URL | Captures |
|---------|-------------|----------|
| `/users` | `/users` | None |
| `/users/:id` | `/users/123` | `{ id: "123" }` |
| `/files/*` | `/files/docs/readme.md` | `{ "*": "docs/readme.md" }` |

**Returns:** `this` (enables method chaining)

**Examples:**

```typescript
// Simple route
app.get("/", (ctx) => {
  return ctx.text("Hello, World!");
});

// With route parameter
app.get("/users/:id", (ctx) => {
  const userId = ctx.params.id; // "123"
  return ctx.json({ id: userId });
});

// With middleware
app.get("/admin", authMiddleware, (ctx) => {
  return ctx.json({ message: "Welcome, admin!" });
});

// Chaining
app
  .get("/a", handler1)
  .get("/b", handler2)
  .get("/c", handler3);
```

---

#### `app.post(path, ...handlers)`

Register a POST route handler. Typically used for creating resources.

**Parameters:** Same as `app.get()`

**Example:**

```typescript
app.post("/users", async (ctx) => {
  // Parse JSON body
  const body = await ctx.body<{ name: string; email: string }>();
  
  // Create user in database
  const user = await db.users.create(body);
  
  // Return with 201 Created status
  return ctx.json({ data: user }, 201);
});
```

---

#### `app.put(path, ...handlers)`

Register a PUT route handler. Typically used for full resource replacement.

**Parameters:** Same as `app.get()`

**Example:**

```typescript
app.put("/users/:id", async (ctx) => {
  const { id } = ctx.params;
  const body = await ctx.body<{ name: string; email: string }>();
  
  const updated = await db.users.update(id, body);
  return ctx.json({ data: updated });
});
```

---

#### `app.delete(path, ...handlers)`

Register a DELETE route handler. Typically used for removing resources.

**Parameters:** Same as `app.get()`

**Example:**

```typescript
app.delete("/users/:id", async (ctx) => {
  const { id } = ctx.params;
  await db.users.delete(id);
  return ctx.status(204); // No Content
});
```

---

#### `app.options(path, ...handlers)`

Register an OPTIONS route handler. Primarily used for CORS preflight requests.

**Parameters:** Same as `app.get()`

**Example:**

```typescript
app.options("/api/*", (ctx) => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
});
```

**Tip:** Consider using the built-in `cors()` middleware instead of manual OPTIONS handling.

---

#### `app.query(path, ...handlers)`

Register a QUERY route handler. Like GET but with body support for complex queries.

**Parameters:** Same as `app.get()`

**Key Features:**
- ✅ **Idempotent** - Safe to retry (like GET)
- ✅ **Body allowed** - Send complex queries in body (like POST)
- ✅ **Cacheable** - Proxies/CDNs can cache responses
- ✅ **Safe** - Read-only, never modifies server state

**When to use QUERY:**
- Complex filters that exceed URL length limits
- Large query payloads (SQL, JSONPath, etc.)
- When you need idempotent reads with body

**Example:**

```typescript
// Complex query with filters
app.query("/orders", async (ctx) => {
  const filters = await ctx.body<{
    select: string[];
    where: Record<string, unknown>;
    limit: number;
    sort: { field: string; order: "asc" | "desc" }[];
  }>();
  
  // Build query from filters
  const results = await db.query(filters);
  return ctx.json({ data: results });
});

// Client sends:
// QUERY /orders
// Content-Type: application/json
//
// {
//   "select": ["id", "customer", "total"],
//   "where": { "status": "active", "total": { "gt": 100 } },
//   "limit": 10,
//   "sort": [{ "field": "created_at", "order": "desc" }]
// }
```

**Comparison:**

| Feature | GET | QUERY | POST |
|---------|-----|-------|------|
| Body allowed | ❌ | ✅ | ✅ |
| Idempotent | ✅ | ✅ | ❌ |
| Cacheable | ✅ | ✅ | ⚠️ |
| Safe (read-only) | ✅ | ✅ | ❌ |

**Note:** QUERY is a new HTTP method standardized in June 2026 (RFC 10008). Support is growing but may not be available in all clients yet.

---

### `app.ws(path, handler)`

Register a WebSocket endpoint. Backed directly by Bun's native WebSocket server for maximum performance.

**Note on Frontend Clients:**
Buntok uses **Raw WebSockets (RFC 6455)** natively. 
⚠️ **Do NOT use `socket.io-client`** to connect to Buntok, as Socket.IO uses a proprietary Engine.IO protocol that is incompatible with Raw WebSockets.
✅ **Recommended clients for React/Next.js:** `react-use-websocket`, `partysocket`, or native `WebSocket`.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | Exact route path for the WebSocket endpoint |
| `handler` | `WSHandler` | Yes | WebSocket event handlers (open, message, close, drain) |

**Example:**

```typescript
app.ws("/ws", {
  open: (ws) => {
    // Treat the user's ID as their own private "room"
    const userId = "user-123"; // Retrieve this from token/auth
    ws.subscribe(`user_${userId}`);
    
    console.log("Client connected!");
  },
  message: (ws, msg) => {
    // For handling incoming client events, parse the JSON
    const payload = JSON.parse(String(msg));
    if (payload.event === "typing") {
      // Do something
    }
  }
});
```

**Broadcasting Events to Specific Users (From API/Jobs):**
You can access the Bun Server instance natively via `app.server` to publish messages from anywhere in your backend! Since Buntok uses raw WebSockets, the standard way to send "events" is to wrap them in a JSON payload.

```typescript
app.post("/api/checkout", (ctx) => {
  const userId = "user-123";
  
  // Format standard event JSON
  const payload = JSON.stringify({
    event: "order_completed",
    data: { orderId: 456, amount: 100 }
  });

  // Target ONLY this specific user
  app.server?.publish(`user_${userId}`, payload);
  
  return ctx.success("Notification sent!");
});
```

**Client-Side Example (Vanilla JS / React):**
```javascript
const ws = new WebSocket("ws://localhost:1212/ws");

ws.onmessage = (e) => {
  const payload = JSON.parse(e.data);
  if (payload.event === "order_completed") {
    alert("Order Completed: " + payload.data.orderId);
  }
};
```

---

### `ctx.sse(callback, options?)`

Start a Server-Sent Events (SSE) stream. SSE is a lightweight alternative to WebSockets when you only need one-way communication (Server to Client), such as real-time notifications or live scores.

**Key Benefits of SSE:**
- Built-in auto-reconnection in the browser.
- Works over standard HTTP/HTTPS (passes through corporate firewalls easily).
- Has native `.sendEvent()` support out of the box.

**Example: Streaming Data**
```typescript
app.get("/stream", (ctx) => {
  return ctx.sse((stream) => {
    // Send a named event
    stream.sendEvent("connected", { status: "ok" });

    const timer = setInterval(() => {
      // Send data periodically
      stream.sendEvent("price_update", { price: Math.random() });
    }, 1000);

    // Buntok will automatically call this when the client disconnects!
    stream.onClose(() => {
      clearInterval(timer);
      console.log("Client disconnected");
    });
  });
});
```

**Client-Side Example:**
```javascript
const eventSource = new EventSource("/stream");

// Listen to specific events
eventSource.addEventListener("price_update", (e) => {
  const data = JSON.parse(e.data);
  console.log("New price:", data.price);
});
```

---

### `app.registerController(ControllerClass)`

Register all routes declared on a class decorated with `@Controller`. This instantiates the class once at boot time and wires each decorated method (`@Get`, `@Post`, etc.) automatically.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ControllerClass` | `Class` | Yes | The class containing decorated route methods |

**Example:**

```typescript
import { Controller, Get } from "buntok";

@Controller("/users")
class UserController {
  @Get("/")
  getAll(ctx: Context) {
    return ctx.json([{ id: 1, name: "Pito" }]);
  }
}

app.registerController(UserController);
```

---

### `app.disable(feature) / app.enable(feature)`

Disable or enable built-in framework features.

**Supported Features:**
- `"x-powered-by"`: Controls whether the `X-Powered-By: buntok` header is sent with HTTP responses.

**Example:**

```typescript
// Disable the X-Powered-By header for security/stealth
app.disable("x-powered-by");

// Re-enable it
app.enable("x-powered-by");
```

---

### `app.use(middleware)`

Add global middleware that runs on every request, before route handlers.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `middleware` | `Middleware` | Yes | Middleware function |

**Returns:** `this` (chainable)

**Middleware Signature:**

```typescript
type Middleware = (
  ctx: Context,
  next: () => Promise<Response>
) => Response | Promise<Response>;
```

**Behavior:**
- Middleware runs in registration order
- Must call `next()` to continue to next middleware/handler
- Can modify request/response

**Examples:**

```typescript
// Request logging
app.use(async (ctx, next) => {
  const start = Date.now();
  console.log(`→ ${ctx.request.method} ${ctx.request.url}`);
  
  const response = await next();
  
  const ms = Date.now() - start;
  console.log(`← ${response.status} (${ms}ms)`);
  
  return response;
});

// Add custom headers
app.use(async (ctx, next) => {
  const response = await next();
  response.headers.set("X-Custom-Header", "value");
  return response;
});
```

**Order Matters:**

```typescript
// ✅ Correct order
app.use(logger);      // Runs first
app.use(auth);        // Runs second
app.get("/api", handler); // Runs last

// ❌ Wrong order - auth won't apply to /api
app.get("/api", handler);
app.use(auth);
```

---

### `app.static(routePath, directory)`

Serve static files from a directory.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `routePath` | `string` | Yes | URL prefix for static files |
| `directory` | `string` | Yes | Local directory path (relative to cwd) |

**Returns:** `this` (chainable)

**Behavior:**
- Automatically detects MIME types
- Returns 404 if file not found
- Trailing slashes are handled automatically

**Examples:**

```typescript
// Serve ./public directory at /assets
app.static("/assets", "./public");
// /assets/style.css → ./public/style.css
// /assets/logo.png → ./public/logo.png

// Serve at root
app.static("/", "./public");
// /index.html → ./public/index.html
```

**MIME Types Supported:**
- `.html` → `text/html`
- `.css` → `text/css`
- `.js` → `application/javascript`
- `.json` → `application/json`
- `.png`, `.jpg`, `.gif` → `image/*`
- `.pdf` → `application/pdf`
- And many more...

---

### `app.icon(path)`

Set custom favicon path.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | Path to favicon file |

**Returns:** `this` (chainable)

**Default:** `./public/favicon.ico`

**Behavior:**
- Serves favicon at `/favicon.ico`
- Falls back to built-in icon if file not found
- Supports `.ico`, `.png`, `.svg`

**Examples:**

```typescript
// Custom icon
app.icon("./assets/custom-favicon.ico");

// Use default (no call needed)
// Automatically serves ./public/favicon.ico
```

---

### `app.onError(handler)`

Set custom global error handler for uncaught exceptions.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `handler` | `ErrorHandler` | Yes | Error handler function |

**Returns:** `this` (chainable)

**Handler Signature:**

```typescript
type ErrorHandler = (err: Error, ctx: Context) => Response | Promise<Response>;
```

**Default Behavior:**
- Logs error with stack trace
- Returns 500 in development
- Returns generic message in production

**Examples:**

```typescript
// Custom error handler
app.onError((err, ctx) => {
  console.error("Error:", err);
  
  return ctx.json({
    success: false,
    error: "Something went wrong",
    message: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message,
  }, 500);
});

// Global error handler with logging
app.onError((err, ctx) => {
  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
    path: new URL(ctx.request.url).pathname,
  });
  
  return ctx.json({ error: "Internal Server Error" }, 500);
});
```

---

### `app.notFound(handler)`

Set custom handler for 404 Not Found responses.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `handler` | `NotFoundHandler` | Yes | Not found handler function |

**Returns:** `this` (chainable)

**Handler Signature:**

```typescript
type NotFoundHandler = (ctx: Context) => Response | Promise<Response>;
```

**Default Behavior:**
- Returns JSON with error message and path

**Examples:**

```typescript
// Custom 404 handler
app.notFound((ctx) => {
  return ctx.json({
    success: false,
    error: "Not Found",
    path: new URL(ctx.request.url).pathname,
  }, 404);
});

// HTML 404 page
app.notFound((ctx) => {
  return ctx.text(`
    <html>
      <head><title>404 Not Found</title></head>
      <body>
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
      </body>
    </html>
  `, 404);
});

// Redirect to home page
app.notFound((ctx) => {
  return new Response(null, {
    status: 302,
    headers: { Location: "/" },
  });
});
```

---

### Dependency Injection (DI)

Buntok provides type-safe dependency injection via generics.

**Setup:**

```typescript
import { App } from "buntok";

// 1. Define your container type
class Database {
  getUsers() { return [{ id: 1, name: "Pito" }]; }
}

class UserService {
  constructor(private repo: Database) {}
  getActiveUsers() { return this.repo.getUsers(); }
}

type Container = {
  db: Database;
  userService: UserService;
  config: { dbName: string; port: number };
};

// 2. Pass Container to App
const app = new App<Container>();

// 3. Register dependencies (type-checked!)
const db = new Database();
app.set("db", db);
app.set("userService", new UserService(db));
app.set("config", { dbName: "buntok_db", port: 1212 });

// 4. Access in routes via ctx.di
app.get("/users", (ctx) => {
  const users = ctx.di.db.getUsers();       // Auto-complete works!
  const { config } = ctx.di;                // Destructuring works!
  return ctx.json({ data: users });
});
```

---

### `app.set(key, value)`

Store a dependency in the application container.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | `keyof DI` | Yes | Dependency name (must match Container type) |
| `value` | `DI[K]` | Yes | Value to store (must match type) |

**Returns:** `this` (chainable)

**Behavior:**
- Type-safe: TypeScript rejects wrong key names or value types
- Values accessible via `ctx.di` in handlers
- Useful for database instances, services, configs, singletons

**Examples:**

```typescript
type Container = {
  db: Database;
  config: { port: number };
};

const app = new App<Container>();

app.set("db", new Database());        // ✅ OK
app.set("config", { port: 3000 });   // ✅ OK
app.set("wrong", "value");           // ❌ TypeScript error!
```

---

### `app.group(prefix)`

Create a route group with shared prefix and middleware.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prefix` | `string` | Yes | URL prefix for all routes in group |

**Returns:** `RouterGroup`

**RouterGroup Methods:**
- `group.get(path, ...handlers)`
- `group.post(path, ...handlers)`
- `group.put(path, ...handlers)`
- `group.delete(path, ...handlers)`
- `group.use(middleware)` — group-level middleware
- `group.group(prefix)` — nested groups

**Examples:**

```typescript
// Basic group
const api = app.group("/api");

api.get("/users", handler);    // GET /api/users
api.post("/users", handler);   // POST /api/users
api.get("/posts", handler);    // GET /api/posts

// Nested groups
const v1 = api.group("/v1");
v1.get("/users", handler);     // GET /api/v1/users

const v2 = api.group("/v2");
v2.get("/users", handler);     // GET /api/v2/users
```

**Group Middleware:**

```typescript
const admin = app.group("/admin");

// Middleware applies to ALL routes in this group
admin.use(async (ctx, next) => {
  const token = ctx.request.headers.get("Authorization");
  if (!token) {
    return ctx.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

admin.get("/dashboard", handler);   // Protected
admin.get("/settings", handler);    // Protected

// Routes outside group are NOT affected
app.get("/public", publicHandler);  // No auth required
```

**Nested Group Middleware:**

```typescript
const api = app.group("/api");

// Parent middleware
api.use(loggerMiddleware);

const admin = api.group("/admin");

// Child middleware
admin.use(adminAuthMiddleware);

// GET /api/admin/dashboard runs:
// 1. loggerMiddleware
// 2. adminAuthMiddleware
// 3. handler
```

---

### `app.listen(port?, callback?)`

Start the HTTP server.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `port` | `number` | No | `1212` | Port to listen on |
| `callback` | `() => void` | No | - | Called after server starts |

**Returns:** `void`

**Port Resolution:**
1. Explicit `port` parameter
2. `PORT` environment variable
3. Default: `1212`

**Behavior:**
- Server auto-starts if `listen()` is never called
- Calling `listen()` multiple times is safe (no duplicate servers)
- Displays BUNTOK banner on startup

**Examples:**

```typescript
// Explicit port
app.listen(3000);

// Use environment variable
PORT=8080 bun run src/index.ts

// With callback
app.listen(3000, () => {
  console.log("Server ready!");
});

// No call needed - auto-starts
const app = new App();
app.get("/", handler);
// Server starts on port 1212 automatically
```

**Environment Variables:**

```bash
# Set custom port
PORT=8080 bun run src/index.ts

# Production
NODE_ENV=production PORT=80 bun run src/index.ts
```

---

## Context

The `Context` object provides access to the request and helper methods.

### `ctx.request`

The raw Web `Request` object.

```typescript
app.get("/headers", (ctx) => {
  const userAgent = ctx.request.headers.get("User-Agent");
  const contentType = ctx.request.headers.get("Content-Type");
  const auth = ctx.request.headers.get("Authorization");
  
  return ctx.json({ userAgent, contentType, hasAuth: !!auth });
});
```

**Common Properties:**

```typescript
ctx.request.method      // "GET", "POST", etc.
ctx.request.url         // "http://localhost:3000/users/123"
ctx.request.headers     // Headers object
ctx.request.body        // ReadableStream (use ctx.body() instead)
```

---

### `ctx.params`

Route parameters as key-value pairs. All values are strings.

```typescript
// Route: /users/:id
app.get("/users/:id", (ctx) => {
  const id = ctx.params.id; // "123" (string, not number!)
  return ctx.json({ id });
});

// Route: /users/:userId/posts/:postId
app.get("/users/:userId/posts/:postId", (ctx) => {
  const { userId, postId } = ctx.params;
  return ctx.json({ userId, postId });
});

// Wildcard: /files/*
app.get("/files/*", (ctx) => {
  const filePath = ctx.params["*"]; // "docs/readme.md"
  return ctx.json({ path: filePath });
});
```

**Type Conversion:**

```typescript
app.get("/users/:id", (ctx) => {
  // Params are always strings - convert manually
  const id = Number(ctx.params.id);
  
  if (Number.isNaN(id)) {
    return ctx.json({ error: "Invalid ID" }, 400);
  }
  
  // Now id is a number
  return ctx.json({ id });
});
```

---

### `ctx.store`

Shared data object between middleware and handlers. Useful for passing data down the pipeline.

```typescript
// Set data in middleware
app.use(async (ctx, next) => {
  ctx.store.user = await getUserFromRequest(ctx.request);
  ctx.store.startTime = Date.now();
  return next();
});

// Access in handler
app.get("/profile", (ctx) => {
  const user = ctx.store.user;
  const elapsed = Date.now() - ctx.store.startTime;
  return ctx.json({ user, elapsed });
});
```

**Type Safety:**

```typescript
// Define store type (optional)
interface AppStore {
  user?: User;
  startTime?: number;
}

// Use with type assertion
app.get("/profile", (ctx) => {
  const store = ctx.store as AppStore;
  return ctx.json({ user: store.user });
});
```

---

### `ctx.di`

Access dependencies registered via `app.set()`. Uses Proxy for property access with full TypeScript autocomplete.

**Type:** `DI` (your Container type)

**Examples:**

```typescript
type Container = {
  db: Database;
  userService: UserService;
  config: { dbName: string; port: number };
};

const app = new App<Container>();

app.set("db", new Database());
app.set("userService", new UserService(db));
app.set("config", { dbName: "buntok_db", port: 1212 });

app.get("/users", (ctx) => {
  // Property access
  const users = ctx.di.db.getUsers();
  
  // Destructuring
  const { config } = ctx.di;
  
  return ctx.json({
    database: config.dbName,
    data: users,
  });
});
```

**Error Handling:**

```typescript
app.get("/data", (ctx) => {
  try {
    const users = ctx.di.db.getUsers();
    return ctx.json({ data: users });
  } catch (err) {
    // Thrown if dependency not registered
    return ctx.json({ error: "Database not configured" }, 500);
  }
});
```

---

### `ctx.body<T>()`

Parse request body as JSON and return typed data.

**Type Parameter:**

| Type | Description |
|------|-------------|
| `T` | Expected body type (defaults to `unknown`) |

**Returns:** `Promise<T>`

**Throws:** `Error` if body is not valid JSON

**Examples:**

```typescript
// Basic usage
app.post("/users", async (ctx) => {
  const body = await ctx.body();
  return ctx.json({ received: body });
});

// With type
interface CreateUserRequest {
  name: string;
  email: string;
}

app.post("/users", async (ctx) => {
  const body = await ctx.body<CreateUserRequest>();
  
  // body.name is string
  // body.email is string
  
  return ctx.json({ created: true, user: body });
});
```

**Error Handling:**

```typescript
app.post("/users", async (ctx) => {
  try {
    const body = await ctx.body<{ name: string }>();
    return ctx.json({ success: true });
  } catch {
    return ctx.json({ error: "Invalid JSON body" }, 400);
  }
});
```

---

### `ctx.json(data, status?)`

Return a JSON response.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `data` | `unknown` | Yes | - | Data to serialize as JSON |
| `status` | `number` | No | `200` | HTTP status code |

**Returns:** `Response`

**Examples:**

```typescript
// 200 OK (default)
return ctx.json({ message: "Success" });

// 201 Created
return ctx.json({ data: newUser }, 201);

// 400 Bad Request
return ctx.json({ error: "Invalid input" }, 400);

// 404 Not Found
return ctx.json({ error: "User not found" }, 404);
```

**Headers Set Automatically:**
- `Content-Type: application/json`

---

### `ctx.text(text, status?)`

Return a plain text response.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | `string` | Yes | - | Response body text |
| `status` | `number` | No | `200` | HTTP status code |

**Returns:** `Response`

**Examples:**

```typescript
// Simple text
return ctx.text("Hello, World!");

// With status
return ctx.text("Not Found", 404);

// HTML response
return ctx.text("<h1>Hello!</h1>");
// Note: Use ctx.json() for application/json
```

**Headers Set Automatically:**
- `Content-Type: text/plain`

---

### `ctx.status(code)`

Return an empty response with only a status code.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `number` | Yes | HTTP status code |

**Returns:** `Response`

**Use Cases:**
- 204 No Content (successful DELETE)
- 301 Redirect (with Location header)
- 403 Forbidden

**Examples:**

```typescript
// Delete success
app.delete("/users/:id", async (ctx) => {
  await db.users.delete(ctx.params.id);
  return ctx.status(204);
});

// Redirect
app.get("/old-path", (ctx) => {
  return new Response(null, {
    status: 301,
    headers: { Location: "/new-path" },
  });
});
```

---

## Built-in Middlewares

### CORS

Handles Cross-Origin Resource Sharing.

**Import:**

```typescript
import { cors } from "buntok/middlewares/cors";
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `origin` | `string \| string[] \| Function` | `"*"` | Allowed origins |
| `methods` | `string[]` | `["GET","POST","PUT","DELETE","PATCH","OPTIONS"]` | Allowed methods |
| `headers` | `string[]` | `["Content-Type","Authorization","x-api-key"]` | Allowed headers |
| `credentials` | `boolean` | `false` | Allow credentials |

**Examples:**

```typescript
// Allow all origins (default)
app.use(cors());

// Restrict to specific origins
app.use(cors({
  origin: ["https://example.com", "https://app.example.com"],
}));

// Dynamic origin check
app.use(cors({
  origin: (origin) => origin.endsWith(".example.com"),
}));

// With credentials (cookies, auth headers)
app.use(cors({
  origin: "https://example.com",
  credentials: true,
}));
```

**Headers Added:**

| Header | Value |
|--------|-------|
| `Access-Control-Allow-Origin` | Allowed origin |
| `Access-Control-Allow-Methods` | Allowed HTTP methods |
| `Access-Control-Allow-Headers` | Allowed request headers |
| `Access-Control-Allow-Credentials` | `"true"` (if enabled) |

---

### Validator

Validate request body and/or route params before hitting your handler.

**Import:**

```typescript
import { validate, validateBody, validateParams } from "buntok/middlewares/validator";
```

**Schema Interface:**

Any object with a `.parse()` method works:

```typescript
interface ValidatorSchema {
  parse: (data: unknown) => unknown;
}
```

Compatible with: Zod, Valibot, Yup, custom schemas.

#### `validateBody(schema)`

Validate request body only.

```typescript
import { validateBody } from "buntok/middlewares/validator";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(18),
});

app.post("/users", validateBody(CreateUserSchema), (ctx) => {
  const data = ctx.store.validatedBody;
  return ctx.json({ created: true, data }, 201);
});
```

#### `validateParams(schema)`

Validate route params only.

```typescript
import { validateParams } from "buntok/middlewares/validator";

const IdSchema = {
  parse: (data: unknown) => {
    const { id } = data as Record<string, string>;
    if (!id || id.length < 3) {
      throw new Error("Invalid ID format");
    }
    return { id };
  },
};

app.get("/users/:id", validateParams(IdSchema), (ctx) => {
  const { id } = ctx.store.validatedParams;
  return ctx.json({ id });
});
```

#### `validate({ body?, params? })`

Validate both body and params.

```typescript
import { validate } from "buntok/middlewares/validator";

app.put("/users/:id", validate({
  body: CreateUserSchema,
  params: IdSchema,
}), (ctx) => {
  const { id } = ctx.store.validatedParams;
  const body = ctx.store.validatedBody;
  return ctx.json({ id, ...body });
});
```

**Validation Error Response (400):**

```json
{
  "error": "Validation Failed",
  "details": [
    "body: Name is required",
    "params: Invalid ID format"
  ]
}
```

---

### Rate Limiter

Limit request rate per IP or custom key.

**Import:**

```typescript
import { rateLimiter, slidingWindowRateLimiter } from "buntok/middlewares/rate-limiter";
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `max` | `number` | `100` | Maximum requests per window |
| `windowMs` | `number` | `60000` | Window duration in milliseconds |
| `message` | `string` | `"Too many requests..."` | Error message |
| `statusCode` | `number` | `429` | HTTP status code |
| `headers` | `boolean` | `true` | Add rate limit headers |
| `keyGenerator` | `Function` | IP-based | Custom key function |
| `skip` | `Function` | - | Skip rate limiting |

**Examples:**

```typescript
import { rateLimiter } from "buntok/middlewares/rate-limiter";

// Default: 100 requests per minute
app.use(rateLimiter());

// Custom limits
app.use(rateLimiter({
  max: 50,
  windowMs: 60000, // 1 minute
  message: "Rate limit exceeded",
}));

// Custom key (e.g., by user ID)
app.use(rateLimiter({
  keyGenerator: (ctx) => ctx.store.userId || ctx.ip,
}));

// Sliding window (more accurate)
import { slidingWindowRateLimiter } from "buntok/middlewares/rate-limiter";

app.use(slidingWindowRateLimiter({ max: 100 }));
```

**Response Headers:**

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed |
| `X-RateLimit-Remaining` | Requests remaining in window |
| `X-RateLimit-Reset` | Window reset timestamp |
| `Retry-After` | Seconds until next request (when limited) |

---

### Request ID

Add unique request ID to every request.

**Import:**

```typescript
import { requestId } from "buntok/middlewares/request-id";
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `header` | `string` | `"x-request-id"` | Header name |
| `generator` | `Function` | UUID | Custom ID generator |
| `store` | `boolean` | `true` | Store in ctx.store |
| `storeKey` | `string` | `"requestId"` | Property name in store |

**Examples:**

```typescript
import { requestId } from "buntok/middlewares/request-id";

// Default
app.use(requestId());

// Custom header and generator
import { shortId } from "buntok/middlewares/request-id";

app.use(requestId({
  header: "x-trace-id",
  generator: shortId,
}));

// Access in handler
app.get("/api", (ctx) => {
  const requestId = ctx.store.requestId;
  return ctx.json({ requestId });
});
```

---

### Response Time

Measure and add response time to headers.

**Import:**

```typescript
import { responseTime } from "buntok/middlewares/response-time";
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `header` | `string` | `"x-response-time"` | Header name |
| `format` | `"ms" \| "s"` | `"ms"` | Time format |
| `store` | `boolean` | `false` | Store in ctx.store |
| `storeKey` | `string` | `"responseTime"` | Property name in store |

**Examples:**

```typescript
import { responseTime } from "buntok/middlewares/response-time";

// Default (milliseconds)
app.use(responseTime());

// Seconds format
app.use(responseTime({ format: "s" }));

// Store in ctx.store for logging
app.use(responseTime({ store: true }));

app.get("/api", (ctx) => {
  // Access response time after handler executes
  return ctx.json({ message: "Hello" });
});
```

---

### Health Check

Register health check endpoint.

**Import:**

```typescript
import { healthCheck, createDatabaseCheck } from "buntok/middlewares/health-check";
```

**Examples:**

```typescript
import { healthCheck } from "buntok/middlewares/health-check";

// Basic health check
healthCheck(app);

// Custom path
healthCheck(app, { path: "/api/health" });

// With database check
import { createDatabaseCheck } from "buntok/middlewares/health-check";

healthCheck(app, {
  check: createDatabaseCheck(async () => {
    // Your database ping logic
    await db.query("SELECT 1");
    return true;
  }),
});

// Multiple checks
import { createHealthCheck } from "buntok/middlewares/health-check";

healthCheck(app, {
  check: createHealthCheck([
    { name: "database", check: async () => { /* db check */ return true; } },
    { name: "redis", check: async () => { /* redis check */ return true; } },
  ]),
});
```

**Response Example:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": { "status": "up", "duration": 5 }
  }
}
```

---

### SSE (Server-Sent Events)

Real-time data streaming to clients.

**Import:**

```typescript
import { SSE, createSSE } from "buntok";
```

**Examples:**

```typescript
import { SSE } from "buntok";

// Basic SSE endpoint
app.get("/events", (ctx) => {
  const sse = new SSE(ctx.request);
  
  // Send events
  sse.sendEvent("message", { text: "Hello!" });
  sse.sendData("Simple data");
  sse.sendWithId(1, { id: 1, data: "With ID" });
  
  return sse.connect();
});

// With options
app.get("/stream", (ctx) => {
  const sse = new SSE(ctx.request, {
    sendInitial: true,
    initialEvent: "connected",
    retry: 5000, // Client reconnect after 5s
  });
  
  // Send heartbeat every 30s (automatic)
  
  return sse.connect();
});

// Using helper function
import { createSSE } from "buntok";

app.get("/events", (ctx) => {
  const sse = createSSE(ctx.request);
  sse.sendEvent("update", { time: Date.now() });
  return sse.connect();
});
```

**SSE Methods:**

| Method | Description |
|--------|-------------|
| `send(message)` | Send full message object |
| `sendData(data)` | Send simple data |
| `sendEvent(event, data)` | Send named event |
| `sendWithId(id, data)` | Send with ID (for resumption) |
| `close()` | Close connection |
| `isConnected` | Check if connected |

---

### Cookie Helpers

Parse and manage cookies.

**Import:**

```typescript
import { getCookie, setCookie, deleteCookie, parseCookies } from "buntok/helpers/cookie";
```

**Examples:**

```typescript
import { getCookie, setCookie, deleteCookie } from "buntok/helpers/cookie";

// Get cookie in handler
app.get("/api", (ctx) => {
  const token = ctx.getCookie("auth_token");
  // Or use helper
  // const token = getCookie(ctx.request, "auth_token");
  
  return ctx.json({ token });
});

// Set cookie on response
app.post("/login", async (ctx) => {
  const response = ctx.json({ success: true });
  
  return setCookie(response, "auth_token", "xyz123", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 86400, // 1 day
  });
});

// Delete cookie
app.post("/logout", (ctx) => {
  const response = ctx.json({ success: true });
  return deleteCookie(response, "auth_token");
});

// Parse all cookies
app.get("/cookies", (ctx) => {
  const cookies = ctx.getCookies(); // Or parseCookies(request)
  return ctx.json({ cookies });
});
```

---

### File Uploads

Parse and validate `multipart/form-data` uploads using customizable storage drivers. Features automatic size and MIME-type validation.

**Import:**

```typescript
import { uploader, LocalDiskStorage, parseUploads } from "buntok";
```

**As a Middleware:**

Automatically parses files and places them in `ctx.store.files`, and standard form fields in `ctx.store.fields`.

```typescript
app.post("/avatar", 
  uploader({
    storage: new LocalDiskStorage("./uploads"),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png"]
  }),
  (ctx) => {
    // Access uploaded files
    const file = ctx.store.files[0];
    return ctx.json({ 
      success: true, 
      file: file.filename 
    });
  }
);
```

**Manual Parsing (Helper Method):**

Parse uploads directly inside your handler for maximum flexibility.

```typescript
app.post("/documents", async (ctx) => {
  const result = await parseUploads(ctx, {
    storage: new LocalDiskStorage("./storage/docs"),
    maxFileSize: 10 * 1024 * 1024
  });

  if (!result.success) {
    return ctx.error(result.error);
  }

  // Text inputs from the same form are separated in fields
  const { title } = result.fields;

  return ctx.json({ title, files: result.files });
});
```

**Custom Storage Drivers (Cloudinary, AWS S3, etc):**

Buntok uses a plugin-based architecture for storage. You can easily build your own driver for third-party providers (like Cloudinary or S3) by implementing the `StorageDriver` interface.

Here is a ready-to-use example for **Cloudinary**:

```typescript
import { StorageDriver, UploadedFile, uploader } from "buntok";
import { v2 as cloudinary } from "cloudinary";

export class CloudinaryStorage implements StorageDriver {
  async handleFile(file: File, filename: string): Promise<UploadedFile> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { public_id: filename }, 
        (error, result) => {
          if (error) return reject(error);
          resolve({
            originalName: file.name,
            filename: result!.public_id,
            size: file.size,
            type: file.type,
            path: result!.secure_url, // Direct image URL
          });
        }
      ).end(buffer);
    });
  }
}

// Usage:
app.post("/avatar", uploader({ storage: new CloudinaryStorage() }), (ctx) => {
  return ctx.json({ url: ctx.store.files[0].path });
});
```

---

## Enterprise Features

Buntok is built to scale. It comes with built-in modules for common enterprise requirements.

### Caching

Buntok includes a robust caching system using a Driver pattern. By default, it uses `MemoryCacheDriver`. It supports atomic operations and advanced key retrieval.

```typescript
import { Cache, MemoryCacheDriver } from "buntok";

// Initialize the Cache
const cache = new Cache(new MemoryCacheDriver());

// Set a value with a 60-second TTL
await cache.set("user:1", { name: "John" }, 60);

// getOrSet: fetch from DB if not in cache, then cache it for 5 mins
const user = await cache.getOrSet("user:2", () => db.findUser(2), 300);

// Atomic counters
const views = await cache.increment("post:1:views");

// Pattern deletion (e.g. clear all session keys)
await cache.deletePattern("session:*");
```

### Background Queues

Handle long-running tasks asynchronously using the Queue system. Features automatic retries, backoff strategies, delays, and priority queuing.

```typescript
import { Queue } from "buntok";

// Initialize the Queue with options
const emailQueue = new Queue("email", { 
  maxRetries: 3, 
  retryDelay: 1000, 
  backoff: "exponential" 
});

// Define a worker
emailQueue.process(async (job) => {
	console.log(`[Attempt ${job.attempt + 1}] Sending email to:`, job.data.to);
});

// Add jobs to the queue with options
await emailQueue.add(
  { to: "admin@example.com", subject: "Hello" }, 
  { delay: 5000, priority: 10 } // Wait 5 seconds, high priority
);
```

### Task Scheduling

Run recurring background jobs using standard cron syntax and the `@CronJob()` decorator. 

Unlike other frameworks, `@CronJob` safely binds to the class instance, allowing you to access injected services via `this`.

```typescript
import { Controller, CronJob } from "buntok";

@Controller("/tasks")
export class TaskController {
	constructor(private readonly cache: Cache) {}
	
	// Runs every day at midnight
	@CronJob("0 0 * * *")
	async performCleanup() {
    // \`this\` works perfectly!
		await this.cache.deletePattern("tmp:*");
		console.log("Cleanup complete!");
	}
}
```

### Auth Guards

Protect your endpoints using granular Auth Guards and the `@UseGuard()` decorator.

```typescript
import { Controller, Get, UseGuard, type GuardFn } from "buntok";

const IsAdmin: GuardFn = async (ctx) => {
	const user = await ctx.di.get("user");
	return user?.role === "admin";
};

@Controller("/admin")
export class AdminController {
	
	@Get("/dashboard")
	@UseGuard(IsAdmin)
	async dashboard(ctx) {
		return ctx.json({ message: "Welcome Admin" });
	}
}
```

### AI & LLM Integration (AI Ready)

Buntok natively supports the **Vercel AI SDK Data Stream Protocol**, making it the perfect backend for Generative UI, chatbots, and autonomous agents.

```typescript
import { Router, streamAI, injectSystemPrompt, AICache, MemoryCacheDriver } from "buntok";
import { OpenAI } from "openai";

const app = new Router();
const openai = new OpenAI();
const aiCache = new AICache(new MemoryCacheDriver());

app.post("/api/chat", async (ctx) => {
  const { messages } = await ctx.body();
  
  // 1. Semantic Cache: Check if we've seen this exact conversation
  const cached = await aiCache.get(messages);
  if (cached) return ctx.json({ role: "assistant", content: cached });
  
  // 2. Guardrails: force system prompt & prevent injection
  const securedMessages = injectSystemPrompt(messages, "You are a helpful assistant.");
  
  // 3. Fetch from OpenAI (Stream mode)
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    messages: securedMessages,
  });

  // 4. Automatically stream via Vercel AI Protocol (0:"text")
  return streamAI(ctx, response, {
    onCompletion: async (fullText) => await aiCache.set(messages, fullText)
  }); 
});
```

## Examples

### Basic CRUD API

```typescript
import { App } from "buntok";

const app = new App();

// In-memory storage
const users: Array<{ id: string; name: string; email: string }> = [];

// List all users
app.get("/users", (ctx) => {
  return ctx.json({ data: users });
});

// Get user by ID
app.get("/users/:id", (ctx) => {
  const user = users.find((u) => u.id === ctx.params.id);
  if (!user) {
    return ctx.json({ error: "User not found" }, 404);
  }
  return ctx.json({ data: user });
});

// Create user
app.post("/users", async (ctx) => {
  const body = await ctx.body<{ name: string; email: string }>();
  const user = {
    id: crypto.randomUUID(),
    ...body,
  };
  users.push(user);
  return ctx.json({ data: user }, 201);
});

// Update user
app.put("/users/:id", async (ctx) => {
  const index = users.findIndex((u) => u.id === ctx.params.id);
  if (index === -1) {
    return ctx.json({ error: "User not found" }, 404);
  }
  const body = await ctx.body<{ name: string; email: string }>();
  users[index] = { ...users[index], ...body };
  return ctx.json({ data: users[index] });
});

// Delete user
app.delete("/users/:id", (ctx) => {
  const index = users.findIndex((u) => u.id === ctx.params.id);
  if (index === -1) {
    return ctx.json({ error: "User not found" }, 404);
  }
  users.splice(index, 1);
  return ctx.status(204);
});
```

---

### Authentication Middleware

```typescript
import { App } from "buntok";
import type { Middleware } from "buntok";

const app = new App();

// Auth middleware
const auth: Middleware = async (ctx, next) => {
  const token = ctx.request.headers.get("Authorization");
  
  if (!token) {
    return ctx.json({ error: "No token provided" }, 401);
  }
  
  try {
    // Verify token (example with JWT)
    const user = await verifyToken(token);
    ctx.store.user = user;
    return next();
  } catch {
    return ctx.json({ error: "Invalid token" }, 401);
  }
};

// Admin-only middleware
const adminOnly: Middleware = async (ctx, next) => {
  if (ctx.store.user?.role !== "admin") {
    return ctx.json({ error: "Admin access required" }, 403);
  }
  return next();
};

// Protected routes
app.get("/profile", auth, (ctx) => {
  return ctx.json({ user: ctx.store.user });
});

// Admin routes
app.get("/admin/dashboard", auth, adminOnly, (ctx) => {
  return ctx.json({ message: "Welcome, admin!" });
});
```

---

### Route Groups

```typescript
import { App } from "buntok";

const app = new App();

// API v1 group
const v1 = app.group("/api/v1");

// Auth middleware for all v1 routes
v1.use(async (ctx, next) => {
  const token = ctx.request.headers.get("Authorization");
  if (!token) return ctx.json({ error: "Unauthorized" }, 401);
  return next();
});

// GET /api/v1/users
v1.get("/users", (ctx) => {
  return ctx.json({ users: [] });
});

// POST /api/v1/users
v1.post("/users", async (ctx) => {
  const body = await ctx.body();
  return ctx.json({ created: true, data: body }, 201);
});

// Nested group
const admin = v1.group("/admin");
// GET /api/v1/admin/settings
admin.get("/settings", (ctx) => {
  return ctx.json({ settings: {} });
});

// Public routes (no auth)
app.get("/", (ctx) => {
  return ctx.json({ message: "Public API" });
});
```

---

### Validation with Zod

```typescript
import { App } from "buntok";
import { validate, validateBody } from "buntok/middlewares/validator";
import { z } from "zod";

const app = new App();

// Define schemas
const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const UserIdSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
});

// Create user with validation
app.post("/users", validateBody(CreateUserSchema), async (ctx) => {
  const data = ctx.store.validatedBody;
  
  // data is fully typed and validated
  const user = await db.users.create(data);
  return ctx.json({ data: user }, 201);
});

// Get user with param validation
app.get("/users/:id", validate({ params: UserIdSchema }), (ctx) => {
  const { id } = ctx.store.validatedParams;
  return db.users.find(id);
});
```

---

### Static Files + SPA

```typescript
import { App } from "buntok";

const app = new App();

// Serve static assets
app.static("/assets", "./public");

// SPA fallback - serve index.html for all other routes
app.get("*", (ctx) => {
  return new Response(Bun.file("./public/index.html"));
});
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `1212` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `LOG_DIR` | - | Directory for log files |
| `LOG_REQUESTS` | `true` | Set to `false` to disable request logging (useful for benchmarks) |

### Logger Behavior

| Environment | Log Level | Format |
|-------------|-----------|--------|
| Development | DEBUG, INFO, WARN, ERROR | Colored text |
| Production | WARN, ERROR | JSON |

**Examples:**

```bash
# Custom port
PORT=8080 bun run src/index.ts

# Production mode (WARN+ERROR only, JSON format)
NODE_ENV=production bun run src/index.ts

# Enable file logging
LOG_DIR=./logs bun run src/index.ts

# Disable request logging (for benchmarks)
LOG_REQUESTS=false bun run src/index.ts
```

---

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "types": ["bun"],
    "strict": true,
    "moduleResolution": "bundler",
    "noEmit": true
  }
}
```

---

## Project Structure

```
my-app/
├── src/
│   └── index.ts          # Application entry point
├── public/
│   ├── favicon.ico       # Favicon (auto-served)
│   └── logo.svg          # Static assets
├── .vscode/
│   └── settings.json     # VS Code + Biome config
├── biome.json            # Linter/formatter config
├── tsconfig.json         # TypeScript config
└── package.json
```

---

## Performance

Buntok is built for speed. Here are benchmark results using [autocannon](https://github.com/mcollina/autocannon) with 50 concurrent connections:

### Production Mode (`NODE_ENV=production`)

| Test | Req/sec | Latency avg | Latency p99 | Throughput |
|------|---------|-------------|-------------|------------|
| Plain text | **15,659** | 2.72ms | 10ms | 1.72 MB/s |
| JSON | **15,981** | 2.65ms | 10ms | 2.48 MB/s |
| Route params (`/user/:id`) | **17,542** | 2.38ms | 10ms | 2.48 MB/s |
| Query string | **18,955** | 2.16ms | 7ms | 2.64 MB/s |
| POST JSON 1 KB | **15,738** | 2.68ms | 10ms | 2.25 MB/s |
| Middleware 5 layers | **16,596** | 2.53ms | 10ms | 2.23 MB/s |
| Static file 100 KB | **4,717** | 10.15ms | 28ms | 461 MB/s |

### Development Mode

| Test | Req/sec | Latency avg | Latency p99 | Throughput |
|------|---------|-------------|-------------|------------|
| Plain text | **6,918** | 6.81ms | 29ms | 0.76 MB/s |
| JSON | **6,142** | 7.65ms | 35ms | 0.95 MB/s |
| Route params (`/user/:id`) | **5,157** | 9.28ms | 45ms | 0.73 MB/s |
| Query string | **7,377** | 6.29ms | 25ms | 1.03 MB/s |
| POST JSON 1 KB | **6,257** | 7.51ms | 35ms | 0.90 MB/s |
| Middleware 5 layers | **8,060** | 5.71ms | 23ms | 1.08 MB/s |
| Static file 100 KB | **2,357** | 21.05ms | 67ms | 230 MB/s |

> **Note:** Production mode only logs WARN+ERROR level (JSON format), while development mode logs all levels (colored text). The performance difference is primarily due to reduced I/O overhead in production.

### Run Benchmarks

```bash
bun run bench        # Development mode
bun run bench:prod   # Production mode
```

---

## ⚡ Performance Benchmark

Buntok is designed to give you the architectural elegance of heavy enterprise frameworks (like NestJS) without sacrificing the raw, face-melting speed of the Bun runtime.

In local benchmark tests (100 concurrent connections, 10 seconds, measured via `bombardier`), Buntok stands shoulder-to-shoulder with the fastest minimal web frameworks in the ecosystem. You get full Object-Oriented Dependency Injection and Decorators with **zero performance penalty**.

| Framework | Plaintext (req/sec) | JSON (req/sec) | Dynamic Route (req/sec) |
| :--- | :--- | :--- | :--- |
| **Buntok** | ~18,527 | ~18,221 | ~18,099 |
| **Elysia** | ~18,772 | ~18,150 | ~18,286 |
| **Hono** | ~18,794 | ~18,373 | ~18,271 |
| **Fastify** | ~18,097 | ~18,549 | ~18,101 |
| **Express** | ~19,286* | ~17,455 | ~17,082 |

*(Note: Benchmark conducted on a standardized local test VM. The numbers demonstrate that Buntok easily matches and often exceeds the throughput of minimal functional routers despite offering a heavy OOP Developer Experience).*

## 📖 Complete Documentation

## Code Generation

Buntok includes a CLI tool for generating code (schema, repository, service, controller) using Drizzle ORM.

### Generate All Files

```bash
bunx buntok create <entity>
```

Example:
```bash
bunx buntok create user
```

This generates:
- `src/db/schemas/user.ts` - Drizzle schema
- `src/repositories/user.repository.ts` - Repository pattern
- `src/services/user.service.ts` - Service layer
- `src/controllers/user.controller.ts` - Controller with CRUD

### Generate Specific Files

```bash
bunx buntok create <entity> --schema      # Only Drizzle schema
bunx buntok create <entity> --repo        # Only repository
bunx buntok create <entity> --service     # Only service
bunx buntok create <entity> --controller  # Only controller
```

### Combine Options

```bash
bunx buntok create user --repo --service  # Repository + Service only
```

### After Generation

1. Add columns to your schema in `src/db/schemas/<entity>.ts`
2. Run migrations:
   ```bash
   bun run db:push      # Push schema to database
   bun run db:generate  # Generate migration files
   bun run db:migrate   # Run migrations
   bun run db:studio    # Open Drizzle Studio
   ```
3. Register routes in `src/index.ts`

---

## Scripts

```bash
bun run dev        # Start with hot reload
bun run start      # Start production server
bun run bench      # Run benchmarks (development)
bun run bench:prod # Run benchmarks (production)
bun run check      # Biome check + format
bun run format     # Format code only
bun run lint       # Lint code only
```

---

## License

MIT
