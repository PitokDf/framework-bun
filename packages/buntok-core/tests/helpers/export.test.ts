import { describe, it, expect } from "bun:test";
import { exportCSV, exportJSON } from "../../src/helpers/export";

function createMockContext(): any {
	return {
		json: (data: any, status = 200) =>
			new Response(JSON.stringify(data), { status }),
	};
}

describe("exportCSV", () => {
	it("should export data as CSV", () => {
		const ctx = createMockContext();
		const data = [
			{ name: "Alice", age: 30 },
			{ name: "Bob", age: 25 },
		];

		const result = exportCSV(ctx, data, "users.csv");
		expect(result).toBeInstanceOf(Response);
		expect(result.headers.get("Content-Type")).toContain("text/csv");
		expect(result.headers.get("Content-Disposition")).toContain("users.csv");
	});

	it("should include headers by default", async () => {
		const ctx = createMockContext();
		const data = [{ name: "Alice", age: 30 }];

		const result = exportCSV(ctx, data);
		const text = await result.text();
		expect(text).toContain("name");
		expect(text).toContain("age");
	});

	it("should exclude headers when header:false", async () => {
		const ctx = createMockContext();
		const data = [{ name: "Alice", age: 30 }];

		const result = exportCSV(ctx, data, "test.csv", { header: false });
		const text = await result.text();
		expect(text).not.toContain("name,age");
	});

	it("should use custom delimiter", async () => {
		const ctx = createMockContext();
		const data = [{ name: "Alice", age: 30 }];

		const result = exportCSV(ctx, data, "test.csv", { delimiter: ";" });
		const text = await result.text();
		expect(text).toContain("name;age");
	});

	it("should escape CSV fields", async () => {
		const ctx = createMockContext();
		const data = [{ name: 'John "Doe"', age: 30 }];

		const result = exportCSV(ctx, data);
		const text = await result.text();
		expect(text).toContain('John ""Doe""');
	});

	it("should handle empty data", async () => {
		const ctx = createMockContext();
		const result = exportCSV(ctx, [], "empty.csv");
		expect(result).toBeInstanceOf(Response);
		expect(result.headers.get("Content-Disposition")).toContain("empty.csv");
	});

	it("should handle null/undefined values", async () => {
		const ctx = createMockContext();
		const data = [{ name: "Alice", age: null }];

		const result = exportCSV(ctx, data);
		const text = await result.text();
		expect(text).toContain("Alice,");
	});

	it("should use default filename", () => {
		const ctx = createMockContext();
		const result = exportCSV(ctx, []);
		expect(result.headers.get("Content-Disposition")).toContain("export.csv");
	});
});

describe("exportJSON", () => {
	it("should export data as JSON download", () => {
		const ctx = createMockContext();
		const data = { name: "Alice" };

		const result = exportJSON(ctx, data, "data.json");
		expect(result).toBeInstanceOf(Response);
		expect(result.headers.get("Content-Type")).toContain("application/json");
		expect(result.headers.get("Content-Disposition")).toContain("data.json");
	});

	it("should pretty-print JSON", async () => {
		const ctx = createMockContext();
		const data = { name: "Alice" };

		const result = exportJSON(ctx, data);
		const text = await result.text();
		expect(text).toContain("\n"); // pretty-printed
	});

	it("should use default filename", () => {
		const ctx = createMockContext();
		const result = exportJSON(ctx, {});
		expect(result.headers.get("Content-Disposition")).toContain("export.json");
	});

	it("should handle arrays", async () => {
		const ctx = createMockContext();
		const data = [1, 2, 3];

		const result = exportJSON(ctx, data);
		const body = await result.json();
		expect(body).toEqual([1, 2, 3]);
	});
});
