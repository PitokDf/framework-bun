import { describe, it, expect } from "bun:test";
import {
	asyncHandler,
	HttpError,
	NotFoundError,
	BadRequestError,
	UnauthorizedError,
	ForbiddenError,
	ConflictError,
	UnprocessableEntityError,
	TooManyRequestsError,
	InternalServerError,
	ServiceUnavailableError,
} from "../src/helpers/async-handler";
import { Context } from "../src/context";

function createMockContext(): Context {
	const req = new Request("http://localhost/test");
	return new Context(req, {
		params: {},
		query: {},
	});
}

function getStatusText(status: number): string {
	const map: Record<number, string> = {
		400: "Bad Request",
		401: "Unauthorized",
		403: "Forbidden",
		404: "Not Found",
		405: "Method Not Allowed",
		409: "Conflict",
		422: "Unprocessable Entity",
		429: "Too Many Requests",
		500: "Internal Server Error",
		503: "Service Unavailable",
	};
	return map[status] || "Internal Server Error";
}

describe("asyncHandler", () => {
	it("should return 204 when handler returns undefined", async () => {
		const handler = asyncHandler(async () => undefined);
		const ctx = createMockContext();
		const res = await handler(ctx);
		expect(res.status).toBe(204);
	});

	it("should return handler response when successful", async () => {
		const handler = asyncHandler(async (ctx) => {
			return ctx.success({ ok: true });
		});
		const ctx = createMockContext();
		const res = await handler(ctx);
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
	});

	it("should catch NotFoundError and return 404 with error name", async () => {
		const handler = asyncHandler(async () => {
			throw new NotFoundError("User tidak ditemukan");
		});
		const ctx = createMockContext();
		const res = await handler(ctx);
		const body = await res.json();

		expect(res.status).toBe(404);
		expect(body.error).toBe("Not Found");
		expect(body.success).toBe(false);
	});

	it("should catch BadRequestError and return 400 with error name", async () => {
		const handler = asyncHandler(async () => {
			throw new BadRequestError("Data tidak valid");
		});
		const ctx = createMockContext();
		const res = await handler(ctx);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toBe("Bad Request");
		expect(body.success).toBe(false);
	});

	it("should catch UnauthorizedError and return 401 with error name", async () => {
		const handler = asyncHandler(async () => {
			throw new UnauthorizedError("Token expired");
		});
		const ctx = createMockContext();
		const res = await handler(ctx);
		const body = await res.json();

		expect(res.status).toBe(401);
		expect(body.error).toBe("Unauthorized");
		expect(body.success).toBe(false);
	});

	it("should catch ForbiddenError and return 403 with error name", async () => {
		const handler = asyncHandler(async () => {
			throw new ForbiddenError("Akses ditolak");
		});
		const ctx = createMockContext();
		const res = await handler(ctx);
		const body = await res.json();

		expect(res.status).toBe(403);
		expect(body.error).toBe("Forbidden");
		expect(body.success).toBe(false);
	});

	it("should catch ConflictError and return 409 with error name", async () => {
		const handler = asyncHandler(async () => {
			throw new ConflictError("Email sudah terdaftar");
		});
		const ctx = createMockContext();
		const res = await handler(ctx);
		const body = await res.json();

		expect(res.status).toBe(409);
		expect(body.error).toBe("Conflict");
		expect(body.success).toBe(false);
	});

	it("should catch UnprocessableEntityError and return 422 with error name", async () => {
		const handler = asyncHandler(async () => {
			throw new UnprocessableEntityError("Validation failed");
		});
		const ctx = createMockContext();
		const res = await handler(ctx);
		const body = await res.json();

		expect(res.status).toBe(422);
		expect(body.error).toBe("Unprocessable Entity");
		expect(body.success).toBe(false);
	});

	it("should catch TooManyRequestsError and return 429 with error name", async () => {
		const handler = asyncHandler(async () => {
			throw new TooManyRequestsError("Rate limit exceeded");
		});
		const ctx = createMockContext();
		const res = await handler(ctx);
		const body = await res.json();

		expect(res.status).toBe(429);
		expect(body.error).toBe("Too Many Requests");
		expect(body.success).toBe(false);
	});

	it("should catch InternalServerError and return 500 with error name", async () => {
		const handler = asyncHandler(async () => {
			throw new InternalServerError("Database connection failed");
		});
		const ctx = createMockContext();
		const res = await handler(ctx);
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body.error).toBe("Internal Server Error");
		expect(body.success).toBe(false);
	});

	it("should catch ServiceUnavailableError and return 503 with error name", async () => {
		const handler = asyncHandler(async () => {
			throw new ServiceUnavailableError("Maintenance mode");
		});
		const ctx = createMockContext();
		const res = await handler(ctx);
		const body = await res.json();

		expect(res.status).toBe(503);
		expect(body.error).toBe("Service Unavailable");
		expect(body.success).toBe(false);
	});

	it("should catch unknown error and return 500", async () => {
		const handler = asyncHandler(async () => {
			throw "something weird";
		});
		const ctx = createMockContext();
		const res = await handler(ctx);
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body.error).toBe("Internal Server Error");
		expect(body.success).toBe(false);
	});
});
