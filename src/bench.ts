import type { App, Middleware } from "./app";

// TechEmpower standard World object (~1KB JSON)
function createWorld(id: number) {
	return {
		id,
		randomNumber: Math.floor(Math.random() * 10000) + 1,
	};
}

// Generate random number between min and max
function randomWorldId() {
	return Math.floor(Math.random() * 10000) + 1;
}

// Simulated database of worlds (in-memory for benchmark)
const worlds = Array.from({ length: 10000 }, (_, i) => createWorld(i + 1));

// HTML template for Fortunes test (escaped, no XSS)
function renderFortunes(fortunes: Array<{ id: number; message: string }>) {
	return `<!DOCTYPE html>
<html>
<head><title>Fortunes</title></head>
<body>
<table>
<tr><th>id</th><th>message</th></tr>
${fortunes.map((f) => `<tr><td>${f.id}</td><td>${f.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td></tr>`).join("\n")}
</table>
</body>
</html>`;
}

const fortunes = [
	{ id: 1, message: "fortune: No such file or directory" },
	{
		id: 2,
		message:
			"A computer scientist is someone who fixes problems with a thin layer of abstraction.",
	},
	{
		id: 3,
		message:
			"Beware of bugs in the above code; I have only proved it correct, not tried it.",
	},
	{ id: 4, message: "Don't panic." },
	{
		id: 5,
		message: "Entering Interactive Mode... (type 'help' for assistance)",
	},
	{ id: 6, message: "Famous quote 1" },
	{ id: 7, message: "Famous quote 2" },
	{ id: 8, message: "Famous quote 3" },
	{ id: 9, message: "Famous quote 4" },
	{ id: 10, message: "Famous quote 5" },
];

export function registerBenchRoutes<DI extends Record<string, unknown>>(
	app: App<DI>,
) {
	// ===== TechEmpower Standard Tests =====

	// 1. Plaintext - Simple text response (tests raw throughput)
	app.get("/bench/plaintext", (_ctx) => {
		return new Response("Hello, World!", {
			headers: { "Content-Type": "text/plain" },
		});
	});

	// 2. JSON Serialization - Single object JSON response
	app.get("/bench/json", (_ctx) => {
		return new Response(JSON.stringify({ message: "Hello, World!" }), {
			headers: { "Content-Type": "application/json" },
		});
	});

	// 3. Single Query - Fetch single row from "database"
	app.get("/bench/db/single", (_ctx) => {
		const world = worlds[randomWorldId() - 1];
		return new Response(JSON.stringify(world), {
			headers: { "Content-Type": "application/json" },
		});
	});

	// 4. Multiple Queries - Fetch N rows from "database"
	app.get("/bench/db/queries", (ctx) => {
		const queries = Math.min(
			Math.max(Number(ctx.query.queries) || 1, 1),
			500,
		);
		const results = Array.from(
			{ length: queries },
			() => worlds[randomWorldId() - 1],
		);
		return new Response(JSON.stringify(results), {
			headers: { "Content-Type": "application/json" },
		});
	});

	// 5. Fortunes - HTML template rendering (TechEmpower standard)
	app.get("/bench/fortunes", (_ctx) => {
		const html = renderFortunes(fortunes);
		return new Response(html, {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	});

	// 6. Data Updates - Update random row in "database"
	app.get("/bench/db/updates", (ctx) => {
		const queries = Math.min(
			Math.max(Number(ctx.query.queries) || 1, 1),
			500,
		);
		const results = Array.from({ length: queries }, () => {
			const id = randomWorldId();
			const world = worlds[id - 1] as { id: number; randomNumber: number };
			const updatedWorld = { ...world, randomNumber: randomWorldId() };
			worlds[id - 1] = updatedWorld;
			return updatedWorld;
		});
		return new Response(JSON.stringify(results), {
			headers: { "Content-Type": "application/json" },
		});
	});

	// ===== Framework-Specific Tests =====

	// 7. Route params (dynamic route test)
	app.get("/bench/user/:id", (ctx) => {
		return ctx.json({ id: ctx.params.id, name: "User" });
	});

	// 8. Query string parsing
	app.get("/bench/query", (ctx) => {
		const name = ctx.query.name || "unknown";
		const age = ctx.query.age || "0";
		return ctx.json({ name, age: Number(age) });
	});

	// 9. POST JSON body parsing
	app.post("/bench/post", async (ctx) => {
		const body = await ctx.body();
		return ctx.json({ received: true, size: JSON.stringify(body).length });
	});

	// 10. Middleware chain (5 layers)
	const mid1: Middleware = async (ctx, next) => {
		ctx.store.mid1 = true;
		return next();
	};
	const mid2: Middleware = async (ctx, next) => {
		ctx.store.mid2 = true;
		return next();
	};
	const mid3: Middleware = async (ctx, next) => {
		ctx.store.mid3 = true;
		return next();
	};
	const mid4: Middleware = async (ctx, next) => {
		ctx.store.mid4 = true;
		return next();
	};
	const mid5: Middleware = async (ctx, next) => {
		ctx.store.mid5 = true;
		return next();
	};

	app.get("/bench/middleware", mid1, mid2, mid3, mid4, mid5, (ctx) => {
		return ctx.json({ middleware: true });
	});

	// 11. Static file (100 KB)
	app.get("/bench/static", (_ctx) => {
		const data = "x".repeat(100 * 1024);
		return new Response(data, {
			headers: { "Content-Type": "text/plain" },
		});
	});

	// 12. QUERY method (RFC 10008 - idempotent, cacheable, with body)
	app.query("/bench/query-method", async (ctx) => {
		const body = await ctx.body<{ name?: string }>();
		return ctx.json({ received: true, name: body?.name || "unknown" });
	});
}
