import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Controllers",
  description:
    "Create reusable controllers with dependency injection and CRUD scaffolding.",
};

export default function ControllersPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Controllers
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Controllers organize routes into class-based structures using Stage 3
        TC39 decorators. They provide a clean way to group related handlers with
        shared middleware and dependency injection.
      </p>

      {/* ──────────────── BASIC CONTROLLER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Controller
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>@Controller</code> to define a route prefix, then{" "}
        <code>@Get</code>, <code>@Post</code>, etc. to register methods:
      </p>
      <CodeBlock
        code={`import { Controller, Get, Post } from "@buntok/core";
import type { Context } from "@buntok/core";

@Controller("/users")
class UserController {
  @Get("/")
  list(ctx: Context) {
    return ctx.json([{ id: 1, name: "John" }]);
  }

  @Get("/:id")
  detail(ctx: Context) {
    const { id } = ctx.params;
    return ctx.json({ id, name: "John" });
  }

  @Post("/")
  async create(ctx: Context) {
    const body = await ctx.body();
    return ctx.json({ created: true, ...body }, 201);
  }
}`}
      />

      <Callout type="info">
        <code>@Controller</code> must be the{" "}
        <strong>outermost (topmost)</strong> decorator on the class. TypeScript
        decorators execute bottom-to-top, so <code>@Controller</code> runs last
        and captures all method routes.
      </Callout>

      {/* ──────────────── REGISTER CONTROLLERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Register Controllers
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>app.registerController()</code> to register controller
        classes:
      </p>
      <CodeBlock
        code={`const app = new App();

// Register single controller
app.registerController(UserController);

// Register multiple controllers
app.registerController(UserController);
app.registerController(PostController);

// Start server
app.listen(1212);`}
      />

      {/* ──────────────── HTTP METHOD DECORATORS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        HTTP Method Decorators
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Decorator
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                HTTP Method
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["@Get(path)", "GET"],
              ["@Post(path)", "POST"],
              ["@Put(path)", "PUT"],
              ["@Patch(path)", "PATCH"],
              ["@Delete(path)", "DELETE"],
              ["@Options(path)", "OPTIONS"],
              ["@Head(path)", "HEAD"],
              ["@All(path)", "All standard methods"],
              ["@Query(path)", "QUERY (Bun-specific)"],
            ].map(([decorator, method]) => (
              <tr
                key={decorator}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{decorator}</td>
                <td className="px-4 py-2 font-mono font-semibold text-text-primary">
                  {method}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Middleware
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Route-Level Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>@Use()</code> to attach middleware to a single route. Multiple{" "}
        <code>@Use()</code> calls stack in declaration order.
      </p>
      <CodeBlock
        code={`import { Controller, Get, Use } from "@buntok/core";
import { zValidator } from "@buntok/core";
import type { Context, ZodCtx } from "@buntok/core";

const auth = async (ctx: Context, next) => {
  const token = ctx.getCookie("token");
  if (!token) return ctx.json({ error: "Unauthorized" }, 401);
  return next();
};

@Controller("/users")
class UserController {
  @Get("/public")
  publicEndpoint(ctx: Context) {
    return ctx.json({ data: "public" });
  }

  @Get("/private")
  @Use(auth)
  privateEndpoint(ctx: Context) {
    return ctx.json({ data: "private" });
  }

  @Get("/validated")
  @Use(zValidator("query", paginationSchema))
  validatedEndpoint(ctx: ZodCtx<{ query: typeof paginationSchema }>) {
    const { page, limit } = ctx.valid("query");
    return ctx.json({ page, limit });
  }
}`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Guards
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>@UseGuard()</code> for simple boolean authorization checks. If
        any guard returns <code>false</code>, the request is rejected with{" "}
        <code>403 Forbidden</code>.
      </p>
      <CodeBlock
        code={`import { Controller, Get, UseGuard } from "@buntok/core";
import type { Context } from "@buntok/core";

const isAdmin = (ctx: Context) => ctx.user?.role === "admin";
const isActive = (ctx: Context) => ctx.user?.status === "active";

@Controller("/admin")
class AdminController {
  @Get("/dashboard")
  @UseGuard(isAdmin, isActive)
  dashboard(ctx: Context) {
    return ctx.json({ secret: "admin data" });
  }
}`}
      />

      <Callout type="info">
        Guards are async-compatible - you can perform database lookups or API
        calls. <code>@UseGuard</code> is syntactic sugar for <code>@Use</code>{" "}
        that returns 403 on failure.
      </Callout>

      {/* ──────────────── GROUPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Controllers with Groups
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Controllers can be registered inside route groups. The group prefix is
        prepended to the controller prefix, and group middleware runs after
        route-level <code>@Use()</code> middleware.
      </p>
      <CodeBlock
        code={`const api = app.group("/api/v1");
api.use(cors);
api.use(authMiddleware);

// UserController has @Controller("/users")
// Final routes: GET /api/v1/users, POST /api/v1/users, etc.
api.registerController(UserController);

// Execution order for GET /api/v1/users:
// @Use middlewares → cors → authMiddleware → handler`}
      />

      {/* ──────────────── INHERITANCE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Inheritance
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Controllers support class inheritance. Child routes override parent
        routes with the same method name.
      </p>
      <CodeBlock
        code={`import type { Context } from "@buntok/core";

@Controller("/base")
class Base {
  @Get("/health")
  health(ctx: Context) {
    return ctx.json({ ok: true });
  }

  @Get("/info")
  info(ctx: Context) {
    return ctx.json({ version: "1.0" });
  }
}

@Controller("/users")
class UserController extends Base {
  @Get("/")
  list(ctx: Context) {
    return ctx.json([]);
  }

  // Override parent's /health route
  @Get("/health")
  customHealth(ctx: Context) {
    return ctx.json({ status: "custom" });
  }
}

// Routes:
// GET /users          → list
// GET /users/health   → customHealth (overrides parent)
// GET /users/info     → parent's info`}
      />

      {/* ──────────────── BASE CONTROLLER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Base Controller (CRUD Scaffold)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Extend <code>BaseController</code> to get a full CRUD scaffold with
        pre-built routes:
      </p>
      <CodeBlock
        code={`import { BaseController } from "@buntok/core";

interface User {
  id: number;
  name: string;
  email: string;
}

interface CreateUser {
  name: string;
  email: string;
}

@Controller("/users")
class UserController extends BaseController<User, CreateUser, Partial<User>> {
  constructor(service: UserService) {
    super(service);
  }
}

// Pre-built routes:
// GET    /       → service.getAll()
// GET    /:id    → service.getById(id)
// POST   /       → service.create(body)
// PUT    /:id    → service.update(id, body)
// DELETE /:id    → service.delete(id)`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Overriding Methods
      </Heading>
      <CodeBlock
        code={`import type { Context } from "@buntok/core";

@Controller("/users")
class UserController extends BaseController<User, CreateUser> {
  constructor(private service: UserService) {
    super(service);
  }

  // Override the default getAll behavior
  @Get("/")
  override async list(ctx: Context) {
    const users = await this.service.findAllWithRoles();
    return ctx.success(users);
  }

  // Override parseId for UUID-based IDs
  protected override parseId(id: string): string {
    return id; // Keep as string, don't convert to number
  }
}`}
      />

      {/* ──────────────── DEPENDENCY INJECTION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Dependency Injection
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Controllers work with the IoC container. Use <code>@Inject</code> to
        declare dependencies and <code>@Injectable</code> to register services:
      </p>
      <CodeBlock
        code={`import { Injectable, Inject, Controller, Get } from "@buntok/core";
import type { Context } from "@buntok/core";

@Injectable()
class UserService {
  async findAll() {
    return await db.user.findMany();
  }
}

@Controller("/users")
class UserController {
  constructor(
    @Inject(UserService) private userService: UserService
  ) {}

  @Get("/")
  async list(ctx: Context) {
    const users = await this.userService.findAll();
    return ctx.json(users);
  }
}

// Setup
const container = new Container();
container.registerClass(UserService);

app.setContainer(container);
app.registerController(UserController);`}
      />

      <Callout type="warning">
        Without <code>app.setContainer()</code>, the controller is instantiated
        with <code>new Controller()</code> and <code>@Inject</code> properties
        will be <code>undefined</code>.
      </Callout>

      {/* ──────────────── HOW IT WORKS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        How It Works
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Decorators execute once at class-definition time (bootstrap), not per
        request:
      </p>
      <ol className="my-3 ml-6 list-decimal text-text-secondary space-y-1">
        <li>
          <code>@Get</code>, <code>@Post</code>, etc. push route entries to a
          temporary array
        </li>
        <li>
          <code>@Use</code> attaches middleware to the pending route entry
        </li>
        <li>
          <code>@Controller</code> captures all entries and stores them in a{" "}
          <code>WeakMap</code>
        </li>
        <li>
          <code>app.registerController()</code> reads the metadata and calls{" "}
          <code>app.registerRoute()</code> for each method
        </li>
      </ol>
      <p className="my-3 text-text-secondary leading-relaxed">
        At runtime, the router sees no difference between decorator-based and
        functional route registrations. Both converge to the same{" "}
        <code>registerRoute()</code> call.
      </p>

      {/* ──────────────── NEXT STEPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Next Steps
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <a href="/docs/decorators" className="text-accent hover:underline">
            Decorators
          </a>{" "}
          - Full decorator reference
        </li>
        <li>
          <a href="/docs/ioc" className="text-accent hover:underline">
            IoC Container
          </a>{" "}
          - Dependency injection
        </li>
        <li>
          <a href="/docs/middleware" className="text-accent hover:underline">
            Middleware
          </a>{" "}
          - Middleware patterns
        </li>
        <li>
          <a href="/docs/routing" className="text-accent hover:underline">
            Routing
          </a>{" "}
          - Functional routing
        </li>
      </ul>
    </div>
  );
}
