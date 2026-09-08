import { TestService } from "@/services/test.service";
import {
	Dependencies,
	Context,
	Get,
	Controller,
	CronJob,
	JwtService,
	setCookie,
	Post,
	requireAuth,
	requireRole,
	Use,
	z,
	zResponse,
	zValidator,
	type ZodCtx,
	UseGuard,
	handleUploads,
} from "@buntok/core";
import { LocalDiskStorage } from "buntok";

const scrt = "pitok-123";

@Dependencies(TestService)
@Controller("/tests")
export class TestController {
	constructor(private testService: TestService) { }

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

	@Get("/get-data")
	async getData() {
		return this.testService.upload("Hello World");
	}

	@Post("/upload")
	@Use(zValidator("body", { docs: z.array(z.file().mime(["image/png", "image/jpeg", "image/webp"])) }, { contentType: "multipart/form-data" }))
	async test(ctx: Context) {
		const result = await handleUploads(ctx, {
			storage: new LocalDiskStorage("./uploads"),
			fields: {
				docs: {
					multiple: true,
					maxFileSize: 1024 * 1024 * 5, // 5MB
					allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
					outputFormat: "webp",
				}
			}
		})

		return result.fields.docs?.map(file => file.path);
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
