import { App } from "../framework-bun/src/exports.ts";

const app = new App();
app.disable("x-powered-by");
app.get("/plaintext", (ctx) => ctx.text("Hello, World!"));
app.get("/json", (ctx) => ctx.json({ message: "Hello, World!" }));
app.get("/id/:id", (ctx) => ctx.text(ctx.params.id));

app.listen(3000, () => {
	console.log("Buntok running on 3000");
});
