import { existsSync } from "node:fs";
import { join } from "node:path";

export async function checkCommand(): Promise<void> {
	const cwd = process.cwd();
	const tsconfigPath = join(cwd, "tsconfig.json");

	if (!existsSync(tsconfigPath)) {
		console.error(
			"\x1b[31mError: tsconfig.json not found. Run `buntok init` first.\x1b[0m",
		);
		process.exitCode = 1;
		return;
	}

	console.log("\x1b[36m  Running type check...\x1b[0m\n");

	const proc = Bun.spawnSync(
		["bunx", "tsc", "--noEmit", "--project", tsconfigPath],
		{ cwd },
	);

	if (proc.exitCode === 0) {
		console.log("\n\x1b[32m  ✓ Type check passed\x1b[0m\n");
	} else {
		console.log("\n\x1b[31m  ✗ Type check failed\x1b[0m\n");
	}

	process.exitCode = proc.exitCode ?? 1;
}
