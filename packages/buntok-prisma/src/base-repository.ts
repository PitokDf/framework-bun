/**
 * BaseRepository for Prisma ORM
 *
 * @example
 * ```ts
 * import type { PrismaClient } from "../../prisma/generated/client";
 * import { BaseRepository } from "@buntok/prisma";
 *
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * // Simple usage (no input types needed)
 * class UserRepository extends BaseRepository<User, PrismaClient> {
 *   constructor(prisma: PrismaClient) {
 *     super(prisma, "user");
 *   }
 *
 *   async findByEmail(email: string) {
 *     return this.delegate.findUnique({ where: { email } });
 *   }
 * }
 *
 * // With typed inputs (optional)
 * import type { Prisma } from "../../prisma/generated/client";
 * class UserRepository extends BaseRepository<User, PrismaClient, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
 *   constructor(prisma: PrismaClient) {
 *     super(prisma, "user");
 *   }
 *
 *   // Hook: runs before creating a record
 *   protected async beforeCreate(data: Prisma.UserCreateInput) {
 *     data.email = data.email.toLowerCase();
 *     return data;
 *   }
 *
 *   // Hook: runs after creating a record
 *   protected async afterCreate(user: User) {
 *     console.log(`User created: ${user.id}`);
 *   }
 * }
 * ```
 */

export interface RepositoryHooks<T, CreateInput, UpdateInput> {
	beforeCreate?: (data: CreateInput) => Promise<CreateInput> | CreateInput;
	afterCreate?: (result: T) => Promise<void> | void;
	beforeUpdate?: (id: string | number, data: UpdateInput) => Promise<UpdateInput> | UpdateInput;
	afterUpdate?: (id: string | number, result: T) => Promise<void> | void;
	beforeDelete?: (id: string | number) => Promise<void> | void;
	afterDelete?: (id: string | number) => Promise<void> | void;
}

export abstract class BaseRepository<T, TPrismaClient extends Record<string, any> = Record<string, any>, CreateInput = any, UpdateInput = any> {
	protected prisma: TPrismaClient;
	protected model: string;

	constructor(prisma: TPrismaClient, model: string) {
		this.prisma = prisma;
		this.model = model;
	}

	protected get delegate() {
		return this.prisma[this.model] as any;
	}

	// ─── Hooks (override in subclass) ────────────────────────────────────

	/** Called before inserting a record. Return modified data or throw to abort. */
	protected async beforeCreate(data: CreateInput): Promise<CreateInput> {
		return data;
	}

	/** Called after inserting a record. */
	protected async afterCreate(_result: T): Promise<void> {}

	/** Called before updating a record. Return modified data or throw to abort. */
	protected async beforeUpdate(_id: string | number, data: UpdateInput): Promise<UpdateInput> {
		return data;
	}

	/** Called after updating a record. */
	protected async afterUpdate(_id: string | number, _result: T): Promise<void> {}

	/** Called before deleting a record. Throw to abort deletion. */
	protected async beforeDelete(_id: string | number): Promise<void> {}

	/** Called after deleting a record. */
	protected async afterDelete(_id: string | number): Promise<void> {}

	// ─── CRUD Methods ────────────────────────────────────────────────────

	async findAll(): Promise<T[]> {
		return this.delegate.findMany();
	}

	async findById(id: string | number): Promise<T | null> {
		return this.delegate.findUnique({ where: { id } });
	}

	async findOne(where: Record<string, any>): Promise<T | null> {
		return this.delegate.findFirst({ where });
	}

	async create(data: CreateInput): Promise<T> {
		const modifiedData = await this.beforeCreate(data);
		const result = await this.delegate.create({ data: modifiedData });
		await this.afterCreate(result);
		return result;
	}

	async update(id: string | number, data: UpdateInput): Promise<T> {
		const modifiedData = await this.beforeUpdate(id, data);
		const result = await this.delegate.update({ where: { id }, data: modifiedData });
		await this.afterUpdate(id, result);
		return result;
	}

	async delete(id: string | number): Promise<T> {
		await this.beforeDelete(id);
		const result = await this.delegate.delete({ where: { id } });
		await this.afterDelete(id);
		return result;
	}

	async count(): Promise<number> {
		return this.delegate.count();
	}

	async exists(where: Record<string, any>): Promise<boolean> {
		const count = await this.delegate.count({ where });
		return count > 0;
	}
}
