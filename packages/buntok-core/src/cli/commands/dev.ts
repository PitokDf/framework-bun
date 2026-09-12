import { resolve } from "node:path";
import { existsSync } from "node:fs";

export async function devCommand(flags: string[]): Promise<void> {
	const isExpose = flags.includes("--expose");
	const port = flags.find(f => f.startsWith("--port="))?.split("=")[1] || "1212";

	const targetDir = process.cwd();

	// Find the user's entry point
	const possibleFiles = [
		"server.ts",
		"src/index.ts",
		"src/main.ts",
		"src/app.ts",
		"src/server.ts",
	];

	let entryFile: string | null = null;
	for (const file of possibleFiles) {
		const filePath = resolve(targetDir, file);
		if (existsSync(filePath)) {
			entryFile = filePath;
			break;
		}
	}

	if (!entryFile) {
		console.error("\x1b[31mError: Could not find app entry point (server.ts, src/index.ts, src/main.ts, src/app.ts, or src/server.ts)\x1b[0m");
		process.exitCode = 1;
		return;
	}

	// Build dev command
	const args = ["--watch", entryFile];
	const env: Record<string, string> = {
		...process.env as Record<string, string>,
		NODE_ENV: "development",
		PORT: port,
	};

	if (isExpose) {
		// Install localtunnel if not present
		console.log("\x1b[36mStarting development server with tunnel...\x1b[0m\n");

		try {
			// Try to import localtunnel
			// biome-ignore lint/suspicious/noExplicitAny: optional dynamic import
			const lt = await import("localtunnel" as string);
			// biome-ignore lint/suspicious/noExplicitAny: optional dynamic import
			const tunnel = await (lt as any).default({
				port: Number.parseInt(port),
				subdomain: `buntok-${Date.now()}`,
			});

			console.log(`\x1b[32m  Server running at http://localhost:${port}\x1b[0m`);
			console.log(`\x1b[36m  Tunnel: ${tunnel.url} → http://localhost:${port}\x1b[0m`);
			console.log(`\n  Press Ctrl+C to stop\n`);

			// Spawn the dev server
			const proc = Bun.spawn(["bun", "run", ...args], {
				stdio: ["inherit", "inherit", "inherit"],
				env,
				cwd: targetDir,
			});

			// Handle cleanup
			const cleanup = async () => {
				proc.kill();
				await tunnel.close();
				process.exit(0);
			};

			process.on("SIGINT", cleanup);
			process.on("SIGTERM", cleanup);

			await proc.exited;
		} catch (err: any) {
			if (err.message?.includes("Cannot find module") || err.code === "ERR_MODULE_NOT_FOUND") {
				console.error("\x1b[31mError: localtunnel is required for --expose flag\x1b[0m");
				console.error("Install it with: \x1b[36mbun add -d localtunnel\x1b[0m");
				process.exitCode = 1;
				return;
			}
			throw err;
		}
	} else {
		// Regular dev mode
		console.log(`\x1b[36mStarting development server...\x1b[0m\n`);
		console.log(`\x1b[32m  Server running at http://localhost:${port}\x1b[0m`);
		console.log(`\n  Press Ctrl+C to stop\n`);

		const proc = Bun.spawn(["bun", "run", ...args], {
			stdio: ["inherit", "inherit", "inherit"],
			env,
			cwd: targetDir,
		});

		await proc.exited;
	}
}
