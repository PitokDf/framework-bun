import { Elysia } from "elysia";

const app = new Elysia();
app.get("/plaintext", () => "Hello, World!");
app.get("/json", () => ({ message: "Hello, World!" }));
app.get("/id/:id", ({ params: { id } }) => id);

app.listen(3000, () => {
	console.log("Elysia running on 3000");
});
