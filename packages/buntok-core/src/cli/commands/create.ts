import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";
import { generateBarrel } from "../generators/barrel.js";
import { generateController } from "../generators/controller.js";
import { detectORM, type ORM } from "../generators/repository.js";
import { generateRepository } from "../generators/repository.js";
import { generateSchemaFile } from "../generators/schema.js";
import { generateService } from "../generators/service.js";

interface CreateOptions {
	repo: boolean;
	service: boolean;
	controller: boolean;
	schema: boolean;
	all: boolean;
	dryRun: boolean;
	orm?: ORM;
}

function parseOptions(args: string[]): CreateOptions {
	const options: CreateOptions = {
		repo: false,
		service: false,
		controller: false,
		schema: false,
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
			case "--schema":
				options.schema = true;
				options.all = false;
				break;
			case "--dry-run":
				options.dryRun = true;
				break;
			case "--prisma":
				options.orm = "prisma";
				break;
			case "--drizzle":
				options.orm = "drizzle";
				break;
			case "--typeorm":
				options.orm = "typeorm";
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
		schema: true,
		all: false,
		dryRun: options.dryRun,
		orm: options.orm,
	};
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
	const orm = options.orm ?? detectORM();
	const moduleDir = join("src/modules", entityName);

	const prefix = options.dryRun ? "\x1b[33m[DRY RUN]\x1b[0m " : "";
	console.log(`\n${prefix}\x1b[36mCreating ${pascalName} entity (orm: ${orm})...\x1b[0m\n`);

	// Ensure module directory exists (skip in dry-run)
	if (!options.dryRun) {
		if (!existsSync(moduleDir)) {
			await fs.mkdir(moduleDir, { recursive: true });
		}
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
				join(moduleDir, `${entityName}.repository.ts`),
				() => generateRepository(entityName, pascalName, orm),
				"Repository",
			),
		);
	}

	if (options.service) {
		tasks.push(
			generateFile(
				join(moduleDir, `${entityName}.service.ts`),
				() => generateService(entityName, pascalName, options.repo, orm),
				"Service",
			),
		);
	}

	if (options.controller) {
		tasks.push(
			generateFile(
				join(moduleDir, `${entityName}.controller.ts`),
				() => generateController(entityName, pascalName, options.service, orm),
				"Controller",
			),
		);
	}

	if (options.schema) {
		const schemaPath = join(moduleDir, `${entityName}.schema.ts`);
		if (!options.dryRun) {
			const result = await generateSchemaFile(entityName, moduleDir);
			if (result) {
				results.push(`✓ Schema: ${result}`);
				generatedFiles.push(result);
			} else {
				results.push(`• Schema: ${schemaPath} (already exists)`);
			}
		} else {
			results.push(`[DRY RUN] Schema: ${schemaPath}`);
		}
	}

	// Execute all file generations concurrently
	await Promise.all(tasks);

	// Generate barrel export (always generate)
	const barrelPath = join(moduleDir, "index.ts");
	if (!options.dryRun && !existsSync(barrelPath)) {
		const barrelContent = generateBarrel(entityName, pascalName, {
			repository: options.repo,
			service: options.service,
			controller: options.controller,
			schema: options.schema,
		});
		await fs.writeFile(barrelPath, barrelContent);
		results.push(`✓ Barrel: ${barrelPath}`);
		generatedFiles.push(barrelPath);
	} else if (existsSync(barrelPath)) {
		results.push(`• Barrel: ${barrelPath} (already exists)`);
	}

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
	if (existsSync(indexPath) && !options.dryRun && options.controller) {
		const indexContent = readFileSync(indexPath, "utf-8");
		const controllerName = `${pascalName}Controller`;
		const controllerImport = `import { ${controllerName} } from "@/modules/${entityName}";`;

		// Determine registration type based on whether controller has @Dependencies
		const useContainer = options.service;

		// Check if this controller is already registered
		const rcSingleRegex = /app\.registerController\((\w+)\)\s*;/;
		const rcArrayRegex = /app\.registerController\(\[([^\]]*)\]\)\s*;/;
		const scanRegex = /(?:app\.getContainer\(\)|container)\.scan\(\[([^\]]*)\]\)\s*;/;

		const rcSingleMatch = indexContent.match(rcSingleRegex);
		const rcArrayMatch = indexContent.match(rcArrayRegex);
		const scanMatch = indexContent.match(scanRegex);

		let alreadyRegistered = false;
		if (useContainer && scanMatch?.[1]) {
			alreadyRegistered = scanMatch[1].includes(controllerName);
		} else if (!useContainer && rcSingleMatch?.[1]) {
			alreadyRegistered = rcSingleMatch[1] === controllerName;
		} else if (!useContainer && rcArrayMatch?.[1]) {
			alreadyRegistered = rcArrayMatch[1].includes(controllerName);
		}

		if (!alreadyRegistered) {
			let content = indexContent;

			// Helper: find insertion point with fallback chain
			function findInsertionIndex(src: string): { index: number; before: string } {
				// Pattern 1: app.listen(
				const listenMatch = src.match(/(app\.listen\s*\()/);
				if (listenMatch?.index !== undefined && listenMatch[1]) {
					return { index: listenMatch.index, before: listenMatch[1] };
				}
				// Pattern 2: app.get( or app.post( etc (route handlers)
				const routeMatch = src.match(/\n(app\.(get|post|put|delete|patch|all|use)\s*\()/);
				if (routeMatch?.index !== undefined && routeMatch[1]) {
					return { index: routeMatch.index + 1, before: routeMatch[1] };
				}
				// Pattern 3: export default app
				const exportDefaultMatch = src.match(/\n(export\s+default\s+app)/);
				if (exportDefaultMatch?.index !== undefined && exportDefaultMatch[1]) {
					return { index: exportDefaultMatch.index + 1, before: exportDefaultMatch[1] };
				}
				// Pattern 4: export const app (insert after)
				const exportConstMatch = src.match(/(export\s+const\s+app\s*=\s*new\s+App\(\))/);
				if (exportConstMatch?.index !== undefined) {
					return { index: exportConstMatch.index + exportConstMatch[0].length, before: "" };
				}
				// Fallback: append at end
				return { index: src.length, before: "" };
			}

			// Helper: add import if missing
			function ensureImport(src: string, imp: string): string {
				if (src.includes(imp)) return src;
				const lines = src.split("\n");
				let lastImportIndex = -1;
				for (let i = 0; i < lines.length; i++) {
					if (lines[i]?.startsWith("import ")) {
						lastImportIndex = i;
					}
				}
				if (lastImportIndex !== -1) {
					lines.splice(lastImportIndex + 1, 0, imp);
				} else {
					lines.unshift(imp);
				}
				return lines.join("\n");
			}

			// Helper: add/merge into existing array
			function mergeIntoArray(src: string, regex: RegExp, newController: string): string {
				const match = src.match(regex);
				if (match?.[1]) {
					const existing = match[1].trim();
					const merged = existing ? `${existing}, ${newController}` : newController;
					return src.replace(regex, `container.scan([${merged}]);`);
				}
				return "";
			}

			// Helper: collect all imported controllers
			// excludeFromScan: filter out controllers already registered in registerController
			function collectImportedControllers(src: string, excludeFromScan: boolean): string[] {
				const imports = src.match(/import\s*\{\s*(\w+Controller)\s*\}\s*from\s*["']@\/modules\/\w+["']/g);
				const controllers: string[] = [];
				if (imports) {
					for (const imp of imports) {
						const match = imp.match(/\{\s*(\w+Controller)\s*\}/);
						if (match?.[1]) {
							// If excludeFromScan, skip controllers already in registerController
							if (excludeFromScan) {
								const rcSingleMatch = src.match(new RegExp(`app\\.registerController\\((${match[1]})\\)`));
								const rcArrayMatch = src.match(new RegExp(`app\\.registerController\\(\\[([^\\]]*?${match[1]}[^\\]]*?)\\]\\)`));
								if (rcSingleMatch || rcArrayMatch) continue;
							}
							controllers.push(match[1]);
						}
					}
				}
				return controllers;
			}

			if (useContainer) {
				// === container.scan() + registerController() flow ===

				// Step 1: Add Container import if missing
				const containerImportRegex = /import\s*\{[^}]*Container[^}]*\}\s*from\s*["']@buntok\/core["']/;
				if (!containerImportRegex.test(content)) {
					// Add Container to existing @buntok/core import
					content = content.replace(
						/import\s*\{([^}]+)\}\s*from\s*["']@buntok\/core["']/,
						(_match, imports: string) => {
							if (imports.includes("Container")) return _match;
							return `import { ${imports.trim()}, Container } from "@buntok/core"`;
						},
					);
				}

				// Step 2: Add controller import if missing
				content = ensureImport(content, controllerImport);

				// Step 3: Add "const container = new Container();" if missing
				const containerDeclRegex = /(?:const|let|var)\s+container\s*=\s*new\s+Container\(\)/;
				if (!containerDeclRegex.test(content)) {
					const insertAfterApp = content.match(/(const\s+app\s*=\s*new\s+App\(\)\s*;?)/);
					if (insertAfterApp?.index !== undefined) {
						const insertPos = insertAfterApp.index + insertAfterApp[0].length;
						content = content.slice(0, insertPos) + "\nconst container = new Container();" + content.slice(insertPos);
					}
				}

				// Step 4: Add/merge container.scan()
				const existingScan = content.match(scanRegex);
				if (existingScan?.[1]) {
					// Already has scan — merge
					const existing = existingScan[1].trim();
					const merged = existing ? `${existing}, ${controllerName}` : controllerName;
					content = content.replace(scanRegex, `container.scan([${merged}]);`);
				} else {
					// No scan found — collect all imported @Dependencies controllers and create scan
					const allControllers = collectImportedControllers(content, true);
					if (!allControllers.includes(controllerName)) {
						allControllers.push(controllerName);
					}
					const scanLine = `container.scan([${allControllers.join(", ")}]);`;
					const insertion = findInsertionIndex(content);
					content = content.slice(0, insertion.index) + scanLine + "\n\n" + content.slice(insertion.index);
				}

				// Step 5: Add app.setContainer(container) if missing
				const setContainerRegex = /app\.setContainer\s*\(\s*container\s*\)\s*;/;
				if (!setContainerRegex.test(content)) {
					const insertion = findInsertionIndex(content);
					content = content.slice(0, insertion.index) + "app.setContainer(container);\n\n" + content.slice(insertion.index);
				}

				// Step 6: Add/merge registerController() — required for API endpoint registration
				const rcSingleNew = content.match(rcSingleRegex);
				const rcArrayNew = content.match(rcArrayRegex);

				if (rcArrayNew?.[1]) {
					// Already has array — merge
					const existing = rcArrayNew[1].trim();
					const merged = existing ? `${existing}, ${controllerName}` : controllerName;
					content = content.replace(rcArrayRegex, `app.registerController([${merged}]);`);
				} else if (rcSingleNew?.[1]) {
					// Has single — convert to array
					content = content.replace(
						rcSingleRegex,
						`app.registerController([${rcSingleNew[1]}, ${controllerName}]);`,
					);
				} else {
					// No registration — create new
					const registerLine = `app.registerController([${controllerName}]);`;
					const insertion = findInsertionIndex(content);
					content = content.slice(0, insertion.index) + registerLine + "\n\n" + content.slice(insertion.index);
				}

				console.log(`\x1b[32m✔ Registered ${controllerName} in container.scan() + registerController()\x1b[0m`);
			} else {
				// === registerController() flow ===

				// Step 1: Add controller import if missing
				content = ensureImport(content, controllerImport);

				// Step 2: Smart registerController merge
				const rcSingleNew = content.match(rcSingleRegex);
				const rcArrayNew = content.match(rcArrayRegex);

				if (rcArrayNew?.[1]) {
					// Already has array — merge
					const existing = rcArrayNew[1].trim();
					const merged = existing ? `${existing}, ${controllerName}` : controllerName;
					content = content.replace(rcArrayRegex, `app.registerController([${merged}]);`);
				} else if (rcSingleNew?.[1]) {
					// Has single — convert to array
					content = content.replace(
						rcSingleRegex,
						`app.registerController([${rcSingleNew[1]}, ${controllerName}]);`,
					);
				} else {
					// No registration — create new
					const registerLine = `app.registerController([${controllerName}]);`;
					const insertion = findInsertionIndex(content);
					content = content.slice(0, insertion.index) + registerLine + "\n\n" + content.slice(insertion.index);
				}

				console.log(`\x1b[32m✔ Registered ${controllerName} in src/index.ts\x1b[0m`);
			}

			await fs.writeFile(indexPath, content);
		} else {
			const location = useContainer ? "container.scan()" : "registerController";
			console.log(
				`\x1b[90m• src/index.ts: ${controllerName} already registered in ${location}\x1b[0m`,
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
