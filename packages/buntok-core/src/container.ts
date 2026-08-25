export type Scope = "singleton" | "transient";

// biome-ignore lint/complexity/noBannedTypes: Token can be string or class constructor
type Token = string | Function;

// biome-ignore lint/suspicious/noExplicitAny: Generic provider defaults require any
export interface ClassProvider<T = any> {
	useClass: new (
		// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
		...args: any[]
	) => T;
	scope?: Scope;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic provider defaults require any
export interface ValueProvider<T = any> {
	useValue: T;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic provider defaults require any
export interface FactoryProvider<T = any> {
	useFactory: (container: Container) => T;
	scope?: Scope;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic provider defaults require any
export type Provider<T = any> =
	| ClassProvider<T>
	| ValueProvider<T>
	| FactoryProvider<T>;

function isClassProvider(p: Provider): p is ClassProvider {
	return "useClass" in p;
}

function isValueProvider(p: Provider): p is ValueProvider {
	return "useValue" in p;
}

function isFactoryProvider(p: Provider): p is FactoryProvider {
	return "useFactory" in p;
}

export class Container {
	// biome-ignore lint/suspicious/noExplicitAny: Internal provider storage
	private providers = new Map<Token, Provider<any>>();
	// biome-ignore lint/suspicious/noExplicitAny: Cached singleton instances
	private singletons = new Map<Token, any>();
	private resolving = new Set<Token>();

	/**
	 * Register a provider for a given token (class or string key).
	 */
	register<T>(token: Token, provider: Provider<T>): this {
		this.providers.set(token, provider);
		return this;
	}

	/**
	 * Auto-register a class provider by its own constructor as the token.
	 */
	registerClass<T>(
		cls: new (
			// biome-ignore lint/suspicious/noExplicitAny: Constructor args are unknowable
			...args: any[]
		) => T,
		scope: Scope = "singleton",
	): this {
		this.providers.set(cls, { useClass: cls, scope });
		return this;
	}

	/**
	 * Resolve a dependency by token. Returns cached instance for singletons.
	 */
	resolve<T>(token: Token): T {
		const cached = this.singletons.get(token);
		if (cached !== undefined) return cached as T;

		if (this.resolving.has(token)) {
			const name = typeof token === "function" ? token.name : String(token);
			throw new Error(`Circular dependency detected: ${name}`);
		}

		const provider = this.providers.get(token);
		if (!provider) {
			const name = typeof token === "function" ? token.name : String(token);
			throw new Error(`No provider registered for: ${name}`);
		}

		this.resolving.add(token);
		// biome-ignore lint/suspicious/noExplicitAny: Dynamic instantiation
		let instance: any;
		let scope: Scope = "singleton";

		if (isClassProvider(provider)) {
			scope = provider.scope ?? "singleton";
			const meta = provider.useClass[Symbol.metadata] as
				| Record<string, unknown>
				| undefined;
			const injections = meta?.__injections as Map<string, Token> | undefined;

			instance = new provider.useClass();

			if (injections) {
				for (const [prop, depToken] of injections) {
					(instance as Record<string, unknown>)[prop] = this.resolve(depToken);
				}
			}
		} else if (isValueProvider(provider)) {
			scope = "singleton";
			instance = provider.useValue;
		} else if (isFactoryProvider(provider)) {
			scope = provider.scope ?? "singleton";
			instance = provider.useFactory(this);
		}

		this.resolving.delete(token);

		if (scope !== "transient") {
			this.singletons.set(token, instance);
		}

		return instance as T;
	}

	/**
	 * Resolve and return an instance, or undefined if not registered.
	 */
	get<T>(token: Token): T | undefined {
		if (this.singletons.has(token)) return this.singletons.get(token) as T;
		if (this.providers.has(token)) return this.resolve(token);
		return undefined;
	}

	/**
	 * Check whether a token has been registered.
	 */
	has(token: Token): boolean {
		return this.providers.has(token);
	}

	/**
	 * Check whether a token has been resolved and cached.
	 */
	hasResolved(token: Token): boolean {
		return this.singletons.has(token);
	}

	/**
	 * Force-clear all providers and cached instances.
	 * Useful in tests.
	 */
	clear(): void {
		this.providers.clear();
		this.singletons.clear();
		this.resolving.clear();
	}
}
