import { Controller, Get, Post, Put, Delete, Use, zValidator, z } from "buntok";
import type { Context, RouteContext } from "buntok";
import { ProductService } from "../services/product.service";

@Controller("/products")
export class ProductController {
  private service = new ProductService();

  @Get("/")
  async getAll(ctx: Context) {
    const products = await this.service.getAll();
    return ctx.success(products, "Records retrieved successfully");
  }

  @Get("/:id")
  @Use(zValidator("params", { "id": z.string() })) // Validasi parameter id sebagai UUID
  async getById(ctx: RouteContext<"/:id", { id: string }>) {
    try {
      const product = await this.service.getById(ctx.params.id);
      return ctx.success(product, "Record retrieved successfully");
    } catch (error: any) {
      return ctx.error(error.message, 404);
    }
  }

  @Post("/")
  async create(ctx: Context) {
    try {
      const body = await ctx.body();
      const product = await this.service.create(body);
      return ctx.success(product, "Record created successfully", 201);
    } catch (error: any) {
      return ctx.error(error.message, 400);
    }
  }

  @Put("/:id")
  async update(ctx: Context) {
    try {
      const body = await ctx.body();
      const product = await this.service.update(ctx.params.id, body);
      return ctx.success(product, "Record updated successfully");
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
