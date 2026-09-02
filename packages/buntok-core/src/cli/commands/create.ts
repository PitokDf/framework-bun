import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";
import { generateController } from "../generators/controller.js";
import { generateRepository } from "../generators/repository.js";
import { generateService } from "../generators/service.js";

interface CreateOptions {
	repo: boolean;
	service: boolean;
	controller: boolean;
	all: boolean;
	dryRun: boolean;
}

function parseOptions(args: string[]): CreateOptions {
	const options: CreateOptions = {
		repo: false,
		service: false,
		controller: false,
		all: true,
		dryRun: false,
	};

	for (const arg of args) {
		switch (arg) {
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
			case "--dry-run":
				options.dryRun = true;
				break;
		}
	}

	// If any specific option is set, don't generate all
	if (!options.all) {
		return options;
	}

	// Generate all by default
	return {
		repo: true,
		service: true,
		controller: true,
		all: false,
		dryRun: options.dryRun,
	};
}

async function ensureDirectories(_entityName: string) {
	const dirs = ["src/repositories", "src/services", "src/controllers"];

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

	const prefix = options.dryRun ? "\x1b[33m[DRY RUN]\x1b[0m " : "";
	console.log(`\n${prefix}\x1b[36mCreating ${pascalName} entity...\x1b[0m\n`);

	// Ensure directories exist (skip in dry-run)
	if (!options.dryRun) {
		await ensureDirectories(entityName);
	}

	const results: string[] = [];
	const generatedFiles: string[] = [];
	const tasks: Promise<void>[] = [];

	// Helper to generate file asynchronously
	const generateFile = async (
		path: string,
		contentGenerator: () => string,
		type: string,
	) => {
		if (options.dryRun) {
			const content = contentGenerator();
			results.push(`[DRY RUN] ${type}: ${path}`);
			console.log(`\n\x1b[90m--- ${path} ---\x1b[0m`);
			console.log(content);
			console.log(`\x1b[90m--- end ---\x1b[0m\n`);
			return;
		}
		if (!existsSync(path)) {
			await fs.writeFile(path, contentGenerator());
			results.push(`✓ ${type}: ${path}`);
			generatedFiles.push(path);
		} else {
			results.push(`• ${type}: ${path} (already exists)`);
		}
	};

	if (options.repo) {
		tasks.push(
			generateFile(
				join("src/repositories", `${entityName}.repository.ts`),
				() => generateRepository(entityName, pascalName),
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

	// Auto-format generated files with Biome if available (skip in dry-run)
	if (generatedFiles.length > 0 && !options.dryRun) {
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

	// Auto-register in src/index.ts (skip in dry-run)
	const indexPath = join("src", "index.ts");
	if (existsSync(indexPath) && !options.dryRun) {
		const indexContent = readFileSync(indexPath, "utf-8");

		// Build imports
		const imports: string[] = [];
		const instantiations: string[] = [];

		// Only register repo + service if full chain (they're needed by controller)
		if (options.repo && options.service) {
			imports.push(`import { ${pascalName}Repository } from "@/repositories/${entityName}.repository";`);
			instantiations.push(`const ${entityName}Repository = new ${pascalName}Repository();`);
		}

		if (options.service) {
			const repoArg = options.repo ? `(${entityName}Repository)` : "";
			instantiations.push(`const ${entityName}Service = new ${pascalName}Service${repoArg};`);
			if (!options.repo) {
				imports.push(`import { ${pascalName}Service } from "@/services/${entityName}.service";`);
			}
		}

		// Always register controller
		{
			imports.push(`import { ${pascalName}Controller } from "@/controllers/${entityName}.controller";`);
			const serviceArg = options.service ? `(${entityName}Service)` : "";
			instantiations.push(`app.registerController(new ${pascalName}Controller${serviceArg});`);
		}

		const importBlock = imports.join("\n");
		const instantiationBlock = instantiations.join("\n");

		if (!indexContent.includes(importBlock)) {
			const lines = indexContent.split("\n");

			// Find the last import line and insert after it
			let lastImportIndex = -1;
			for (let i = 0; i < lines.length; i++) {
				if (lines[i]?.startsWith("import ")) {
					lastImportIndex = i;
				}
			}

			if (lastImportIndex !== -1) {
				lines.splice(lastImportIndex + 1, 0, importBlock);
			} else {
				lines.unshift(importBlock);
			}

			// Find app.registerController or app.listen and insert before it
			const content = lines.join("\n");
			const updatedContent = content.replace(
				/(app\.(registerController|listen)\s*\()/,
				`${instantiationBlock}\n\n$1`,
			);

			await fs.writeFile(indexPath, updatedContent);
			console.log(
				`\x1b[32m✔ Registered ${pascalName} in src/index.ts\x1b[0m`,
			);
		} else {
			console.log(
				`\x1b[90m• src/index.ts: ${pascalName} already registered\x1b[0m`,
			);
		}
	}

	// Print results
	console.log(options.dryRun ? "\x1b[33mWould generate:\x1b[0m" : "\x1b[32mGenerated files:\x1b[0m");
	for (const result of results.sort()) {
		console.log(`  ${result}`);
	}

	if (options.dryRun) {
		console.log(`\n\x1b[33mRun without --dry-run to create these files.\x1b[0m\n`);
	} else {
		console.log(`
\x1b[36mNext steps:\x1b[0m
  1. Start dev server: \x1b[33mbun run dev\x1b[0m
`);
	}
}
