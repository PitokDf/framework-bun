import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function generateMiddleware(name: string, pascalName: string): string {
  return `import type { Context } from "buntok";

export async function ${pascalName}Middleware(ctx: Context, next: () => Promise<void>) {
  // TODO: Implement middleware logic here
  // Example: 
  // const token = ctx.req.headers.get("Authorization");
  // if (!token) {
  //   return ctx.json({ error: "Unauthorized" }, 401);
  // }
  
  console.log(\`[${pascalName}Middleware] processing request for: \${ctx.req.url}\`);
  
  // Call the next middleware or route handler in the chain
  await next();
  
  // Logic after the route handler finishes
  // console.log(\`[${pascalName}Middleware] response ready\`);
}
`;
}

export async function makeMiddlewareCommand(name: string) {
  const pascalName = toPascalCase(name);
  console.log(`\n\x1b[36mCreating ${pascalName} Middleware...\x1b[0m\n`);

  const middlewaresDir = "src/middlewares";
  
  if (!existsSync(middlewaresDir)) {
    await fs.mkdir(middlewaresDir, { recursive: true });
  }

  const filePath = join(middlewaresDir, `${name}.middleware.ts`);
  
  if (existsSync(filePath)) {
    console.error(`\x1b[31mError: Middleware file already exists at ${filePath}\x1b[0m`);
    process.exit(1);
  }

  const content = generateMiddleware(name, pascalName);
  await fs.writeFile(filePath, content);

  // Auto-format generated file with Biome if available
  const biomeProc = Bun.spawnSync(["bunx", "biome", "format", "--write", filePath], {
    stdio: ["ignore", "ignore", "ignore"]
  });
  
  if (biomeProc.exitCode === 0) {
    console.log("\x1b[90m✨ Auto-formatted generated file with Biome\x1b[0m");
  }

  console.log(`\x1b[32m✓ Generated middleware:\x1b[0m ${filePath}`);
  
  console.log(`
\x1b[36mUsage:\x1b[0m
  Import and apply it globally in src/index.ts:
     \x1b[32mapp.use(${pascalName}Middleware);\x1b[0m
     
  Or apply it to a specific controller:
     \x1b[32m@Use(${pascalName}Middleware)\x1b[0m
     \x1b[32mexport class MyController { ... }\x1b[0m
`);
}
