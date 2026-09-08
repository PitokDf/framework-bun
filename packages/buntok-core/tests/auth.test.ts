import { describe, it, expect } from "bun:test";
import { JwtService } from "../src/auth";

describe("JwtService", () => {
	const secret = "test-secret-key";
	const jwt = new JwtService(secret);

	it("should sign and verify a token", async () => {
		const token = await jwt.sign({ userId: 1, role: "admin" });
		const payload = await jwt.verify<{ userId: number; role: string }>(token);
		expect(payload).not.toBeNull();
		expect(payload?.userId).toBe(1);
		expect(payload?.role).toBe("admin");
	});

	it("should include exp in token", async () => {
		const token = await jwt.sign({ data: "test" }, 3600);
		const payload = await jwt.verify(token);
		expect(payload?.exp).toBeDefined();
		expect(payload!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
	});

	it("should return null for expired token", async () => {
		const token = await jwt.sign({ data: "test" }, -10); // expired 10 seconds ago
		const payload = await jwt.verify(token);
		expect(payload).toBeNull();
	});

	it("should return null for invalid token", async () => {
		expect(await jwt.verify("invalid.token.here")).toBeNull();
	});

	it("should return null for tampered signature", async () => {
		const token = await jwt.sign({ data: "test" });
		const parts = token.split(".");
		const tampered = `${parts[0]}.${parts[1]}.tampered`;
		expect(await jwt.verify(tampered)).toBeNull();
	});

	it("should return null for token with wrong secret", async () => {
		const otherJwt = new JwtService("other-secret");
		const token = await jwt.sign({ data: "test" });
		expect(await otherJwt.verify(token)).toBeNull();
	});

	it("should return null for token with less than 3 parts", async () => {
		expect(await jwt.verify("only.two")).toBeNull();
	});

	it("should handle empty payload", async () => {
		const token = await jwt.sign({});
		const payload = await jwt.verify(token);
		expect(payload).not.toBeNull();
	});
});
