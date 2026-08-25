// ─── JS Fallback: Route Trie ──────────────────────────────────────────────────

type NodeType = "static" | "param" | "catchall";

interface TrieNode {
	children: Map<string, TrieNode>;
	paramChild: TrieNode | null;
	catchAllChild: TrieNode | null;
	handlerId: number;
	paramName: string | null;
	nodeType: NodeType;
}

function createNode(nodeType: NodeType = "static"): TrieNode {
	return {
		children: new Map(),
		paramChild: null,
		catchAllChild: null,
		handlerId: -1,
		paramName: null,
		nodeType,
	};
}

function splitPath(path: string): string[] {
	const segments: string[] = [];
	let start = path[0] === "/" ? 1 : 0;
	for (let i = start; i < path.length; i++) {
		if (path[i] === "/") {
			if (i > start) {
				segments.push(path.substring(start, i));
			}
			start = i + 1;
		}
	}
	if (start < path.length) {
		segments.push(path.substring(start));
	}
	return segments;
}

// ─── JS Fallback: Trie Implementation ────────────────────────────────────────

export class JSTrie {
	private root: TrieNode;
	private nodeCount: number = 0;

	constructor() {
		this.root = createNode();
	}

	insert(path: string, handlerId: number): void {
		const segments = splitPath(path);
		let current = this.root;

		for (const segment of segments) {
			if (segment.length === 0) continue;

			let nodeType: NodeType = "static";
			let cleanSegment = segment;
			let paramName: string | null = null;

			if (segment[0] === ":") {
				nodeType = "param";
				paramName = segment.slice(1);
				cleanSegment = ":";
			} else if (segment[0] === "*") {
				nodeType = "catchall";
				paramName = segment.slice(1);
				cleanSegment = "*";
			}

			let nextNode: TrieNode | null = null;

			if (nodeType === "static") {
				nextNode = current.children.get(cleanSegment) ?? null;
			} else if (nodeType === "param") {
				nextNode = current.paramChild;
			} else {
				nextNode = current.catchAllChild;
			}

			if (!nextNode) {
				nextNode = createNode(nodeType);
				nextNode.paramName = paramName;

				if (nodeType === "static") {
					current.children.set(cleanSegment, nextNode);
				} else if (nodeType === "param") {
					current.paramChild = nextNode;
				} else {
					current.catchAllChild = nextNode;
				}
				this.nodeCount++;
			}

			current = nextNode;

			if (nodeType === "catchall") break;
		}

		current.handlerId = handlerId;
	}

	find(path: string): { handlerId: number; params: Record<string, string> } {
		let current = this.root;
		const params: Record<string, string> = {};
		let start = path[0] === "/" ? 1 : 0;

		if (start >= path.length) {
			return { handlerId: current.handlerId, params };
		}

		while (start < path.length) {
			let end = path.indexOf("/", start);
			if (end === -1) end = path.length;

			if (end > start) {
				const segment = path.substring(start, end);
				let nextNode = current.children.get(segment);

				if (!nextNode) {
					if (current.paramChild) {
						nextNode = current.paramChild;
						if (nextNode.paramName) {
							params[nextNode.paramName] = segment;
						}
					} else if (current.catchAllChild) {
						nextNode = current.catchAllChild;
						params["*"] = path.substring(start);
						current = nextNode;
						break;
					} else {
						return { handlerId: -1, params };
					}
				}
				current = nextNode;
			}
			start = end + 1;
		}

		return { handlerId: current.handlerId, params };
	}

	getNodeCount(): number {
		return this.nodeCount;
	}
}

// ─── JS Fallback: JSON Escape ────────────────────────────────────────────────

export function jsEscapeString(str: string): string {
	return JSON.stringify(str);
}

// ─── JS Fallback: Query Parser ───────────────────────────────────────────────

export function jsParseQuery(query: string): Record<string, string> {
	if (!query) return {};

	const params: Record<string, string> = {};
	const pairs = query.split("&");

	for (const pair of pairs) {
		if (!pair) continue;
		const eqIdx = pair.indexOf("=");
		let key: string;
		let value: string;

		if (eqIdx === -1) {
			key = pair;
			value = "";
		} else {
			key = pair.substring(0, eqIdx);
			value = pair.substring(eqIdx + 1);
		}

		params[decodeURIComponent(key)] = decodeURIComponent(value);
	}

	return params;
}

// ─── JS Fallback: Cookie Parser ──────────────────────────────────────────────

export function jsParseCookies(cookieHeader: string): Record<string, string> {
	if (!cookieHeader) return {};

	const cookies: Record<string, string> = {};
	const pairs = cookieHeader.split(";");

	for (const pair of pairs) {
		const trimmed = pair.trim();
		if (!trimmed) continue;

		const eqIdx = trimmed.indexOf("=");
		let name: string;
		let value: string;

		if (eqIdx === -1) {
			name = trimmed;
			value = "";
		} else {
			name = trimmed.substring(0, eqIdx);
			value = trimmed.substring(eqIdx + 1);
		}

		cookies[name] = value;
	}

	return cookies;
}
