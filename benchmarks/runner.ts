import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import autocannon from "autocannon";

const frameworks = ["express", "fastify", "hono", "elysia", "buntok"];
const routes = ["/plaintext", "/json", "/id/123"];

async function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBombardier(target: string) {
	return new Promise<any>((resolve) => {
		const child = spawn(
			"./bombardier",
			["-c", "100", "-d", "10s", "-o", "json", target],
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
						resolve(JSON.parse(jsonMatch[0]));
					} else {
						resolve(null);
					}
				} catch (e) {
					resolve(null);
				}
			} else {
				resolve(null);
			}
		});
	});
}

async function runAutocannon(target: string) {
	return new Promise<any[]>((resolve) => {
		const instance = autocannon({
			url: target,
			connections: 100,
			duration: 10,
		});

		const timeSeries: any[] = [];
		let currentSecond = 1;

		instance.on('tick', () => {
			timeSeries.push({ second: currentSecond++, rps: instance.stat(instance.requests, 'requests') });
		});

		instance.on('done', (result) => {
			// Extract the final time series by calculating difference between ticks if needed, 
			// wait, autocannon emits total requests per tick maybe?
			// Actually, tick doesn't provide rps directly. Let's just use result.
			resolve(timeSeries);
		});
	});
}

async function main() {
	const results: any = {};
	const timeSeriesData: any = {};

	console.log("🚀 Starting Comprehensive Benchmark Suite...");

	for (const fw of frameworks) {
		console.log(`\nTesting ${fw}...`);
		results[fw] = {};
		timeSeriesData[fw] = [];

		const env = { ...process.env, NODE_ENV: "production" };
		const startMs = performance.now();
		const server = spawn("bun", ["run", `benchmarks/${fw}.ts`], { env, stdio: "pipe" });

		await new Promise<void>((resolve) => {
			let started = false;
			const timeout = setTimeout(() => {
				if (!started) resolve();
			}, 3000);

			server.stdout?.on("data", (data) => {
				if (!started) {
					started = true;
					clearTimeout(timeout);
					results[fw].startupTime = performance.now() - startMs;
					resolve();
				}
			});
		});

		if (!results[fw].startupTime) {
			results[fw].startupTime = performance.now() - startMs; // Fallback
		}

		await wait(1000); 

		for (const route of routes) {
			process.stdout.write(`  - ${route} ... `);
			const data = await runBombardier(`http://localhost:3000${route}`);
			if (data && data.result) {
				const rps = data.result.rps.mean;
				results[fw][route] = {
					reqPerSec: rps,
					latencyAvg: data.result.latency.mean,
					latencyMax: data.result.latency.max,
					latencyP95: data.result.latency.p95,
					latencyP99: data.result.latency.p99,
					throughput: data.result.bytesRead.mean,
					requests: data.result.req1xx + data.result.req2xx + data.result.req3xx + data.result.req4xx + data.result.req5xx,
					errors: data.result.req4xx + data.result.req5xx
				};
				console.log(`${Math.round(rps)} req/sec`);
			} else {
				console.log(`Failed`);
			}
		}

		// Run timeseries for plaintext
		console.log(`  - Generating timeseries for ${fw} ...`);
		const instance = autocannon({
			url: `http://localhost:3000/plaintext`,
			connections: 100,
			duration: 10,
		});

		instance.on('tick', (stats: any) => {
			timeSeriesData[fw].push({
				reqPerSec: stats.counter
			});
		});

		await new Promise((resolve) => instance.on('done', resolve));

		server.kill();
		await wait(1000);
	}

	const machineInfo = {
		cpu: os.cpus()[0].model,
		cores: os.cpus().length,
		memory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
		os: `${os.type()} ${os.release()}`,
		runtime: `Bun ${Bun.version}`,
		date: new Date().toISOString()
	};

	const finalReport = {
		machine: machineInfo,
		frameworks: results,
		timeSeries: timeSeriesData
	};

	await fs.writeFile("dashboard-data.json", JSON.stringify(finalReport, null, 2));
	console.log("\n✅ Generated comprehensive dashboard-data.json with Time Series!");
}

main().catch(console.error);
