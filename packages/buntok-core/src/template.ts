// ──────────────────────────────────────────────────────────────────────────────
// Buntok Template Engine - Handlebars-like, zero-deps
// ──────────────────────────────────────────────────────────────────────────────

export interface TemplateOptions {
	strict?: boolean;
	escapeHtml?: boolean;
	onMissing?: (path: string, availableKeys: string[]) => void;
}

export interface HelperFn {
	(...args: unknown[]): string;
}

// ─── AST Node Types ───────────────────────────────────────────────────────────

interface TextNode {
	type: "text";
	value: string;
}

interface VariableNode {
	type: "variable";
	path: string;
	escaped: boolean;
}

interface BlockNode {
	type: "block";
	blockType: "if" | "unless" | "each";
	expression: string;
	children: ASTNode[];
	inverse?: ASTNode[];
}

interface PartialNode {
	type: "partial";
	name: string;
}

interface CommentNode {
	type: "comment";
	value: string;
}

type ASTNode = TextNode | VariableNode | BlockNode | PartialNode | CommentNode;

// ─── Tokenizer ────────────────────────────────────────────────────────────────

type TokenType =
	| "TEXT"
	| "VARIABLE"
	| "BLOCK_OPEN"
	| "BLOCK_CLOSE"
	| "PARTIAL"
	| "COMMENT";

interface Token {
	type: TokenType;
	value: string;
	path?: string;
	escaped?: boolean;
}

function tokenize(template: string): Token[] {
	const tokens: Token[] = [];
	let pos = 0;

	while (pos < template.length) {
		const openIndex = template.indexOf("{{", pos);
		if (openIndex === -1) {
			tokens.push({ type: "TEXT", value: template.slice(pos) });
			break;
		}

		if (openIndex > pos) {
			tokens.push({ type: "TEXT", value: template.slice(pos, openIndex) });
		}

		// Look for }}} first (triple braces), then }} (double braces)
		let closeIndex = template.indexOf("}}}", openIndex + 2);
		let closeLen = 3;
		let tagStart = openIndex + 2;
		if (closeIndex === -1) {
			closeIndex = template.indexOf("}}", openIndex + 2);
			closeLen = 2;
		} else {
			// Triple braces: skip the third {
			tagStart = openIndex + 3;
		}
		if (closeIndex === -1) {
			tokens.push({ type: "TEXT", value: template.slice(openIndex) });
			break;
		}

		const tagContent = template.slice(tagStart, closeIndex).trim();
		pos = closeIndex + closeLen;

		// Triple braces = unescaped output
		const isTripleBrace = closeLen === 3;

		// Classify tag
		if (tagContent.startsWith("!")) {
			tokens.push({ type: "COMMENT", value: tagContent.slice(1).trim() });
		} else if (tagContent === "else") {
			tokens.push({ type: "BLOCK_OPEN", value: "else" });
		} else if (tagContent.startsWith("#")) {
			tokens.push({ type: "BLOCK_OPEN", value: tagContent.slice(1).trim() });
		} else if (tagContent.startsWith("/")) {
			tokens.push({ type: "BLOCK_CLOSE", value: tagContent.slice(1).trim() });
		} else if (tagContent.startsWith(">")) {
			tokens.push({ type: "PARTIAL", value: tagContent.slice(1).trim() });
		} else {
			tokens.push({ type: "VARIABLE", value: tagContent, path: tagContent, escaped: !isTripleBrace });
		}
	}

	return tokens;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseBlockType(value: string): { blockType: "if" | "unless" | "each"; expression: string } {
	const spaceIndex = value.indexOf(" ");
	const blockType = (spaceIndex === -1 ? value : value.slice(0, spaceIndex)) as "if" | "unless" | "each";
	const expression = spaceIndex === -1 ? "" : value.slice(spaceIndex + 1).trim();
	return { blockType, expression };
}

function parse(tokens: Token[]): ASTNode[] {
	const nodes: ASTNode[] = [];
	let pos = 0;

	while (pos < tokens.length) {
		const token = tokens[pos];
		if (!token) break;

		if (token.type === "TEXT") {
			nodes.push({ type: "text", value: token.value });
			pos++;
		} else if (token.type === "VARIABLE") {
			nodes.push({
				type: "variable",
				path: token.path || "",
				escaped: token.escaped ?? true,
			});
			pos++;
		} else if (token.type === "BLOCK_OPEN") {
			const { blockType, expression } = parseBlockType(token.value);
			pos++;

			// Handle standalone {{else}} token
			if (blockType === ("else" as string)) {
				// This shouldn't happen at top level, but handle gracefully
				return nodes;
			}

			const children: ASTNode[] = [];
			const inverse: ASTNode[] = [];
			let depth = 1;
			let inElse = false;

			while (pos < tokens.length && depth > 0) {
				const t = tokens[pos];
				if (!t) break;

				if (t.type === "BLOCK_OPEN" && t.value === "else") {
					inElse = true;
					pos++;
				} else if (t.type === "BLOCK_OPEN") {
					const nested = parseBlockType(t.value);
					depth++;
					// Parse nested block properly
					pos++;
					const nestedChildren: ASTNode[] = [];
					const nestedInverse: ASTNode[] = [];
					let nestedDepth = 1;
					let nestedInElse = false;

					while (pos < tokens.length && nestedDepth > 0) {
						const nt = tokens[pos];
						if (!nt) break;
						if (nt.type === "BLOCK_OPEN" && nt.value === "else") {
							nestedInElse = true;
							pos++;
						} else if (nt.type === "BLOCK_OPEN") {
							nestedDepth++;
							nestedChildren.push(...parse([nt]));
							pos++;
						} else if (nt.type === "BLOCK_CLOSE") {
							nestedDepth--;
							if (nestedDepth === 0) {
								pos++;
								break;
							}
							nestedInverse.push({ type: "text", value: `{{/${nt.value}}}` });
							pos++;
						} else {
							if (nestedInElse) nestedInverse.push({ type: "text", value: nt.value });
							else nestedChildren.push({ type: "text", value: nt.value });
							pos++;
						}
					}

					const nestedBlock: BlockNode = {
						type: "block",
						blockType: nested.blockType,
						expression: nested.expression,
						children: nestedChildren,
						inverse: nestedInverse.length > 0 ? nestedInverse : undefined,
					};
					if (inElse) inverse.push(nestedBlock);
					else children.push(nestedBlock);
				} else if (t.type === "BLOCK_CLOSE") {
					depth--;
					if (depth === 0) {
						pos++;
						break;
					}
					inverse.push({ type: "text", value: `{{/${t.value}}}` });
					pos++;
				} else if (t.type === "TEXT") {
					if (inElse) {
						inverse.push({ type: "text", value: t.value });
					} else {
						children.push({ type: "text", value: t.value });
					}
					pos++;
				} else if (t.type === "VARIABLE") {
					const node: VariableNode = {
						type: "variable",
						path: t.path || "",
						escaped: t.escaped ?? true,
					};
					if (inElse) inverse.push(node);
					else children.push(node);
					pos++;
				} else {
					pos++;
				}
			}

			nodes.push({
				type: "block",
				blockType,
				expression,
				children,
				inverse: inverse.length > 0 ? inverse : undefined,
			});
		} else if (token.type === "PARTIAL") {
			nodes.push({ type: "partial", name: token.value });
			pos++;
		} else if (token.type === "COMMENT") {
			pos++;
		} else {
			pos++;
		}
	}

	return nodes;
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

const ESCAPE_MAP: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#x27;",
};

function escapeHtml(str: string): string {
	return str.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] || char);
}

function resolvePath(path: string, context: unknown): unknown {
	const parts = path.split(".");
	let current = context;

	for (const part of parts) {
		if (current == null || typeof current !== "object") {
			return undefined;
		}
		current = (current as Record<string, unknown>)[part];
	}

	return current;
}

function collectKeys(obj: unknown, prefix = ""): string[] {
	const keys: string[] = [];
	if (obj == null || typeof obj !== "object") return keys;

	for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		keys.push(fullKey);
		if (value != null && typeof value === "object" && !Array.isArray(value)) {
			keys.push(...collectKeys(value, fullKey));
		}
	}
	return keys;
}

function levenshteinDistance(a: string, b: string): number {
	const m = a.length;
	const n = b.length;
	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

	for (let i = 0; i <= m; i++) {
		const row = dp[i];
		if (row) row[0] = i;
	}
	for (let j = 0; j <= n; j++) {
		const row = dp[0];
		if (row) row[j] = j;
	}

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			const row = dp[i];
			const prevRow = dp[i - 1];
			if (row && prevRow) {
				row[j] =
					a[i - 1] === b[j - 1]
						? (prevRow[j - 1] ?? 0)
						: Math.min(prevRow[j] ?? 0, row[j - 1] ?? 0, prevRow[j - 1] ?? 0) + 1;
			}
		}
	}

	return dp[m]?.[n] ?? 0;
}

function suggestVariable(path: string, availableKeys: string[]): string | null {
	const basePath = path.split(".")[0] || "";
	let bestMatch: string | null = null;
	let bestDistance = Infinity;

	for (const key of availableKeys) {
		const keyBase = key.split(".")[0] || "";
		const distance = levenshteinDistance(basePath, keyBase);
		if (distance < bestDistance && distance <= 3) {
			bestDistance = distance;
			bestMatch = key;
		}
	}

	return bestMatch;
}

function renderNodes(
	nodes: ASTNode[],
	context: unknown,
	options: TemplateOptions,
	partials: Map<string, ASTNode[]>,
	helpers: Map<string, HelperFn>,
): string {
	const parts: string[] = [];

	for (const node of nodes) {
		switch (node.type) {
			case "text":
				parts.push(node.value);
				break;

			case "variable": {
				// Check if this is a helper call (e.g., "upper name")
				const spaceIdx = node.path.indexOf(" ");
				if (spaceIdx !== -1) {
					const helperName = node.path.slice(0, spaceIdx);
					const argPath = node.path.slice(spaceIdx + 1).trim();
					const helper = helpers.get(helperName);
					if (helper) {
						const argValue = resolvePath(argPath, context);
						parts.push(helper(argValue));
						break;
					}
				}

				const value = resolvePath(node.path, context);

				if (value === undefined || value === null) {
					if (options.strict) {
						const availableKeys = collectKeys(context);
						const suggestion = suggestVariable(node.path, availableKeys);
						let msg = `TemplateError: Variable '${node.path}' not found in context.`;
						if (availableKeys.length > 0) {
							msg += `\n  Available keys: ${availableKeys.slice(0, 10).join(", ")}`;
						}
						if (suggestion) {
							msg += `\n  Did you mean: '${suggestion}'?`;
						}
						throw new Error(msg);
					}
					if (options.onMissing) {
						options.onMissing(node.path, collectKeys(context));
					}
					parts.push("");
				} else if (typeof value === "function") {
					parts.push(String(value));
				} else if (node.escaped) {
					parts.push(escapeHtml(String(value)));
				} else {
					parts.push(String(value));
				}
				break;
			}

			case "block": {
				const value = resolvePath(node.expression, context);

				if (node.blockType === "if") {
					if (value && !(Array.isArray(value) && value.length === 0)) {
						parts.push(renderNodes(node.children, context, options, partials, helpers));
					} else if (node.inverse) {
						parts.push(renderNodes(node.inverse, context, options, partials, helpers));
					}
				} else if (node.blockType === "unless") {
					if (!value || (Array.isArray(value) && value.length === 0)) {
						parts.push(renderNodes(node.children, context, options, partials, helpers));
					} else if (node.inverse) {
						parts.push(renderNodes(node.inverse, context, options, partials, helpers));
					}
				} else if (node.blockType === "each") {
					if (Array.isArray(value)) {
						for (let i = 0; i < value.length; i++) {
							const item = value[i];
							const eachContext =
								typeof item === "object" && item !== null
									? { ...item, "@index": i, "@first": i === 0, "@last": i === value.length - 1, "../": context }
									: { "@value": item, "@index": i, "@first": i === 0, "@last": i === value.length - 1, "../": context };
							parts.push(
								renderNodes(node.children, eachContext, options, partials, helpers),
							);
						}
					} else if (node.inverse) {
						parts.push(renderNodes(node.inverse, context, options, partials, helpers));
					}
				}
				break;
			}

			case "partial": {
				const partialNodes = partials.get(node.name);
				if (partialNodes) {
					parts.push(renderNodes(partialNodes, context, options, partials, helpers));
				} else if (options.strict) {
					throw new Error(
						`TemplateError: Partial '${node.name}' not found. Register it with engine.registerPartial().`,
					);
				}
				break;
			}

			case "comment":
				break;
		}
	}

	return parts.join("");
}

// ─── TemplateEngine Class ─────────────────────────────────────────────────────

export class TemplateEngine {
	private options: TemplateOptions;
	private partials = new Map<string, ASTNode[]>();
	private helpers = new Map<string, HelperFn>();

	constructor(options: TemplateOptions = {}) {
		this.options = {
			strict: true,
			escapeHtml: true,
			...options,
		};
	}

	registerPartial(name: string, template: string): void {
		const tokens = tokenize(template);
		this.partials.set(name, parse(tokens));
	}

	registerHelper(name: string, fn: HelperFn): void {
		this.helpers.set(name, fn);
	}

	render(template: string, context: unknown): string {
		const tokens = tokenize(template);
		const ast = parse(tokens);
		return renderNodes(ast, context, this.options, this.partials, this.helpers);
	}

	compile(template: string): (context: unknown) => string {
		const tokens = tokenize(template);
		const ast = parse(tokens);
		return (context: unknown) =>
			renderNodes(ast, context, this.options, this.partials, this.helpers);
	}
}

// ─── Convenience Functions ────────────────────────────────────────────────────

const defaultEngine = new TemplateEngine();

export function render(template: string, context: unknown): string {
	return defaultEngine.render(template, context);
}

export function registerPartial(name: string, template: string): void {
	defaultEngine.registerPartial(name, template);
}

export function registerHelper(name: string, fn: HelperFn): void {
	defaultEngine.registerHelper(name, fn);
}
