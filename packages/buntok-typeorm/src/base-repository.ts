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

export abstract class BaseRepository<TEntity, CreateInput, UpdateInput> {
	protected dataSource: DataSource;
	protected entity: EntityTarget<TEntity>;
	protected repo: any;

	constructor(dataSource: DataSource, entity: EntityTarget<TEntity>) {
		this.dataSource = dataSource;
		this.entity = entity;
		this.repo = dataSource.getRepository(entity);
	}

	async findAll(): Promise<TEntity[]> {
		return this.repo.find();
	}

	async findById(id: number | string): Promise<TEntity | null> {
		return this.repo.findOneBy({ id } as FindOptionsWhere<TEntity>);
	}

	async findOne(where: FindOptionsWhere<TEntity>): Promise<TEntity | null> {
		return this.repo.findOneBy(where);
	}

	async create(data: CreateInput): Promise<TEntity> {
		const entity = this.repo.create(data);
		return this.repo.save(entity);
	}

	async createMany(data: CreateInput[]): Promise<TEntity[]> {
		const entities = this.repo.create(data);
		return this.repo.save(entities);
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
