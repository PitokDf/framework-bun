import { App, asyncHandler, auditLog, compress, ConflictError, createHealthCheck, healthCheck, LocalDiskStorage, parseUploads, Queue, ServiceUnavailableError, UnprocessableEntityError, z, zResponse, zValidator } from "@buntok/core"
import { TestController } from "./controllers/test.controller"

export const app = new App()

app.use(compress())
app.static("/docs", "./public/docs")
app.validateEnv({

})
healthCheck(app, {
	version: "1.0.0",
	includeUptime: false,
})

app.post("/test", zValidator("body", { avatar: z.file() }, { contentType: "multipart/form-data" }), asyncHandler(async (ctx) => {
	const result = await parseUploads(ctx, {
		storage: new LocalDiskStorage("./uploads"),
		fields: {
			avatar: {
				maxFileSize: 1024 * 1024 * 5, // 5MB
				allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
				required: true,
			}
		}
	})
	return ctx.success({ result: result.fields.avatar.name })
}))

app.get("/wellcome/:name",
	zValidator("params", z.object({
		name: z.string()
	}),
		{ contentType: "application/json" }
	),
	zResponse(200, { name: z.string() }),
	asyncHandler(async (ctx) => {

		return ctx.success({ name: "Hello " + ctx.params.name })
	})
)

app.registerController(TestController)

app.listen(1213)
