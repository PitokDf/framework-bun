/**
 * BaseRepository for TypeORM
 *
 * @example
 * ```ts
 * import { DataSource } from "typeorm";
 * import { BaseRepository } from "@buntok/typeorm";
 * import { User } from "./entities/user";
 * import { Post } from "./entities/post";
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
 * class UserRepository extends BaseRepository<User, CreateUserInput, UpdateUserInput> {
 *   constructor(dataSource: DataSource) {
 *     super(dataSource, User);
 *   }
 *
 *   async findWithPosts() {
 *     return this.dataSource.getRepository(User).find({ // ✅ akses multi-table
 *       relations: ["posts"]
 *     });
 *   }
 *
 *   async findRecentPosts() {
 *     return this.dataSource.getRepository(Post).find({ // ✅ akses tabel lain
 *       order: { createdAt: "DESC" },
 *       take: 10
 *     });
 *   }
 * }
 * ```
 */
import { type EntityTarget, type DataSource, type FindOptionsWhere } from "typeorm";

export abstract class BaseRepository<TEntity extends Record<string, any>, CreateInput, UpdateInput> {
	protected dataSource: DataSource;
	protected entity: EntityTarget<TEntity>;
	protected repo: any;

	/**
	 * Fields to exclude from responses (blacklist mode).
	 * Type-safe: only accepts keys of TEntity.
	 *
	 * @example
	 * ```ts
	 * class UserRepository extends BaseRepository<User, CreateUserInput, UpdateUserInput> {
	 *   protected $hidden = ["passwordHash", "resetToken"];
	 * }
	 * ```
	 */
	protected $hidden?: readonly (keyof TEntity)[];

	/**
	 * Fields to include in responses (whitelist mode).
	 * When set, only these fields are returned. Takes precedence over $hidden.
	 * Type-safe: only accepts keys of TEntity.
	 *
	 * @example
	 * ```ts
	 * class UserRepository extends BaseRepository<User, CreateUserInput, UpdateUserInput> {
	 *   protected $visible = ["id", "name", "email"];
	 * }
	 * ```
	 */
	protected $visible?: readonly (keyof TEntity)[];

	constructor(dataSource: DataSource, entity: EntityTarget<TEntity>) {
		this.dataSource = dataSource;
		this.entity = entity;
		this.repo = dataSource.getRepository(entity);
	}

	// ─── Field Sanitization ────────────────────────────────────────────

	/**
	 * Sanitize a single entity by applying $visible or $hidden rules.
	 */
	private sanitize(item: TEntity): TEntity {
		if (this.$visible) {
			const result: Record<string, any> = {};
			for (const key of this.$visible) {
				if (key in item) result[key as string] = item[key];
			}
			return result as TEntity;
		}
		if (this.$hidden?.length) {
			const result: Record<string, any> = { ...item };
			for (const key of this.$hidden) {
				delete result[key as string];
			}
			return result as TEntity;
		}
		return item;
	}

	/**
	 * Sanitize an array of entities.
	 */
	private sanitizeMany(items: TEntity[]): TEntity[] {
		return items.map((item) => this.sanitize(item));
	}

	async findAll(): Promise<TEntity[]> {
		const items = await this.repo.find();
		return this.sanitizeMany(items);
	}

	async findById(id: number | string): Promise<TEntity | null> {
		const item = await this.repo.findOneBy({ id } as unknown as FindOptionsWhere<TEntity>);
		return item ? this.sanitize(item) : null;
	}

	async findOne(where: FindOptionsWhere<TEntity>): Promise<TEntity | null> {
		const item = await this.repo.findOneBy(where);
		return item ? this.sanitize(item) : null;
	}

	async create(data: CreateInput): Promise<TEntity> {
		const entity = this.repo.create(data);
		const result = await this.repo.save(entity);
		return this.sanitize(result);
	}

	async createMany(data: CreateInput[]): Promise<TEntity[]> {
		const entities = this.repo.create(data);
		const results = await this.repo.save(entities);
		return this.sanitizeMany(results);
	}

	async update(id: number | string, data: UpdateInput): Promise<TEntity | null> {
		await this.repo.update(id, data);
		return this.findById(id);
	}

	async delete(id: number | string): Promise<void> {
		await this.repo.delete(id);
	}

	async count(): Promise<number> {
		return this.repo.count();
	}

	async exists(where: FindOptionsWhere<TEntity>): Promise<boolean> {
		const count = await this.repo.countBy(where);
		return count > 0;
	}
}
