/**
 * Lightweight typed RPC client.
 *
 * buntok's `App` doesn't currently thread per-route generics through its
 * method overloads (every `app.get/post/...` uses a fixed `Handler<DI>`),
 * so this client can't auto-infer types from your route definitions the
 * way Hono's `hc()` does. Instead, you declare each route's shape once as
 * a `RouteContract`, and the client is fully typed from that declaration.
 * Zero changes needed on the server side, and no runtime cost added to
 * request handling — this only affects client-side code.
 *
 * ```ts
 * import { createClient, type RouteContract } from "buntok/client";
 *
 * const routes = {
 *   getUser: { method: "GET", path: "/users/:id" } as RouteContract<
 *     { id: string },
 *     undefined,
 *     undefined,
 *     { id: string; name: string }
 *   >,
 *   createUser: { method: "POST", path: "/users" } as RouteContract<
 *     undefined,
 *     undefined,
 *     { name: string },
 *     { id: string; name: string }
 *   >,
 * };
 *
 * const api = createClient(routes, "http://localhost:1212");
 *
 * const user = await api.getUser({ params: { id: "1" } }); // typed
 * const created = await api.createUser({ body: { name: "Tok" } }); // typed
 * ```
 */

export interface RouteContract<
	TParams = undefined,
	TQuery = undefined,
	TBody = undefined,
	TResponse = unknown,
> {
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
	/** Path template, e.g. "/users/:id" — `:params` are substituted at call time. */
	path: string;
	/** Type-only fields; never read at runtime, only used for inference. */
	params?: TParams;
	query?: TQuery;
	body?: TBody;
	response?: TResponse;
}

// biome-ignore lint/suspicious/noExplicitAny: contract map is intentionally open
type AnyContract = RouteContract<any, any, any, any>;

type CallArgs<C extends AnyContract> = (undefined extends C["params"]
	? { params?: never }
	: { params: C["params"] }) &
	(undefined extends C["query"]
		? { query?: C["query"] }
		: { query: C["query"] }) &
	(undefined extends C["body"] ? { body?: never } : { body: C["body"] });

type Client<T extends Record<string, AnyContract>> = {
	[K in keyof T]: (
		...args: CallArgs<T[K]> extends {
			params?: never;
			query?: never;
			body?: never;
		}
			? []
			: [CallArgs<T[K]>]
	) => Promise<T[K]["response"]>;
};

export interface CreateClientOptions {
	/** Extra headers sent on every request (e.g. Authorization). */
	headers?: Record<string, string>;
	/** Override the fetch implementation (useful for testing). */
	fetch?: typeof fetch;
}

export function createClient<T extends Record<string, AnyContract>>(
	contracts: T,
	baseUrl: string,
	options: CreateClientOptions = {},
): Client<T> {
	const doFetch = options.fetch ?? fetch;
	const client = {} as Client<T>;

	for (const key of Object.keys(contracts) as (keyof T)[]) {
		const contract = contracts[key] as AnyContract;

		// biome-ignore lint/suspicious/noExplicitAny: bridging the typed public API to a runtime implementation
		(client[key] as any) = async (args: any = {}) => {
			let path = contract.path;
			if (args.params) {
				for (const [k, v] of Object.entries(args.params)) {
					path = path.replace(`:${k}`, encodeURIComponent(String(v)));
				}
			}

			const url = new URL(path, baseUrl);
			if (args.query) {
				for (const [k, v] of Object.entries(args.query)) {
					if (v !== undefined) url.searchParams.set(k, String(v));
				}
			}

			const hasBody = args.body !== undefined;
			const response = await doFetch(url, {
				method: contract.method,
				headers: {
					...(hasBody ? { "Content-Type": "application/json" } : {}),
					...options.headers,
				},
				body: hasBody ? JSON.stringify(args.body) : undefined,
			});

			if (!response.ok) {
				throw new Error(
					`${contract.method} ${path} failed with status ${response.status}`,
				);
			}

			const contentType = response.headers.get("Content-Type") || "";
			if (contentType.includes("application/json")) {
				return response.json();
			}
			return response.text();
		};
	}

	return client;
}
