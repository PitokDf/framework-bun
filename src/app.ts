import { join, sep } from "node:path";
import type { Server, ServerWebSocket } from "bun";
import { z } from "zod";
import { Container } from "./container";
import { Context } from "./context";
import { getControllerMeta } from "./decorators";
import { HttpError } from "./helpers/async-handler";
import { toResponse } from "./helpers/response";
import { logger } from "./logger";
import { Router } from "./router";

export interface WSData<DI = Record<string, unknown>> {
	ctx: Context<DI>;
	handler: WSHandler<DI>;
}

export interface WSOptions {
	/** Per-message deflate — Bun native, default false */
	perMessageDeflate?: boolean | object;
	/** Max payload length bytes — default 16MB */
	maxPayloadLength?: number;
	/** Idle timeout seconds before close — default 120, 30 untuk heartbeat */
	idleTimeout?: number;
	/** Backpressure highWaterMark */
	maxBackpressure?: number;
	/** Publish to self? default false */
	publishToSelf?: boolean;
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
	pong?: (ws: ServerWebSocket<WSData<DI>>) => void;
	/**
	 * Optional authentication handler.
	 * Called on connection open. Return null to reject the connection.
	 * The returned data is stored in `ws.data.auth`.
	 */
	authenticate?: (ws: ServerWebSocket<WSData<DI>>) => Promise<unknown | null>;
}

export type ExtractParams<Path extends string> =
	Path extends `${infer _Start}:${infer Param}/${infer Rest}`
		? { [K in Param]: string } & ExtractParams<`/${Rest}`>
		: Path extends `${infer _Start}:${infer Param}`
			? { [K in Param]: string }
			: Path extends `${infer _Start}*${infer Catchall}`
				? { [K in Catchall]: string } & { "*": string }
				: Record<string, never>;

/**
 * @deprecated Use `ZodCtx<{ body: typeof schema; query: typeof schema }>` instead.
 * `RouteContext` has 5 generic parameters that are hard to remember.
 * `ZodCtx` only needs one and infers types automatically from your Zod schemas.
 */
export type RouteContext<
	Path extends string = string,
	BodyType = unknown,
	DI = Record<string, unknown>,
	QueryType = unknown,
	ParamsType = ExtractParams<Path>,
> = {
	body(): Promise<BodyType>;
	valid<T extends "body" | "query" | "params">(
		target: T,
	): T extends "body"
		? BodyType
		: T extends "query"
			? QueryType
			: T extends "params"
				? ParamsType
				: unknown;
} & Context<DI, ParamsType>;

/**
 * Helper to infer Context types from Zod schemas automatically.
 *
 * Just pass your Zod schemas — no need to remember generic parameter order.
 *
 * @example
 * const paginationSchema = z.object({ page: z.coerce.number(), limit: z.coerce.number() });
 *
 * @Controller("/users")
 * export class UserController {
 *   @Get("/")
 *   @Use(zValidator("query", paginationSchema))
 *   async getAll(ctx: ZodCtx<{ query: typeof paginationSchema }>) {
 *     const { page, limit } = ctx.valid("query"); // Fully typed!
 *   }
 * }
 */
export type ZodCtx<
	// biome-ignore lint/suspicious/noExplicitAny: Requires accessing Zod types
	T extends { query?: any; body?: any; params?: any },
> = {
	body(): Promise<T["body"] extends { _type: infer U } ? U : T["body"]>;
	valid<Target extends "body" | "query" | "params">(
		target: Target,
	): Target extends "body"
		? T["body"] extends { _type: infer U }
			? U
			: T["body"]
		: Target extends "query"
			? T["query"] extends { _type: infer U }
				? U
				: T["query"]
			: Target extends "params"
				? T["params"] extends { _type: infer U }
					? U
					: T["params"]
				: unknown;
} & Context<
	Record<string, unknown>,
	T["params"] extends { _type: infer U }
		? U
		: T["params"] extends Record<string, string>
			? T["params"]
			: Record<string, string>
>;

export type HandlerReturn =
	| Response
	| string
	| number
	| boolean
	| bigint
	| Record<string, unknown>
	| unknown[]
	| null
	| undefined
	| void
	| Promise<
			| Response
			| string
			| number
			| boolean
			| bigint
			| Record<string, unknown>
			| unknown[]
			| null
			| undefined
			| void
	  >;

export type Handler<
	DI = Record<string, unknown>,
	Path extends string = string,
> = (ctx: Context<DI, ExtractParams<Path>>) => HandlerReturn;
export type Middleware<
	DI = Record<string, unknown>,
	Path extends string = string,
> = (
	ctx: Context<DI, ExtractParams<Path>>,
	next: () => Promise<Response> | Response,
) => HandlerReturn;
export type ErrorHandler<DI = Record<string, unknown>> = (
	err: Error,
	// biome-ignore lint/suspicious/noExplicitAny: generic
	ctx: Context<DI, any>,
) => HandlerReturn;
export type NotFoundHandler<DI = Record<string, unknown>> = (
	// biome-ignore lint/suspicious/noExplicitAny: generic
	ctx: Context<DI, any>,
) => HandlerReturn;

export interface EnvValidationOptions {
	/**
	 * Custom error handler called when env validation fails.
	 * If provided, the default error printing and process.exit(1) are skipped.
	 * Use this to send alerts to monitoring services or custom logging before exiting.
	 *
	 * @example
	 * app.validateEnv(schema, {
	 *   onError: (errors) => {
	 *     // Send to monitoring service
	 *     await sentry.captureException(new Error("Env validation failed"));
	 *     // Log to external service
	 *     await logger.fatal("Missing env vars", { errors });
	 *     // Then exit manually
	 *     process.exit(1);
	 *   }
	 * });
	 */
	onError?: (errors: { field: string; message: string }[]) => void | never;
}

export interface StaticOptions {
	/** Cache max-age in seconds (default: 3600) */
	maxAge?: number;
	/** Override the full Cache-Control header value */
	cacheControl?: string;
	/** Enable ETag generation and conditional requests (default: true) */
	etag?: boolean;
}

export interface ApiDocsOptions {
	/** URL path for the docs UI (default: "/docs") */
	path?: string;
	/** API title displayed in the docs (default: "API Documentation") */
	title?: string;
	/** API version (default: "1.0.0") */
	version?: string;
	/** API description */
	description?: string;
	/** Hide docs when NODE_ENV is "production" (default: false) */
	safeOnProduction?: boolean;
}

export class App<DI extends Record<string, unknown> = Record<string, unknown>> {
	private router: Router;
	private middlewares: Middleware<DI>[] = [];
	private compiledGlobalPipeline?: (
		ctx: Context<DI>,
		finalHandler: Handler<DI>,
	) => HandlerReturn;
	private iconPath: string = "./public/favicon.ico";
	private isListening: boolean = false;
	public di = {} as DI;
	private wsRoutes: Map<string, WSHandler<DI>> = new Map();
	private wsOpts: WSOptions = {};
	private poweredByHeaderEnabled: boolean = true;
	private _reusePort: boolean = false;
	private _skipLogResponse: boolean = false;
	public _apiDocsConfig: ApiDocsOptions | null = null;
	// biome-ignore lint/suspicious/noExplicitAny: Required for internal OpenAPI registry
	public openApiDocs: any[] = [];
	private container: Container | null = null;

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
		const status = err instanceof HttpError ? err.status : 500;
		const errorName =
			status === 400
				? "Bad Request"
				: status === 401
					? "Unauthorized"
					: status === 403
						? "Forbidden"
						: status === 404
							? "Not Found"
							: status === 405
								? "Method Not Allowed"
								: status === 409
									? "Conflict"
									: status === 422
										? "Unprocessable Entity"
										: status === 429
											? "Too Many Requests"
											: status === 503
												? "Service Unavailable"
												: "Internal Server Error";
		return ctx.json(
			{
				success: false,
				error: errorName,
				message:
					process.env.NODE_ENV === "production"
						? "Terjadi kesalahan pada server"
						: err.message,
			},
			status,
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
	}

	public use(middleware: Middleware<DI>): this {
		this.middlewares.push(middleware);
		return this;
	}

	public set<K extends keyof DI>(key: K, value: DI[K]): this {
		this.di[key] = value;
		return this;
	}

	/**
	 * Attach an IoC Container to the app. When set, `registerController()`
	 * will resolve controllers via `container.resolve()` (use `FactoryProvider` for ctor deps).
	 */
	public setContainer(container: Container): this {
		this.container = container;
		return this;
	}

	/**
	 * Get the attached IoC Container, or create an empty one if none was set.
	 */
	public getContainer(): Container {
		if (!this.container) {
			this.container = new Container();
		}
		return this.container;
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

	/** Configure Bun WebSocket options — Bun-only, zero-deps */
	public wsOptions(opts: WSOptions): this {
		this.wsOpts = { ...this.wsOpts, ...opts };
		return this;
	}

	/**
	 * Type-safe Environment Variables Validator (static).
	 * Validates `process.env` against a Zod schema object and returns the typed result.
	 * If validation fails, it prints a beautiful error to the console and exits the process (stops booting).
	 *
	 * @example
	 * // Static — no App instance needed (ideal for src/env.ts)
	 * const env = App.validateEnv({
	 *   DATABASE_URL: z.string().url(),
	 *   PORT: z.coerce.number().default(3000),
	 * });
	 *
	 * @example
	 * // Custom error handler - send to monitoring before exiting
	 * const env = App.validateEnv({
	 *   DATABASE_URL: z.string().url(),
	 * }, {
	 *   onError: (errors) => {
	 *     // Send to monitoring service
	 *     console.error("ENV ERROR:", errors);
	 *     // Exit manually after alerting
	 *     process.exit(1);
	 *   }
	 * });
	 */
	static validateEnv<T extends z.ZodRawShape>(
		schema: T,
		options?: EnvValidationOptions,
	): z.infer<z.ZodObject<T>> {
		const envSchema = z.object(schema);
		const result = envSchema.safeParse(process.env);

		if (!result.success) {
			const errors = result.error.issues.map((err) => ({
				field: err.path.join("."),
				message: err.message,
			}));

			// If custom handler provided, call it and skip default behavior
			if (options?.onError) {
				options.onError(errors);
				// If onError didn't throw/exit, throw error for caller to handle
				throw new Error(
					`Environment validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
				);
			}

			// Default behavior: print error and exit
			console.error("\n\x1b[41m\x1b[37m 🚨 Buntok Environment Error \x1b[0m\n");
			console.error(
				"\x1b[31mMissing or invalid environment variables:\x1b[0m\n",
			);

			errors.forEach((err) => {
				console.error(
					`  \x1b[33m❯\x1b[0m \x1b[36m${err.field}\x1b[0m: \x1b[90m${err.message}\x1b[0m`,
				);
			});

			console.error("\n\x1b[31mServer boot aborted.\x1b[0m\n");
			process.exit(1);
		}

		return result.data;
	}

	/**
	 * Type-safe Environment Variables Validator (instance).
	 * Delegates to the static method. Kept for backward compatibility.
	 *
	 * @example
	 * const app = new App();
	 * const env = app.validateEnv({
	 *   DATABASE_URL: z.string().url(),
	 *   PORT: z.coerce.number().default(3000),
	 * });
	 */
	public validateEnv<T extends z.ZodRawShape>(
		schema: T,
		options?: EnvValidationOptions,
	): z.infer<z.ZodObject<T>> {
		return App.validateEnv(schema, options);
	}

	/**
	 * Register all `@Get`/`@Post`/etc. routes declared on a `@Controller`
	 * class. This is sugar over `registerRoute()` — it instantiates the
	 * class once (at boot time, not per request) and wires each decorated
	 * method up exactly like a manual `app.get(path, handler)` call would.
	 *
	 * When a Container is attached via `app.setContainer()`, `@Inject`-
	 * annotated properties on the controller are automatically resolved
	 * from the container before routes are bound.
	 *
	 * ```ts
	 * app.registerController(UserController);
	 * ```
	 */
	public registerController<T extends object>(
		// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
		target: (new (...args: any[]) => T) | T,
	): this {
		// Detect if target is a class (constructor) or an instance
		const isInstance =
			typeof target === "object" &&
			target !== null &&
			typeof target === "object";

		const ControllerClass = isInstance
			? // biome-ignore lint/suspicious/noExplicitAny: dynamic type narrowing
				(target as any).constructor
			: // biome-ignore lint/suspicious/noExplicitAny: dynamic type narrowing
				(target as new (
					...args: any[]
				) => T);

		const meta = getControllerMeta(ControllerClass);
		if (!meta) {
			throw new Error(
				`${ControllerClass.name} is not decorated with @Controller — did you forget to add it?`,
			);
		}

		let instance: T;

		if (isInstance) {
			// Use the provided instance directly
			instance = target as T;
		} else if (this.container) {
			const resolved = this.container.resolve<T>(ControllerClass);
			instance = resolved;
		} else {
			instance = new ControllerClass();
		}

		const normalizedPrefix = meta.prefix.endsWith("/")
			? meta.prefix.slice(0, -1)
			: meta.prefix;

		for (const route of meta.routes) {
			const cleanPath = route.path === "/" ? "" : route.path;
			const fullPath = `${normalizedPrefix}${cleanPath}` || "/";
			// biome-ignore lint/suspicious/noExplicitAny: dynamic method dispatch by decorated property key
			let handler = (instance as any)[route.propertyKey].bind(
				instance,
			) as Handler<DI>;

			// Apply zero-cost wrappers for @HttpCode/@Header/@Redirect (boot-time, no per-request alloc beyond wrapper closure)
			const hasStatus = route.statusCode !== undefined;
			const hasHeaders = route.headers && route.headers.length > 0;
			const hasRedirect = !!route.redirect;
			if (hasStatus || hasHeaders || hasRedirect) {
				const original = handler;
				const routeMeta = route;
				// biome-ignore lint/suspicious/noExplicitAny: wrapper must accept any Context shape
				handler = ((ctx: any) => {
					// Redirect - static or dynamic override (Nest behavior)
					if (hasRedirect) {
						const result: any = original(ctx);
						// If handler returns promise, handle async
						if (result instanceof Promise) {
							return result.then((val: any) => {
								if (val && typeof val === "object" && "url" in val) {
									const url = (val as any).url as string;
									const sc = (val as any).statusCode ?? routeMeta.redirect!.statusCode;
									return new Response(null, { status: sc, headers: { Location: url } });
								}
								// Also allow string return as url override
								if (typeof val === "string" && val.startsWith("/")) {
									return new Response(null, { status: routeMeta.redirect!.statusCode, headers: { Location: val } });
								}
								// Static redirect
								return new Response(null, {
									status: routeMeta.redirect!.statusCode,
									headers: { Location: routeMeta.redirect!.url },
								});
							});
						}
						if (result && typeof result === "object" && "url" in result) {
							const url = (result as any).url as string;
							const sc = (result as any).statusCode ?? routeMeta.redirect!.statusCode;
							return new Response(null, { status: sc, headers: { Location: url } });
						}
						if (typeof result === "string" && result.startsWith("/")) {
							return new Response(null, { status: routeMeta.redirect!.statusCode, headers: { Location: result } });
						}
						return new Response(null, {
							status: routeMeta.redirect!.statusCode,
							headers: { Location: routeMeta.redirect!.url },
						});
					}
					const raw: any = original(ctx);
					const apply = (res: Response): Response => {
						let r: Response = res;
						if (hasStatus && r.status === 200) {
							// Override status only if default 200 (preserve explicit ctx.status etc.)
							r = new Response(r.body, { status: routeMeta.statusCode!, headers: r.headers });
						} else if (hasStatus && r.status === 204 && routeMeta.statusCode !== 204) {
							// For void returns that became 204, respect HttpCode
							r = new Response(r.body, { status: routeMeta.statusCode!, headers: r.headers });
						}
						if (hasHeaders) {
							for (const [k, v] of routeMeta.headers!) {
								r.headers.set(k, v);
							}
						}
						return r;
					};
					if (raw instanceof Promise) {
						return raw.then((v: any) => apply(toResponse(v)));
					}
					return apply(toResponse(raw));
				}) as Handler<DI>;
			}

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

	/**
	 * Enable SO_REUSEPORT for multi-process load balancing (Linux only).
	 * When enabled, multiple instances of the app can bind to the same port,
	 * and incoming requests are load-balanced at the kernel level.
	 *
	 * ⚠️ On non-Linux platforms (macOS, Windows), this option is silently ignored.
	 * A warning will be logged in development mode to help catch environment mismatches.
	 */
	public enableReusePort(enabled = true): this {
		this._reusePort = enabled;

		// Warn in development about platform limitation
		if (enabled && process.platform !== "linux") {
			console.warn(
				`\x1b[33m⚠ Warning: enableReusePort() is only supported on Linux. ` +
				`Current platform: ${process.platform}. ` +
				`This option will be ignored in production.\x1b[0m`,
			);
		}

		return this;
	}

	public icon(path: string): this {
		this.iconPath = path;
		return this;
	}

	private registerFaviconRoute(): void {
		this.get("/favicon.ico", async (_ctx) => {
			// Try custom path first
			const customFile = Bun.file(this.iconPath);
			if (await customFile.exists()) {
				return new Response(customFile);
			}
			// Fallback to built-in icon
			const builtInFile = Bun.file(this.getBuiltInIconPath());
			if (await builtInFile.exists()) {
				return new Response(builtInFile);
			}
			// No favicon found
			return new Response(null, { status: 404 });
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

	public patch<Path extends string>(
		path: Path,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.registerRoute("PATCH", path, handlers);
		return this;
	}

	public head<Path extends string>(
		path: Path,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.registerRoute("HEAD", path, handlers);
		return this;
	}

	/**
	 * Register a handler for all standard HTTP methods (GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS).
	 */
	public all<Path extends string>(path: Path, handler: Handler<DI, Path>): this;
	public all<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public all<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		const methods = [
			"GET",
			"HEAD",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		];
		for (const method of methods) {
			this.registerRoute(method, path, handlers);
		}
		return this;
	}

	/**
	 * Serve static files from `directory` under `routePath`.
	 *
	 * Rejects any request whose resolved path escapes `directory` (e.g.
	 * `/files/../../etc/passwd`) — without this check, static serving is a
	 * directory-traversal vulnerability.
	 *
	 * Supports ETag-based conditional requests (If-None-Match → 304).
	 * ETag is computed on every response and sent to the client, enabling
	 * efficient caching on subsequent requests.
	 */
	public static(routePath: string, directory: string, options?: StaticOptions): this {
		const baseDir = join(process.cwd(), directory);
		const maxAge = options?.maxAge ?? 3600;
		const cacheControl = options?.cacheControl ?? `public, max-age=${maxAge}`;
		const enableEtag = options?.etag !== false;

		const handler: Handler<DI> = async (ctx) => {
			const requestedPath = ctx.params["*"] || "";
			let absolutePath = join(baseDir, requestedPath);

			if (absolutePath !== baseDir && !absolutePath.startsWith(baseDir + sep)) {
				return ctx.json({ error: "Forbidden" }, 403);
			}

			// If file doesn't exist, check for directory with index.html
			if (!(await Bun.file(absolutePath).exists())) {
				const indexPath = join(absolutePath, "index.html");
				if (await Bun.file(indexPath).exists()) {
					absolutePath = indexPath;
				}
			}

			const file = Bun.file(absolutePath);

			if (!(await file.exists())) {
				return ctx.json({ error: "File Not Found" }, 404);
			}

			const etag = enableEtag ? `"${file.size}-${file.lastModified}"` : null;

			// ETag-based conditional request (If-None-Match → 304)
			if (etag) {
				const ifNoneMatch = ctx.request.headers.get("If-None-Match");
				if (ifNoneMatch === etag) {
					return new Response(null, {
						status: 304,
						headers: { ETag: etag },
					});
				}
			}

			const headers: Record<string, string> = {
				"Cache-Control": cacheControl,
			};
			if (etag) {
				headers.ETag = etag;
			}

			return new Response(file, { headers });
		};

		const wildcardPath = routePath.endsWith("/")
			? `${routePath}*`
			: `${routePath}/*`;
		this.get(wildcardPath, handler);
		return this;
	}

	/**
	 * Enable interactive API documentation at the specified path.
	 *
	 * Serves a built-in docs UI and the generated OpenAPI spec (swagger.json).
	 * The docs routes are registered directly on the router and do NOT appear
	 * in the generated swagger.json.
	 *
	 * @example
	 * ```ts
	 * app.apiDocs({ path: "/docs", title: "My API", version: "1.0.0" });
	 * ```
	 */
	public apiDocs(options?: ApiDocsOptions): this {
		this._apiDocsConfig = {
			path: options?.path ?? "/docs",
			title: options?.title ?? "API Documentation",
			version: options?.version ?? "1.0.0",
			description: options?.description,
			safeOnProduction: options?.safeOnProduction ?? false,
		};
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
				if (target === "body") {
					openApiDoc.request.bodyContentType = h._contentType as string;
				}
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

	/**
	 * Register API docs routes directly on the router.
	 * These routes do NOT go through registerRoute() and therefore
	 * do NOT appear in openApiDocs / swagger.json.
	 */
	private registerApiDocsRoutes(): void {
		const config = this._apiDocsConfig!;
		const basePath = (config.path ?? "/docs").replace(/\/+$/, "");

		// Resolve template paths relative to this package's dist directory
		const templatesDir = new URL("./cli/templates", import.meta.url).pathname;

		// Handler for serving the HTML docs UI — safe injection via app.apiDocs()
		const uiHandler: Handler<DI> = async () => {
			const htmlPath = join(templatesDir, "index.html");
			const file = Bun.file(htmlPath);
			if (await file.exists()) {
				let html = await file.text();
				// Safe HTML escape for <title> (prevent </title> injection)
				const rawTitle = config.title ?? "API Reference";
				const escTitleHtml = String(rawTitle)
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;");
				html = html.replace(
					/<title>.*?<\/title>/,
					`<title>${escTitleHtml} — API Reference</title>`,
				);
				// Safe JSON injection via JSON.stringify (handles quotes, newlines, unicode)
				html = html.replace(
					/"title":\s*"API Documentation"/,
					`"title":${JSON.stringify(config.title ?? "API Documentation")}`,
				);
				html = html.replace(
					/"version":\s*"1\.0\.0"/,
					`"version":${JSON.stringify(config.version ?? "1.0.0")}`,
				);
				if (config.description) {
					html = html.replace(
						/"description":\s*"Loading API specification\.\.\."/,
						`"description":${JSON.stringify(config.description)}`,
					);
				}
				return new Response(html, {
					headers: { "Content-Type": "text/html; charset=utf-8" },
				});
			}
			return new Response("Docs UI not found. Run 'buntok make:docs' first.", { status: 404 });
		};

		// Handler for serving swagger.json (reads fresh on every request)
		const swaggerHandler: Handler<DI> = async () => {
			const swaggerPath = join(process.cwd(), "public/docs/swagger.json");
			const file = Bun.file(swaggerPath);
			if (await file.exists()) {
				return new Response(file, {
					headers: { "Content-Type": "application/json" },
				});
			}
			return new Response(JSON.stringify({ error: "swagger.json not found. Run 'buntok make:docs' first." }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		};

		// Handler for serving static assets (tailwind.js, font-googles.css)
		const assetsHandler: Handler<DI> = async (ctx) => {
			const assetName = ctx.params["*"] ?? "";
			const assetPath = join(templatesDir, assetName);
			const file = Bun.file(assetPath);
			if (await file.exists()) {
				const ext = assetName.split(".").pop()?.toLowerCase() ?? "";
				const contentTypes: Record<string, string> = {
					js: "application/javascript; charset=utf-8",
					css: "text/css; charset=utf-8",
					json: "application/json",
					png: "image/png",
					svg: "image/svg+xml",
				};
				return new Response(file, {
					headers: { "Content-Type": contentTypes[ext] || "application/octet-stream" },
				});
			}
			return new Response("Not Found", { status: 404 });
		};

		// Register routes directly on router (bypass openApiDocs)
		this.router.insert("GET", `${basePath}/swagger.json`, swaggerHandler);
		this.router.insert("GET", `${basePath}/index.html`, uiHandler);
		this.router.insert("GET", `${basePath}/*`, assetsHandler);
		this.router.insert("GET", basePath, uiHandler);
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
		) => HandlerReturn;
	}

	private compileAOTRouter(): (
		request: Request,
		server?: Server<WSData<DI>>,
	) => Response | Promise<Response> {
		let code =
			"return function(request, server) {\n" +
			"  const url = request.url;\n" +
			"  let start = url.indexOf('/', url.indexOf('//') + 2);\n" +
			"  if (start === -1) start = url.length;\n" +
			"  let end = url.indexOf('?', start);\n" +
			"  if (end === -1) end = url.length;\n" +
			"  const pathname = start === url.length ? '/' : url.substring(start, end);\n";

		if (this.wsRoutes.size > 0) {
			code +=
				"  if (server && wsRoutes.has(pathname)) {\n" +
				"    const wsHandler = wsRoutes.get(pathname);\n" +
				"    const ctx = new Context(request, EMPTY_PARAMS, di);\n" +
				"    const data = { ctx, handler: wsHandler };\n" +
				"    const upgraded = server.upgrade(request, { data });\n" +
				"    if (upgraded) return undefined;\n" +
				"    return new Response('Upgrade Required', { status: 426, headers: { Connection: 'Upgrade', Upgrade: 'websocket' } });\n" +
				"  }\n";
		}

		code += "  const method = request.method;\n" + "  switch(method) {\n";

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
					"        const raw = compiledGlobalPipeline(ctx, " +
					handlerRef +
					");\n";
				if (this._skipLogResponse) {
					code += "        if (raw instanceof Promise) {\n";
					code +=
						"          return raw.then((v) => toResponse(v)).catch((e) => handleError(request, pathname, ctx, e));\n";
					code += "        }\n";
					code += "        return toResponse(raw);\n";
				} else {
					code += "        if (raw instanceof Promise) {\n";
					code +=
						"          return raw.then((v) => logResponse(request, pathname, toResponse(v))).catch((e) => handleError(request, pathname, ctx, e));\n";
					code += "        }\n";
					code += "        return logResponse(request, pathname, toResponse(raw));\n";
				}
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
			"wsRoutes",
			"toResponse",
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
			this.wsRoutes,
			toResponse,
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
		// Guard against undefined response from middleware chain
		if (!response) {
			return new Response("Internal Server Error", { status: 500 });
		}
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

	/**
	 * Normalize flexible handler return (string | object | null etc.) to Response.
	 * Used by both AOT and fallback paths.
	 */
	private normalizeReturn(value: unknown): Response | Promise<Response> {
		if (value instanceof Promise) {
			return value.then((v) => toResponse(v));
		}
		return toResponse(value);
	}

	/**
	 * Normalize handler return then pass through logResponse.
	 * Handles both sync and async flexible returns.
	 */
	private readonly logNormalized = (
		request: Request,
		pathname: string,
		value: unknown,
	): Response | Promise<Response> => {
		const normalized = this.normalizeReturn(value);
		if (normalized instanceof Promise) {
			return normalized.then((res) => this.logResponse(request, pathname, res));
		}
		return this.logResponse(request, pathname, normalized);
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
		// Normalize ErrorHandler flexible return as well
		const normalized = this.normalizeReturn(result);
		if (normalized instanceof Promise) {
			return normalized.then((response) => {
				if (this.poweredByHeaderEnabled) {
					response.headers.set("X-Powered-By", "buntok");
				}
				return response;
			});
		}
		if (this.poweredByHeaderEnabled) {
			normalized.headers.set("X-Powered-By", "buntok");
		}
		return normalized;
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
		// Lazy AOT — compile sekali saja (fix speed murah: sebelumnya compile tiap request)
		if (!this._aotReady) {
			this._compiledAOTRouter = this.compileAOTRouter();
			this._aotReady = true;
		}
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

	private _aotReady = false;
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
				return result
					.then((value) => this.logNormalized(request, pathname, value))
					.catch((err) => this.handleError(request, pathname, ctx, err));
			}
			return this.logNormalized(request, pathname, result);
		} catch (err) {
			return this.handleError(request, pathname, ctx, err);
		}
	}

	public listen(port?: number, callback?: () => void): void {
		// Skip server startup when running under make:docs
		if (process.env.BUNTOK_DOCS_BUILD === "1") return;
		if (this.isListening) return;
		this.isListening = true;

		// Pre-compute whether logResponse can be skipped entirely
		this._skipLogResponse = !logger.logRequests && !this.poweredByHeaderEnabled;

		// Register API docs routes directly on router (bypasses openApiDocs)
		if (this._apiDocsConfig) {
			const isProduction = process.env.NODE_ENV === "production";
			if (!(this._apiDocsConfig.safeOnProduction && isProduction)) {
				this.registerApiDocsRoutes();
			}
		}

		// Perform AOT compilation for global middlewares
		this.compileGlobalPipeline();
		this._compiledAOTRouter = this.compileAOTRouter();
		this._aotReady = true;

		const finalPort = port || Number(process.env.PORT) || 1212;

		// biome-ignore lint/suspicious/noExplicitAny: Required for bun serve signature compatibility
		const serveOptions: any = {
			port: finalPort,
			fetch: this._compiledAOTRouter,
		};

		if (this._reusePort) {
			serveOptions.reusePort = true;
		}

		if (this.wsRoutes.size > 0) {
			serveOptions.websocket = {
				// Bun-only native options — pluggable, zero-deps
				perMessageDeflate: this.wsOpts.perMessageDeflate ?? false,
				maxPayloadLength: this.wsOpts.maxPayloadLength ?? 16 * 1024 * 1024,
				idleTimeout: this.wsOpts.idleTimeout ?? 120,
				maxBackpressure: this.wsOpts.maxBackpressure,
				publishToSelf: this.wsOpts.publishToSelf ?? false,
				open: async (ws: ServerWebSocket<WSData<DI>>) => {
					try {
						if (ws.data.handler.authenticate) {
							const authData = await ws.data.handler.authenticate(ws);
							if (authData === null) {
								ws.close(4001, "Unauthorized");
								return;
							}
							(ws.data as unknown as Record<string, unknown>).auth = authData;
						}
						ws.data.handler.open?.(ws);
					} catch (err) {
						logger.error("WS open error", { error: (err as Error).message });
						try { ws.close(1011, "Internal error"); } catch {}
					}
				},
				message: (
					ws: ServerWebSocket<WSData<DI>>,
					message: string | Buffer,
				) => {
					try {
						ws.data.handler.message?.(ws, message);
					} catch (err) {
						logger.error("WS message error", { error: (err as Error).message });
					}
				},
				close: (
					ws: ServerWebSocket<WSData<DI>>,
					code: number,
					reason: string,
				) => {
					try { ws.data.handler.close?.(ws, code, reason); } catch (err) {
						logger.error("WS close error", { error: (err as Error).message });
					}
				},
				drain: (ws: ServerWebSocket<WSData<DI>>) => {
					try { ws.data.handler.drain?.(ws); } catch {}
				},
				pong: (ws: ServerWebSocket<WSData<DI>>) => {
					try {
						// heartbeat pong — reset alive (fix: pong bukan message)
						(ws.data.handler as unknown as { pong?: (ws: ServerWebSocket<WSData<DI>>) => void }).pong?.(ws);
						// juga fallback untuk wsHeartbeat yang attach di ws.data
						const hb = (ws.data as unknown as { heartbeat?: { alive: boolean } }).heartbeat;
						if (hb) hb.alive = true;
					} catch {}
				},
			} as unknown as Record<string, unknown>;
		}

		// Auto-increment port if already in use
		let currentPort = finalPort;
		const maxRetries = 10;
		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				serveOptions.port = currentPort;
				this.server = Bun.serve<WSData<DI>>(serveOptions);
				break;
			} catch (err: any) {
				if (err?.code === "EADDRINUSE" && attempt < maxRetries - 1) {
					const originalPort = currentPort;
					currentPort++;
					logger.warn(
						`⚠ Port ${originalPort} is already in use, using port ${currentPort} instead`,
					);
					continue;
				}
				throw err;
			}
		}

		// Setup graceful shutdown handlers
		this.setupGracefulShutdown();

		logger.info(`Server listening at http://localhost:${currentPort}`);

		if (callback) callback();
	}

	/**
	 * Setup graceful shutdown handlers for SIGTERM and SIGINT signals.
	 * When a signal is received, the server stops accepting new connections,
	 * waits for in-flight requests to complete, then exits cleanly.
	 */
	private setupGracefulShutdown(): void {
		const shutdown = async (signal: string) => {
			logger.info(`\n${signal} received. Starting graceful shutdown...`);

			if (this.server) {
				// Stop accepting new connections
				this.server.stop(false);

				// Drain SSE — industrial graceful (close all streams dengan 30s heartbeat comment)
				try {
					const { SSE } = await import("./sse");
					// kirim close event sebelum terminate
					for (const c of SSE.getActiveConnections()) {
						try { c.sendEvent("close", "Server shutting down"); } catch {}
					}
					// beri waktu 1s untuk flush
					await new Promise((r) => setTimeout(r, 1000));
					SSE.closeAll();
				} catch {}

				// Drain WS — close dengan 1001 Going Away
				try {
					// broadcast ke semua topic jika pakai publish
					try { this.server.publish("buntok:shutdown", "shutting down"); } catch {}
				} catch {}

				// Give in-flight requests time to complete (max 30 seconds)
				const shutdownTimeout = 30_000;
				const forceExitTimeout = setTimeout(() => {
					logger.warn("Forcing shutdown after timeout");
					process.exit(1);
				}, shutdownTimeout);
				// Jangan clear langsung — biarkan timeout jadi safety net
				// Cleanup setelah graceful selesai
				setTimeout(() => {
					clearTimeout(forceExitTimeout);
					logger.info("Server shut down gracefully");
					process.exit(0);
				}, 1500);
				return;
			}

			logger.info("Server shut down gracefully");
			process.exit(0);
		};

		process.on("SIGTERM", () => shutdown("SIGTERM"));
		process.on("SIGINT", () => shutdown("SIGINT"));
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
		this.app.registerRoute("QUERY", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
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
		this.app.registerRoute("OPTIONS", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
		return this;
	}

	public patch<Path extends string>(
		path: Path,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public patch<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.app.registerRoute("PATCH", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
		return this;
	}

	public head<Path extends string>(
		path: Path,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public head<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		this.app.registerRoute("HEAD", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
		return this;
	}

	/**
	 * Register a handler for all standard HTTP methods (GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS).
	 */
	public all<Path extends string>(path: Path, handler: Handler<DI, Path>): this;
	public all<Path extends string>(
		path: Path,
		middleware: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public all<Path extends string>(
		path: Path,
		m1: Middleware<DI, Path>,
		m2: Middleware<DI, Path>,
		m3: Middleware<DI, Path>,
		m4: Middleware<DI, Path>,
		m5: Middleware<DI, Path>,
		handler: Handler<DI, Path>,
	): this;
	public all<Path extends string>(
		path: Path,
		...handlers: Array<Middleware<DI, Path> | Handler<DI, Path>>
	): this {
		const methods = [
			"GET",
			"HEAD",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		];
		for (const method of methods) {
			this.app.registerRoute(method, this.normalizePath(path), [
				...this.groupMiddlewares,
				...handlers,
			]);
		}
		return this;
	}

	/**
	 * Register a WebSocket endpoint within this group.
	 * Path is prefixed with the group prefix.
	 */
	public ws(path: string, handler: WSHandler<DI>): this {
		this.app.ws(this.normalizePath(path), handler);
		return this;
	}

	/**
	 * Serve static files within this group.
	 * Route path is prefixed with the group prefix.
	 */
	public static(routePath: string, directory: string): this {
		this.app.static(this.normalizePath(routePath), directory);
		return this;
	}

	/**
	 * Register a decorator-based controller within this group.
	 * The controller's prefix is combined with the group prefix.
	 *
	 * @example
	 * const api = app.group("/api/v1");
	 * api.registerController(UserController);
	 * // → routes registered as /api/v1/users, /api/v1/users/:id, etc.
	 */
	public registerController<T extends object>(
		// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
		target: (new (...args: any[]) => T) | T,
	): this {
		const isInstance =
			typeof target === "object" &&
			target !== null &&
			typeof target === "object";

		const ControllerClass = isInstance
			? // biome-ignore lint/suspicious/noExplicitAny: dynamic type narrowing
				(target as any).constructor
			: // biome-ignore lint/suspicious/noExplicitAny: dynamic type narrowing
				(target as new (
					...args: any[]
				) => T);

		const meta = getControllerMeta(ControllerClass);
		if (!meta) {
			throw new Error(
				`${ControllerClass.name} is not decorated with @Controller — did you forget to add it?`,
			);
		}

		let instance: T;

		if (isInstance) {
			instance = target as T;
		} else {
			const container = this.app.getContainer();
			if (container) {
				instance = container.resolve<T>(ControllerClass);
			} else {
				instance = new ControllerClass();
			}
		}

		const normalizedPrefix = meta.prefix.endsWith("/")
			? meta.prefix.slice(0, -1)
			: meta.prefix;

		for (const route of meta.routes) {
			const cleanPath = route.path === "/" ? "" : route.path;
			const fullPath =
				`${this.normalizePath(normalizedPrefix)}${cleanPath}` || "/";
			// biome-ignore lint/suspicious/noExplicitAny: dynamic method dispatch by decorated property key
			const handler = (instance as any)[route.propertyKey].bind(
				instance,
			) as Handler<DI>;

			this.app.registerRoute(route.method, fullPath, [
				...(route.middlewares as Middleware<DI>[]),
				...this.groupMiddlewares,
				handler,
			]);
		}

		return this;
	}
}
