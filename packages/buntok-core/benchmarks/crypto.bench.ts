import { bench, run } from "mitata";
import {
	fastHash,
	sha256Hex,
	sha512Hex,
	md5Hex,
} from "../src/helpers/crypto";

// ──── Hashing benchmarks ────
const testData = "Hello, World! This is a test string for hashing benchmarks.";
const testDataObj = {
	userId: 123,
	action: "view",
	endpoint: "/api/users",
	params: { id: 42, page: 1 },
	timestamp: Date.now(),
};

bench("fastHash - string (Bun.hash)", () => {
	fastHash(testData);
});

bench("fastHash - object (Bun.hash)", () => {
	fastHash(testDataObj);
});

bench("sha256Hex - string", async () => {
	await sha256Hex(testData);
});

bench("sha512Hex - string", async () => {
	await sha512Hex(testData);
});

bench("md5Hex - string", async () => {
	await md5Hex(testData);
});

// ──── Different data sizes ────
const smallData = "test";
const mediumData = "a".repeat(1000);
const largeData = "b".repeat(100000);

bench("fastHash - small (4 bytes)", () => {
	fastHash(smallData);
});

bench("fastHash - medium (1KB)", () => {
	fastHash(mediumData);
});

bench("fastHash - large (100KB)", () => {
	fastHash(largeData);
});

bench("sha256Hex - small (4 bytes)", async () => {
	await sha256Hex(smallData);
});

bench("sha256Hex - medium (1KB)", async () => {
	await sha256Hex(mediumData);
});

bench("sha256Hex - large (100KB)", async () => {
	await sha256Hex(largeData);
});

// ──── Comparison: Bun.hash vs crypto ────
bench("Bun.hash (non-crypto) - 1KB", () => {
	Bun.hash(mediumData);
});

bench("crypto.subtle SHA-256 - 1KB", async () => {
	const encoder = new TextEncoder();
	const data = encoder.encode(mediumData);
	await crypto.subtle.digest("SHA-256", data);
});

run();
