import { NotFoundError } from "./helpers/async-handler";

export abstract class BaseService<T, CreateInput = any, UpdateInput = any> {
	constructor(
		protected repository: {
			findAll: () => Promise<T[]>;
			findById: (id: string | number) => Promise<T | null>;
			create: (data: CreateInput) => Promise<T>;
			update: (id: string | number, data: UpdateInput) => Promise<T>;
			delete: (id: string | number) => Promise<T>;
			count: () => Promise<number>;
		},
	) {}

	async getAll(): Promise<T[]> {
		return this.repository.findAll();
	}

	async getById(id: string | number): Promise<T> {
		const item = await this.repository.findById(id);
		if (!item) throw new NotFoundError(`Data dengan id ${id} tidak ditemukan`);
		return item;
	}

	async create(data: CreateInput): Promise<T> {
		return this.repository.create(data);
	}

	async update(id: string | number, data: UpdateInput): Promise<T> {
		await this.getById(id);
		return this.repository.update(id, data);
	}

	async delete(id: string | number): Promise<T> {
		await this.getById(id);
		return this.repository.delete(id);
	}

	async count(): Promise<number> {
		return this.repository.count();
	}
}
