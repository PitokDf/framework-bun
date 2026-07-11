import Fastify from "fastify";

const fastify = Fastify();

fastify.get("/plaintext", async () => "Hello, World!");
fastify.get("/json", async () => ({ message: "Hello, World!" }));
fastify.get("/id/:id", async (request) => (request.params as any).id);

fastify.listen({ port: 3000 }, () => {
	console.log("Fastify running on 3000");
});
