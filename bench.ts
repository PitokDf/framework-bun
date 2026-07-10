#!/usr/bin/env bun

import { spawn } from "node:child_process";
import autocannon from "autocannon";

const PORT = 1213;
const BASE = `http://localhost:${PORT}`;
const DURATION = 10;
const CONNECTIONS = 100; // TechEmpower standard: higher connection count
const PIPELINING = 10; // TechEmpower standard: pipelining

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

interface BenchmarkResult {
	name: string;
	throughput: { average: number; mean: number };
	latency: { average: number; mean: number; p99: number };
	requests: { average: number; total: number };
}

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
	{
		name: "QUERY Method (RFC 10008)",
		url: `${BASE}/bench/query-method`,
		method: "QUERY" as const,
		body: generate1KBJson(),
		headers: { "Content-Type": "application/json" },
	},
];

async function runBenchmark(
	config: (typeof benchmarks)[0],
): Promise<BenchmarkResult> {
	return new Promise((resolve, reject) => {
		const instance = autocannon(
			{
				url: config.url,
				method: config.method,
				body: config.body,
				headers: config.headers,
				duration: DURATION,
				connections: CONNECTIONS,
				pipelining: PIPELINING,
			},
			(err, result) => {
				if (err) reject(err);
				else resolve(result as BenchmarkResult);
			},
		);

		autocannon.track(instance, { renderProgressBar: false });
	});
}

function formatResult(name: string, result: BenchmarkResult) {
	const reqPerSec = result.requests.average;
	const latencyAvg = result.latency.average.toFixed(2);
	const latencyP99 = result.latency.p99.toFixed(2);
	const totalRequests = result.requests.total;
	const throughputMB = (result.throughput.average / 1024 / 1024).toFixed(2);

	return {
		Test: name,
		"Req/sec": reqPerSec.toLocaleString(),
		"Latency avg (ms)": latencyAvg,
		"Latency p99 (ms)": latencyP99,
		"Throughput (MB/s)": throughputMB,
		"Total requests": totalRequests.toLocaleString(),
	};
}

async function main() {
	console.log("⚡ Buntok Benchmark (TechEmpower Standard)");
	console.log(
		`   Mode: ${isProd ? "production" : "development"} | Duration: ${DURATION}s | Connections: ${CONNECTIONS} | Pipelining: ${PIPELINING}`,
	);
	console.log(`   Target: ${BASE}\n`);

	const results = [];
	const benchOutput: Array<{
		name: string;
		hz: number;
		stats: {
			mean: number;
			variance: number;
			stddev: number;
			sem: number;
			rme: number;
			sample: number[];
		};
		samples: number;
	}> = [];

	for (const bench of benchmarks) {
		process.stdout.write(`   Running: ${bench.name}...`);
		try {
			const result = await runBenchmark(bench);
			const formatted = formatResult(bench.name, result);
			results.push(formatted);
		benchOutput.push({
			name: bench.name,
			hz: result.requests.average,
			stats: {
				mean: result.latency.average,
				variance: 0,
				stddev: 0,
				sem: 0,
				rme: 0,
				sample: [],
			},
			samples: 100,
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

	// Cleanup with graceful shutdown
	const cleanup = () => {
		// Flush any remaining logs before exit
		server.kill();
		setTimeout(() => process.exit(0), 100);
	};

	process.on("SIGINT", cleanup);
	process.on("SIGTERM", cleanup);

	cleanup();
}

main();
