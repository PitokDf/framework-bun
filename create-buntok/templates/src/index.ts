import { App } from "buntok";

const app = new App();

app.get("/", (ctx) => {
	return ctx.json({ message: "Welcome to BUNTOK!" });
});
