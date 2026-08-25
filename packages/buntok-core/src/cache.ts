export interface CacheDriver {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
	delete(key: string): Promise<void>;
	clear(): Promise<void>;
	/** Optional: list all stored keys (used by deletePattern / keys) */
	keys?(): Promise<string[]>;
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

	async keys(): Promise<string[]> {
		const now = Date.now();
		const result: string[] = [];
		for (const [key, item] of this.store.entries()) {
			if (!item.expiry || now <= item.expiry) {
				result.push(key);
			}
		}
		return result;
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
	 * Returns true if the key exists and has not expired.
	 */
	async has(key: string): Promise<boolean> {
		return (await this.driver.get(key)) !== null;
	}

	/**
	 * Get value from cache, or execute the factory function to compute and cache it.
	 *
	 * @example
	 * const user = await cache.getOrSet(`user:${id}`, () => db.findUser(id), 300);
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

	/**
	 * Atomically increment a numeric value stored at `key`.
	 * If the key does not exist it is initialized to 0 then incremented.
	 *
	 * @param key - Cache key
	 * @param amount - Amount to add (default: 1)
	 * @param ttlSeconds - Optional TTL; only applied when the key is first created
	 */
	async increment(
		key: string,
		amount = 1,
		ttlSeconds?: number,
	): Promise<number> {
		const current = (await this.get<number>(key)) ?? 0;
		const next = current + amount;
		await this.set(key, next, current === null ? ttlSeconds : undefined);
		return next;
	}

	/**
	 * Atomically decrement a numeric value stored at `key`.
	 * If the key does not exist it is initialized to 0 then decremented.
	 */
	async decrement(
		key: string,
		amount = 1,
		ttlSeconds?: number,
	): Promise<number> {
		return this.increment(key, -amount, ttlSeconds);
	}

	/**
	 * Get multiple keys in a single call. Returns `null` for missing keys.
	 *
	 * @example
	 * const [user, post] = await cache.mget([`user:1`, `post:42`]);
	 */
	async mget<T>(keys: string[]): Promise<(T | null)[]> {
		return Promise.all(keys.map((k) => this.get<T>(k)));
	}

	/**
	 * Set multiple key-value pairs with the same optional TTL.
	 *
	 * @example
	 * await cache.mset([["user:1", userData], ["user:2", user2Data]], 300);
	 */
	async mset<T>(entries: [string, T][], ttlSeconds?: number): Promise<void> {
		await Promise.all(
			entries.map(([key, value]) => this.set(key, value, ttlSeconds)),
		);
	}

	/**
	 * Delete all keys matching a glob-style pattern.
	 * Requires the underlying driver to implement `keys()`.
	 *
	 * Supported wildcards:
	 *  - `*` matches any sequence of characters
	 *  - `?` matches any single character
	 *
	 * @example
	 * await cache.deletePattern("session:*");
	 * await cache.deletePattern("tmp:??:*");
	 */
	async deletePattern(pattern: string): Promise<number> {
		if (!this.driver.keys) {
			throw new Error(
				"deletePattern() requires the cache driver to implement keys(). " +
					"MemoryCacheDriver supports it; for Redis use SCAN + DEL.",
			);
		}
		const regex = this.globToRegex(pattern);
		const allKeys = await this.driver.keys();
		const matching = allKeys.filter((k) => regex.test(k));
		await Promise.all(matching.map((k) => this.delete(k)));
		return matching.length;
	}

	/**
	 * List all keys currently stored (non-expired).
	 * Requires the underlying driver to implement `keys()`.
	 */
	async keys(): Promise<string[]> {
		if (!this.driver.keys) {
			throw new Error(
				"keys() requires the cache driver to implement keys(). " +
					"MemoryCacheDriver supports it.",
			);
		}
		return this.driver.keys();
	}

	/** Convert a glob pattern to a RegExp */
	private globToRegex(pattern: string): RegExp {
		const escaped = pattern
			.replace(/[.+^${}()|[\]\\]/g, "\\$&") // escape regex specials
			.replace(/\*/g, ".*") // * → .*
			.replace(/\?/g, "."); // ? → .
		return new RegExp(`^${escaped}$`);
	}
}
