import { join } from "node:path";
import { Context } from "./context";
import { logger } from "./logger";
import { Router } from "./router";

export type Handler<DI = Record<string, unknown>> = (
	ctx: Context<DI>,
) => Response | Promise<Response>;
export type Middleware<DI = Record<string, unknown>> = (
	ctx: Context<DI>,
	next: () => Promise<Response> | Response,
) => Response | Promise<Response>;
export type ErrorHandler<DI = Record<string, unknown>> = (
	err: Error,
	ctx: Context<DI>,
) => Response | Promise<Response>;
export type NotFoundHandler<DI = Record<string, unknown>> = (
	ctx: Context<DI>,
) => Response | Promise<Response>;

export class App<DI extends Record<string, unknown> = Record<string, unknown>> {
	private router: Router;
	private middlewares: Middleware<DI>[] = [];
	private iconPath: string = "./public/favicon.ico";
	private isListening: boolean = false;
	private state: Map<string, unknown> = new Map();

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
		this.state.set(key as string, value);
		return this;
	}

	public group(prefix: string): RouterGroup<DI> {
		return new RouterGroup<DI>(prefix, this);
	}

	public onError(handler: ErrorHandler<DI>): this {
		this.customErrorHandler = handler;
		return this;
	}

	public notFound(handler: NotFoundHandler<DI>): this {
		this.customNotFoundHandler = handler;
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
		return join(import.meta.dir, "..", "public", "favicon.ico");
	}

	public get(path: string, handler: Handler<DI>): this;
	public get(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public get(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public get(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public get(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public get(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		m5: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public get(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.registerRoute("GET", path, handlers);
		return this;
	}

	public post(path: string, handler: Handler<DI>): this;
	public post(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public post(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public post(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public post(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public post(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		m5: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public post(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.registerRoute("POST", path, handlers);
		return this;
	}

	public put(path: string, handler: Handler<DI>): this;
	public put(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public put(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public put(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public put(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public put(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		m5: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public put(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.registerRoute("PUT", path, handlers);
		return this;
	}

	public delete(path: string, handler: Handler<DI>): this;
	public delete(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public delete(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public delete(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public delete(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public delete(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		m5: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public delete(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.registerRoute("DELETE", path, handlers);
		return this;
	}

	public options(path: string, handler: Handler<DI>): this;
	public options(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public options(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public options(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public options(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public options(
		path: string,
		m1: Middleware<DI>,
		m2: Middleware<DI>,
		m3: Middleware<DI>,
		m4: Middleware<DI>,
		m5: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public options(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.registerRoute("OPTIONS", path, handlers);
		return this;
	}

	// QUERY method - like GET but with body support
	// Idempotent, safe, cacheable - for complex read operations
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

	public static(routePath: string, directory: string): this {
		const handler: Handler<DI> = async (ctx) => {
			const filePath = ctx.params["*"] || "";
			const absolutePath = `${process.cwd()}/${directory}/${filePath}`;
			const file = Bun.file(absolutePath);

			if (await file.exists()) {
				return new Response(file);
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
		const mainHandler = handlers.pop() as Handler<DI>;
		const routeMiddlewares = handlers as Middleware<DI>[];

		const executionChain = (ctx: Context<DI>): Response | Promise<Response> => {
			return this.runPipeline(ctx, routeMiddlewares, mainHandler);
		};

		this.router.insert(method, path, executionChain);
	}

	private runPipeline(
		ctx: Context<DI>,
		middlewares: Middleware<DI>[],
		finalHandler: Handler<DI>,
	): Response | Promise<Response> {
		let index = 0;

		const next = (): Response | Promise<Response> => {
			if (index < middlewares.length) {
				const middleware = middlewares[index] as Middleware<DI>;
				index++;
				const result = middleware(ctx, next);
				if (result instanceof Promise) return result;
				return result;
			}
			const result = finalHandler(ctx);
			if (result instanceof Promise) return result;
			return result;
		};

		return next();
	}

	private extractPathname(url: string): string {
		// Skip protocol + authority (http://localhost:1212)
		const start = url.indexOf("/", url.indexOf("//") + 2);
		if (start === -1) return "/";
		let end = url.indexOf("?", start);
		if (end === -1) end = url.length;
		return url.substring(start, end);
	}

	public handleRequest(request: Request): Response | Promise<Response> {
		const pathname = this.extractPathname(request.url);
		const route = this.router.find(request.method, pathname);

		const ctx = new Context(request, route.params, this.state) as Context<DI>;

		let finalHandler = route.handler as Handler<DI>;
		if (!finalHandler) {
			finalHandler = this.customNotFoundHandler;
		}

		const handler = (response: Response): Response => {
			logger.info(`${request.method} ${pathname}`, {
				status: response.status,
			});
			return response;
		};

		const errorHandler = (err: unknown): Response | Promise<Response> => {
			const errorObj = err instanceof Error ? err : new Error(String(err));
			logger.error(`${request.method} ${pathname}`, {
				error: errorObj.message,
			});
			return this.customErrorHandler(errorObj, ctx);
		};

		// Fast path: no app-level middlewares
		if (this.middlewares.length === 0) {
			try {
				const result = finalHandler(ctx);
				if (result instanceof Promise) {
					return result.then(handler).catch(errorHandler);
				}
				return handler(result);
			} catch (err) {
				return errorHandler(err);
			}
		}

		try {
			const result = this.runPipeline(ctx, this.middlewares, finalHandler);
			if (result instanceof Promise) {
				return result.then(handler).catch(errorHandler);
			}
			return handler(result);
		} catch (err) {
			return errorHandler(err);
		}
	}

	public listen(port?: number, callback?: () => void): void {
		if (this.isListening) return;
		this.isListening = true;

		const finalPort = port || Number(process.env.PORT) || 1212;

		Bun.serve({
			port: finalPort,
			fetch: (request: Request) => this.handleRequest(request),
		});

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

	public get(path: string, handler: Handler<DI>): this;
	public get(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public get(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.app.registerRoute("GET", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
		return this;
	}

	public post(path: string, handler: Handler<DI>): this;
	public post(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public post(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.app.registerRoute("POST", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
		return this;
	}

	public put(path: string, handler: Handler<DI>): this;
	public put(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public put(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
	): this {
		this.app.registerRoute("PUT", this.normalizePath(path), [
			...this.groupMiddlewares,
			...handlers,
		]);
		return this;
	}

	public delete(path: string, handler: Handler<DI>): this;
	public delete(
		path: string,
		middleware: Middleware<DI>,
		handler: Handler<DI>,
	): this;
	public delete(
		path: string,
		...handlers: Array<Middleware<DI> | Handler<DI>>
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
