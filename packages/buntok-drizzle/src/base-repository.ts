/**
 * BaseRepository for Drizzle ORM
 *
 * @example
 * ```ts
 * import { drizzle } from "drizzle-orm/bun-sqlite";
 * import { BaseRepository } from "@buntok/drizzle";
 * import { users, posts } from "./db/schema";
 * import type { DrizzleDB } from "./db";
 *
 * interface CreateUserInput {
 *   name: string;
 *   email: string;
 * }
 *
 * interface UpdateUserInput {
 *   name?: string;
 *   email?: string;
 * }
 *
 * class UserRepository extends BaseRepository<typeof users, CreateUserInput, UpdateUserInput, DrizzleDB> {
 *   constructor(db: DrizzleDB) {
 *     super(db, users);
 *   }
 *
 *   async findWithPosts() {
 *     return this.db.query.users.findMany({ // ✅ akses multi-table
 *       with: { posts: true }
 *     });
 *   }
 * }
 * ```
 */
import { eq, count as drizzleCount } from "drizzle-orm";
import type { Table } from "drizzle-orm";

export abstract class BaseRepository<TTable extends Table, CreateInput, UpdateInput, TDb extends Record<string, any> = Record<string, any>> {
	protected db: TDb;
	protected table: TTable;

	constructor(db: TDb, table: TTable) {
		this.db = db;
		this.table = table;
	}

	private get tableName(): string {
		return this.table[Symbol.for("drizzle:Name")];
	}

	async findAll(): Promise<any[]> {
		return this.db.query[this.tableName].findMany();
	}

	async findById(id: number | string): Promise<any | null> {
		return this.db.query[this.tableName].findFirst({
			where: eq(this.table.id, id),
		});
	}

	async findOne(where: Record<string, any>): Promise<any | null> {
		return this.db.query[this.tableName].findFirst({ where });
	}

	async create(data: CreateInput): Promise<any> {
		const [result] = await this.db
			.insert(this.table)
			.values(data)
			.returning();
		return result;
	}

	async createMany(data: CreateInput[]): Promise<any[]> {
		return this.db.insert(this.table).values(data).returning();
	}

	async update(id: number | string, data: UpdateInput): Promise<any> {
		const [result] = await this.db
			.update(this.table)
			.set(data)
			.where(eq(this.table.id, id))
			.returning();
		return result;
	}

	async delete(id: number | string): Promise<void> {
		await this.db.delete(this.table).where(eq(this.table.id, id));
	}

	async count(): Promise<number> {
		const [result] = await this.db
			.select({ value: drizzleCount() })
			.from(this.table);
		return result?.value ?? 0;
	}

	async exists(where: Record<string, any>): Promise<boolean> {
		const [result] = await this.db
			.select({ value: drizzleCount() })
			.from(this.table)
			.where(where);
		return (result?.value ?? 0) > 0;
	}
}
