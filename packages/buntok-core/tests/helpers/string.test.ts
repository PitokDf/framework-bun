import { describe, it, expect } from "bun:test";
import {
	slugify,
	truncate,
	capitalize,
	camelCase,
	snakeCase,
	kebabCase,
} from "../../src/helpers/string";

describe("slugify", () => {
	it("should convert simple string", () => {
		expect(slugify("Hello World")).toBe("hello-world");
	});

	it("should remove special characters", () => {
		expect(slugify("Hello! @World#")).toBe("hello-world");
	});

	it("should handle multiple spaces", () => {
		expect(slugify("Hello   World")).toBe("hello-world");
	});

	it("should trim leading/trailing dashes", () => {
		expect(slugify("  Hello World  ")).toBe("hello-world");
	});

	it("should handle empty string", () => {
		expect(slugify("")).toBe("");
	});

	it("should handle underscores as spaces", () => {
		expect(slugify("hello_world")).toBe("hello-world");
	});
});

describe("truncate", () => {
	it("should not truncate short strings", () => {
		expect(truncate("Hi", 10)).toBe("Hi");
	});

	it("should truncate long strings with ellipsis", () => {
		expect(truncate("Lorem ipsum dolor sit", 13)).toBe("Lorem ipsu...");
	});

	it("should use custom suffix", () => {
		expect(truncate("Hello World", 8, "...")).toBe("Hello...");
	});

	it("should handle exact length", () => {
		expect(truncate("Hello", 5)).toBe("Hello");
	});
});

describe("capitalize", () => {
	it("should capitalize first letter", () => {
		expect(capitalize("hello")).toBe("Hello");
	});

	it("should handle already capitalized", () => {
		expect(capitalize("Hello")).toBe("Hello");
	});

	it("should handle single character", () => {
		expect(capitalize("a")).toBe("A");
	});

	it("should handle empty string", () => {
		expect(capitalize("")).toBe("");
	});
});

describe("camelCase", () => {
	it("should convert kebab-case", () => {
		expect(camelCase("hello-world")).toBe("helloWorld");
	});

	it("should convert snake_case", () => {
		expect(camelCase("hello_world")).toBe("helloWorld");
	});

	it("should convert space-separated", () => {
		expect(camelCase("hello world")).toBe("helloWorld");
	});

	it("should handle single word", () => {
		expect(camelCase("hello")).toBe("hello");
	});

	it("should handle multiple words", () => {
		expect(camelCase("one two three four")).toBe("oneTwoThreeFour");
	});
});

describe("snakeCase", () => {
	it("should convert camelCase", () => {
		expect(snakeCase("helloWorld")).toBe("hello_world");
	});

	it("should convert kebab-case", () => {
		expect(snakeCase("hello-world")).toBe("hello_world");
	});

	it("should handle single word", () => {
		expect(snakeCase("hello")).toBe("hello");
	});

	it("should handle multiple capitals", () => {
		expect(snakeCase("helloBeautifulWorld")).toBe("hello_beautiful_world");
	});
});

describe("kebabCase", () => {
	it("should convert camelCase", () => {
		expect(kebabCase("helloWorld")).toBe("hello-world");
	});

	it("should convert snake_case", () => {
		expect(kebabCase("hello_world")).toBe("hello-world");
	});

	it("should handle single word", () => {
		expect(kebabCase("hello")).toBe("hello");
	});
});
