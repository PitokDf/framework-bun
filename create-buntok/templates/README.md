# Buntok Project

> High-performance web framework for [Bun](https://bun.sh) runtime

## Getting Started

```bash
# Development
bun run dev

# Production
bun run start
```

Server starts on port `3000` (or `PORT` env var).

## Project Structure

```
src/
├── controllers/    # Request handlers
├── db/
│   └── schemas/    # Drizzle ORM schemas
├── repositories/   # Database queries
├── routes/         # Route definitions
├── services/       # Business logic
└── index.ts        # Entry point
```

| Feature | Description |
|------|-------------|
| 📦 **Code Generation** | CLI tool for generating schema, repo, service, controller |
| 🧠 **Cache System** | Built-in driver-based Cache manager |
| 🔄 **Queue System** | Built-in driver-based background Queues |
| ⏱️ **Task Scheduler** | Native CRON job support via `@CronJob` |
| 🛡️ **Auth Guards** | Granular access control via `@UseGuard` |

## Code Generation

Generate CRUD files for an entity:

```bash
# Generate all files
bunx buntok create user

# Generate specific files
bunx buntok create user --schema
bunx buntok create user --repo --service
bunx buntok create user --controller
bunx buntok create user --route
```

### What Gets Generated

| File | Description |
|------|-------------|
| `src/db/schemas/user.ts` | Drizzle schema |
| `src/repositories/user.repository.ts` | Database queries |
| `src/services/user.service.ts` | Business logic |
| `src/controllers/user.controller.ts` | Request handlers |
| `src/routes/user.routes.ts` | Route definitions + DI registration |

### After Generation

1. Add columns to schema in `src/db/schemas/user.ts`
2. Run migrations:
   ```bash
   bun run db:push      # Push schema to database
   bun run db:generate  # Generate migration files
   bun run db:migrate   # Run migrations
   bun run db:studio    # Open Drizzle Studio
   ```

3. Register routes in `src/index.ts`:
   ```ts
   import { registerUserRoutes } from "@/routes/user.routes";
   
   registerUserRoutes(app);
   ```

## Basic Usage

### Simple Route

```ts
import { App } from "buntok";

const app = new App();

app.get("/", (ctx) => {
  return ctx.json({ message: "Hello!" });
});
```

### Route with Params

```ts
app.get("/users/:id", (ctx) => {
  const { id } = ctx.params;
  return ctx.json({ id });
});
```

### POST with Body

```ts
app.post("/users", async (ctx) => {
  const body = await ctx.body<{ name: string }>();
  return ctx.json({ created: true, data: body }, 201);
});
```

### QUERY (Complex Queries)

Like GET but with body support - idempotent and cacheable:

```ts
app.query("/search", async (ctx) => {
  const filters = await ctx.body<{
    query: string;
    limit: number;
    sort: string;
  }>();
  
  const results = await db.search(filters);
  return ctx.json({ data: results });
});
```

**Why QUERY over GET/POST?**
- Body allowed (unlike GET)
- Idempotent & cacheable (unlike POST)
- Safe for complex queries

### Route Group

```ts
const api = app.group("/api");

api.get("/users", getUsers);
api.post("/users", createUser);
```

### Controllers (Decorators)

```ts
import { Controller, Get } from "buntok";

@Controller("/users")
export class UserController {
  @Get("/")
  getAll(ctx: Context) {
    return ctx.json([{ id: 1 }]);
  }
}

app.registerController(UserController);
```

### WebSockets

```ts
app.ws("/chat", {
  open: (ws) => {
    // Treat user ID as a room
    ws.subscribe("user_123");
  },
  message: (ws, msg) => {
    // Parse JSON for events
    const payload = JSON.parse(String(msg));
    if (payload.event === "typing") { /* ... */ }
  }
});
```

**Note on Frontend Clients:**
Buntok uses **Raw WebSockets (RFC 6455)** natively.
⚠️ **Do NOT use `socket.io-client`** to connect to Buntok.
✅ **Recommended clients for React/Next.js:** `react-use-websocket`, `partysocket`, or native `WebSocket`.

**Broadcasting Events from API/Jobs:**
You can access the Bun Server instance natively via `app.server` to publish messages from anywhere in your backend!

```typescript
// Broadcast to a specific user
app.post("/api/checkout", (ctx) => {
  app.server?.publish("user_123", JSON.stringify({ 
    event: "order_done", data: {} 
  }));
  return ctx.success();
});
```

### Server-Sent Events (SSE)

Lightweight alternative to WebSockets for Server-to-Client one-way streams.

```ts
app.get("/stream", (ctx) => {
  return ctx.sse((stream) => {
    stream.sendEvent("connected", { status: "ok" });

    const timer = setInterval(() => {
      stream.sendEvent("ping", { time: Date.now() });
    }, 1000);

    stream.onClose(() => clearInterval(timer));
  });
});
```

### Middleware

```ts
// Global middleware
app.use(async (ctx, next) => {
  console.log(`→ ${ctx.request.method}`);
  const response = await next();
  console.log(`← ${response.status}`);
  return response;
});

// Per-route middleware
app.get("/admin", authMiddleware, (ctx) => {
  return ctx.json({ message: "Admin only" });
});
```

### Dependency Injection

```ts
// Register
app.set("userService", new UserService());

// Access in handler
app.get("/users", (ctx) => {
  const users = ctx.di.userService.getAll();
  return ctx.json({ data: users });
});
```

## Built-in Middlewares

### CORS

```ts
import { cors } from "buntok";

app.use(cors({ origin: "*" }));
```

### Rate Limiter

```ts
import { rateLimiter } from "buntok";

app.use(rateLimiter({ max: 100, windowMs: 60000 }));
```

### Request ID

```ts
import { requestId } from "buntok";

app.use(requestId());

// Access: ctx.store.requestId
```

### Response Time

```ts
import { responseTime } from "buntok";

app.use(responseTime());

// Access: ctx.store.responseTime
```

### Health Check

```ts
import { healthCheck } from "buntok";

app.use(healthCheck({
  path: "/health",
  checks: {
    database: async () => {
      await db.query("SELECT 1");
      return { status: "ok" };
    },
  },
}));
```

## Context Methods

```ts
app.get("/example", async (ctx) => {
  // Body
  const body = await ctx.body<{ name: string }>();
  
  // Params
  const id = ctx.params.id;
  
  // JSON response
  return ctx.json({ data: "ok" });
  
  // Text response
  return ctx.text("Hello");
  
  // HTML response
  return ctx.html("<h1>Hello</h1>");
  
  // Status only
  return ctx.status(204);
  
  // Redirect
  return ctx.redirect("/login", 302);
  
  // Cookies
  const token = ctx.getCookie("token");
});
```

## Error Handling

```ts
import { NotFoundError, BadRequestError } from "buntok";

// Throw errors - automatically returns proper status code
throw new NotFoundError("User not found");    // 404
throw new BadRequestError("Invalid data");    // 400

// Or use asyncHandler in controllers (auto-catches errors)
import { asyncHandler } from "buntok";

export class UserController {
  getAll = asyncHandler(async (ctx) => {
    const users = await this.service.getAll();
    return ctx.json({ data: users });
  });
}
```

## Database Commands

```bash
bun run db:push      # Push schema to database
bun run db:generate  # Generate migration files
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
```

## Configuration

### Environment Variables

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
PORT=3000
NODE_ENV=development
```

### tsconfig.json

Path aliases are configured:
```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

Use `@/` for imports:
```ts
import { UserService } from "@/services/user.service";
```

## Learn More

- [Buntok Documentation](https://www.npmjs.com/package/buntok)
- [Bun Documentation](https://bun.sh/docs)

## License

MIT
