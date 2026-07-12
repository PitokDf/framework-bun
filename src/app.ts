import { join, sep } from "node:path";
import type { Server, ServerWebSocket } from "bun";
import { Context } from "./context";
import { getControllerMeta } from "./decorators";
import { logger } from "./logger";
import { Router } from "./router";

export interface WSData<DI = Record<string, unknown>> {
	ctx: Context<DI>;
	handler: WSHandler<DI>;
}

export interface WSHandler<DI = Record<string, unknown>> {
	open?: (ws: ServerWebSocket<WSData<DI>>) => void;
	message?: (ws: ServerWebSocket<WSData<DI>>, message: string | Buffer) => void;
	close?: (
		ws: ServerWebSocket<WSData<DI>>,
		code: number,
		reason: string,
	) => void;
	drain?: (ws: ServerWebSocket<WSData<DI>>) => void;
}

export type ExtractParams<Path extends string> =
	Path extends `${infer _Start}:${infer Param}/${infer Rest}`
		? { [K in Param]: string } & ExtractParams<`/${Rest}`>
		: Path extends `${infer _Start}:${infer Param}`
			? { [K in Param]: string }
			: Path extends `${infer _Start}*${infer Catchall}`
				? { [K in Catchall]: string } & { "*": string }
				: Record<string, never>;

export type RouteContext<
	Path extends string = string,
	BodyType = unknown,
	DI = Record<string, unknown>
> = Omit<Context<DI, ExtractParams<Path>>, "body" | "valid"> & {
	body(): Promise<BodyType>;
	valid(target: "body"): BodyType;
	valid<T>(target: "query" | "params"): T;
};

export type Handler<
	DI = Record<string, unknown>,
	Path extends string = string,
> = (ctx: Context<DI, ExtractParams<Path>>) => Response | Promise<Response>;
export type Middleware<
	DI = Record<string, unknown>,
	Path extends string = string,
> = (
	ctx: Context<DI, ExtractParams<Path>>,
	next: () => Promise<Response> | Response,
) => Response | Promise<Response>;
export type ErrorHandler<DI = Record<string, unknown>> = (
	err: Error,
	// biome-ignore lint/suspicious/noExplicitAny: generic
	ctx: Context<DI, any>,
) => Response | Promise<Response>;
export type NotFoundHandler<DI = Record<string, unknown>> = (
	// biome-ignore lint/suspicious/noExplicitAny: generic
	ctx: Context<DI, any>,
) => Response | Promise<Response>;

export class App<DI extends Record<string, unknown> = Record<string, unknown>> {
	private router: Router;
	private middlewares: Middleware<DI>[] = [];
	private compiledGlobalPipeline?: (
		ctx: Context<DI>,
		finalHandler: Handler<DI>,
	) => Response | Promise<Response>;
	private iconPath: string = "./public/favicon.ico";
	private isListening: boolean = false;
	public di = {} as DI;
	private wsRoutes: Map<string, WSHandler<DI>> = new Map();
	private poweredByHeaderEnabled: boolean = true;
	// biome-ignore lint/suspicious/noExplicitAny: Required for internal OpenAPI registry
	public openApiDocs: any[] = [];

	/**
	 * The underlying Bun Server instance. Only available after app.listen() is called.
	 * Can be used for server.publish() to broadcast WebSocket messages.
	 */
	public server?: Server<WSData<DI>>;

	private customErrorHandler: ErrorHandler<DI> = (err, ctx) => {
		logger.error("Unhandled Exception", {
			error: err.message,
			stack: err.stack,
		});
		return ctx.json(
			{
				success: false,
				error: "Internal Server Error",
				message:
					process.env.NODE_ENV === "production"
						? "Terjadi kesalahan pada server"
						: err.message,
			},
			500,
		);
	};

	private customNotFoundHandler: NotFoundHandler<DI> = (ctx) => {
		return ctx.json(
			{
				success: false,
				error: "Not Found",
				path: new URL(ctx.request.url).pathname,
			},
			404,
		);
	};

	constructor() {
		this.router = new Router();
		this.registerFaviconRoute();
		setTimeout(() => {
			if (!this.isListening) this.listen();
		}, 0);
	}

	public use(middleware: Middleware<DI>): this {
		this.middlewares.push(middleware);
		return this;
	}

	public set<K extends keyof DI>(key: K, value: DI[K]): this {
		this.di[key] = value;
		return this;
	}

	public group(prefix: string): RouterGroup<DI> {
		return new RouterGroup<DI>(prefix, this);
	}

	/**
	 * Register a WebSocket endpoint at an exact path (no params/wildcards).
	 * Backed directly by Bun's native WebSocket server — no polyfill or
	 * extra abstraction layer between your handler and `Bun.serve`.
	 *
	 * ```ts
	 * app.ws("/chat", {
	 *   open: (ws) => ws.subscribe("room"),
	 *   message: (ws, msg) => ws.publish("room", msg),
	 * });
	 * ```
	 */
	public ws(path: string, handler: WSHandler<DI>): this {
		this.wsRoutes.set(path, handler);
		return this;
	}

	/**
	 * Register all `@Get`/`@Post`/etc. routes declared on a `@Controller`
	 * class. This is sugar over `registerRoute()` — it instantiates the
	 * class once (at boot time, not per request) and wires each decorated
	 * method up exactly like a manual `app.get(path, handler)` call would.
	 *
	 * ```ts
	 * app.registerController(UserController);
	 * ```
	 */
	public registerController<T extends object>(
		ControllerClass: new () => T,
	): this {
		const meta = getControllerMeta(ControllerClass);
		if (!meta) {
			throw new Error(
				`${ControllerClass.name} is not decorated with @Controller — did you forget to add it?`,
			);
		}

		const instance = new ControllerClass();
		const normalizedPrefix = meta.prefix.endsWith("/")
			? meta.prefix.slice(0, -1)
			: meta.prefix;

		for (const route of meta.routes) {
			const cleanPath = route.path === "/" ? "" : route.path;
			const fullPath = `${normalizedPrefix}${cleanPath}` || "/";
			// biome-ignore lint/suspicious/noExplicitAny: dynamic method dispatch by decorated property key
			const handler = (instance as any)[route.propertyKey].bind(
				instance,
			) as Handler<DI>;

			this.registerRoute(route.method, fullPath, [
				...(route.middlewares as Middleware<DI>[]),
				handler,
			]);
		}

		return this;
	}

	public onError(handler: ErrorHandler<DI>): this {
		this.customErrorHandler = handler;
		return this;
	}

	public notFound(handler: NotFoundHandler<DI>): this {
		this.customNotFoundHandler = handler;
		return this;
	}

	/**
	 * Disable a built-in feature. Currently only `"x-powered-by"` is
	 * supported, which turns off the `X-Powered-By: buntok` response header.
	 * The header's value itself is not configurable — this only controls
	 * whether it's sent.
	 */
	public disable(feature: "x-powered-by"): this {
		if (feature === "x-powered-by") {
			this.poweredByHeaderEnabled = false;
		}
		return this;
	}

	/**
	 * Re-enable a feature previously turned off with `disable()`.
	 */
	public enable(feature: "x-powered-by"): this {
		if (feature === "x-powered-by") {
			this.poweredByHeaderEnabled = true;
		}
		return this;
	}

	public icon(path: string): this {
		this.iconPath = path;
		return this;
	}

	private registerFaviconRoute(): void {
		this.get("/favicon.ico", (_ctx) => {
			const file = Bun.file(this.iconPath);
			if (file) {
				return new Response(file);
			}
			return new Response(Bun.file(this.getBuiltInIconPath()));
		});
	}

	private getBuiltInIconPath(): string {
		return join(__dirname, "..", "public", "favicon.ico");
	}

	public get<Path extends string>(path: Path, handler: Handler<DI, Path>): this;
	public get<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public get<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public get<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.registerRoute("GET", path, handlers);
		return this;
	}

	public post<Path extends string>(
		path: Path,
		handler: Handler<DI, Path>,
	): this;
	public post<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public post<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public post<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.registerRoute("POST", path, handlers);
		return this;
	}

	public put<Path extends string>(path: Path, handler: Handler<DI, Path>): this;
	public put<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public put<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public put<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.registerRoute("PUT", path, handlers);
		return this;
	}

	public delete<Path extends string>(
		path: Path,
		handler: Handler<DI, Path>,
	): this;
	public delete<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public delete<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public delete<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.registerRoute("DELETE", path, handlers);
		return this;
	}

	public options<Path extends string>(
		path: Path,
		handler: Handler<DI, Path>,
	): this;
	public options<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public options<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public options<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.registerRoute("OPTIONS", path, handlers);
		return this;
	}

	public query(path: string, handler: Handler<DI>): this;
	public query(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		m5: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.registerRoute("QUERY", path, handlers);
		return this;
	}

	/**
	 * Serve static files from `directory` under `routePath`.
	 *
	 * Rejects any request whose resolved path escapes `directory` (e.g.
	 * `/files/../../etc/passwd`) — without this check, static serving is a
	 * directory-traversal vulnerability.
	 */
	public static(routePath: string, directory: string): this {
		const baseDir = join(process.cwd(), directory);

		const handler: Handler<DI> = async (ctx) => {
			const requestedPath = ctx.params["*"] || "";
			const absolutePath = join(baseDir, requestedPath);

			if (absolutePath !== baseDir && !absolutePath.startsWith(baseDir + sep)) {
				return ctx.json({ error: "Forbidden" }, 403);
			}

			const file = Bun.file(absolutePath);

			if (await file.exists()) {
				return new Response(file, {
					headers: {
						"Cache-Control": "public, max-age=3600",
					},
				});
			}
			return ctx.json({ error: "File Not Found" }, 404);
		};

		const wildcardPath = routePath.endsWith("/")
			? `${routePath}*`
			: `${routePath}/*`;
		this.get(wildcardPath, handler);
		return this;
	}

	public registerRoute(
		method: string,
		path: string,
		handlers: Array<Middleware<DI> | Handler<DI>>,
	): void {
		const mainHandler = handlers[handlers.length - 1] as Handler<DI>;
		const routeMiddlewares = handlers.slice(0, -1) as Middleware<DI>[];

		// Collect OpenAPI metadata
		// biome-ignore lint/suspicious/noExplicitAny: Required for flexible schema representation
		const openApiDoc: any = {
			method: method.toLowerCase(),
			path,
			request: { params: null, query: null, body: null },
			responses: [],
		};

		for (const handler of handlers) {
			const h = handler as unknown as Record<string, unknown>;
			if (h._isBuntokValidator) {
				const target = h._target as string;
				const schema = h._schema;
				openApiDoc.request[target] = schema;
			}
			if (h._isBuntokResponse) {
				openApiDoc.responses.push({
					status: h._status,
					schema: h._schema,
					description: h._description,
				});
			}
		}

		// Always register the route in OpenAPI, even if it lacks explicit validation/responses
		this.openApiDocs.push(openApiDoc);

		// AOT Compile route middlewares
		const executionChain = this.compilePipeline(routeMiddlewares, mainHandler);

		this.router.insert(method, path, executionChain);
	}

	private compilePipeline(
		middlewares: Middleware<DI>[],
		finalHandler: Handler<DI>,
	): Handler<DI> {
		if (middlewares.length === 0) return finalHandler;

		const fns = [...middlewares, finalHandler];
		let code = `return fns[${fns.length - 1}](ctx);`;
		for (let i = fns.length - 2; i >= 0; i--) {
			code = `return fns[${i}](ctx, () => { ${code} });`;
		}

		const factory = new Function("fns", `return function(ctx) { ${code} }`);
		return factory(fns) as Handler<DI>;
	}

	private compileGlobalPipeline(): void {
		if (this.middlewares.length === 0) {
			this.compiledGlobalPipeline = (ctx, finalHandler) =>
				// biome-ignore lint/suspicious/noExplicitAny: compiled
				finalHandler(ctx as any);
			return;
		}

		const fns = [...this.middlewares];
		let code = `return finalHandler(ctx);`;
		for (let i = fns.length - 1; i >= 0; i--) {
			code = `return fns[${i}](ctx, () => { ${code} });`;
		}

		const factory = new Function(
			"fns",
			`return function(ctx, finalHandler) { ${code} }`,
		);
		this.compiledGlobalPipeline = factory(fns) as (
			ctx: Context<DI>,
			finalHandler: Handler<DI>,
		) => Response | Promise<Response>;
	}

	private compileAOTRouter(): (
		request: Request,
		server?: Server<WSData<DI>>,
	) => Response | Promise<Response> {
		if (this.wsRoutes.size > 0) {
			return this.fallbackHandleRequest.bind(this);
		}

		let code =
			"return function(request, server) {\n" +
			"  const url = request.url;\n" +
			"  let start = url.indexOf('/', url.indexOf('//') + 2);\n" +
			"  if (start === -1) start = url.length;\n" +
			"  let end = url.indexOf('?', start);\n" +
			"  if (end === -1) end = url.length;\n" +
			"  const pathname = start === url.length ? '/' : url.substring(start, end);\n" +
			"  const method = request.method;\n" +
			"  switch(method) {\n";

		// biome-ignore lint/suspicious/noExplicitAny: generic
		const handlersList: any[] = [];
		// biome-ignore lint/suspicious/noExplicitAny: generic
		const handlersMap = new Map<any, string>();

		// biome-ignore lint/suspicious/noExplicitAny: generic
		function getHandlerIndex(handler: any) {
			if (handlersMap.has(handler)) return handlersMap.get(handler);
			const idx = handlersList.length;
			handlersList.push(handler);
			handlersMap.set(handler, `handlers[${idx}]`);
			return `handlers[${idx}]`;
		}

		// biome-ignore lint/suspicious/noExplicitAny: generic
		const methodPaths = new Map<string, { path: string; handler: any }[]>();
		for (const [path, methodMap] of this.router.staticRoutes.entries()) {
			for (const [method, handler] of methodMap.entries()) {
				if (!methodPaths.has(method)) methodPaths.set(method, []);
				// biome-ignore lint/style/noNonNullAssertion: guaranteed
				methodPaths.get(method)!.push({ path, handler });
			}
		}

		for (const [method, routes] of methodPaths.entries()) {
			code += `case "${method}": {\n`;
			code += "  switch(pathname) {\n";
			for (const route of routes) {
				const handlerRef = getHandlerIndex(route.handler);
				code += `    case "${route.path}": {\n`;
				code += "      const ctx = new Context(request, EMPTY_PARAMS, di);\n";
				code += "      try {\n";
				code +=
					"        const result = compiledGlobalPipeline(ctx, " +
					handlerRef +
					");\n";
				code += "        if (result instanceof Promise) {\n";
				code +=
					"          return result.then((r) => logResponse(request, pathname, r)).catch((e) => handleError(request, pathname, ctx, e));\n";
				code += "        }\n";
				code += "        return logResponse(request, pathname, result);\n";
				code += "      } catch (err) {\n";
				code += "        return handleError(request, pathname, ctx, err);\n";
				code += "      }\n";
				code += "    }\n";
			}
			code += "  }\n";
			code += "  break;\n";
			code += "}\n";
		}

		code += "  }\n" + "  return fallback(request, server);\n" + "};\n";

		const factory = new Function(
			"Context",
			"EMPTY_PARAMS",
			"di",
			"handlers",
			"compiledGlobalPipeline",
			"logResponse",
			"handleError",
			"fallback",
			code,
		);

		const EMPTY_PARAMS = Object.freeze({});
		return factory(
			Context,
			EMPTY_PARAMS,
			this.di,
			handlersList,
			this.compiledGlobalPipeline,
			this.logResponse,
			this.handleError,
			this.fallbackHandleRequest.bind(this),
		);
	}

	private extractPathname(url: string): string {
		// Skip protocol + authority (http://localhost:1212)
		const start = url.indexOf("/", url.indexOf("//") + 2);
		if (start === -1) return "/";
		let end = url.indexOf("?", start);
		if (end === -1) end = url.length;
		return url.substring(start, end);
	}

	// Bound once per App instance instead of allocating a new closure per request
	private readonly logResponse = (
		request: Request,
		pathname: string,
		response: Response,
	): Response => {
		// Skip building the log string entirely when request logging is off
		if (logger.logRequests) {
			logger.info(`${request.method} ${pathname}`, {
				status: response.status,
			});
		}
		if (this.poweredByHeaderEnabled) {
			response.headers.set("X-Powered-By", "buntok");
		}
		return response;
	};

	private readonly handleError = (
		request: Request,
		pathname: string,
		ctx: Context<DI>,
		err: unknown,
	): Response | Promise<Response> => {
		const errorObj = err instanceof Error ? err : new Error(String(err));
		logger.error(`${request.method} ${pathname}`, {
			error: errorObj.message,
		});
		const result = this.customErrorHandler(errorObj, ctx);
		if (result instanceof Promise) {
			return result.then((response) => {
				if (this.poweredByHeaderEnabled) {
					response.headers.set("X-Powered-By", "buntok");
				}
				return response;
			});
		}
		if (this.poweredByHeaderEnabled) {
			result.headers.set("X-Powered-By", "buntok");
		}
		return result;
	};

	/**
	 * Dispatch a request through the app without binding to a real port.
	 * Meant for tests: `await app.request("/users/1")` is much faster than
	 * spinning up a server and making a real HTTP call.
	 *
	 * Accepts the same input as the global `fetch()` / `Request` constructor.
	 */
	public async request(
		input: string | Request | URL,
		init?: RequestInit,
	): Promise<Response> {
		if (!this.compiledGlobalPipeline) this.compileGlobalPipeline();
		this._compiledAOTRouter = this.compileAOTRouter();
		const request =
			input instanceof Request && !init
				? input
				: new Request(
						typeof input === "string" && !/^https?:\/\//.test(input)
							? `http://localhost${input.startsWith("/") ? "" : "/"}${input}`
							: // biome-ignore lint/suspicious/noExplicitAny: Standard fetch input overriding
								(input as any),
						init,
					);
		return this.handleRequest(request);
	}

	private _compiledAOTRouter: (
		request: Request,
		server?: Server<WSData<DI>>,
	) => Response | Promise<Response> = this.fallbackHandleRequest.bind(this);

	public handleRequest(
		request: Request,
		server?: Server<WSData<DI>>,
	): Response | Promise<Response> {
		return this._compiledAOTRouter(request, server);
	}

	public fallbackHandleRequest(
		request: Request,
		server?: Server<WSData<DI>>,
	): Response | Promise<Response> {
		const pathname = this.extractPathname(request.url);

		if (server && this.wsRoutes.size > 0) {
			const wsHandler = this.wsRoutes.get(pathname);
			if (wsHandler) {
				const ctx = new Context(request, {}, this.di) as Context<DI>;
				const data: WSData<DI> = { ctx, handler: wsHandler };
				const upgraded = server.upgrade(request, { data });
				if (upgraded) {
					return undefined as unknown as Response;
				}
				return new Response("Upgrade Required", {
					status: 426,
					headers: {
						Connection: "Upgrade",
						Upgrade: "websocket",
					},
				});
			}
		}

		const route = this.router.find(request.method, pathname);

		const ctx = new Context(request, route.params, this.di) as Context<DI>;

		let finalHandler = route.handler as Handler<DI>;
		if (!finalHandler) {
			finalHandler = this.customNotFoundHandler;
		}

		try {
			// biome-ignore lint/style/noNonNullAssertion: Guaranteed by compileGlobalPipeline
			const result = this.compiledGlobalPipeline!(ctx, finalHandler);

			if (result instanceof Promise) {
				// A closure is unavoidable here since .then/.catch need the
				// per-request context, but this only happens on the async path.
				return result
					.then((response) => this.logResponse(request, pathname, response))
					.catch((err) => this.handleError(request, pathname, ctx, err));
			}
			return this.logResponse(request, pathname, result);
		} catch (err) {
			return this.handleError(request, pathname, ctx, err);
		}
	}

	public listen(port?: number, callback?: () => void): void {
		if (this.isListening) return;
		this.isListening = true;

		// Perform AOT compilation for global middlewares
		this.compileGlobalPipeline();
		this._compiledAOTRouter = this.compileAOTRouter();

		const finalPort = port || Number(process.env.PORT) || 1212;

		// biome-ignore lint/suspicious/noExplicitAny: Required for bun serve signature compatibility
		const serveOptions: any = {
			port: finalPort,
			fetch: (request: Request, server: Server<WSData<DI>>) =>
				this.handleRequest(request, server),
		};

		if (this.wsRoutes.size > 0) {
			serveOptions.websocket = {
				open: (ws: ServerWebSocket<WSData<DI>>) => {
					ws.data.handler.open?.(ws);
				},
				message: (
					ws: ServerWebSocket<WSData<DI>>,
					message: string | Buffer,
				) => {
					ws.data.handler.message?.(ws, message);
				},
				close: (
					ws: ServerWebSocket<WSData<DI>>,
					code: number,
					reason: string,
				) => {
					ws.data.handler.close?.(ws, code, reason);
				},
				drain: (ws: ServerWebSocket<WSData<DI>>) => {
					ws.data.handler.drain?.(ws);
				},
			};
		}

		this.server = Bun.serve<WSData<DI>>(serveOptions);

		console.log(`
  \x1b[32m██████╗ ██╗   ██╗███╗   ██╗████████╗ ██████╗ ██╗  ██╗\x1b[0m
  \x1b[32m██╔══██╗██║   ██║████╗  ██║╚══██╔══╝██╔═══██╗██║ ██╔╝\x1b[0m
  \x1b[32m██████╔╝██║   ██║██╔██╗ ██║   ██║   ██║   ██║█████╔╝ \x1b[0m
  \x1b[32m██╔══██╗██║   ██║██║╚██╗██║   ██║   ██║   ██║██╔═██╗ \x1b[0m
  \x1b[32m██████╔╝╚██████╔╝██║ ╚████║   ██║   ╚██████╔╝██║  ██╗\x1b[0m
  \x1b[32m╚═════╝  ╚═════╝ ╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝\x1b[0m
  `);
		logger.info(`🔥 Server is running on http://localhost:${finalPort}`);

		if (callback) callback();
	}
}

export class RouterGroup<
	DI extends Record<string, unknown> = Record<string, unknown>,
> {
	private prefix: string;
	private app: App<DI>;
	private groupMiddlewares: Middleware<DI>[] = [];

	constructor(prefix: string, app: App<DI>) {
		this.prefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
		this.app = app;
	}

	public use(middleware: Middleware<DI>): this {
		this.groupMiddlewares.push(middleware);
		return this;
	}

	public group(prefix: string): RouterGroup<DI> {
		const newGroup = new RouterGroup<DI>(this.prefix + prefix, this.app);
		newGroup.groupMiddlewares = [...this.groupMiddlewares];
		return newGroup;
	}

	private normalizePath(path: string): string {
		const cleanPath = path === "/" ? "" : path;
		return `${this.prefix}${cleanPath}`;
	}

	public get<Path extends string>(path: Path, handler: Handler<DI, Path>): this;
	public get<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public get<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.app.registerRoute("GET", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
		return this;
	}

	public post<Path extends string>(
		path: Path,
		handler: Handler<DI, Path>,
	): this;
	public post<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public post<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.app.registerRoute("POST", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
		return this;
	}

	public put<Path extends string>(path: Path, handler: Handler<DI, Path>): this;
	public put<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public put<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.app.registerRoute("PUT", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
		return this;
	}

	public delete<Path extends string>(
		path: Path,
		handler: Handler<DI, Path>,
	): this;
	public delete<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public delete<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.app.registerRoute("DELETE", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
		return this;
	}

	// QUERY method - like GET but with body support
	public query(path: string, handler: Handler<DI>): this;
	public query(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public query(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.app.registerRoute("QUERY", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
		return this;
	}
}
