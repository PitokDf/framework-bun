import type { Middleware } from "../app";

export interface CorsOptions {
	origin?: string | string[] | ((origin: string) => boolean);
	methods?: string[];
	headers?: string[];
	credentials?: boolean;
}

export const cors = (options: CorsOptions = {}): Middleware => {
	return async (ctx, next) => {
		const requestOrigin = ctx.request.headers.get("Origin") || "*";
		let allowedOrigin = "*";

		if (typeof options.origin === "function") {
			allowedOrigin = options.origin(requestOrigin) ? requestOrigin : "";
		} else if (Array.isArray(options.origin)) {
			allowedOrigin = options.origin.includes(requestOrigin)
				? requestOrigin
				: "";
		} else if (options.origin) {
			allowedOrigin = options.origin;
		}

		if (ctx.request.method === "OPTIONS") {
			const res = new Response(null, { status: 204 });
			res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
			res.headers.set(
				"Access-Control-Allow-Methods",
				(
					options.methods || [
						"GET",
						"POST",
						"PUT",
						"DELETE",
						"PATCH",
						"OPTIONS",
					]
				).join(","),
			);
			res.headers.set(
				"Access-Control-Allow-Headers",
				(
					options.headers || ["Content-Type", "Authorization", "x-api-key"]
				).join(","),
			);
			if (options.credentials)
				res.headers.set("Access-Control-Allow-Credentials", "true");
			res.headers.set("X-Powered-By", "Buntok");
			return res;
		}

		const response = await next();

		response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
		response.headers.set("X-Powered-By", "Buntok");
		if (options.credentials)
			response.headers.set("Access-Control-Allow-Credentials", "true");

		return response;
	};
};
