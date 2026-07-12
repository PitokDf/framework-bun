import { z } from "zod";
import type { Middleware } from "../app";

export interface ValidatorSchema {
	parse: (data: unknown) => unknown;
}

export interface ValidateOptions {
	body?: ValidatorSchema;
	params?: ValidatorSchema;
}

/** @deprecated Prefer `zValidator()`, which gives you `ctx.valid()` with full type inference. */
export const validate = (schemas: ValidateOptions): Middleware => {
	return async (ctx, next) => {
		const errors: string[] = [];

		if (schemas.body) {
			try {
				const bodyData = await ctx.body();
				ctx.store.validatedBody = schemas.body.parse(bodyData);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : "Invalid body";
				errors.push(`body: ${message}`);
			}
		}

		if (schemas.params) {
			try {
				ctx.store.validatedParams = schemas.params.parse(ctx.params);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : "Invalid params";
				errors.push(`params: ${message}`);
			}
		}

		if (errors.length > 0) {
			return ctx.json(
				{
					error: "Validation Failed",
					details: errors,
				},
				400,
			);
		}

		return next();
	};
};

/** @deprecated Prefer `zValidator("body", schema)`. */
export const validateBody = (schema: ValidatorSchema): Middleware => {
	return validate({ body: schema });
};

/** @deprecated Prefer `zValidator("params", schema)`. */
export const validateParams = (schema: ValidatorSchema): Middleware => {
	return validate({ params: schema });
};

export type ValidationTarget = "body" | "query" | "params";

export type SchemaType = z.ZodType | Record<string, z.ZodTypeAny>;

function wrapSchema(schema: SchemaType): z.ZodType {
	// biome-ignore lint/suspicious/noExplicitAny: Required to check internal Zod fields
	return schema instanceof z.ZodType || (schema as any)?._def
		? (schema as z.ZodType)
		: z.object(schema as Record<string, z.ZodTypeAny>);
}

/**
 * Validate request body/query/params against a Zod schema and expose the
 * parsed, typed result via `ctx.valid(target)` — no manual casting needed.
 *
 * ```ts
 * const schema = z.object({ name: z.string(), age: z.number() });
 *
 * app.post("/users", zValidator("body", schema), (ctx) => {
 *   const data = ctx.valid<z.infer<typeof schema>>("body"); // fully typed
 *   return ctx.json(data);
 * });
 * ```
 *
 * On failure, responds with 400 and Zod's flattened error details — the
 * handler never runs, so no need to re-check inside it.
 */
export function zValidator(
	target: ValidationTarget,
	schema: SchemaType,
): Middleware {
	const finalSchema = wrapSchema(schema);
	const middleware: Middleware = async (ctx, next) => {
		let raw: unknown;

		if (target === "body") {
			try {
				raw = await ctx.body();
			} catch {
				return ctx.error("Validation Failed", 400, ["body: invalid JSON"]);
			}
		} else if (target === "query") {
			raw = ctx.query;
		} else {
			raw = ctx.params;
		}

		const result = finalSchema.safeParse(raw);
		if (!result.success) {
			return ctx.error(
				"Validation Failed",
				400,
				result.error.issues.map(
					(issue) => `${target}.${issue.path.join(".")}: ${issue.message}`,
				),
			);
		}

		ctx.setValidated(target, result.data);

		return next();
	};

	// Attach metadata for OpenAPI generation
	const mwMeta = middleware as unknown as Record<string, unknown>;
	mwMeta._isBuntokValidator = true;
	mwMeta._target = target;
	mwMeta._schema = finalSchema;

	return middleware;
}

/**
 * Document the response schema for OpenAPI.
 * Note: Currently this is for documentation purposes only and does not perform runtime response validation.
 */
export function zResponse(
	status: number,
	schema: SchemaType,
	description: string = "Success",
): Middleware {
	const finalSchema = wrapSchema(schema);

	// Wrap in standard Buntok response envelope
	const envelopedSchema = z.object({
		success: z.boolean(),
		message: z.string(),
		data: finalSchema,
	});

	const middleware: Middleware = async (_ctx, next) => {
		return next();
	};

	// Attach metadata for OpenAPI generation
	const mwMeta = middleware as unknown as Record<string, unknown>;
	mwMeta._isBuntokResponse = true;
	mwMeta._status = status;
	mwMeta._schema = envelopedSchema;
	mwMeta._description = description;

	return middleware;
}
