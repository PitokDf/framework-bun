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

	/**
	 * Fields to exclude from responses (blacklist mode).
	 *
	 * @example
	 * ```ts
	 * class UserRepository extends BaseRepository<typeof users, CreateInput, UpdateInput> {
	 *   protected $hidden = ["passwordHash", "resetToken"];
	 * }
	 * ```
	 */
	protected $hidden?: string[];

	/**
	 * Fields to include in responses (whitelist mode).
	 * When set, only these fields are returned. Takes precedence over $hidden.
	 *
	 * @example
	 * ```ts
	 * class UserRepository extends BaseRepository<typeof users, CreateInput, UpdateInput> {
	 *   protected $visible = ["id", "name", "email"];
	 * }
	 * ```
	 */
	protected $visible?: string[];

	constructor(db: TDb, table: TTable) {
		this.db = db;
		this.table = table;
	}

	private get tableName(): string {
		return (this.table as any)[Symbol.for("drizzle:Name")];
	}

	// ─── Field Sanitization ────────────────────────────────────────────

	/**
	 * Sanitize a single entity by applying $visible or $hidden rules.
	 */
	private sanitize(item: Record<string, any>): Record<string, any> {
		if (this.$visible) {
			const result: Record<string, any> = {};
			for (const key of this.$visible) {
				if (key in item) result[key] = item[key];
			}
			return result;
		}
		if (this.$hidden?.length) {
			const result: Record<string, any> = { ...item };
			for (const key of this.$hidden) {
				delete result[key];
			}
			return result;
		}
		return item;
	}

	/**
	 * Sanitize an array of entities.
	 */
	private sanitizeMany(items: Record<string, any>[]): Record<string, any>[] {
		return items.map((item) => this.sanitize(item));
	}

	async findAll(): Promise<any[]> {
		const items = await this.db.query[this.tableName].findMany();
		return this.sanitizeMany(items);
	}

	async findById(id: number | string): Promise<any | null> {
		const item = await this.db.query[this.tableName].findFirst({
			where: eq((this.table as any).id, id),
		});
		return item ? this.sanitize(item) : null;
	}

	async findOne(where: Record<string, any>): Promise<any | null> {
		const item = await this.db.query[this.tableName].findFirst({ where });
		return item ? this.sanitize(item) : null;
	}

	async create(data: CreateInput): Promise<any> {
		const [result] = await this.db
			.insert(this.table)
			.values(data)
			.returning();
		return this.sanitize(result);
	}

	async createMany(data: CreateInput[]): Promise<any[]> {
		const results = await this.db.insert(this.table).values(data).returning();
		return this.sanitizeMany(results);
	}

	async update(id: number | string, data: UpdateInput): Promise<any> {
		const [result] = await this.db
			.update(this.table)
			.set(data)
			.where(eq((this.table as any).id, id))
			.returning();
		return this.sanitize(result);
	}

	async delete(id: number | string): Promise<void> {
		await this.db.delete(this.table).where(eq((this.table as any).id, id));
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
