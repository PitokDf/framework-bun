import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";
import { generateController } from "../generators/controller.js";
import { generateRepository } from "../generators/repository.js";
import { generateSchema } from "../generators/schema.js";
import { generateService } from "../generators/service.js";

interface CreateOptions {
	schema: boolean;
	repo: boolean;
	service: boolean;
	controller: boolean;
	all: boolean;
}

function parseOptions(args: string[]): CreateOptions {
	const options: CreateOptions = {
		schema: false,
		repo: false,
		service: false,
		controller: false,
		all: true,
	};

	for (const arg of args) {
		switch (arg) {
			case "--schema":
				options.schema = true;
				options.all = false;
				break;
			case "--repo":
				options.repo = true;
				options.all = false;
				break;
			case "--service":
				options.service = true;
				options.all = false;
				break;
			case "--controller":
				options.controller = true;
				options.all = false;
				break;
		}
	}

	// If any specific option is set, don't generate all
	if (!options.all) {
		return options;
	}

	// Generate all by default
	return {
		schema: true,
		repo: true,
		service: true,
		controller: true,
		all: false,
	};
}

async function ensureDirectories(_entityName: string) {
	const dirs = [
		"src/db/schemas",
		"src/repositories",
		"src/services",
		"src/controllers",
	];

	await Promise.all(
		dirs.map(async (dir) => {
			if (!existsSync(dir)) {
				await fs.mkdir(dir, { recursive: true });
			}
		}),
	);
}

function toPascalCase(str: string): string {
	return str
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

export async function createCommand(entityName: string, args: string[]) {
	const options = parseOptions(args);
	const pascalName = toPascalCase(entityName);

	console.log(`\n\x1b[36mCreating ${pascalName} entity...\x1b[0m\n`);

	// Ensure directories exist
	await ensureDirectories(entityName);

	const results: string[] = [];
	const generatedFiles: string[] = [];
	const tasks: Promise<void>[] = [];

	// Helper to generate file asynchronously
	const generateFile = async (
		path: string,
		contentGenerator: () => string,
		type: string,
	) => {
		if (!existsSync(path)) {
			await fs.writeFile(path, contentGenerator());
			results.push(`✓ ${type}: ${path}`);
			generatedFiles.push(path);
		} else {
			results.push(`• ${type}: ${path} (already exists)`);
		}
	};

	if (options.schema) {
		tasks.push(
			generateFile(
				join("src/db/schemas", `${entityName}.ts`),
				() => generateSchema(entityName),
				"Schema",
			),
		);
	}

	if (options.repo) {
		tasks.push(
			generateFile(
				join("src/repositories", `${entityName}.repository.ts`),
				() => generateRepository(entityName, pascalName, options.schema),
				"Repository",
			),
		);
	}

	if (options.service) {
		tasks.push(
			generateFile(
				join("src/services", `${entityName}.service.ts`),
				() => generateService(entityName, pascalName, options.repo),
				"Service",
			),
		);
	}

	if (options.controller) {
		tasks.push(
			generateFile(
				join("src/controllers", `${entityName}.controller.ts`),
				() => generateController(entityName, pascalName, options.service),
				"Controller",
			),
		);
	}

	// Execute all file generations concurrently
	await Promise.all(tasks);

	// Auto-format generated files with Biome if available
	if (generatedFiles.length > 0) {
		const biomeProc = Bun.spawnSync(
			["bunx", "biome", "format", "--write", ...generatedFiles],
			{
				stdio: ["ignore", "ignore", "ignore"],
			},
		);
		if (biomeProc.exitCode === 0) {
			console.log(
				"\x1b[90m✨ Auto-formatted generated files with Biome\x1b[0m\n",
			);
		}
	}

	// Print results
	console.log("\x1b[32mGenerated files:\x1b[0m");
	for (const result of results.sort()) {
		console.log(`  ${result}`);
	}

	console.log(`
\x1b[36mNext steps:\x1b[0m
  1. Register your controller in src/index.ts:
     \x1b[32mimport { ${pascalName}Controller } from "./controllers/${entityName}.controller";\x1b[0m
     \x1b[32mapp.registerController(${pascalName}Controller);\x1b[0m
  2. Run migrations: \x1b[33mbun run db:push\x1b[0m
  3. Start dev server: \x1b[33mbun run dev\x1b[0m
`);
}
