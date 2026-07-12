import { resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

export async function makeDocsCommand() {
  console.log("\x1b[36mGenerating OpenAPI documentation...\x1b[0m");

  const entryPath = resolve(process.cwd(), "src/index.ts");
  
  try {
    console.log(`\x1b[90mLoading app from ${entryPath}...\x1b[0m`);
    
    // Dynamically import the user's app instance.
    const userApp = await import(entryPath);
    const appInstance = userApp.app || userApp.default;

    if (!appInstance || !appInstance.openApiDocs) {
      throw new Error("Could not find an exported 'app' instance in src/index.ts. Make sure you export your app: `export const app = new App();`");
    }

    const registry = new OpenAPIRegistry();

    for (const doc of appInstance.openApiDocs) {
      // Convert express-style params /users/:id to openapi style /users/{id}
      const openapiPath = doc.path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
      
      const routeConfig: any = {
        method: doc.method,
        path: openapiPath,
        responses: {}
      };

      if (doc.request.params || doc.request.query || doc.request.body) {
        routeConfig.request = {};
        if (doc.request.params) routeConfig.request.params = doc.request.params;
        if (doc.request.query) routeConfig.request.query = doc.request.query;
        if (doc.request.body) {
          routeConfig.request.body = {
            content: { 'application/json': { schema: doc.request.body } }
          };
        }
      }

      if (doc.responses.length > 0) {
        for (const res of doc.responses) {
          routeConfig.responses[res.status.toString()] = {
            description: res.description,
            content: { 'application/json': { schema: res.schema } }
          };
        }
      } else {
        routeConfig.responses["200"] = { description: "Success" };
      }

      registry.registerPath(routeConfig);
    }

    const generator = new OpenApiGeneratorV3(registry.definitions);
    const document = generator.generateDocument({
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Buntok API Documentation',
        description: 'Auto-generated OpenAPI docs from Zod schemas',
      },
    });

    mkdirSync(resolve(process.cwd(), "public"), { recursive: true });
    const outPath = resolve(process.cwd(), "public/swagger.json");
    writeFileSync(outPath, JSON.stringify(document, null, 2));

    console.log(`\x1b[32m✔ OpenAPI JSON successfully generated at public/swagger.json!\x1b[0m`);
    
    // Generate a basic Scalar UI html wrapper for convenience
    const htmlPath = resolve(process.cwd(), "public/docs.html");
    const html = `<!doctype html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <!-- Point to the generated swagger.json -->
    <script id="api-reference" data-url="/swagger.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
    writeFileSync(htmlPath, html);
    console.log(`\x1b[32m✔ Scalar UI HTML generated at public/docs.html!\x1b[0m`);
    
    console.log(`\n\x1b[36mNext steps:\x1b[0m`);
    console.log(`  1. Make sure static files are served: app.static("/", "./public")`);
    console.log(`  2. Visit http://localhost:1212/docs.html to view your API documentation!`);
  } catch (error) {
    console.error("\x1b[31mFailed to generate docs:\x1b[0m");
    console.error(error);
  }
}
