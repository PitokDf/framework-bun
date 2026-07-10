export function generateController(entityName: string, pascalName: string): string {
  return `import type { Context } from "buntok";
import { ${pascalName}Service } from "../services/${entityName}.service";

const service = new ${pascalName}Service();

export const ${entityName}Controller = {
  // GET /${entityName}
  async getAll(ctx: Context) {
    const ${entityName}s = await service.getAll();
    return ctx.json({ data: ${entityName}s });
  },

  // GET /${entityName}/:id
  async getById(ctx: Context) {
    try {
      const ${entityName} = await service.getById(ctx.params.id);
      return ctx.json({ data: ${entityName} });
    } catch (error) {
      return ctx.json({ error: error.message }, 404);
    }
  },

  // POST /${entityName}
  async create(ctx: Context) {
    try {
      const body = await ctx.body();
      const ${entityName} = await service.create(body);
      return ctx.json({ data: ${entityName} }, 201);
    } catch (error) {
      return ctx.json({ error: error.message }, 400);
    }
  },

  // PUT /${entityName}/:id
  async update(ctx: Context) {
    try {
      const body = await ctx.body();
      const ${entityName} = await service.update(ctx.params.id, body);
      return ctx.json({ data: ${entityName} });
    } catch (error) {
      return ctx.json({ error: error.message }, 400);
    }
  },

  // DELETE /${entityName}/:id
  async delete(ctx: Context) {
    try {
      await service.delete(ctx.params.id);
      return ctx.status(204);
    } catch (error) {
      return ctx.json({ error: error.message }, 404);
    }
  },
};
`;
}
