import { randomUUID } from "node:crypto";
import type { App, Middleware } from "./app";
import type { Context } from "./context";

export interface DevToolsRequestEntry {
	id: string;
	method: string;
	url: string;
	path: string;
	status: number;
	durationMs: number;
	timestamp: number;
	requestHeaders: Record<string, string>;
	responseHeaders: Record<string, string>;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	requestBody?: any;
	responseBody?: string;
	error?: string;
	errorStack?: string;
}

export interface DevToolsLogEntry {
	type: "log" | "error" | "warn" | "info";
	message: string;
	timestamp: number;
}

// In-memory store (max 500 entries to prevent memory leaks)
const MAX_ENTRIES = 500;
const requestsStore: DevToolsRequestEntry[] = [];
const consoleStore: DevToolsLogEntry[] = [];

/**
 * Push a new entry to the store and maintain the maximum length.
 * Older entries are dropped when the limit is reached.
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function pushEntry(entry: DevToolsRequestEntry, app?: App<any>) {
	requestsStore.unshift(entry); // Add to the beginning (newest first)
	if (requestsStore.length > MAX_ENTRIES) {
		requestsStore.pop();
	}
	// Publish to any listening WebSocket clients
	if (app && app.server) {
		app.server.publish("buntok-devtools", JSON.stringify(entry));
	}
}

/**
 * The tracker middleware that intercepts and logs HTTP requests.
 */
function createTrackerMiddleware<DI extends Record<string, unknown>>(
	app: App<DI>,
): Middleware<DI> {
	return async (
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		ctx: Context<DI, any>,
		next: () => Promise<Response> | Response,
	) => {
		// Do not track DevTools' own requests!
		const url = new URL(ctx.request.url);
		if (url.pathname.startsWith("/__buntok")) {
			return next();
		}

		const start = performance.now();
		const id = randomUUID();
		const timestamp = Date.now();

		const reqHeaders: Record<string, string> = {};
		ctx.request.headers.forEach((val, key) => {
			reqHeaders[key] = val;
		});

		let res: Response | undefined;
		let caughtError: Error | undefined;

		try {
			res = await next();
		} catch (err) {
			caughtError = err instanceof Error ? err : new Error(String(err));
			throw caughtError; // Rethrow to let App.onError handle it
		} finally {
			const durationMs = Math.round((performance.now() - start) * 100) / 100;

			// If it threw an error, status is typically 500, else we use the actual response status
			const status = caughtError ? 500 : res?.status || 200;

			const resHeaders: Record<string, string> = {};
			let resBodyText: string | undefined;

			if (res) {
				res.headers.forEach((val, key) => {
					resHeaders[key] = val;
				});

				// Extract response body if it's JSON
				try {
					if (res.headers.get("content-type")?.includes("application/json")) {
						resBodyText = await res.clone().text();
					}
				} catch (e) {
					// Ignore clone errors
				}
			}

			// Extract request body (parsed by zValidator or ctx.body())
			// biome-ignore lint/suspicious/noExplicitAny: internal context inspection
			const reqBody = (ctx as any)._validated?.body || (ctx as any)._body;

			pushEntry(
				{
					id,
					method: ctx.request.method,
					url: ctx.request.url,
					path: url.pathname,
					status,
					durationMs,
					timestamp,
					requestHeaders: reqHeaders,
					responseHeaders: resHeaders,
					requestBody: reqBody,
					responseBody: resBodyText,
					error: caughtError?.message,
					errorStack: caughtError?.stack,
				},
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				app as App<any>,
			);
		}

		return res;
	};
}

/**
 * Enable Buntok DevTools on the application instance.
 * Safe to call in production (it will auto-disable itself unless forced).
 */
export function enableDevTools<DI extends Record<string, unknown>>(
	app: App<DI>,
	options?: { force?: boolean },
) {
	const isDev = process.env.NODE_ENV !== "production";
	const shouldRun = options?.force || isDev;

	if (!shouldRun) {
		return;
	}

	// Monkey-patch console to capture logs
	const originalLog = console.log;
	const originalError = console.error;
	const originalWarn = console.warn;
	const originalInfo = console.info;

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const pushLog = (type: "log" | "error" | "warn" | "info", args: any[]) => {
		const msg = args
			.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
			.join(" ");
		const entry: DevToolsLogEntry = {
			type,
			message: msg,
			timestamp: Date.now(),
		};
		consoleStore.unshift(entry);
		if (consoleStore.length > MAX_ENTRIES) consoleStore.pop();
		if (app.server) {
			app.server.publish(
				"buntok-devtools",
				JSON.stringify({ type: "console", data: entry }),
			);
		}
	};

	console.log = (...args) => {
		pushLog("log", args);
		originalLog.apply(console, args);
	};
	console.error = (...args) => {
		pushLog("error", args);
		originalError.apply(console, args);
	};
	console.warn = (...args) => {
		pushLog("warn", args);
		originalWarn.apply(console, args);
	};
	console.info = (...args) => {
		pushLog("info", args);
		originalInfo.apply(console, args);
	};

	// 1. Inject the tracker middleware globally
	app.use(createTrackerMiddleware<DI>(app));

	// 2. Register internal API routes for the Dashboard UI
	const devToolsGroup = app.group("/__buntok/api");

	// 3. WebSocket for realtime logs
	app.ws("/__buntok/api/ws", {
		open(ws) {
			ws.subscribe("buntok-devtools");
		},
	});

	// Get recent requests
	devToolsGroup.get("/requests", (ctx) => {
		return ctx.json({
			success: true,
			data: requestsStore,
		});
	});

	// Get registered routes (API Map)
	devToolsGroup.get("/routes", (ctx) => {
		return ctx.success(app.openApiDocs);
	});

	// Get console logs
	devToolsGroup.get("/logs", (ctx) => {
		return ctx.success(consoleStore);
	});

	// Get specific request details
	devToolsGroup.get("/requests/:id", (ctx) => {
		const entry = requestsStore.find((req) => req.id === ctx.params.id);
		if (!entry) {
			return ctx.error("Request not found", 404);
		}
		return ctx.success(entry);
	});

	// Clear logs
	devToolsGroup.post("/requests/clear", (ctx) => {
		requestsStore.length = 0;
		return ctx.success(null, "DevTools logs cleared");
	});

	// Serve the static DevTools UI
	app.get("/__buntok", (ctx) => {
		const htmlPath = require("path").join(
			__dirname,
			"..",
			"devtools-ui",
			"dist",
			"index.html",
		);
		const file = Bun.file(htmlPath);
		if (!file.size)
			return new Response("DevTools UI not built yet.", { status: 404 });
		return new Response(file, { headers: { "Content-Type": "text/html" } });
	});

	app.get("/__buntok/assets/*", (ctx) => {
		const assetPath = require("path").join(
			__dirname,
			"..",
			"devtools-ui",
			"dist",
			"assets",
			ctx.params["*"],
		);
		const file = Bun.file(assetPath);

		// Map content types manually since we don't have a static middleware loaded here
		const ext = assetPath.split(".").pop();
		const type =
			ext === "css"
				? "text/css"
				: ext === "js"
					? "application/javascript"
					: "text/plain";

		return new Response(file, { headers: { "Content-Type": type } });
	});

	console.log(
		`\x1b[36m[Buntok DevTools]\x1b[0m Tracker injected. Dashboard UI available at \x1b[90mhttp://localhost:<port>/__buntok\x1b[0m`,
	);
}
