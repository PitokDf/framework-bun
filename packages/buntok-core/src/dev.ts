export interface DevServerConfig {
	/** Port to listen on (default: 3000) */
	port?: number;
	/** Hostname to bind to (default: "localhost") */
	hostname?: string;
	/** HTML file or routes map */
	routes?: Record<string, unknown>;
	/** Enable HMR (default: true) */
	hmr?: boolean;
	/** Echo browser console to terminal (default: true) */
	console?: boolean;
	/** Called when server is ready */
	onReady?: (info: { port: number; hostname: string }) => void;
	/** Additional Bun.serve options */
	[key: string]: unknown;
}

/**
 * Start a Bun development server with HMR enabled.
 *
 * Wraps `Bun.serve()` with `development: true` for hot module replacement,
 * source maps, and automatic re-bundling.
 *
 * @example
 * ```ts
 * import { devServer } from "@buntok/core/dev";
 * import homepage from "./index.html";
 *
 * devServer({
 *   port: 3000,
 *   routes: { "/": homepage },
 *   onReady: (info) => console.log(`Dev server: http://localhost:${info.port}`),
 * });
 * ```
 */
export function devServer(config: DevServerConfig = {}) {
	const {
		port = 3000,
		hostname = "localhost",
		routes,
		hmr = true,
		console: echoConsole = true,
		onReady,
		fetch,
		...rest
	} = config;

	const server = (globalThis as any).Bun.serve({
		port,
		hostname,
		development: {
			hmr,
			console: echoConsole,
		},
		routes,
		fetch: fetch ?? (() => new Response("Not Found", { status: 404 })),
		...rest,
	});

	onReady?.({ port: server.port, hostname: server.hostname });
	return server;
}
