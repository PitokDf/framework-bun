import { spawn } from "node:child_process";
import fs from "node:fs/promises";

const frameworks = ["express", "fastify", "hono", "elysia", "buntok"];
const routes = ["/plaintext", "/json", "/id/123"];

async function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBombardier(target: string) {
	return new Promise<number>((resolve) => {
		// Use the bombardier binary from root
		const child = spawn(
			"./bombardier",
			["-c", "100", "-d", "5s", "-o", "json", target],
			{ stdio: "pipe" },
		);

		let stdout = "";
		child.stdout?.on("data", (data: Buffer) => {
			stdout += data.toString();
		});

		child.on("close", (code) => {
			if (code === 0) {
				try {
					const jsonMatch = stdout.match(/\{"spec":.*/);
					if (jsonMatch) {
						const data = JSON.parse(jsonMatch[0]);
						resolve(Math.round(data.result.rps.mean));
					} else {
						console.error("No JSON found in output");
						resolve(0);
					}
				} catch (e) {
					console.error("Failed to parse output");
					resolve(0);
				}
			} else {
				console.error("Bombardier failed with code", code);
				resolve(0);
			}
		});
	});
}

async function main() {
	const results: Record<string, Record<string, number>> = {};

	console.log("🚀 Starting Benchmark Suite...");

	for (const fw of frameworks) {
		console.log(`\nTesting ${fw}...`);
		results[fw] = {};

		const env = { ...process.env, NODE_ENV: "production" };
		const server = spawn("bun", ["run", `benchmarks/${fw}.ts`], { env, stdio: "pipe" });

		await wait(2000); // Wait for server to start

		for (const route of routes) {
			process.stdout.write(`  - ${route} ... `);
			const rps = await runBombardier(`http://localhost:3000${route}`);
			results[fw][route] = rps;
			console.log(`${rps} req/sec`);
		}

		server.kill();
		await wait(1000); // Wait for port to be released
	}

	console.log("\n📊 Final Results (Req/Sec):");
	console.table(results);

	const benchOutput = [];
	for (const [fw, fwResults] of Object.entries(results)) {
		for (const [route, rps] of Object.entries(fwResults)) {
			benchOutput.push({
				name: `${fw} ${route}`,
				unit: "req/sec",
				value: rps,
			});
		}
	}
	await fs.writeFile("benchmark-output.json", JSON.stringify(benchOutput, null, 2));
}

main().catch(console.error);
