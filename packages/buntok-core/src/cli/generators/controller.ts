export function generateController(
	entityName: string,
	pascalName: string,
	withService: boolean = true,
): string {
	if (withService) {
		return `import { Controller, Get, Post, Put, Delete, Use, zResponse, z } from "@buntok/core";
import type { Context } from "@buntok/core";
import { ${pascalName}Service } from "../services/${entityName}.service";

@Controller("/${entityName}s")
export class ${pascalName}Controller {
  private service: ${pascalName}Service;

  constructor() {
    this.service = new ${pascalName}Service();
  }

  @Get("/")
  async getAll(ctx: Context) {
    const items = await this.service.getAll();
    return ctx.success(items, "Records retrieved successfully");
  }

  @Get("/:id")
  async getById(ctx: Context) {
    const item = await this.service.getById(ctx.params.id);
    return ctx.success(item, "Record retrieved successfully");
  }

  @Post("/")
  async create(ctx: Context) {
    const data = await ctx.body<any>();
    const item = await this.service.create(data);
    return ctx.success(item, "Record created successfully", 201);
  }

  @Put("/:id")
  async update(ctx: Context) {
    const data = await ctx.body<any>();
    const item = await this.service.update(ctx.params.id, data);
    return ctx.success(item, "Record updated successfully");
  }

  @Delete("/:id")
  async delete(ctx: Context) {
    await this.service.delete(ctx.params.id);
    return ctx.success(null, "Record deleted successfully");
  }
}
`;
	}

	return `import { Controller, Get, Post, Put, Delete, zResponse, z } from "@buntok/core";
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
