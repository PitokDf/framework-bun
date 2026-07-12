import { Controller, Get, Post, Put, Delete } from "buntok";
import type { Context } from "buntok";

@Controller("/users")
export class UserController {
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
    const body = await ctx.body();
    return ctx.success(body, "Record created successfully", 201);
  }

  @Put("/:id")
  async update(ctx: Context) {
    const body = await ctx.body();
    return ctx.success({ id: ctx.params.id, ...(body as any) }, "Record updated successfully");
  }

  @Delete("/:id")
  async delete(ctx: Context) {
    return ctx.success(null, "Record deleted successfully", 200);
  }
}
