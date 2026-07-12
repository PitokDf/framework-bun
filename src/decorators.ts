import type { Middleware } from "./app";
import type { Context } from "./context";

/**
 * Decorator-based controller routing, built on Stage 3 (TC39) decorators —
 * the same kind natively supported by Bun/TypeScript 5+ without setting
 * `experimentalDecorators`.
 *
 * This is a thin layer on top of the existing functional API: decorators
 * only run once at class-definition/bootstrap time, and end up calling the
 * exact same `app.registerRoute()` used by `app.get()`/`app.post()`. There
 * is zero per-request overhead — the router has no idea (and doesn't care)
 * whether a route came from a decorator or a direct `.get()` call.
 *
 * ```ts
 * @Controller("/users")
 * class UserController {
 *   @Get("/:id")
 *   getUser(ctx: Context) {
 *     return ctx.json({ id: ctx.params.id });
 *   }
 *
 *   @Post("/")
 *   @Use(zValidator("body", createUserSchema))
 *   createUser(ctx: Context) {
 *     const data = ctx.valid<{ name: string }>("body");
 *     return ctx.json(data, 201);
 *   }
 * }
 *
 * app.registerController(UserController);
 * ```
 */

interface RouteMeta {
	method: string;
	path: string;
	propertyKey: string;
	middlewares: Middleware[];
}

interface ControllerMeta {
	prefix: string;
	routes: RouteMeta[];
}

let pendingRoutes: RouteMeta[] = [];

// biome-ignore lint/complexity/noBannedTypes: Native Decorator API uses Function
const controllerRegistry = new WeakMap<Function, ControllerMeta>();

type MethodDecoratorFn = (
	// biome-ignore lint/suspicious/noExplicitAny: Required for TS method decorator contravariance
	originalMethod: (...args: any[]) => any,
	context: ClassMethodDecoratorContext,
) => void;

function createRouteDecorator(method: string) {
	return (path: string): MethodDecoratorFn => {
		return (_originalMethod, context) => {
			if (context.kind !== "method") {
				throw new Error(`@${method} can only decorate methods`);
			}
			const propertyKey = String(context.name);
			const entry = pendingRoutes.find((r) => r.propertyKey === propertyKey);
			if (entry) {
				entry.method = method;
				entry.path = path;
			} else {
				pendingRoutes.push({
					method,
					path,
					propertyKey,
					middlewares: [],
				});
			}
		};
	};
}

export const Get = createRouteDecorator("GET");
export const Post = createRouteDecorator("POST");
export const Put = createRouteDecorator("PUT");
export const Patch = createRouteDecorator("PATCH");
export const Delete = createRouteDecorator("DELETE");
export const Options = createRouteDecorator("OPTIONS");
export const Head = createRouteDecorator("HEAD");
export const Query = createRouteDecorator("QUERY");

/**
 * Matches ALL HTTP methods. Useful for catch-all handlers or proxies.
 * Note: more specific method decorators (@Get, @Post, etc.) registered on the
 * same path will take precedence in the AOT-compiled router.
 */
export const All = createRouteDecorator("ALL");

/**
 * Attach middleware to a single decorated route. Stack multiple `@Use()`
 * calls to chain several — they run in the order listed, same as passing
 * multiple middleware args to `app.get(path, mw1, mw2, handler)`.
 */
export function Use(middleware: Middleware): MethodDecoratorFn {
	return (_originalMethod, context) => {
		if (context.kind !== "method") {
			throw new Error("@Use can only decorate methods");
		}
		const propertyKey = String(context.name);
		let entry = pendingRoutes.find((r) => r.propertyKey === propertyKey);
		if (!entry) {
			entry = { method: "", path: "", propertyKey, middlewares: [] };
			pendingRoutes.push(entry);
		}
		entry.middlewares.unshift(middleware);
	};
}

export type GuardFn<DI = Record<string, unknown>> = (
	ctx: Context<DI>,
) => boolean | Promise<boolean>;

/**
 * Apply one or more guards to a controller method.
 * A guard is a function that returns a boolean. If it returns false,
 * the request is rejected with a 403 Forbidden.
 */
export function UseGuard<DI = Record<string, unknown>>(
	...guards: GuardFn<DI>[]
) {
	// biome-ignore lint/suspicious/noExplicitAny: Required for internal Context bypass
	return Use(async (ctx: any, next: any) => {
		for (const guard of guards) {
			const passed = await guard(ctx);
			if (!passed) {
				return ctx.error("Forbidden resource", 403);
			}
		}
		return next();
	});
}

/**
 * Marks a class as a controller and registers its accumulated `@Get`/
 * `@Post`/etc. routes under `prefix`. Must be the outermost (topmost)
 * decorator on the class so it runs after all method decorators have
 * populated the pending route list.
 */
export function Controller(prefix = "") {
	// biome-ignore lint/complexity/noBannedTypes: Native Decorator API uses Function
	return (target: Function, context: ClassDecoratorContext): void => {
		if (context.kind !== "class") {
			throw new Error("@Controller can only decorate classes");
		}
		const routes = pendingRoutes.filter((r) => r.method !== "");
		pendingRoutes = [];
		controllerRegistry.set(target, { prefix, routes });
	};
}

/**
 * Reads the routes registered on a `@Controller`-decorated class. Used
 * internally by `App.registerController()`.
 */
export function getControllerMeta(
	// biome-ignore lint/complexity/noBannedTypes: Native Decorator API uses Function
	ControllerClass: Function,
): ControllerMeta | undefined {
	return controllerRegistry.get(ControllerClass);
}
