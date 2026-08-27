/**
 * Role-Based Access Control (RBAC) middleware.
 *
 * @example
 * ```ts
 * import { requireRole, requirePermission } from "buntok";
 *
 * // Require specific role
 * app.get("/admin", requireAuth(secret), requireRole("admin"), adminHandler);
 *
 * // Require any of multiple roles
 * app.get("/mod", requireAuth(secret), requireRole("admin", "moderator"), modHandler);
 *
 * // Require specific permission
 * app.delete("/users/:id", requireAuth(secret), requirePermission("users:delete"), deleteUser);
 *
 * // Custom role resolver
 * app.use(requireRole({
 *   resolver: (user) => user.roles,  // extract roles from JWT payload
 *   roles: ["admin"],
 * }));
 * ```
 */

type UserWithRoles = {
	role?: string;
	roles?: string[];
	[key: string]: any;
};

export interface RequireRoleOptions {
	/** Extract roles from user object. Default: (user) => user.role || user.roles */
	resolver?: (user: any) => string | string[] | undefined;

	/** Required roles (user must have at least one) */
	roles: string[];

	/** Custom error message */
	message?: string;
}

/**
 * Middleware that requires the user to have at least one of the specified roles.
 * Must be used AFTER requireAuth middleware.
 */
export function requireRole(
	...roles: string[]
): (
	ctx: any,
	next: () => Promise<Response> | Response,
) => Promise<Response> | Response;
export function requireRole(
	options: RequireRoleOptions,
): (
	ctx: any,
	next: () => Promise<Response> | Response,
) => Promise<Response> | Response;
export function requireRole(
	...args: any[]
): (
	ctx: any,
	next: () => Promise<Response> | Response,
) => Promise<Response> | Response {
	// Parse arguments
	let options: RequireRoleOptions;
	if (
		args.length === 1 &&
		typeof args[0] === "object" &&
		!Array.isArray(args[0])
	) {
		options = args[0];
	} else {
		options = { roles: args.flat() };
	}

	const { roles: requiredRoles, resolver, message } = options;

	return async (ctx, next) => {
		const user = ctx.user as UserWithRoles | undefined;

		if (!user) {
			return ctx.json(
				{ success: false, message: "Authentication required" },
				401,
			);
		}

		// Resolve user roles
		let userRoles: string[];
		if (resolver) {
			const resolved = resolver(user);
			userRoles = Array.isArray(resolved)
				? resolved
				: resolved
					? [resolved]
					: [];
		} else {
			userRoles = [];
			if (user.role) userRoles.push(user.role);
			if (user.roles) userRoles.push(...user.roles);
		}

		// Check if user has any required role
		const hasRole = requiredRoles.some((r) => userRoles.includes(r));

		if (!hasRole) {
			return ctx.json(
				{
					success: false,
					error: "Forbidden",
					message: message ?? `Requires one of: ${requiredRoles.join(", ")}`,
				},
				403,
			);
		}

		return next();
	};
}

export interface RequirePermissionOptions {
	/** Extract permissions from user object. Default: (user) => user.permissions */
	resolver?: (user: any) => string[] | undefined;

	/** Required permissions (user must have ALL) */
	permissions: string[];

	/** Custom error message */
	message?: string;
}

/**
 * Middleware that requires the user to have ALL specified permissions.
 * Must be used AFTER requireAuth middleware.
 */
export function requirePermission(
	...permissions: string[]
): (
	ctx: any,
	next: () => Promise<Response> | Response,
) => Promise<Response> | Response;
export function requirePermission(
	options: RequirePermissionOptions,
): (
	ctx: any,
	next: () => Promise<Response> | Response,
) => Promise<Response> | Response;
export function requirePermission(
	...args: any[]
): (
	ctx: any,
	next: () => Promise<Response> | Response,
) => Promise<Response> | Response {
	let options: RequirePermissionOptions;
	if (
		args.length === 1 &&
		typeof args[0] === "object" &&
		!Array.isArray(args[0])
	) {
		options = args[0];
	} else {
		options = { permissions: args.flat() };
	}

	const { permissions: requiredPermissions, resolver, message } = options;

	return async (ctx, next) => {
		const user = ctx.user as UserWithRoles | undefined;

		if (!user) {
			return ctx.json(
				{ success: false, message: "Authentication required" },
				401,
			);
		}

		// Resolve user permissions
		let userPermissions: string[];
		if (resolver) {
			userPermissions = resolver(user) ?? [];
		} else {
			userPermissions = (user as any).permissions ?? [];
		}

		// Check if user has all required permissions
		const hasAll = requiredPermissions.every((p) =>
			userPermissions.includes(p),
		);

		if (!hasAll) {
			const missing = requiredPermissions.filter(
				(p) => !userPermissions.includes(p),
			);
			return ctx.json(
				{
					success: false,
					error: "Forbidden",
					message: message ?? `Missing permissions: ${missing.join(", ")}`,
				},
				403,
			);
		}

		return next();
	};
}
