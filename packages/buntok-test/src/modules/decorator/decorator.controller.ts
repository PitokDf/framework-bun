import { Controller, Get, Post, Put, Delete, HttpCode, SetHeader, Redirect, Query } from "@buntok/core";
import type { Context } from "@buntok/core";

@Controller("/decorators")
export class DecoratorController {
	@Get("/")
	@HttpCode(201)
	@SetHeader("X-Custom-Header", "CustomValue")
	async getAll(ctx: Context) {
		return "Hello from DecoratorController";
	}

	@Query("/old")
	@Redirect("/new")
	async newFungsi() {
		return "Baru"
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
