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
          <strong>Node.js</strong> (optional, for npm package compatibility)
        </li>
      </ul>

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
        optimal configuration.
      </Callout>

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
                <code>.vscode/settings.json</code>
              </td>
              <td className="px-4 py-2">VS Code settings for this project</td>
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
    "start": "bun run src/index.ts",
    "check": "bunx @biomejs/biome check --write .",
    "format": "bunx @biomejs/biome format --write .",
    "lint": "bunx @biomejs/biome lint ."
  }
}`}
      />

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

      <Callout type="info">
        Use <code>buntok create user</code> to generate all files (repository,
        service, controller) at once. Add <code>--repo</code>,{" "}
        <code>--service</code>, or <code>--controller</code> for partial
        generation.
      </Callout>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Manual Setup
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If you prefer to set up manually without <code>buntok init</code>:
      </p>

      <CodeBlock
        code={`# Install dependencies
bun add @buntok/core

# Create entry point file
mkdir src
touch src/index.ts`}
      />

      <CodeBlock
        code={`// src/index.ts
import { App } from "@buntok/core";

const app = new App();

app.get("/", (ctx) => {
  return ctx.json({ message: "Hello, Buntok!" });
});

app.listen(1212, () => {
  console.log("Server running on http://localhost:1212");
});`}
      />

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Run the Server
      </Heading>

      <CodeBlock
        code={`# Development mode (hot reload)
bun run dev

# Or directly
bun run src/index.ts`}
      />

      <p className="my-3 text-text-secondary leading-relaxed">
        Open <code>http://localhost:1212</code> in your browser. You will see:
      </p>

      <CodeBlock code={`{ "message": "Hello, Buntok!" }`} />

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
├── biome.json               # Linter config
├── tsconfig.json            # TypeScript config
└── package.json`}
      />

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
          - Organize routes with controllers
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
      </ul>
    </div>
  );
}
