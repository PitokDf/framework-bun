import { describe, expect, it } from "bun:test";
import {
	TemplateEngine,
	render,
	registerPartial,
	registerHelper,
} from "../src/template";

describe("Template Engine", () => {
	describe("Variable Interpolation", () => {
		it("should render simple variable", () => {
			expect(render("Hello {{ name }}", { name: "Budi" })).toBe("Hello Budi");
		});

		it("should render nested variable", () => {
			const result = render("{{ user.email }}", {
				user: { email: "budi@example.com" },
			});
			expect(result).toBe("budi@example.com");
		});

		it("should render multiple variables", () => {
			const result = render("{{ a }} and {{ b }}", { a: "foo", b: "bar" });
			expect(result).toBe("foo and bar");
		});

		it("should render empty string for undefined variable in lenient mode", () => {
			const engine = new TemplateEngine({ strict: false });
			expect(engine.render("Hello {{ missing }}", {})).toBe("Hello ");
		});

		it("should escape HTML by default", () => {
			const result = render("{{ html }}", { html: '<script>alert("xss")</script>' });
			expect(result).toContain("&lt;script&gt;");
			expect(result).not.toContain("<script>");
		});

		it("should not escape HTML with triple braces", () => {
			const result = render("{{{ html }}}", { html: "<b>bold</b>" });
			expect(result).toBe("<b>bold</b>");
		});
	});

	describe("Conditionals", () => {
		it("should render if block when truthy", () => {
			const result = render("{{#if active}}Yes{{/if}}", { active: true });
			expect(result).toBe("Yes");
		});

		it("should not render if block when falsy", () => {
			const result = render("{{#if active}}Yes{{/if}}", { active: false });
			expect(result).toBe("");
		});

		it("should render else block", () => {
			const result = render("{{#if active}}Yes{{else}}No{{/if}}", { active: false });
			expect(result).toBe("No");
		});

		it("should render unless block when falsy", () => {
			const result = render("{{#unless active}}Inactive{{/unless}}", { active: false });
			expect(result).toBe("Inactive");
		});

		it("should not render unless block when truthy", () => {
			const result = render("{{#unless active}}Inactive{{/unless}}", { active: true });
			expect(result).toBe("");
		});

		it("should treat empty array as falsy", () => {
			const result = render("{{#if items}}Has items{{/if}}", { items: [] });
			expect(result).toBe("");
		});

		it("should treat non-empty array as truthy", () => {
			const result = render("{{#if items}}Has items{{/if}}", { items: [1] });
			expect(result).toBe("Has items");
		});
	});

	describe("Loops", () => {
		it("should render each block", () => {
			const result = render("{{#each items}}{{name}} {{/each}}", {
				items: [{ name: "A" }, { name: "B" }, { name: "C" }],
			});
			expect(result).toBe("A B C ");
		});

		it("should provide @index", () => {
			const result = render("{{#each items}}{{@index}}:{{name}} {{/each}}", {
				items: [{ name: "X" }, { name: "Y" }],
			});
			expect(result).toBe("0:X 1:Y ");
		});

		it("should provide @first", () => {
			const result = render("{{#each items}}{{#if @first}}FIRST{{/if}} {{/each}}", {
				items: ["a", "b", "c"],
			});
			expect(result).toBe("FIRST   ");
		});

		it("should provide @last", () => {
			const result = render("{{#each items}}{{#if @last}}LAST{{/if}} {{/each}}", {
				items: ["a", "b", "c"],
			});
			expect(result).toBe("  LAST ");
		});

		it("should handle empty array", () => {
			const result = render("{{#each items}}item{{/each}}", { items: [] });
			expect(result).toBe("");
		});

		it("should handle non-array gracefully", () => {
			const result = render("{{#each items}}item{{/each}}", { items: "not-array" });
			expect(result).toBe("");
		});
	});

	describe("Partials", () => {
		it("should render partial", () => {
			const engine = new TemplateEngine();
			engine.registerPartial("header", "<h1>{{ title }}</h1>");
			const result = engine.render("{{> header }}", { title: "Welcome" });
			expect(result).toBe("<h1>Welcome</h1>");
		});

		it("should throw on missing partial in strict mode", () => {
			expect(() => render("{{> missing }}", {})).toThrow("Partial 'missing' not found");
		});

		it("should render empty for missing partial in lenient mode", () => {
			const engine = new TemplateEngine({ strict: false });
			expect(engine.render("{{> missing }}", {})).toBe("");
		});
	});

	describe("Helpers", () => {
		it("should call helper function", () => {
			const engine = new TemplateEngine();
			engine.registerHelper("upper", (val: unknown) => String(val).toUpperCase());
			const result = engine.render("{{ upper name }}", { name: "hello" });
			expect(result).toBe("HELLO");
		});
	});

	describe("Comments", () => {
		it("should strip comments", () => {
			const result = render("Hello {{! this is a comment }}World", {});
			expect(result).toBe("Hello World");
		});
	});

	describe("Strict Mode & Missing Variables", () => {
		it("should throw on missing variable in strict mode", () => {
			expect(() => render("Hello {{ usre.name }}", { user: { name: "Budi" } })).toThrow(
				"Variable 'usre.name' not found",
			);
		});

		it("should suggest correct variable name", () => {
			try {
				render("Hello {{ usre.name }}", { user: { name: "Budi" } });
				expect(true).toBe(false); // Should not reach here
			} catch (e: unknown) {
				const err = e as Error;
				expect(err.message).toContain("Did you mean");
				expect(err.message).toContain("user.name");
			}
		});

		it("should list available keys in error", () => {
			try {
				render("{{ wrong }}", { name: "test", email: "test@test.com" });
				expect(true).toBe(false);
			} catch (e: unknown) {
				const err = e as Error;
				expect(err.message).toContain("Available keys");
				expect(err.message).toContain("name");
				expect(err.message).toContain("email");
			}
		});

		it("should call onMissing callback", () => {
			const missing: string[] = [];
			const engine = new TemplateEngine({
				strict: false,
				onMissing: (path) => missing.push(path),
			});
			engine.render("{{ wrong }}", {});
			expect(missing).toContain("wrong");
		});
	});

	describe("Compile", () => {
		it("should compile and reuse template", () => {
			const engine = new TemplateEngine();
			const compiled = engine.compile("Hello {{ name }}!");
			expect(compiled({ name: "A" })).toBe("Hello A!");
			expect(compiled({ name: "B" })).toBe("Hello B!");
		});
	});

	describe("Real Email Template", () => {
		it("should render full invoice template", () => {
			const template = `
				<h1>Invoice #{{ invoice.number }}</h1>
				<p>Hi {{ user.name }},</p>
				{{#if invoice.paid}}
					<span style="color: green;">Paid</span>
				{{else}}
					<span style="color: red;">Unpaid</span>
				{{/if}}
				{{#each invoice.items}}
					<div>{{ name }} - {{ price }}</div>
				{{/each}}
			`;

			const result = render(template, {
				user: { name: "Budi" },
				invoice: {
					number: "INV-001",
					paid: false,
					items: [
						{ name: "Item A", price: 10000 },
						{ name: "Item B", price: 20000 },
					],
				},
			});

			expect(result).toContain("Invoice #INV-001");
			expect(result).toContain("Hi Budi,");
			expect(result).toContain("Unpaid");
			expect(result).toContain("Item A - 10000");
			expect(result).toContain("Item B - 20000");
			expect(result).not.toContain("Paid");
		});
	});
});
