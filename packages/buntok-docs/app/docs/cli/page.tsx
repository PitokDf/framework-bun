import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "CLI Commands",
  description: "Scaffold projects, generate code, and manage databases with the CLI.",
};

export default function CLIPage() {
  return (
    <div>
      <Heading level={1} className="text-4xl font-bold mt-8 mb-4 text-text-primary">CLI</Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok provides a CLI for scaffolding and managing projects.
      </p>

      {/* ──────────────── INIT ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        init
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Initialize a new Buntok project with optimal configuration.
      </p>
      <CodeBlock code={`bunx buntok init`} />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        Interactive Prompts
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        During initialization, you'll be asked:
      </p>
      <CodeBlock code={`? Do you want to deploy to Vercel? (y/N):`} />
      <p className="my-3 text-text-secondary leading-relaxed">
        If you answer <code>y</code>, a <code>vercel.json</code> file will be created with the recommended configuration for Bun projects.
      </p>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        What Gets Created
      </Heading>
      <CodeBlock
        code={`$ bunx buntok init

✓ Created .agents/skills/buntok-skill/SKILL.md
✓ Updated package.json (added 5 scripts)
✓ Created tsconfig.json
✓ Installed @biomejs/biome
✓ Created biome.json
✓ Created .vscode/settings.json
✓ Created src/env.ts
✓ Created src/index.ts
✓ Created .env
✓ Created .env.example
✓ Created .gitignore

? Do you want to deploy to Vercel? (y/N): y
✓ Created vercel.json`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        Generated <code>env.ts</code>
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The <code>src/env.ts</code> file contains a type-safe environment schema using <code>validateEnv()</code>.
        All variables have sensible defaults and are validated at startup.
      </p>
      <CodeBlock
        code={`import { App, z } from "@buntok/core";

export const env = App.validateEnv({
  PORT: z.coerce.number().default(1212),
  AUTH_STORE: z.enum(["header", "cookie"]).default("header"),
  AUTH_COOKIE: z.string().default("session"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});`}
      />
      <p className="my-3 text-text-secondary leading-relaxed">
        Add more variables as needed (e.g., <code>DATABASE_URL</code>, <code>JWT_SECRET</code>).
        The server will exit with a clear error if any required variable is missing or invalid.
      </p>

      {/* ──────────────── BUILD ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        build
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Build project for production. Compiles TypeScript to JavaScript and outputs to <code>.buntok/</code>.
      </p>
      <CodeBlock code={`bunx buntok build`} />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        What It Does
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>Compiles <code>src/index.ts</code> using <code>Bun.build()</code></li>
        <li>Resolves path aliases (e.g., <code>@/*</code>) from <code>tsconfig.json</code></li>
        <li>Marks all packages as external (not bundled)</li>
        <li>Outputs to <code>.buntok/index.js</code></li>
      </ul>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        Output
      </Heading>
      <CodeBlock
        code={`$ bunx buntok build

🔨 Building project...
✅ Build successful → .buntok/index.js
  Deploy: copy .buntok/ + node_modules/ + package.json to server`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        Deploying
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        After building, deploy these files to your server:
      </p>
      <CodeBlock
        code={`# Files needed for production
.buntok/index.js    # Compiled application
node_modules/       # Dependencies
package.json        # Package manifest`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        Development vs Production
      </Heading>
      <CodeBlock
        code={`# Development (hot reload)
bun run dev

# Build for production
bun run build

# Run production build
bun run start`}
      />

      {/* ──────────────── CREATE ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        create
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Generate repository, service, and controller files for an entity.
      </p>
      <CodeBlock code={`bunx buntok create <entity>`} />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        Example Output
      </Heading>
      <CodeBlock
        code={`$ bunx buntok create user

✓ Created src/repositories/user.repository.ts
✓ Created src/services/user.service.ts
✓ Created src/controllers/user.controller.ts`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        Generated Files
      </Heading>
      <CodeBlock
        code={`// src/controllers/user.controller.ts
import { Controller, Get, Post, Put, Delete } from "@buntok/core";
import type { Context } from "@buntok/core";
import { UserService } from "../services/user.service";

@Controller("/users")
export class UserController {
  private service = new UserService();

  @Get("/")
  async findAll(ctx: Context) {
    const users = await this.service.findAll();
    return ctx.json({ data: users });
  }

  @Get("/:id")
  async findById(ctx: Context) {
    const user = await this.service.findById(ctx.params.id);
    if (!user) {
      return ctx.json({ message: "User not found" }, 404);
    }
    return ctx.json({ data: user });
  }

  @Post("/")
  async create(ctx: Context) {
    const body = await ctx.body();
    const user = await this.service.create(body);
    return ctx.json({ data: user }, 201);
  }

  @Put("/:id")
  async update(ctx: Context) {
    const body = await ctx.body();
    const user = await this.service.update(ctx.params.id, body);
    return ctx.json({ data: user });
  }

  @Delete("/:id")
  async delete(ctx: Context) {
    await this.service.delete(ctx.params.id);
    return ctx.json({ message: "User deleted" });
  }
}`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">
        Partial Generation
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use flags to generate only specific files. Flags can be <strong>combined</strong>:
      </p>
      <CodeBlock
        code={`# Generate only the repository
bunx buntok create user --repo

# Generate only the service
bunx buntok create user --service

# Generate only the controller
bunx buntok create user --controller

# Combined (repo + service)
bunx buntok create user --repo --service`}
      />

      {/* ──────────────── DB ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        db
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Database management commands.
      </p>
      <CodeBlock
        code={`# Run pending migrations (optional name)
bunx buntok db migrate
bunx buntok db migrate add-users-table

# Reset database (drop all tables)
bunx buntok db reset

# Seed database with initial data
bunx buntok db seed

# Generate migration from schema changes
bunx buntok db generate

# Open studio (Prisma Studio / Drizzle Studio)
bunx buntok db studio

# Show migration status
bunx buntok db status`}
      />
      <Callout type="info">
        Auto-detects ORM (<code>@buntok/prisma</code>, <code>@buntok/drizzle</code>, <code>@buntok/typeorm</code>) via <code>detectOrm()</code>. <code>migrate [name]</code> accepts optional migration name.
      </Callout>

      {/* ──────────────── MAKE:DOCS ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        make:docs
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Generate OpenAPI documentation from your routes and controllers.
      </p>
      <CodeBlock code={`bunx buntok make:docs`} />

      {/* ──────────────── PROJECT STRUCTURE ──────────────── */}
      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Project Structure
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        After using <code>buntok init</code> and <code>buntok create</code>:
      </p>
      <CodeBlock
        code={`my-app/
├── src/
│   ├── index.ts
│   ├── env.ts
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── services/
│   │   └── user.service.ts
│   └── repositories/
│       └── user.repository.ts
├── .agents/
│   └── skills/
│       └── buntok-skill/
│           └── SKILL.md
├── .env
├── .env.example
├── .gitignore
├── .vscode/
│   └── settings.json
├── biome.json
├── tsconfig.json
└── package.json`}
      />
    </div>
  );
}
