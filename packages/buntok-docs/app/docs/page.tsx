"use client";

import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export default function GettingStartedPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Getting Started
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        A comprehensive guide to get started building web applications with the
        Buntok Framework.
      </p>

      {/* ──────────────── PREREQUISITES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Prerequisites
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Before getting started, make sure you have installed:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <strong>Bun</strong> &gt;= 1.0.0 -{" "}
          <a
            href="https://bun.sh"
            target="_blank"
            className="text-accent hover:underline"
          >
            https://bun.sh
          </a>
        </li>
        <li>
          <strong>TypeScript</strong> &gt;= 5.0
        </li>
        <li>
          <strong>Node.js</strong> (optional, for npm package compatibility)
        </li>
      </ul>

      <Callout type="info">
        <strong>OS Notes:</strong> Some features like{" "}
        <code>enableReusePort()</code> (SO_REUSEPORT) are Linux-only. On other
        platforms, this feature is disabled with a warning in development mode.
      </Callout>

      {/* ──────────────── QUICK SETUP ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Quick Setup
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        The fastest way to get started is by using <code>buntok init</code>:
      </p>

      <CodeBlock
        code={`# 1. Create a new project
mkdir my-app && cd my-app
bun init -y

# 2. Install buntok
bun add @buntok/core

# 3. Run the init command
bunx buntok init`}
      />

      <Callout type="info">
        <code>buntok init</code> will automatically set up your project with an
        optimal configuration. You'll be asked if you want to deploy to Vercel —
        if yes, a <code>vercel.json</code> file will be created.
      </Callout>

      {/* ──────────────── WHAT DOES INIT DO ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        What does <code>buntok init</code> do?
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        This command will create and configure:
      </p>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                File
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>src/index.ts</code>
              </td>
              <td className="px-4 py-2">Entry point with example routes</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>tsconfig.json</code>
              </td>
              <td className="px-4 py-2">TypeScript configuration</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>biome.json</code>
              </td>
              <td className="px-4 py-2">Biome linter configuration</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>.env</code>
              </td>
              <td className="px-4 py-2">Environment variables</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>.env.example</code>
              </td>
              <td className="px-4 py-2">Environment variables template</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>.vscode/settings.json</code>
              </td>
              <td className="px-4 py-2">VS Code settings for this project</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>.gitignore</code>
              </td>
              <td className="px-4 py-2">Git ignore rules</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>.agents/skills/buntok-skill/SKILL.md</code>
              </td>
              <td className="px-4 py-2">Skill guide for AI assistants</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip">
        <code>.agents/skills/buntok-skill/SKILL.md</code> contains the complete
        framework documentation that can be read by AI assistants such as
        Cursor, Copilot, or Claude.
      </Callout>

      {/* ──────────────── ENVIRONMENT CONFIGURATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Environment Configuration
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok uses environment variables for configuration. The{" "}
        <code>.env</code> file is created automatically during{" "}
        <code>buntok init</code>.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Basic Setup
      </Heading>
      <CodeBlock
        code={`# .env
PORT=1212
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
JWT_SECRET=your-secret-key-here`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Validating Environment Variables
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>validateEnv()</code> to ensure required variables are set and
        correctly typed:
      </p>

      <CodeBlock
        code={`import { App } from "@buntok/core";
import { z } from "@buntok/core";

const app = new App();

const env = app.validateEnv({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(1212),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

// env is fully typed!
console.log(env.DATABASE_URL);
console.log(env.PORT); // number (defaulted)`}
      />

      <Callout type="warning">
        If validation fails, the server prints a formatted error and calls{" "}
        <code>process.exit(1)</code>. The app will not start.
      </Callout>

      <Callout type="info">
        Learn more in{" "}
        <a href="/docs/app-config" className="text-accent hover:underline">
          App Configuration
        </a>
        .
      </Callout>

      {/* ──────────────── PROJECT STRUCTURE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Project Structure
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Project structure after <code>buntok init</code>:
      </p>

      <CodeBlock
        code={`my-app/
├── src/
│   └── index.ts           # Entry point
├── .agents/
│   └── skills/
│       └── buntok-skill/
│           └── SKILL.md    # AI skill guide
├── .vscode/
│   └── settings.json       # VS Code settings
├── .env                    # Environment variables
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── biome.json              # Linter config
├── tsconfig.json           # TypeScript config
└── package.json`}
      />

      {/* ──────────────── DATABASE SETUP ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Database Setup
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok supports multiple database drivers through official packages:
      </p>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Package
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>@buntok/prisma</code>
              </td>
              <td className="px-4 py-2">Prisma ORM integration</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>@buntok/drizzle</code>
              </td>
              <td className="px-4 py-2">Drizzle ORM integration</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>@buntok/typeorm</code>
              </td>
              <td className="px-4 py-2">TypeORM integration</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Example with Prisma
      </Heading>
      <CodeBlock
        code={`# Install Prisma driver
bun add @buntok/prisma

# Initialize Prisma
bunx prisma init`}
      />

      <CodeBlock
        code={`// src/database.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Use in your services
export class UserService {
  async findAll() {
    return prisma.user.findMany();
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }
}`}
      />

      <Callout type="info">
        Use <code>buntok db migrate</code> to run migrations and{" "}
        <code>buntok db seed</code> to seed your database.
      </Callout>

      {/* ──────────────── ARCHITECTURE OVERVIEW ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Architecture Overview
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok follows a <strong>layered architecture</strong> pattern for
        organized, maintainable code. Base classes auto-generate CRUD operations
        so you don't have to write boilerplate.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Request Flow
      </Heading>
      <CodeBlock
        code={`Request
  │
  ▼
Route (decorator-based or manual)
  │
  ▼
Controller (handles HTTP, validates input)
  │
  ▼
Service (business logic)
  │
  ▼
Repository (data access)
  │
  ▼
Database`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Layer Descriptions
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Layer
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Base Class
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Responsibility
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">Controller</td>
              <td className="px-4 py-2 font-mono text-text-secondary">
                <code>BaseController</code>
              </td>
              <td className="px-4 py-2">
                Handles HTTP requests/responses, auto-registers CRUD routes
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">Service</td>
              <td className="px-4 py-2 font-mono text-text-secondary">
                <code>BaseService</code>
              </td>
              <td className="px-4 py-2">
                Business logic, data transformation, NotFoundError handling
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">Repository</td>
              <td className="px-4 py-2 font-mono text-text-secondary">
                <code>BaseRepository</code>
              </td>
              <td className="px-4 py-2">
                Data access layer, database queries, lifecycle hooks
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Auto-Generated CRUD
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Extend the base classes to get a full CRUD API without writing
        boilerplate:
      </p>

      <CodeBlock
        code={`// 1. Repository - extends BaseRepository from your ORM
import { BaseRepository } from "@buntok/prisma"; // or @buntok/drizzle, @buntok/typeorm

export class UserRepository extends BaseRepository<User, PrismaClient> {
  constructor(prisma: PrismaClient) {
    super(prisma, "user");
  }
}

// 2. Service - extends BaseService
import { BaseService } from "@buntok/core";

export class UserService extends BaseService<User, CreateUser, UpdateUser> {
  constructor(private repo: UserRepository) {
    super(repo);
  }
}

// 3. Controller - extends BaseController (auto-registers 5 CRUD routes!)
import { BaseController, Controller } from "@buntok/core";

@Controller("/users")
export class UserController extends BaseController<User, CreateUser, UpdateUser> {
  constructor(private service: UserService) {
    super(service);
  }
}

// This automatically creates:
// GET    /       → service.getAll()
// GET    /:id    → service.getById(id)
// POST   /       → service.create(body)
// PUT    /:id    → service.update(id, body)
// DELETE /:id    → service.delete(id)`}
      />

      <Callout type="info">
        Each ORM has its own <code>BaseRepository</code>:{" "}
        <code>@buntok/prisma</code>, <code>@buntok/drizzle</code>, or{" "}
        <code>@buntok/typeorm</code>. Choose the one that matches your stack.
      </Callout>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Routing Approaches
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok supports two routing approaches:
      </p>

      <Heading
        level={4}
        className="text-lg font-semibold mt-4 mb-2 text-text-primary"
      >
        1. Decorator-based (Recommended)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Routes are automatically registered using decorators:
      </p>
      <CodeBlock
        code={`import { Controller, Get, Post } from "@buntok/core";

@Controller("/users")
export class UserController {
  @Get("/")
  findAll(ctx) {
    return ctx.json({ users: [] });
  }

  @Post("/")
  create(ctx) {
    return ctx.json({ message: "User created" }, 201);
  }
}`}
      />

      <Heading
        level={4}
        className="text-lg font-semibold mt-4 mb-2 text-text-primary"
      >
        2. Manual Routing (Optional)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        For simple cases, you can define routes directly on the app:
      </p>
      <CodeBlock
        code={`import { App } from "@buntok/core";

const app = new App();

app.get("/", (ctx) => {
  return ctx.json({ message: "Hello, Buntok!" });
});

app.post("/users", (ctx) => {
  return ctx.json({ message: "User created" }, 201);
});`}
      />

      {/* ──────────────── CLI COMMANDS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        CLI Commands
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok provides several commands to help with development:
      </p>

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Command
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok init</code>
              </td>
              <td className="px-4 py-2">
                Set up project with optimal configuration
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok build</code>
              </td>
              <td className="px-4 py-2">
                Build project for production (output to <code>.buntok/</code>)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok create &lt;entity&gt;</code>
              </td>
              <td className="px-4 py-2">
                Generate repository, service, and controller for an entity
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok db migrate</code>
              </td>
              <td className="px-4 py-2">Run pending database migrations</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok db seed</code>
              </td>
              <td className="px-4 py-2">Seed database with initial data</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2">
                <code>buntok make:docs</code>
              </td>
              <td className="px-4 py-2">Generate OpenAPI documentation</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Code Generation Example
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Running <code>buntok create user</code> generates:
      </p>

      <CodeBlock
        code={`$ bunx buntok create user

✓ Created src/repositories/user.repository.ts
✓ Created src/services/user.service.ts
✓ Created src/controllers/user.controller.ts`}
      />

      <CodeBlock
        code={`// src/controllers/user.controller.ts
import { Controller, Get, Post, Put, Delete } from "@buntok/core";
import { UserService } from "../services/user.service";

@Controller("/users")
export class UserController {
  private service = new UserService();

  @Get("/")
  async findAll(ctx) {
    const users = await this.service.findAll();
    return ctx.json({ data: users });
  }

  @Get("/:id")
  async findById(ctx) {
    const user = await this.service.findById(ctx.params.id);
    if (!user) {
      return ctx.json({ message: "User not found" }, 404);
    }
    return ctx.json({ data: user });
  }

  @Post("/")
  async create(ctx) {
    const body = await ctx.body();
    const user = await this.service.create(body);
    return ctx.json({ data: user }, 201);
  }
}`}
      />

      <Callout type="info">
        Use <code>buntok create user --repo</code>,{" "}
        <code>--service</code>, or <code>--controller</code> for partial
        generation.
      </Callout>

      {/* ──────────────── PACKAGE SCRIPTS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Package Scripts
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        <code>buntok init</code> will also add scripts to{" "}
        <code>package.json</code>:
      </p>

      <CodeBlock
        code={`{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bunx buntok build",
    "start": "bun .buntok/index.js",
    "check": "bunx @biomejs/biome check --write .",
    "format": "bunx @biomejs/biome format --write .",
    "lint": "bunx @biomejs/biome lint ."
  }
}`}
      />

      {/* ──────────────── RUN THE SERVER ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Run the Server
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Development Mode
      </Heading>
      <CodeBlock
        code={`# Hot reload with file watching
bun run dev

# Or directly
bun run src/index.ts`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Production Mode
      </Heading>
      <CodeBlock
        code={`# Build for production
bun run build

# Run the built output
bun run start`}
      />

      <p className="my-3 text-text-secondary leading-relaxed">
        Open <code>http://localhost:1212</code> in your browser. You will see:
      </p>

      <CodeBlock code={`{ "message": "Hello, Buntok!" }`} />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Port Auto-Increment
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If the specified port is already in use, Buntok will automatically try
        the next available port:
      </p>

      <CodeBlock
        code={`⚠ Port 3000 is already in use, using port 3001 instead
Server listening at http://localhost:3001`}
      />

      <Callout type="info">
        This prevents crashes when running multiple instances or when another
        service is using the same port. The server will try up to 10 ports
        before failing.
      </Callout>

      {/* ──────────────── TROUBLESHOOTING ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Troubleshooting
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Port Already in Use
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If you see a port conflict warning, Buntok will automatically use the
        next available port. You can also specify a different port:
      </p>
      <CodeBlock
        code={`app.listen(3000); // Try port 3000
// Or via environment variable
PORT=3000 bun run dev`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Error During <code>bunx buntok init</code>
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If the init command fails, try these steps:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          Make sure you're in the correct directory with a{" "}
          <code>package.json</code>
        </li>
        <li>
          Ensure Bun is installed and up to date: <code>bun --version</code>
        </li>
        <li>
          Check if you have write permissions in the current directory
        </li>
      </ul>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Environment Variables Not Read
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If your environment variables aren't being read:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          Make sure <code>.env</code> is in your project root (same level as{" "}
          <code>package.json</code>)
        </li>
        <li>
          Use <code>validateEnv()</code> to catch missing/invalid variables
          early
        </li>
        <li>
          Restart the server after changing <code>.env</code> files
        </li>
      </ul>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Database Connection Refused
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If you can't connect to your database:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          Verify <code>DATABASE_URL</code> is set correctly in <code>.env</code>
        </li>
        <li>Ensure your database server is running</li>
        <li>
          Run migrations: <code>buntok db migrate</code>
        </li>
        <li>
          For Prisma, regenerate the client: <code>bunx prisma generate</code>
        </li>
      </ul>

      {/* ──────────────── NEXT STEPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Next Steps
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <a href="/docs/routing" className="text-accent hover:underline">
            Routing
          </a>{" "}
          - Learn how to define routes
        </li>
        <li>
          <a href="/docs/controllers" className="text-accent hover:underline">
            Controllers
          </a>{" "}
          - Organize routes with controllers and{" "}
          <code>BaseController</code>
        </li>
        <li>
          <a href="/docs/repository" className="text-accent hover:underline">
            Repository
          </a>{" "}
          - CRUD operations with <code>BaseRepository</code>
        </li>
        <li>
          <a href="/docs/context" className="text-accent hover:underline">
            Context
          </a>{" "}
          - Access request and response
        </li>
        <li>
          <a href="/docs/validation" className="text-accent hover:underline">
            Validation
          </a>{" "}
          - Validate input data
        </li>
        <li>
          <a href="/docs/app-config" className="text-accent hover:underline">
            App Configuration
          </a>{" "}
          - Environment validation and settings
        </li>
      </ul>
    </div>
  );
}
