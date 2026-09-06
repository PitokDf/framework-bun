import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Dev Server - BunTok",
  description: "Development server with HMR.",
};

export default function DevServerPage() {
  return (
    <>
      <Heading level={1}>Dev Server</Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Bun development server with HMR (Hot Module Replacement) enabled. Thin wrapper around{" "}
        <code>Bun.serve()</code> with <code>development: true</code> — automatic re-bundling, source
        maps, and hot reload when files change.
      </p>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Import
      </Heading>
      <CodeBlock language="typescript" code={`import { devServer } from "@buntok/core/dev";`} />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Usage
      </Heading>

      <Heading level={3} className="text-lg font-semibold mt-6 mb-2 text-text-primary">
        Minimal — default returns 404
      </Heading>
      <CodeBlock
        language="typescript"
        code={`import { devServer } from "@buntok/core/dev";

devServer({
  port: 3000,
  onReady: (info) => console.log(\`Dev server: http://localhost:\${info.port}\`),
});`}
      />

      <Heading level={3} className="text-lg font-semibold mt-6 mb-2 text-text-primary">
        With routes — serve HTML files
      </Heading>
      <CodeBlock
        language="typescript"
        code={`import { devServer } from "@buntok/core/dev";
import homepage from "./index.html";

devServer({
  port: 3000,
  routes: { "/": homepage },
  onReady: (info) => console.log(\`Dev server: http://localhost:\${info.port}\`),
});`}
      />

      <Heading level={3} className="text-lg font-semibold mt-6 mb-2 text-text-primary">
        With custom fetch handler
      </Heading>
      <CodeBlock
        language="typescript"
        code={`import { devServer } from "@buntok/core/dev";

devServer({
  port: 3000,
  fetch: (req) => new Response(\`Hello from \${req.url}\`),
});`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Options
      </Heading>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="py-2 pr-4">Option</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Default</th>
              <th className="py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">port</td>
              <td className="py-2 pr-4 font-mono text-xs">number</td>
              <td className="py-2 pr-4">3000</td>
              <td className="py-2">
                Port to listen on. <code>0</code> = random available port
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">hostname</td>
              <td className="py-2 pr-4 font-mono text-xs">string</td>
              <td className="py-2 pr-4">"localhost"</td>
              <td className="py-2">Hostname to bind to</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">routes</td>
              <td className="py-2 pr-4 font-mono text-xs">Record&lt;string, unknown&gt;</td>
              <td className="py-2 pr-4">—</td>
              <td className="py-2">Bun routes object — maps paths to HTML files or handlers</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">fetch</td>
              <td className="py-2 pr-4 font-mono text-xs">(req: Request) =&gt; Response</td>
              <td className="py-2 pr-4">404 handler</td>
              <td className="py-2">Custom fetch handler — used when no routes provided</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">hmr</td>
              <td className="py-2 pr-4 font-mono text-xs">boolean</td>
              <td className="py-2 pr-4">true</td>
              <td className="py-2">Enable Hot Module Replacement</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">console</td>
              <td className="py-2 pr-4 font-mono text-xs">boolean</td>
              <td className="py-2 pr-4">true</td>
              <td className="py-2">Echo browser console to terminal</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">onReady</td>
              <td className="py-2 pr-4 font-mono text-xs">(info) =&gt; void</td>
              <td className="py-2 pr-4">—</td>
              <td className="py-2">Called when server starts</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">...rest</td>
              <td className="py-2 pr-4 font-mono text-xs">BunServeOptions</td>
              <td className="py-2 pr-4">—</td>
              <td className="py-2">Any additional Bun.serve() options</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        When to Use
      </Heading>
      <ul className="my-3 text-text-secondary leading-relaxed list-disc list-inside space-y-1">
        <li>
          <strong>Web/frontend development</strong> — HMR for HTML, CSS, JS changes
        </li>
        <li>
          <strong>Full-stack apps</strong> — serve templates + API routes simultaneously
        </li>
        <li>
          <strong>Framework development</strong> — test BunTok itself with hot reload
        </li>
      </ul>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        When NOT to Use
      </Heading>
      <ul className="my-3 text-text-secondary leading-relaxed list-disc list-inside space-y-1">
        <li>
          <strong>Pure API servers</strong> — <code>bun --watch server.ts</code> is simpler and
          sufficient
        </li>
        <li>
          <strong>Vercel deployment</strong> — Vercel handles serving; use <code>app.fetch()</code>{" "}
          instead
        </li>
        <li>
          <strong>Production</strong> — always use <code>bun run build</code> +{" "}
          <code>bun run start</code>
        </li>
      </ul>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Return Value
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Returns the <code>Bun.serve()</code> instance:
      </p>
      <CodeBlock
        language="typescript"
        code={`const server = devServer({ port: 0 });
console.log(server.port); // actual port (useful with port: 0)
server.stop(); // stop the server`}
      />

      <Callout type="info">
        <code>devServer()</code> without <code>routes</code> or <code>fetch</code> returns 404 for
        all requests by default. This is useful for testing that the server starts correctly.
      </Callout>
    </>
  );
}
