import app from "./src";

Bun.serve({
	port: Number(process.env.PORT) || 1212,
	fetch: (request) => app.fetch(request),
});
