import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "IoC Container",
  description: "Manage dependencies with inversion of control and circular dependency detection.",
};


export default function IoCPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        IoC Container
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Built-in dependency injection container with singleton/transient scopes,
        multiple provider types, and circular dependency detection.
      </p>

      {/* ──────────────── QUICK START ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Quick Start
      </Heading>
      <CodeBlock
        code={`import { Injectable, Inject, Container } from "@buntok/core";

// 1. Define services
@Injectable()
class UserRepository {
  findAll() { return [{ id: 1, name: "John" }]; }
}

@Injectable()
class UserService {
  @Inject(UserRepository) private repo: UserRepository;
  getUsers() { return this.repo.findAll(); }
}

// 2. Register and resolve
const container = new Container();
container
  .register(UserRepository, { useClass: UserRepository })
  .register(UserService, { useClass: UserService });

const userService = container.resolve(UserService);
const users = userService.getUsers();`}
      />

      <Callout type="info">
        <code>container.register()</code> returns <code>this</code>, so you can
        chain multiple registrations:
      </Callout>

      {/* ──────────────── PROVIDERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Providers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Provider
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">useClass</td>
              <td className="px-4 py-2">Create instance from class constructor</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">useValue</td>
              <td className="px-4 py-2">Return a static value (always singleton)</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">useFactory</td>
              <td className="px-4 py-2">
                Create instance from a function (receives container)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        ClassProvider
      </Heading>
      <CodeBlock
        code={`container.register(UserService, {
  useClass: UserService,
  scope: "singleton", // default
});

// Or auto-register by class constructor
container.registerClass(UserService);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        ValueProvider
      </Heading>
      <CodeBlock
        code={`container.register("DATABASE_URL", {
  useValue: process.env.DATABASE_URL,
});

// Use string tokens for config values
const url = container.resolve<string>("DATABASE_URL");`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        FactoryProvider
      </Heading>
      <CodeBlock
        code={`container.register("CacheDriver", {
  useFactory: (container) => {
    const config = container.resolve("Config");
    return new RedisCache(config.redisUrl);
  },
  scope: "singleton",
});`}
      />

      {/* ──────────────── SCOPES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Scopes
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Scope
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Behavior
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">singleton</td>
              <td className="px-4 py-2">
                One instance, cached and reused (default)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">transient</td>
              <td className="px-4 py-2">New instance every time it's resolved</td>
            </tr>
          </tbody>
        </table>
      </div>

      <CodeBlock
        code={`// Singleton - same instance returned every time
container.register(UserService, { useClass: UserService, scope: "singleton" });

// Transient - new instance each time
container.register(RequestLogger, { useClass: RequestLogger, scope: "transient" });`}
      />

      {/* ──────────────── @INJECTABLE & @INJECT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        @Injectable & @Inject
      </Heading>
      <CodeBlock
        code={`import { Injectable, Inject } from "@buntok/core";

// @Injectable marks a class for DI
@Injectable()
class EmailService {
  send(to: string, body: string) { /* ... */ }
}

// @Inject declares dependencies via fields
@Injectable()
class UserService {
  @Inject(EmailService) private email: EmailService;
}

// Set scope via decorator option (alternative to container.registerClass)
@Injectable({ scope: "transient" })
class RequestLogger {
  log(msg: string) { console.log(msg); }
}

// When container resolves UserService:
// 1. Creates UserService instance
// 2. Resolves EmailService from container
// 3. Injects EmailService into the field`}
      />

      {/* ──────────────── CONTAINER API ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Container API
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "container.register(token, provider)",
                "Register a provider for a token",
              ],
              [
                "container.registerClass(cls, scope?)",
                "Auto-register class by constructor",
              ],
              [
                "container.resolve<T>(token)",
                "Resolve and return instance (throws if not found)",
              ],
              [
                "container.get<T>(token)",
                "Resolve or return undefined",
              ],
              ["container.has(token)", "Check if token is registered"],
              [
                "container.hasResolved(token)",
                "Check if token is already cached",
              ],
              ["container.clear()", "Clear all providers and cache"],
            ].map(([method, desc]) => (
              <tr
                key={method}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent text-xs">
                  {method}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── CIRCULAR DEPENDENCY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Circular Dependency Detection
      </Heading>
      <Callout type="warning">
        The container detects circular dependencies and throws an error with the
        class name to help you debug.
      </Callout>

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example: Controller with DI
      </Heading>
      <CodeBlock
        code={`import { App, Injectable, Inject } from "@buntok/core";

@Injectable()
class UserRepository {
  async findAll() {
    return await db.user.findMany();
  }
  async findById(id: string) {
    return await db.user.findUnique({ where: { id } });
  }
}

@Injectable()
class UserService {
  @Inject(UserRepository) private repo: UserRepository;
  getUsers() { return this.repo.findAll(); }
  getUser(id: string) { return this.repo.findById(id); }
}

// Register in app
const app = new App();
const container = new Container();
container.registerClass(UserRepository);
container.registerClass(UserService);
app.setContainer(container);

// Controller uses DI
@Controller("/users")
class UserController {
  @Inject(UserService) private userService: UserService;

  @Get("/")
  async list(ctx: Context) {
    const users = await this.userService.getUsers();
    return ctx.json(users);
  }
}

app.registerController(UserController);
app.listen(1212);`}
      />
    </div>
  );
}
