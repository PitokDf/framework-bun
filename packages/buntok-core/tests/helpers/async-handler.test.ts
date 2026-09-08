import { describe, it, expect } from "bun:test";
import {
	asyncHandler,
	HttpError,
	NotFoundError,
	BadRequestError,
	UnauthorizedError,
	ForbiddenError,
	MethodNotAllowedError,
	ConflictError,
	UnprocessableEntityError,
	TooManyRequestsError,
	InternalServerError,
	ServiceUnavailableError,
} from "../../src/helpers/async-handler";

function createMockContext(): any {
	return {
		json: (data: any, status = 200) =>
			new Response(JSON.stringify(data), { status }),
	};
}

describe("asyncHandler", () => {
	it("should return result as Response", async () => {
		const handler = asyncHandler(async () => "hello");
		const ctx = createMockContext();

		const result = await handler(ctx);
		expect(result).toBeInstanceOf(Response);
		expect(await result.text()).toBe("hello");
	});

	it("should convert object to JSON", async () => {
		const handler = asyncHandler(async () => ({ ok: true }));
		const ctx = createMockContext();

		const result = await handler(ctx);
		const body = await result.json();
		expect(body.ok).toBe(true);
	});

	it("should handle errors with 500", async () => {
		const handler = asyncHandler(async () => {
			throw new Error("boom");
		});
		const ctx = createMockContext();

		const result = await handler(ctx);
		expect(result.status).toBe(500);
		const body = await result.json();
		expect(body.error).toBe("Internal Server Error");
		expect(body.message).toBe("boom");
	});

	it("should handle HttpError with correct status", async () => {
		const handler = asyncHandler(async () => {
			throw new HttpError(422, "Invalid data");
		});
		const ctx = createMockContext();

		const result = await handler(ctx);
		expect(result.status).toBe(422);
		const body = await result.json();
		expect(body.error).toBe("Unprocessable Entity");
	});

	it("should handle NotFoundError", async () => {
		const handler = asyncHandler(async () => {
			throw new NotFoundError("Resource not found");
		});
		const ctx = createMockContext();

		const result = await handler(ctx);
		expect(result.status).toBe(404);
		const body = await result.json();
		expect(body.error).toBe("Not Found");
	});

	it("should handle BadRequestError", async () => {
		const handler = asyncHandler(async () => {
			throw new BadRequestError("Missing field");
		});
		const ctx = createMockContext();

		const result = await handler(ctx);
		expect(result.status).toBe(400);
	});
});

describe("Error classes", () => {
	it("BadRequestError should have status 400", () => {
		const err = new BadRequestError();
		expect(err.status).toBe(400);
		expect(err.name).toBe("BadRequestError");
	});

	it("UnauthorizedError should have status 401", () => {
		const err = new UnauthorizedError();
		expect(err.status).toBe(401);
	});

	it("ForbiddenError should have status 403", () => {
		const err = new ForbiddenError();
		expect(err.status).toBe(403);
	});

	it("NotFoundError should have status 404", () => {
		const err = new NotFoundError();
		expect(err.status).toBe(404);
	});

	it("MethodNotAllowedError should have status 405", () => {
		const err = new MethodNotAllowedError();
		expect(err.status).toBe(405);
	});

	it("ConflictError should have status 409", () => {
		const err = new ConflictError();
		expect(err.status).toBe(409);
	});

	it("UnprocessableEntityError should have status 422", () => {
		const err = new UnprocessableEntityError();
		expect(err.status).toBe(422);
	});

	it("TooManyRequestsError should have status 429", () => {
		const err = new TooManyRequestsError();
		expect(err.status).toBe(429);
	});

	it("InternalServerError should have status 500", () => {
		const err = new InternalServerError();
		expect(err.status).toBe(500);
	});

	it("ServiceUnavailableError should have status 503", () => {
		const err = new ServiceUnavailableError();
		expect(err.status).toBe(503);
	});
});
