import { describe, it, expect } from "bun:test";
import { app } from "../../src/index"; // Adjust this import if your app instance is exported elsewhere

describe("Product API (E2E)", () => {
  it("should return a list of items (GET /products)", async () => {
    const response = await app.request("/products", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    
    // const body = await response.json();
    // expect(Array.isArray(body)).toBe(true);
  });

  it("should create a new item (POST /products)", async () => {
    const response = await app.request("/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // TODO: add payload here
      }),
    });

    // expect(response.status).toBe(201);
  });

  it("should handle not found items (GET /products/999999)", async () => {
    const response = await app.request("/products/999999", {
      method: "GET",
    });

    // expect(response.status).toBe(404);
  });
});
