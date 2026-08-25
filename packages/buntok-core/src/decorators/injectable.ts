import type { Scope } from "../container";

// biome-ignore lint/suspicious/noExplicitAny: Symbol.metadata is not typed in TS
interface InjectableMetadata extends Record<string, any> {
	__injectable: boolean;
	__scope: Scope;
}

/**
 * Marks a class as managed by the IoC Container.
 * When the container resolves this class, it will instantiate it and
 * resolve any `@Inject`-annotated properties automatically.
 *
 * ```ts
 * @Injectable()
 * class UserService {
 *   @Inject(UserRepository) private repo: UserRepository;
 * }
 * ```
 */
export function Injectable(options?: { scope?: Scope }) {
	return (
		// biome-ignore lint/complexity/noBannedTypes: Native Decorator API uses Function
		_target: Function,
		context: ClassDecoratorContext,
	): void => {
		if (context.kind !== "class") {
			throw new Error("@Injectable can only decorate classes");
		}
		const meta = context.metadata as unknown as InjectableMetadata;
		meta.__injectable = true;
		meta.__scope = options?.scope ?? "singleton";
	};
}
