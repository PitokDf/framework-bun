import { describe, expect, it } from "bun:test";
import { MemoryQueueDriver, Queue } from "../src/queue";

describe("Queue lifecycle", () => {
	it("waits for an active memory job during drain", async () => {
		const queue = new Queue("jobs", new MemoryQueueDriver("jobs"));
		let release!: () => void;
		const started = new Promise<void>((resolve) => {
			queue.process(async () => {
				resolve();
				await new Promise<void>((done) => { release = done; });
			});
		});

		await queue.add({ id: 1 });
		await started;
		let drained = false;
		const draining = queue.drain({ timeout: 100 }).then(() => { drained = true; });
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(drained).toBe(false);
		release();
		await draining;
		expect(drained).toBe(true);
		await queue.close();
	});

	it("rejects new jobs after close", async () => {
		const queue = new Queue("jobs");
		await queue.close();
		await expect(queue.add({ id: 1 })).rejects.toThrow("Queue jobs is closed");
		await queue.close();
	});

	it("reports truthful memory capabilities and size", async () => {
		const queue = new Queue("jobs");
		await queue.add({ id: 1 }, { delay: 1000 });
		expect(queue.size()).toBe(1);
		expect(queue.capabilities.durability).toBe("process-local");
		expect(queue.capabilities.crashRecovery).toBe(false);
		await queue.close();
	});

	it("pauses and resumes memory processing", async () => {
		const queue = new Queue("jobs");
		let processed = 0;
		queue.pause();
		queue.process(() => { processed++; });
		await queue.add({ id: 1 });
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(processed).toBe(0);
		queue.resume();
		await queue.drain();
		expect(processed).toBe(1);
		await queue.close();
	});
});