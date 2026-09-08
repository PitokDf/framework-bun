import { describe, it, expect } from "bun:test";
import { delay, retry } from "../../src/helpers/async";

describe("delay", () => {
	it("should resolve after specified time", async () => {
		const start = Date.now();
		await delay(50);
		const elapsed = Date.now() - start;
		expect(elapsed).toBeGreaterThanOrEqual(40); // allow small timer variance
	});
});

describe("retry", () => {
	it("should return result on success", async () => {
		const result = await retry(async () => 42, { retries: 3, delay: 1 });
		expect(result).toBe(42);
	});

	it("should retry on failure and succeed", async () => {
		let attempts = 0;
		const result = await retry(
			async () => {
				attempts++;
				if (attempts < 3) throw new Error("fail");
				return "ok";
			},
			{ retries: 5, delay: 1 },
		);
		expect(result).toBe("ok");
		expect(attempts).toBe(3);
	});

	it("should throw after all retries exhausted", async () => {
		try {
			await retry(async () => {
				throw new Error("always fail");
			}, { retries: 2, delay: 1 });
			expect(true).toBe(false);
		} catch (e) {
			expect((e as Error).message).toBe("always fail");
		}
	});

	it("should use onError to decide if retryable", async () => {
		let attempts = 0;
		try {
			await retry(
				async () => {
					attempts++;
					throw new Error("non-retryable");
				},
				{
					retries: 5,
					delay: 1,
					onError: () => false, // don't retry
				},
			);
			expect(true).toBe(false);
		} catch (e) {
			expect(attempts).toBe(1); // stopped after first attempt
		}
	});

	it("should use fixed backoff", async () => {
		let attempts = 0;
		const start = Date.now();
		await retry(
			async () => {
				attempts++;
				if (attempts < 3) throw new Error("fail");
				return "ok";
			},
			{ retries: 5, delay: 20, backoff: "fixed" },
		);
		const elapsed = Date.now() - start;
		expect(attempts).toBe(3);
		// 2 retries with 20ms each = ~40ms minimum
		expect(elapsed).toBeGreaterThanOrEqual(30);
	});

	it("should use exponential backoff", async () => {
		let attempts = 0;
		const start = Date.now();
		await retry(
			async () => {
				attempts++;
				if (attempts < 3) throw new Error("fail");
				return "ok";
			},
			{ retries: 5, delay: 10, backoff: "exponential" },
		);
		const elapsed = Date.now() - start;
		expect(attempts).toBe(3);
		// exponential: 10ms + 20ms = 30ms minimum
		expect(elapsed).toBeGreaterThanOrEqual(20);
	});
});
