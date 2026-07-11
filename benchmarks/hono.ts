import { Hono } from "hono";

const app = new Hono();
app.get("/plaintext", (c) => c.text("Hello, World!"));
app.get("/json", (c) => c.json({ message: "Hello, World!" }));
app.get("/id/:id", (c) => c.text(c.req.param("id")));

console.log("Hono running on 3000");

export default {
	port: 3000,
	fetch: app.fetch,
};
