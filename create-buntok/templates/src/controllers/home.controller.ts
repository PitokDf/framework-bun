import { Controller, Get, type Context } from "buntok";

@Controller("/")
export class HomeController {
	@Get("/")
	async index(ctx: Context) {
		return ctx.json({ message: "Welcome to BUNTOK Enterprise!" });
	}
}
