import { describe, it, expect } from "bun:test";
import {
	pick,
	omit,
	groupBy,
	uniq,
	flatten,
	chunk,
	deepMerge,
	flattenObject,
} from "../../src/helpers/object";

describe("pick", () => {
	it("should pick specified keys", () => {
		expect(pick({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ a: 1, c: 3 });
	});

	it("should ignore missing keys", () => {
		expect(pick({ a: 1 }, ["a", "b"] as any)).toEqual({ a: 1 });
	});

	it("should return empty object for empty keys", () => {
		expect(pick({ a: 1 }, [])).toEqual({});
	});
});

describe("omit", () => {
	it("should omit specified keys", () => {
		expect(omit({ a: 1, b: 2, c: 3 }, ["b"])).toEqual({ a: 1, c: 3 });
	});

	it("should handle omitting non-existent key", () => {
		expect(omit({ a: 1 }, ["b"] as any)).toEqual({ a: 1 });
	});

	it("should return full object for empty keys", () => {
		expect(omit({ a: 1, b: 2 }, [])).toEqual({ a: 1, b: 2 });
	});
});

describe("groupBy", () => {
	it("should group by key", () => {
		const items = [
			{ type: "a", val: 1 },
			{ type: "b", val: 2 },
			{ type: "a", val: 3 },
		];
		const result = groupBy(items, "type");
		expect(result.a).toHaveLength(2);
		expect(result.b).toHaveLength(1);
	});

	it("should group by function", () => {
		const items = [1, 2, 3, 4, 5];
		const result = groupBy(items, (n) => (n % 2 === 0 ? "even" : "odd"));
		expect(result.even).toEqual([2, 4]);
		expect(result.odd).toEqual([1, 3, 5]);
	});
});

describe("uniq", () => {
	it("should remove duplicates", () => {
		expect(uniq([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
	});

	it("should handle empty array", () => {
		expect(uniq([])).toEqual([]);
	});

	it("should handle strings", () => {
		expect(uniq(["a", "b", "a"])).toEqual(["a", "b"]);
	});
});

describe("flatten", () => {
	it("should flatten nested arrays", () => {
		expect(flatten([1, [2, [3, [4, 5]]]])).toEqual([1, 2, 3, 4, 5]);
	});

	it("should handle flat array", () => {
		expect(flatten([1, 2, 3])).toEqual([1, 2, 3]);
	});
});

describe("chunk", () => {
	it("should split into chunks", () => {
		expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
	});

	it("should handle exact division", () => {
		expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
	});

	it("should throw for size <= 0", () => {
		expect(() => chunk([1, 2], 0)).toThrow("chunk size must be > 0");
	});
});

describe("deepMerge", () => {
	it("should merge flat objects", () => {
		expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
	});

	it("should merge nested objects", () => {
		const result = deepMerge(
			{ a: 1, b: { c: 2 } },
			{ b: { d: 3 } },
		);
		expect(result).toEqual({ a: 1, b: { c: 2, d: 3 } });
	});

	it("should replace arrays (not merge)", () => {
		const result = deepMerge(
			{ a: [1, 2] },
			{ a: [3, 4] },
		);
		expect(result.a).toEqual([3, 4]);
	});

	it("should handle multiple sources", () => {
		const result = deepMerge({ a: 1 }, { b: 2 }, { c: 3 });
		expect(result).toEqual({ a: 1, b: 2, c: 3 });
	});
});

describe("flattenObject", () => {
	it("should flatten nested object", () => {
		expect(flattenObject({ a: { b: { c: 1 } } })).toEqual({
			"a.b.c": 1,
		});
	});

	it("should keep flat keys as-is", () => {
		expect(flattenObject({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
	});

	it("should use custom separator", () => {
		expect(flattenObject({ a: { b: 1 } }, "-")).toEqual({ "a-b": 1 });
	});
});
