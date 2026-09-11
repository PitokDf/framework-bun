import { describe, expect, it } from "bun:test";
import { Metrics, metricsEndpoint, metricsMiddleware } from "../src/metrics";

describe("metrics", () => {
	it("records bounded route and status metrics", async () => {
		const metrics = new Metrics();
		const middleware = metricsMiddleware(metrics, "/users/:id");
		const response = await middleware({} as never, async () => new Response("ok"));
		const snapshot = metrics.read();
		expect(response.status).toBe(200);
		expect(snapshot.requests).toBe(1);
		expect(snapshot.byRoute["/users/:id"]).toBe(1);
		expect(snapshot.inFlight).toBe(0);
	});

	it("exposes Prometheus text", () => {
		const metrics = new Metrics();
		metrics.record("/health", 503, 4);
		let handler!: () => Response;
		metricsEndpoint(metrics)({ get: (_path, routeHandler) => { handler = routeHandler; } });
		const response = handler();
		expect(response.headers.get("content-type")).toContain("text/plain");
	});

	it("supports binary handler return types in the public contract", async () => {
		const metrics = new Metrics();
		const middleware = metricsMiddleware(metrics, "/file");
		const response = await middleware({} as never, async () => new Uint8Array([1, 2, 3]));
		expect(response).toBeInstanceOf(Uint8Array);
	});
});