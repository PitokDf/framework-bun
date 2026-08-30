export function generateController(
	entityName: string,
	pascalName: string,
	withService: boolean = true,
): string {
	if (withService) {
		return `import { Controller, BaseController } from "@buntok/core";
import { ${pascalName}Service } from "@/services/${entityName}.service";

@Controller("/${entityName}s")
export class ${pascalName}Controller extends BaseController<${pascalName}> {
  constructor(private readonly ${entityName}Service: ${pascalName}Service) {
    super(${entityName}Service);
  }
}
`;
	}

	return `import { Controller, Get, Post, Put, Delete } from "@buntok/core";
import type { Context } from "@buntok/core";

@Controller("/${entityName}s")
export class ${pascalName}Controller {
  @Get("/")
  async getAll(ctx: Context) {
    return ctx.success([], "Records retrieved successfully");
  }

  @Get("/:id")
  async getById(ctx: Context) {
    return ctx.success({ id: ctx.params.id }, "Record retrieved successfully");
  }

  @Post("/")
  async create(ctx: Context) {
    const data = await ctx.body<any>();
    return ctx.success(data, "Record created successfully", 201);
  }

  @Put("/:id")
  async update(ctx: Context) {
    const data = await ctx.body<any>();
    return ctx.success({ id: ctx.params.id, ...data }, "Record updated successfully");
  }

  @Delete("/:id")
  async delete(ctx: Context) {
    return ctx.success(null, "Record deleted successfully");
  }
}
`;
}
