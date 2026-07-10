export enum NodeType {
	STATIC = 0,
	PARAM = 1,
	CATCHALL = 2,
}

export interface RouteHandler {
	method: string;
	// biome-ignore lint/suspicious/noExplicitAny: generic router handler
	handler: (...args: any[]) => any;
}

export class RouterNode {
	path: string = "";
	type: NodeType = NodeType.STATIC;
	staticChildren: Map<string, RouterNode> = new Map();
	paramChild: RouterNode | null = null;
	catchAllChild: RouterNode | null = null;
	// biome-ignore lint/suspicious/noExplicitAny: generic router handler
	handlers: Map<string, (...args: any[]) => any> = new Map();
	paramName: string | null = null;

	constructor(path: string = "", type: NodeType = NodeType.STATIC) {
		this.path = path;
		this.type = type;
	}
}
