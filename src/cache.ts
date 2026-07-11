export interface CacheDriver {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
	delete(key: string): Promise<void>;
	clear(): Promise<void>;
}

export class MemoryCacheDriver implements CacheDriver {
	private store = new Map<string, { value: unknown; expiry: number | null }>();

	async get<T>(key: string): Promise<T | null> {
		const item = this.store.get(key);
		if (!item) return null;
		if (item.expiry && Date.now() > item.expiry) {
			this.store.delete(key);
			return null;
		}
		return item.value as T;
	}

	async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
		const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
		this.store.set(key, { value, expiry });
	}

	async delete(key: string): Promise<void> {
		this.store.delete(key);
	}

	async clear(): Promise<void> {
		this.store.clear();
	}
}

export class Cache {
	constructor(private driver: CacheDriver = new MemoryCacheDriver()) {}

	async get<T>(key: string): Promise<T | null> {
		return this.driver.get<T>(key);
	}

	async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
		return this.driver.set(key, value, ttlSeconds);
	}

	async delete(key: string): Promise<void> {
		return this.driver.delete(key);
	}

	async clear(): Promise<void> {
		return this.driver.clear();
	}

	/**
	 * Get value from cache, or execute the factory function to compute and cache it.
	 */
	async getOrSet<T>(
		key: string,
		factory: () => Promise<T>,
		ttlSeconds?: number,
	): Promise<T> {
		const existing = await this.get<T>(key);
		if (existing !== null) return existing;
		const val = await factory();
		await this.set(key, val, ttlSeconds);
		return val;
	}
}
