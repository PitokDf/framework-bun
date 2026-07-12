import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";

function toPascalCase(str: string): string {
	return str
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

function generateMiddleware(_name: string, pascalName: string): string {
	return `import type { Context, Handler } from "buntok";

export const ${pascalName}Middleware: Handler = async (ctx: Context, next: () => Promise<void>) => {
  const start = performance.now();
  
  await next();
  
  const end = performance.now();
  const url = new URL(ctx.request.url);
  console.log(\`[\${ctx.request.method}] \${url.pathname} - \${Math.round(end - start)}ms\`);
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
		console.error(
			`\x1b[31mError: Middleware file already exists at ${filePath}\x1b[0m`,
		);
		process.exit(1);
	}

	const content = generateMiddleware(name, pascalName);
	await fs.writeFile(filePath, content);

	// Auto-format generated file with Biome if available
	const biomeProc = Bun.spawnSync(
		["bunx", "biome", "format", "--write", filePath],
		{
			stdio: ["ignore", "ignore", "ignore"],
		},
	);

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
