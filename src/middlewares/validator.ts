import type { Middleware } from "../app";

export interface ValidatorSchema {
	parse: (data: unknown) => unknown;
}

export interface ValidateOptions {
	body?: ValidatorSchema;
	params?: ValidatorSchema;
}

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

// Convenience functions
export const validateBody = (schema: ValidatorSchema): Middleware => {
	return validate({ body: schema });
};

export const validateParams = (schema: ValidatorSchema): Middleware => {
	return validate({ params: schema });
};
