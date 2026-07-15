// biome-ignore lint/complexity/noBannedTypes: Token can be string or class constructor
type Token = string | Function;

interface InjectableMetadata extends Record<string, unknown> {
	__injections?: Map<string, Token>;
}

/**
 * Property decorator that tells the IoC Container to resolve and inject
 * a dependency by its token when the owning class is instantiated.
 *
 * ```ts
 * @Injectable()
 * class UserController {
 *   @Inject(UserService) private service: UserService;
 *   @Inject("config") private config: AppConfig;
 * }
 * ```
 */
export function Inject(token: Token) {
	return (_value: undefined, context: ClassFieldDecoratorContext): void => {
		if (context.kind !== "field") {
			throw new Error("@Inject can only decorate fields");
		}
		const meta = context.metadata as unknown as InjectableMetadata;
		if (!meta.__injections) {
			meta.__injections = new Map();
		}
		meta.__injections.set(String(context.name), token);
	};
}
