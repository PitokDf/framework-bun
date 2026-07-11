import type { Context } from "../context";

type RouteHandler<DI = Record<string, unknown>> = (
	ctx: Context<DI>,
) => Promise<Response>;

export function asyncHandler<DI = Record<string, unknown>>(
	handler: (ctx: Context<DI>) => Promise<Response | undefined>,
): RouteHandler<DI> {
	return async (ctx: Context<DI>): Promise<Response> => {
		try {
			const result = await handler(ctx);
			return result ?? new Response(null, { status: 204 });
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Internal Server Error";
			const status = error instanceof HttpError ? error.status : 500;

			return ctx.error(message, status);
		}
	};
}

export class HttpError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
		this.name = "HttpError";
	}
}

export class NotFoundError extends HttpError {
	constructor(message = "Not Found") {
		super(404, message);
		this.name = "NotFoundError";
	}
}

export class BadRequestError extends HttpError {
	constructor(message = "Bad Request") {
		super(400, message);
		this.name = "BadRequestError";
	}
}

export class UnauthorizedError extends HttpError {
	constructor(message = "Unauthorized") {
		super(401, message);
		this.name = "UnauthorizedError";
	}
}

export class ForbiddenError extends HttpError {
	constructor(message = "Forbidden") {
		super(403, message);
		this.name = "ForbiddenError";
	}
}
