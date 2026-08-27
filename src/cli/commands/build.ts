import { join } from "node:path";
import { existsSync } from "node:fs";

export async function buildCommand() {
	const projectRoot = process.cwd();
	const entryPoint = join(projectRoot, "src/index.ts");
	const outDir = join(projectRoot, ".buntok");

	if (!existsSync(entryPoint)) {
		console.error("\x1b[31m❌ src/index.ts not found\x1b[0m");
		process.exitCode = 1;
		return;
	}

	console.log("\x1b[36m🔨 Building project...\x1b[0m");

	const result = await Bun.build({
		entrypoints: [entryPoint],
		outdir: outDir,
		target: "bun",
		tsconfig: join(projectRoot, "tsconfig.json"),
		packages: "external",
	});

	if (!result.success) {
		console.error("\x1b[31m❌ Build failed:\x1b[0m");
		for (const log of result.logs) {
			console.error(log);
		}
		process.exitCode = 1;
		return;
	}

	console.log("\x1b[32m✅ Build successful → .buntok/index.js\x1b[0m");
	console.log("\x1b[90m  Deploy: copy .buntok/ + node_modules/ + package.json to server\x1b[0m");
}
