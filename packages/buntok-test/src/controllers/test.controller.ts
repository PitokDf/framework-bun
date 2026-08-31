import { TestService } from "@/services/test.service";
import {
	Context,
	Get,
	Controller,
	CronJob,
	JwtService,
	setCookie,
	Post,
	requireAuth,
	requirePermission,
	requireRole,
	Use,
	z,
	zResponse,
	zValidator,
	type ZodCtx,
	UseGuard,
	SetMetadata,
	getMetadata,
} from "@buntok/core";

const scrt = "pitok-123";
@Controller("/tests")
export class TestController {
	private testService = new TestService();

	@Post("/get-token")
	@Use(
		zValidator(
			"body",
			{
				name: z.string().min(1),
				role: z.enum(["admin", "user"]).default("user"),
			},
			{ contentType: "application/json" },
		),
	)
	@Use(
		zResponse(
			200,
			z.array(
				z.object({
					name: z.string(),
					role: z.enum(["admin", "user"]),
				}),
			),
		),
	)
	async generateToken(ctx: ZodCtx<{ body: { name: string; role: string } }>) {
		const body = ctx.valid("body");
		const jwt = new JwtService(scrt);
		const token = await jwt.sign({ name: body.name, role: body.role });

		const res = ctx.success({ token, role: body.role });
		return setCookie(res, "token", "easeqeqweqe", {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			maxAge: 60 * 60 * 24,
		});
	}

	@Post("/upload")
	@Use(requireAuth(scrt))
	@Use(requireRole("admin"))
	async test(ctx: Context) {
		console.log("ctx.user", ctx.user);
		return ctx.success({ test: "test" });
	}

	@CronJob("*/5 * * * *") // Every 5 minutes
	async syncData() {
		console.log("Cron job executed at", new Date().toISOString());
	}

	@Get("/hello/:name")
	@UseGuard((ctx) => ctx.params.name === "admin")
	getNameOfDeclaration({ params }: Context) {
		return { name: params.name };
	}
}
