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
        code={`import { Container } from "@buntok/core";

// 1. Define services (plain classes — no decorator needed)
class UserRepository {
  findAll() { return [{ id: 1, name: "John" }]; }
}

class UserService {
  constructor(private repo: UserRepository) {}
  getUsers() { return this.repo.findAll(); }
}

// 2. Register and resolve
const container = new Container();
container.register(UserRepository, { useClass: UserRepository });
container.register(UserService, {
  useFactory: (c) => new UserService(c.resolve(UserRepository)),
});

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

      {/* ──────────────── DEPRECATED DECORATORS ──────────────── */}
      <Callout type="warning">
        <code>@Injectable</code> & <code>@Inject</code> sudah dihapus. Gunakan{" "}
        <code>Container.register</code> + <code>useFactory</code> /{" "}
        <code>useClass</code> untuk DI (contoh di Quick Start). Field decorator{" "}
        tidak lagi didukung.
      </Callout>

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
        code={`import { App, Container } from "@buntok/core";

class UserRepository {
  async findAll() {
    return await db.user.findMany();
  }
  async findById(id: string) {
    return await db.user.findUnique({ where: { id } });
  }
}

class UserService {
  constructor(private repo: UserRepository) {}
  getUsers() { return this.repo.findAll(); }
  getUser(id: string) { return this.repo.findById(id); }
}

// Register in app — useFactory untuk constructor injection
const app = new App();
const container = new Container();
container.register(UserRepository, { useClass: UserRepository });
container.register(UserService, {
  useFactory: (c) => new UserService(c.resolve(UserRepository)),
});
app.setContainer(container);

// Controller — inject via factory, bukan field decorator
class UserController {
  constructor(private userService: UserService) {}
  async list(ctx: Context) {
    const users = await this.userService.getUsers();
    return ctx.json(users);
  }
}
// Daftarkan controller dengan factory agar dapat service
container.register(UserController, {
  useFactory: (c) => new UserController(c.resolve(UserService)),
});
app.registerController(container.resolve(UserController));
app.listen(1212);`}
      />
    </div>
  );
}
