"use client";

import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export default function ValidationPage() {
  return (
    <div>
      <Heading level={1} className="text-4xl font-bold mt-8 mb-4 text-text-primary">Validation</Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok provides request data validation using Zod schemas. Zod is already included when you install <code>@buntok/core</code>.
      </p>

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        zValidator
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Middleware for validating request data with Zod schemas. Supports: <code>body</code>, <code>query</code>, <code>params</code>, <code>headers</code>.
      </p>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Body Validation</Heading>
      <CodeBlock
        code={`import { zValidator, z } from "@buntok/core";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).max(150).optional(),
});

app.post("/users", zValidator("body", userSchema), (ctx) => {
  const data = ctx.valid("body");
  // data is already validated, safe to use
  return ctx.json({ created: true, ...data });
});`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Query Validation</Heading>
      <CodeBlock
        code={`const paginationSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

app.get("/users", zValidator("query", paginationSchema), (ctx) => {
  const { page, limit } = ctx.valid("query");
  return ctx.json({ page, limit });
});`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Params Validation</Heading>
      <CodeBlock
        code={`const idSchema = z.object({ id: z.string().uuid() });

app.get("/users/:id", zValidator("params", idSchema), (ctx) => {
  const { id } = ctx.valid("params");
  return ctx.json({ id });
});`}
      />

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">Headers Validation</Heading>
      <CodeBlock
        code={`const apiKeySchema = z.object({
  "x-api-key": z.string().min(1),
});

app.get("/secret", zValidator("headers", apiKeySchema), (ctx) => {
  const { "x-api-key": apiKey } = ctx.valid("headers");
  return ctx.json({ secret: "data" });
});`}
      />

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        ctx.valid()
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Retrieve data that has been validated by <code>zValidator</code>.
      </p>
      <CodeBlock
        code={`// With type
const data = ctx.valid<UserCreateDto>("body");

// Or without type
const data = ctx.valid("body");`}
      />

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Shortcuts
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Shortcut functions for common use cases:
      </p>
      <CodeBlock
        code={`// validateBody = zValidator("body", schema)
app.post("/users", validateBody(schema), handler);

// validateParams = zValidator("params", schema)
app.get("/users/:id", validateParams(idSchema), handler);`}
      />

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Error Response
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        When validation fails, Buntok automatically returns a 422:
      </p>
      <CodeBlock
        code={`{
  "success": false,
  "error": {
    "name": "ValidationError",
    "message": "Validation failed",
    "details": [
      { "field": "name", "message": "String must contain at least 1 character(s)" },
      { "field": "email", "message": "Invalid email" }
    ]
  }
}`}
      />

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Custom Error Message
      </Heading>
      <CodeBlock
        code={`const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});`}
      />

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Combining Validators
      </Heading>
      <CodeBlock
        code={`app.post("/users",
  zValidator("body", userSchema),
  zValidator("query", paginationSchema),
  (ctx) => {
    const body = ctx.valid("body");
    const query = ctx.valid("query");
    return ctx.json({ body, query });
  }
);`}
      />

      <Callout type="info">
        Each <code>zValidator</code> only validates a specific target (body, query, params, or headers). You can use multiple validators simultaneously.
      </Callout>

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Next Steps
      </Heading>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li><a href="/docs/upload" className="text-accent hover:underline">Upload</a> — Validate file uploads</li>
        <li><a href="/docs/routing" className="text-accent hover:underline">Routing</a> — Route parameters and query strings</li>
      </ul>
    </div>
  );
}
