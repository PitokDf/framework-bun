import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export default function ApiDocsPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        API Docs
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Auto-generate OpenAPI 3.0 documentation from your Zod validation schemas.
        One command, zero config.
      </p>

      {/* ──────────────── HOW IT WORKS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        How It Works
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok automatically collects metadata from <code>zValidator</code> and{" "}
        <code>zResponse</code> middlewares on every registered route. When you
        run the CLI command, it generates:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <code>public/docs/swagger.json</code> — OpenAPI 3.0 spec
        </li>
        <li>
          <code>public/docs/index.html</code> — Scalar API Reference UI
        </li>
      </ul>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Generate Docs
      </Heading>
      <CodeBlock
        code={`buntok make:docs`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Serve Docs
      </Heading>
      <CodeBlock
        code={`import { App, z } from "@buntok/core";

const app = new App();

// Serve the generated docs
app.static("/docs", "./public/docs");

app.listen(1212);
// Visit http://localhost:1212/docs`}
      />

      {/* ──────────────── ANNOTATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Annotating Routes
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>zValidator</code> and <code>zResponse</code> in your route
        handlers. The CLI picks them up automatically.
      </p>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Body Validation
      </Heading>
      <CodeBlock
        code={`
import { z } from "@buntok/core";

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["admin", "user"]).default("user"),
});

app.post(
  "/users",
  zValidator("body", CreateUserSchema),
  async (ctx) => {
    const data = ctx.valid("body");
    // ...
  }
);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Query & Params Validation
      </Heading>
      <CodeBlock
        code={`// Query params
app.get(
  "/users",
  zValidator("query", z.object({
    page: z.coerce.number().int().default(1),
    limit: z.coerce.number().int().default(10),
    search: z.string().optional(),
  })),
  async (ctx) => {
    const { page, limit } = ctx.valid("query");
    // ...
  }
);

// Path params
app.get(
  "/users/:id",
  zValidator("params", z.object({
    id: z.string().uuid(),
  })),
  async (ctx) => {
    const { id } = ctx.valid("params");
    // ...
  }
);`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Documenting Responses
      </Heading>
      <CodeBlock
        code={`

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  createdAt: z.string(),
});

app.get(
  "/users/:id",
  zValidator("params", z.object({ id: z.string().uuid() })),
  zResponse(200, UserSchema, "User found"),
  zResponse(404, z.object({}), "User not found"),
  async (ctx) => {
    const user = await userRepo.findById(ctx.valid("params").id);
    if (!user) return ctx.error("Not found", 404);
    return ctx.json(user);
  }
);`}
      />

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`
import { z } from "@buntok/core";

export const metadata = {
  title: "API Documentation",
  description: "Generate OpenAPI docs and serve Scalar UI for interactive API exploration.",
};


const app = new App();

// ─── Schemas ───────────────────────────────────────
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

// ─── Routes ────────────────────────────────────────
app.get(
  "/users",
  zValidator("query", z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
  })),
  zResponse(200, z.array(UserSchema), "List of users"),
  async (ctx) => {
    const users = await userRepo.findAll();
    return ctx.json(users);
  }
);

app.post(
  "/users",
  zValidator("body", CreateUserSchema),
  zResponse(201, UserSchema, "User created"),
  async (ctx) => {
    const user = await userRepo.create(ctx.valid("body"));
    return ctx.json(user, 201);
  }
);

app.get(
  "/users/:id",
  zValidator("params", z.object({ id: z.string() })),
  zResponse(200, UserSchema, "User found"),
  async (ctx) => {
    const user = await userRepo.findById(ctx.valid("params").id);
    if (!user) return ctx.error("Not found", 404);
    return ctx.json(user);
  }
);

// ─── Serve docs ────────────────────────────────────
app.static("/docs", "./public/docs");
app.listen(1212);

// Run: buntok make:docs
// Visit: http://localhost:1212/docs`}
      />

      {/* ──────────────── TIPS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Tips
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-2">
        <li>
          Routes without <code>zValidator</code> are still registered in the
          spec (no request/response schema)
        </li>
        <li>
          If a schema type is unsupported, that route is skipped with a warning.
          Annotate with <code>.openapi()</code> from{" "}
          <code>@asteasolutions/zod-to-openapi</code>
        </li>
        <li>
          The <code>zResponse</code> schema is wrapped in the standard Buntok
          envelope: <code>{"{ success, message, data }"}</code>
        </li>
        <li>
          The Scalar UI renders a beautiful, interactive API reference from{" "}
          <code>swagger.json</code>
        </li>
      </ul>

      <Callout type="info">
        The <code>buntok make:docs</code> command imports your{" "}
        <code>src/index.ts</code> and reads the exported{" "}
        <code>app</code> instance. Make sure you export it:{" "}
        <code>export const app = new App()</code>.
      </Callout>
    </div>
  );
}
