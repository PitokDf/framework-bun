#!/usr/bin/env bun

import { spawn } from "node:child_process";

const PORT = 1214;
const BASE = `http://localhost:${PORT}`;
const DURATION = 10;
const CONNECTIONS = 100; // TechEmpower standard: higher connection count

const isProd = process.argv.includes("--prod");
const NODE_ENV = isProd ? "production" : "development";

// Start server automatically
const server = spawn("bun", ["run", "src/index.ts"], {
	env: { ...process.env, PORT: String(PORT), NODE_ENV, LOG_REQUESTS: "false" },
	stdio: "pipe",
});

// Wait for server to be ready
await new Promise<void>((resolve) => {
	server.stdout?.on("data", (data: Buffer) => {
		const text = data.toString();
		if (text.includes("running on")) {
			resolve();
		}
	});
	server.stderr?.on("data", (data: Buffer) => {
		process.stderr.write(data);
	});
	setTimeout(resolve, 3000);
});

function generate1KBJson(): string {
	return JSON.stringify({
		data: "x".repeat(900),
	});
}

// TechEmpower standard benchmark suite
const benchmarks = [
	// ===== TechEmpower Core Tests =====
	{
		name: "Plaintext",
		url: `${BASE}/bench/plaintext`,
		method: "GET" as const,
	},
	{
		name: "JSON Serialization",
		url: `${BASE}/bench/json`,
		method: "GET" as const,
	},
	{
		name: "Single Query (DB)",
		url: `${BASE}/bench/db/single`,
		method: "GET" as const,
	},
	{
		name: "Multiple Queries (10)",
		url: `${BASE}/bench/db/queries?queries=10`,
		method: "GET" as const,
	},
	{
		name: "Fortunes (HTML)",
		url: `${BASE}/bench/fortunes`,
		method: "GET" as const,
	},
	{
		name: "Data Updates (10)",
		url: `${BASE}/bench/db/updates?queries=10`,
		method: "GET" as const,
	},
	// ===== Framework-Specific Tests =====
	{
		name: "Route Params",
		url: `${BASE}/bench/user/123`,
		method: "GET" as const,
	},
	{
		name: "Query String",
		url: `${BASE}/bench/query?name=test&age=25`,
		method: "GET" as const,
	},
	{
		name: "POST JSON 1KB",
		url: `${BASE}/bench/post`,
		method: "POST" as const,
		body: generate1KBJson(),
		headers: { "Content-Type": "application/json" },
	},
	{
		name: "Middleware 5 Layers",
		url: `${BASE}/bench/middleware`,
		method: "GET" as const,
	},
	{
		name: "Static File 100KB",
		url: `${BASE}/bench/static`,
		method: "GET" as const,
	},
];

// biome-ignore lint/suspicious/noExplicitAny: Required for arbitrary result objects
async function runBenchmark(config: (typeof benchmarks)[0]): Promise<any> {
	return new Promise((resolve, reject) => {
		const args = [
			"./bombardier",
			"-c",
			String(CONNECTIONS),
			"-d",
			`${DURATION}s`,
			"-m",
			config.method,
			"-o",
			"json",
			"-p",
			"r", // Print result only
		];

		if (config.headers) {
			for (const [k, v] of Object.entries(config.headers)) {
				args.push("-H", `${k}: ${v}`);
			}
		}

		if (config.body) {
			args.push("-b", config.body);
		}

		args.push(config.url);

		const child = spawn(args[0] as string, args.slice(1), { stdio: "pipe" });

		let stdout = "";
		child.stdout?.on("data", (data: Buffer) => {
			stdout += data.toString();
		});

		child.on("close", (code: number | null) => {
			if (code !== 0) {
				reject(
					new Error(
						`Bombardier failed with code ${code}. Please make sure you have downloaded it: wget https://github.com/codesenberg/bombardier/releases/download/v1.2.6/bombardier-linux-amd64 -O bombardier && chmod +x bombardier`,
					),
				);
				return;
			}
			try {
				const res = JSON.parse(stdout);
				resolve(res);
			} catch (_e) {
				reject(new Error(`Failed to parse bombardier output: ${stdout}`));
			}
		});
	});
}

function formatResult(name: string, data: unknown) {
	// biome-ignore lint/suspicious/noExplicitAny: Required to parse unknown JSON
	const res = (data as any).result;

	const reqPerSec = res.rps.mean;
	const latencyAvg = res.latency.mean / 1000; // convert us to ms
	const latencyMax = res.latency.max / 1000;

	const totalRequests =
		res.req1xx + res.req2xx + res.req3xx + res.req4xx + res.req5xx;
	const throughputMB = res.bytesRead / 1024 / 1024 / res.timeTakenSeconds;

	return {
		Test: name,
		"Req/sec": reqPerSec.toLocaleString(undefined, {
			maximumFractionDigits: 0,
		}),
		"Latency avg (ms)": latencyAvg.toFixed(2),
		"Latency max (ms)": latencyMax.toFixed(2),
		"Throughput (MB/s)": throughputMB.toFixed(2),
		"Total requests": totalRequests.toLocaleString(),
	};
}

async function main() {
	console.log("⚡ Buntok Benchmark (TechEmpower Standard via Bombardier)");
	console.log(
		`   Mode: ${isProd ? "production" : "development"} | Duration: ${DURATION}s | Connections: ${CONNECTIONS}`,
	);
	console.log(`   Target: ${BASE}\n`);

	const results = [];
	const benchOutput: Array<{
		name: string;
		unit: string;
		value: number;
		range: string;
	}> = [];

	for (const bench of benchmarks) {
		process.stdout.write(`   Running: ${bench.name}...`);
		try {
			const result = await runBenchmark(bench);
			const formatted = formatResult(bench.name, result);
			results.push(formatted);
			benchOutput.push({
				name: bench.name,
				unit: "req/sec",
				value: Math.round(result.result.rps.mean),
				range: `±${Math.round((result.result.rps.stddev / result.result.rps.mean) * 100)}%`,
			});
			console.log(" done");
		} catch (err) {
			console.log(` FAILED: ${err}`);
		}
	}

	console.log("\n📊 Results:\n");
	console.table(results);

	// Output JSON for CI benchmarking
	const fs = await import("node:fs");
	fs.writeFileSync(
		"benchmark-output.json",
		JSON.stringify(benchOutput, null, 2),
	);
	console.log("\n✅ Benchmark output saved to benchmark-output.json");

	// Kill server and exit
	server.kill();
	process.exit(0);
}

main();
