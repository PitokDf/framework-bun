import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata = {
  title: "Static Files",
  description:
    "Serve static assets from directories with configurable caching headers.",
};

export default function StaticFilesPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Static Files
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Serve static files from a directory using <code>app.static()</code>.
        This is useful for serving images, CSS, JavaScript bundles, or any other
        static assets.
      </p>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`// Serve files from ./public at /public/*
app.static("/public", "./public");

// Serve files from ./assets at /files/*
app.static("/files", "./assets");`}
      />

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Parameters
      </Heading>
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
              <td className="px-4 py-2 font-mono text-accent">routePath</td>
              <td className="px-4 py-2 font-mono">string</td>
              <td className="px-4 py-2">URL prefix (e.g., "/public")</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">directory</td>
              <td className="px-4 py-2 font-mono">string</td>
              <td className="px-4 py-2">
                Filesystem path relative to <code>process.cwd()</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Security
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Directory traversal attacks are automatically prevented. Requests that
        attempt to escape the base directory (e.g.,{" "}
        <code>/files/../../etc/passwd</code>) will receive a{" "}
        <code>403 Forbidden</code> response.
      </p>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Caching
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Static file responses include caching headers:
      </p>
      <ul className="my-3 ml-6 list-disc text-text-secondary space-y-1">
        <li>
          <code>Cache-Control: public, max-age=3600</code> (1 hour)
        </li>
        <li>
          <strong>ETag support</strong> - Server sends{" "}
          <code>ETag</code> header on <code>304 Not Modified</code> responses.
          Clients should send <code>If-None-Match</code> to leverage caching.
        </li>
      </ul>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        404 Handling
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        If the requested file does not exist, the server returns a{" "}
        <code>404</code> response with{" "}
        <code>{"{ error: 'File Not Found' }"}</code>.
      </p>

      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Example
      </Heading>
      <CodeBlock
        code={`// Project structure:
// ./public/
//   ├── index.html
//   ├── styles.css
//   └── images/
//       └── logo.png

app.static("/public", "./public");

// GET /public/index.html   → serves index.html
// GET /public/styles.css   → serves styles.css
// GET /public/images/logo.png → serves logo.png
// GET /public/missing.txt  → 404 Not Found`}
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
          - Learn about route groups and other routing features
        </li>
        <li>
          <a href="/docs/middleware" className="text-accent hover:underline">
            Middleware
          </a>{" "}
          - Add middleware to static file routes
        </li>
      </ul>
    </div>
  );
}
