import { NodeType, RouterNode } from "./node";

export interface LookupResult {
	// biome-ignore lint/suspicious/noExplicitAny: generic router handler
	handler: ((...args: any[]) => any) | null;
	params: Record<string, string>;
}

const EMPTY_PARAMS: Record<string, string> = Object.freeze({});

export class Router {
	private root: RouterNode = new RouterNode("/", NodeType.STATIC);
	// biome-ignore lint/suspicious/noExplicitAny: flat cache for static routes
	private staticRoutes: Map<string, Map<string, (...args: any[]) => any>> =
		new Map();

	private static splitPath(path: string): string[] {
		const segments: string[] = [];
		let start = 0;
		if (path[0] === "/") start = 1;
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

	public insert(
		method: string,
		path: string,
		// biome-ignore lint/suspicious/noExplicitAny: generic router handler
		handler: (...args: any[]) => any,
	): void {
		if (path === "") return;

		const upperMethod = method.toUpperCase();
		const segments = Router.splitPath(path);
		const hasParams = segments.some((s) => s[0] === ":" || s[0] === "*");

		// Fast path: store static routes in flat map
		if (!hasParams) {
			let methodMap = this.staticRoutes.get(path);
			if (!methodMap) {
				methodMap = new Map();
				this.staticRoutes.set(path, methodMap);
			}
			methodMap.set(upperMethod, handler);
		}

		// Also insert into trie for param/catchall routes
		let currentNode = this.root;

		if (segments.length === 0) {
			this.root.handlers.set(upperMethod, handler);
			return;
		}

		for (const segment of segments) {
			let nodeType = NodeType.STATIC;
			let paramName: string | null = null;
			let cleanSegment = segment;

			if (segment.startsWith(":")) {
				nodeType = NodeType.PARAM;
				paramName = segment.slice(1);
				cleanSegment = ":";
			} else if (segment.startsWith("*")) {
				nodeType = NodeType.CATCHALL;
				paramName = segment.slice(1);
				cleanSegment = "*";
			} else {
				nodeType = NodeType.STATIC;
				cleanSegment = segment;
			}

			let childNode: RouterNode | undefined;

			if (nodeType === NodeType.STATIC) {
				childNode = currentNode.staticChildren.get(cleanSegment);
			} else if (nodeType === NodeType.PARAM) {
				childNode = currentNode.paramChild ?? undefined;
			} else {
				childNode = currentNode.catchAllChild ?? undefined;
			}

			if (!childNode) {
				childNode = new RouterNode(cleanSegment, nodeType);

				if (nodeType === NodeType.PARAM) {
					childNode.paramName = paramName;
					currentNode.paramChild = childNode;
				} else if (nodeType === NodeType.CATCHALL) {
					childNode.paramName = paramName;
					currentNode.catchAllChild = childNode;
				} else {
					currentNode.staticChildren.set(cleanSegment, childNode);
				}
			}

			currentNode = childNode;

			if (nodeType === NodeType.CATCHALL) break;
		}

		currentNode.handlers.set(upperMethod, handler);
	}

	public find(method: string, path: string): LookupResult {
		// Fast path: try flat static route cache first
		const methodMap = this.staticRoutes.get(path);
		if (methodMap) {
			const handler = methodMap.get(method); // method is already uppercase
			if (handler) {
				return { handler, params: EMPTY_PARAMS };
			}
		}

		// Slow path: trie traversal for param/catchall routes
		const result: LookupResult = { handler: null, params: {} };
		const segments = Router.splitPath(path);

		let currentNode = this.root;

		if (segments.length === 0) {
			result.handler = this.root.handlers.get(method) || null;
			return result;
		}

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i] as string;
			let nextNode: RouterNode | undefined;

			nextNode = currentNode.staticChildren.get(segment);

			if (!nextNode) {
				const paramNode = currentNode.paramChild;
				if (paramNode?.paramName && segment) {
					result.params[paramNode.paramName] = segment;
					nextNode = paramNode;
				}
			}

			if (!nextNode) {
				const catchAllNode = currentNode.catchAllChild;
				if (catchAllNode) {
					result.params["*"] = segments.slice(i).join("/");
					currentNode = catchAllNode;
					break;
				}
			}

			if (!nextNode) {
				return result;
			}

			currentNode = nextNode;
		}

		result.handler = currentNode.handlers.get(method) || null;
		return result;
	}
}
