import { Controller, Get, Post, Put, Delete, Use, zValidator, z, uploader, LocalDiskStorage } from "buntok";
import type { Context, RouteContext } from "buntok";
const uploadSchema = z.object({ file: z.file(), description: z.string().optional() });

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10)
});

@Controller("/posts")
export class PostController {

  @Get("/")
  @Use(zValidator("query", paginationSchema))
  async getAll(ctx: RouteContext<"/", unknown, unknown, z.infer<typeof paginationSchema>>) {
    const queries = ctx.valid("query");
    return ctx.paginate([], 11, queries.page, queries.limit, "Records retrieved successfully");
  }

  @Get("/:id")
  async getById(ctx: Context) {
    return ctx.success({ id: ctx.params.id }, "Record retrieved successfully");
  }

  @Post("/")
  async create(ctx: Context) {
    const body = await ctx.body();
    return ctx.success(body, "Record created successfully", 201);
  }

  @Put("/:id")
  @Use(zValidator("body", {
    title: z.string().min(3).max(100),
    content: z.string().min(10),
  }))
  async update(ctx: Context) {
    const body = ctx.valid<{ title: string; content: string }>("body");
    return ctx.success({ id: ctx.params.id, ...(body as any) }, "Record updated successfully");
  }

  @Delete("/:id")
  async delete(ctx: Context) {
    return ctx.success(null, "Record deleted successfully", 200);
  }


  @Post("/upload")
  @Use(zValidator("body", uploadSchema, { contentType: "multipart/form-data" }))
  @Use(uploader({ storage: new LocalDiskStorage("./uploads") }))
  // 2. Pasang tipe schema-nya di parameter kedua RouteContext
  async upload(ctx: RouteContext<"/upload", z.infer<typeof uploadSchema>>) {
    // SEKARANG OTOMATIS! TypeScript langsung tahu ctx.valid("body") punya .file
    const body = ctx.valid("body");

    return ctx.success(body.description, "File uploaded successfully", 201);
  }


  // @Post("/upload")
  // @Use(zValidator("body", { file: z.file() }, { contentType: "multipart/form-data" }))
  // async upload(ctx: Context) {
  //   const body = ctx.valid<{ file: File }>("body");
  //   const file = body.file;
  //   return ctx.success(file.name, "File uploaded successfully", 201);
  // }
}