/**
 * Convert a string to a URL-friendly slug.
 * `"Hello World!"` → `"hello-world"`
 */
export function slugify(str: string): string {
	return str
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

/**
 * Truncate a string to a maximum length with an ellipsis suffix.
 * `"Lorem ipsum dolor sit"` → `"Lorem ipsum..."` (max=13)
 */
export function truncate(str: string, max = 100, suffix = "..."): string {
	if (str.length <= max) return str;
	return str.slice(0, max - suffix.length) + suffix;
}

/**
 * Capitalize the first letter of a string.
 * `"hello"` → `"Hello"`
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a string to camelCase.
 * `"hello-world"` → `"helloWorld"`
 * `"hello_world"` → `"helloWorld"`
 */
export function camelCase(str: string): string {
	return str
		.replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
		.replace(/^(.)/, (_, c: string) => c.toLowerCase());
}

/**
 * Convert a string to snake_case.
 * `"helloWorld"` → `"hello_world"`
 * `"hello-world"` → `"hello_world"`
 */
export function snakeCase(str: string): string {
	return str
		.replace(/([A-Z])/g, "_$1")
		.replace(/[-\s]+/g, "_")
		.toLowerCase()
		.replace(/^_/, "")
		.replace(/_+/g, "_");
}

/**
 * Convert a string to kebab-case.
 * `"helloWorld"` → `"hello-world"`
 * `"hello_world"` → `"hello-world"`
 */
export function kebabCase(str: string): string {
	return snakeCase(str).replace(/_/g, "-");
}
