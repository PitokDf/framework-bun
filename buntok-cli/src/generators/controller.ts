export function generateController(entityName: string, pascalName: string): string {
  return `import { Controller, Get, Post, Put, Delete } from "buntok";
import type { Context } from "buntok";
import { ${pascalName}Service } from "../services/${entityName}.service";

@Controller("/${entityName}s")
export class ${pascalName}Controller {
  private service = new ${pascalName}Service();

  @Get("/")
  async getAll(ctx: Context) {
    const ${entityName}s = await this.service.getAll();
    return ctx.success(${entityName}s, "Records retrieved successfully");
  }

  @Get("/:id")
  async getById(ctx: Context) {
    try {
      const ${entityName} = await this.service.getById(ctx.params.id);
      return ctx.success(${entityName}, "Record retrieved successfully");
    } catch (error: any) {
      return ctx.error(error.message, 404);
    }
  }

  @Post("/")
  async create(ctx: Context) {
    try {
      const body = await ctx.body();
      const ${entityName} = await this.service.create(body);
      return ctx.success(${entityName}, "Record created successfully", 201);
    } catch (error: any) {
      return ctx.error(error.message, 400);
    }
  }

  @Put("/:id")
  async update(ctx: Context) {
    try {
      const body = await ctx.body();
      const ${entityName} = await this.service.update(ctx.params.id, body);
      return ctx.success(${entityName}, "Record updated successfully");
    } catch (error: any) {
      return ctx.error(error.message, 400);
    }
  }

  @Delete("/:id")
  async delete(ctx: Context) {
    try {
      await this.service.delete(ctx.params.id);
      return ctx.success(null, "Record deleted successfully", 200);
    } catch (error: any) {
      return ctx.error(error.message, 404);
    }
  }
}
`;
}
