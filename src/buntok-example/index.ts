import { App } from "@buntok/core";

const app = new App();

app.get("/", (ctx) => {
	return ctx.json({ message: "Hello from Buntok!" });
});

app.listen(3000, () => {
	console.log("Server running on port 3000");
});
