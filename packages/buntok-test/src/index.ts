import {
	App,
	asyncHandler,
	compress,
	healthCheck,
	LocalDiskStorage,
	handleUploads,
	z,
	zResponse,
	zValidator,
	responseTime,
} from "@buntok/core";
import { TestController } from "./controllers/test.controller";

export const app = new App();
app.use(responseTime());

app.use(compress());
app.apiDocs({
	path: "/docs",
	title: "API Documentation",
	version: "1.0.1",
	description: "api docs for buntok test",
});

healthCheck(app, {
	version: "1.0.0",
	includeUptime: false,
});

app.post(
	"/test",
	zValidator(
		"body",
		{ avatar: z.file(), name: z.string() },
		{ contentType: "multipart/form-data" },
	),
	asyncHandler(async (ctx) => {
		const result = await handleUploads(ctx, {
			storage: new LocalDiskStorage("./uploads"),
			fields: {
				avatar: {
					maxFileSize: 1024 * 1024 * 5, // 5MB
					allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
					outputFormat: "webp",
				},
			},
		});
		return ctx.success({ result: result.fields.avatar });
	}),
);

app.get(
	"/wellcome/:name",
	zValidator(
		"params",
		z.object({
			name: z
				.string()
				.min(3, "Name is required and must be at least 1 character long."),
		}),
		{ contentType: "application/json" },
	),
	zResponse(200, { name: z.string() }),
	asyncHandler(async (ctx) => {
		return ctx.success({ name: "Hello " + ctx.params.name });
	}),
);

app.registerController(TestController);

app.listen();
