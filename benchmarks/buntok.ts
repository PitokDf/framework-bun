import { App } from "../packages/buntok-core/src/index.ts";

const app = new App();
app.disable("x-powered-by");

app.get("/plaintext", () => "Hello, World!");
app.get("/json", () => ({ message: "Hello, World!" }));
app.get("/id/:id", ({ params: { id } }) => id);

app.listen(3000, () => {
	console.log("Buntok running on 3000");
});
