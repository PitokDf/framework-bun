import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Decorators",
  description: "Use decorators for route handling, validation, guards, and middleware in Buntok.",
};


export default function DecoratorsPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Decorators
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok uses Stage 3 TC39 decorators - the standard decorators natively
        supported by Bun and TypeScript 5+ without the{" "}
        <code>experimentalDecorators</code> flag.
      </p>

      <Callout type="info">
        Decorators execute once at class-definition time (bootstrap), not per
        request. This means zero runtime overhead - the router produces the same{" "}
        <code>registerRoute()</code> calls as manual{" "}
        <code>app.get()</code>/<code>app.post()</code> registrations.
      </Callout>

      {/* ──────────────── CONTROLLER DECORATOR ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @Controller
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Marks a class as a controller and sets a route prefix. Must be the{" "}
        <strong>outermost (topmost)</strong> decorator on the class.
      </p>
      <CodeBlock
        code={`@Controller("/users")
class UserController {
  // All routes here will be prefixed with /users
}`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">prefix</td>
              <td className="px-4 py-2 font-mono">string</td>
              <td className="px-4 py-2">
                Route prefix (default: <code>""</code>)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="warning">
        <code>@Controller</code> must be the topmost decorator. TypeScript
        decorators execute bottom-to-top, so <code>@Controller</code> runs last
        and captures all method routes that were registered by{" "}
        <code>@Get</code>, <code>@Post</code>, etc.
      </Callout>

      {/* ──────────────── ROUTE DECORATORS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Route Decorators
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Decorate class methods to register them as route handlers. Each
        decorator takes a path string as its first argument.
      </p>
      <CodeBlock
        code={`@Controller("/users")
class UserController {
  @Get("/")
  list(ctx) { /* GET /users */ }

  @Get("/:id")
  detail(ctx) { /* GET /users/:id */ }

  @Post("/")
  create(ctx) { /* POST /users */ }

  @Put("/:id")
  update(ctx) { /* PUT /users/:id */ }

  @Patch("/:id")
  patch(ctx) { /* PATCH /users/:id */ }

  @Delete("/:id")
  remove(ctx) { /* DELETE /users/:id */ }

  @Options("/info")
  options(ctx) { /* OPTIONS /users/info */ }

  @Head("/check")
  check(ctx) { /* HEAD /users/check */ }

  @All("/health")
  health(ctx) { /* All methods on /users/health */ }
}`}
      />

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
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["@Get(path)", "GET", "Retrieve resources"],
              ["@Post(path)", "POST", "Create resources"],
              ["@Put(path)", "PUT", "Replace resources"],
              ["@Patch(path)", "PATCH", "Partial update"],
              ["@Delete(path)", "DELETE", "Remove resources"],
              ["@Options(path)", "OPTIONS", "CORS preflight"],
              ["@Head(path)", "HEAD", "Headers only"],
              ["@All(path)", "All standard", "Matches all methods"],
              ["@Query(path)", "QUERY", "Bun-specific: GET with body"],
            ].map(([decorator, method, notes]) => (
              <tr
                key={decorator}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{decorator}</td>
                <td className="px-4 py-2 font-mono font-semibold text-text-primary">
                  {method}
                </td>
                <td className="px-4 py-2">{notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── @QUERY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @Query
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Bun-specific HTTP method — like GET but with a request body (RFC 9110).
        Useful for complex search queries that don&apos;t fit in query params.
      </p>
      <CodeBlock
        code={`@Controller("/search")
class SearchController {
  @Query("/")
  async search(ctx) {
    const body = await ctx.body(); // { filters: [...], sort: "date" }
    const results = await db.search(body);
    return ctx.json(results);
  }
}`}
      />

      {/* ──────────────── @USE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @Use
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Attach middleware to a single route. Multiple <code>@Use()</code> calls
        stack in declaration order.
      </p>
      <CodeBlock
        code={`const auth = async (ctx, next) => {
  const token = ctx.getCookie("token");
  if (!token) return ctx.json({ error: "Unauthorized" }, 401);
  return next();
};

const log = async (ctx, next) => {
  console.log(ctx.request.method, ctx.request.url);
  return next();
};

@Controller("/users")
class UserController {
  @Get("/public")
  publicEndpoint(ctx) {
    return ctx.json({ data: "public" });
  }

  @Get("/private")
  @Use(auth)
  @Use(log)
  privateEndpoint(ctx) {
    return ctx.json({ data: "private" });
  }
}

// Execution order for GET /users/private:
// auth → log → privateEndpoint`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">middleware</td>
              <td className="px-4 py-2 font-mono">
                (ctx, next) =&gt; Response
              </td>
              <td className="px-4 py-2">
                Middleware function receiving context and <code>next</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        With zValidator
      </Heading>
      <CodeBlock
        code={`import { zValidator, z } from "@buntok/core";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

@Controller("/users")
class UserController {
  @Post("/")
  @Use(zValidator("body", userSchema))
  async create(ctx) {
    const data = ctx.valid("body"); // Fully typed!
    return ctx.json({ created: true, ...data }, 201);
  }

  @Get("/search")
  @Use(zValidator("query", searchSchema))
  search(ctx) {
    const { q } = ctx.valid("query");
    return ctx.json({ results: [] });
  }
}`}
      />

      {/* ──────────────── @USEGUARD ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @UseGuard
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        A convenience decorator for boolean authorization checks. A guard is a
        function that returns <code>boolean</code> or{" "}
        <code>Promise&lt;boolean&gt;</code>. If any guard returns{" "}
        <code>false</code>, the request is rejected with{" "}
        <code>403 Forbidden</code>.
      </p>
      <CodeBlock
        code={`const isAdmin = (ctx) => ctx.user?.role === "admin";
const isActive = (ctx) => ctx.user?.status === "active";

const hasApiKey = async (ctx) => {
  const key = ctx.request.headers.get("x-api-key");
  const valid = await validateApiKey(key);
  return valid;
};

@Controller("/admin")
class AdminController {
  @Get("/dashboard")
  @UseGuard(isAdmin)
  dashboard(ctx) {
    return ctx.json({ secret: "admin data" });
  }

  @Get("/reports")
  @UseGuard(isAdmin, isActive)
  reports(ctx) {
    return ctx.json({ reports: [] });
  }

  @Get("/api-data")
  @UseGuard(hasApiKey)
  apiData(ctx) {
    return ctx.json({ data: "sensitive" });
  }
}`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">...guards</td>
              <td className="px-4 py-2 font-mono">
                (ctx) =&gt; boolean | Promise&lt;boolean&gt;
              </td>
              <td className="px-4 py-2">
                One or more guard functions (rest parameters)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info">
        <code>@UseGuard</code> is syntactic sugar for <code>@Use</code>. It
        creates an async middleware that runs guards sequentially and returns 403
        on failure. Guards are awaited, so async guards (e.g., database lookups)
        are fully supported.
      </Callout>

      {/* ──────────────── @INJECTABLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @Injectable
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Marks a class as container-managed for dependency injection.
      </p>
      <CodeBlock
        code={`// Singleton (default) - one instance shared across the app
@Injectable()
class UserService {
  async findAll() {
    return await db.user.findMany();
  }
}

// Transient - new instance each time it's injected
@Injectable({ scope: "transient" })
class Logger {
  log(msg) { console.log(msg); }
}`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Option
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Default
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">scope</td>
              <td className="px-4 py-2 font-mono">"singleton" | "transient"</td>
              <td className="px-4 py-2">"singleton"</td>
              <td className="px-4 py-2">
                <code>singleton</code>: shared instance, <code>transient</code>:
                new instance per injection
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── @INJECT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @Inject
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Declares a dependency to be resolved from the IoC container. Use on
        class fields.
      </p>
      <CodeBlock
        code={`@Controller("/users")
class UserController {
  @Inject(UserService) private userService: UserService;
  @Inject(UserRepository) private userRepo: UserRepository;

  @Get("/")
  async list(ctx) {
    const users = await this.userService.findAll();
    return ctx.json(users);
  }
}`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Parameter
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">token</td>
              <td className="px-4 py-2 font-mono">Token</td>
              <td className="px-4 py-2">
                Class constructor or string token to resolve
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ──────────────── DECORATOR ORDERING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Decorator Ordering
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        TypeScript decorators execute <strong>bottom-to-top</strong>. The{" "}
        <code>@Controller</code> decorator must always be on top because it runs
        last and captures all routes.
      </p>
      <CodeBlock
        code={`@Controller("/users")          // 4. Captures all routes
class UserController {
  @Get("/")                   // 3. Registers GET route
  @Use(auth)                  // 2. Attaches middleware
  @Use(log)                   // 1. Attaches middleware (runs first)
  async list(ctx) {
    return ctx.json([]);
  }
}

// Execution order: log → auth → list`}
      />

      <Callout type="warning">
        If <code>@Controller</code> is not the topmost decorator, it will not
        capture the routes correctly. Always place it first.
      </Callout>

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import {
  App, Controller, Get, Post, Use, UseGuard,
  Injectable, Inject, Container, zValidator, z
} from "@buntok/core";

// Service
@Injectable()
class UserService {
  async findAll() {
    return await db.user.findMany();
  }
  async create(data: CreateUser) {
    return await db.user.create({ data });
  }
}

// Middleware
const auth = async (ctx, next) => {
  const token = ctx.getCookie("token");
  if (!token) return ctx.json({ error: "Unauthorized" }, 401);
  return next();
};

// Guards
const isAdmin = (ctx) => ctx.user?.role === "admin";

// Schema
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// Controller
@Controller("/users")
class UserController {
  @Inject(UserService) private service: UserService;

  @Get("/")
  async list(ctx) {
    const users = await this.service.findAll();
    return ctx.json(users);
  }

  @Post("/")
  @Use(auth)
  @UseGuard(isAdmin)
  @Use(zValidator("body", createUserSchema))
  async create(ctx) {
    const data = ctx.valid("body");
    const user = await this.service.create(data);
    return ctx.json({ created: true, ...user }, 201);
  }
}

// Setup
const app = new App();
const container = new Container();
container.registerClass(UserService);

app.setContainer(container);
app.registerController(UserController);
app.listen(1212);`}
      />

      {/* ──────────────── NEXT STEPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Next Steps
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <a href="/docs/controllers" className="text-accent hover:underline">
            Controllers
          </a>{" "}
          - Class-based routing
        </li>
        <li>
          <a href="/docs/ioc" className="text-accent hover:underline">
            IoC Container
          </a>{" "}
          - Dependency injection
        </li>
        <li>
          <a href="/docs/validation" className="text-accent hover:underline">
            Validation
          </a>{" "}
          - Zod validation
        </li>
        <li>
          <a href="/docs/middleware" className="text-accent hover:underline">
            Middleware
          </a>{" "}
          - Middleware patterns
        </li>
      </ul>
    </div>
  );
}
