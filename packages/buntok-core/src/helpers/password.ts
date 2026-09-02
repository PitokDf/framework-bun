import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const SCRYPT_OPTIONS = {
	N: 16384, // 2^14 - memory cost (16 MB)
	r: 8, // block size
	p: 1, // parallelization
};
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Hash a password using scrypt (memory-hard algorithm).
 * Returns a string in the format `scrypt:<salt>:<hash>` (hex-encoded).
 *
 * @example
 * ```ts
 * const hashed = await hashPassword("mypassword");
 * // "scrypt:a1b2c3d4...:e5f6g7h8..."
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(SALT_LENGTH);
	const hash = scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
	return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Verify a password against a stored hash string.
 * Supports both scrypt (`scrypt:<salt>:<hash>`) and legacy PBKDF2 (`iterations:salt:hash`) formats.
 * Uses timing-safe comparison.
 *
 * @example
 * ```ts
 * const valid = await verifyPassword("mypassword", hashed);  // true
 * const wrong = await verifyPassword("wrong", hashed);        // false
 * ```
 */
export async function verifyPassword(
	password: string,
	stored: string,
): Promise<boolean> {
	// Scrypt format
	if (stored.startsWith("scrypt:")) {
		const parts = stored.split(":");
		if (parts.length !== 3) return false;

		const saltHex = parts[1] as string;
		const expectedHash = parts[2] as string;
		const salt = Buffer.from(saltHex, "hex");
		const test = scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);

		return timingSafeEqual(
			Buffer.from(expectedHash, "hex"),
			test,
		);
	}

	// Legacy PBKDF2 format
	return verifyPBKDF2Legacy(password, stored);
}

// ─── PBKDF2 Legacy Support ─────────────────────────────────────────────

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = "SHA-256";

function toHex(buffer: Uint8Array): string {
	return [...buffer].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
	return new Uint8Array(
		hex.match(/.{1,2}/g)?.map((h) => Number.parseInt(h, 16)) ?? [],
	);
}

async function verifyPBKDF2Legacy(
	password: string,
	stored: string,
): Promise<boolean> {
	const parts = stored.split(":");
	if (parts.length < 3) return false;

	const iterations = Number(parts[0]);
	const saltHex = parts[1] as string;
	const expectedHash = parts[2] as string;
	const salt = fromHex(saltHex) as Uint8Array<ArrayBuffer>;

	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const derived = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt, iterations, hash: PBKDF2_DIGEST },
		key,
		PBKDF2_KEY_LENGTH * 8,
	);
	const actual = toHex(new Uint8Array(derived));

	if (actual.length !== expectedHash.length) return false;
	let result = 0;
	for (let i = 0; i < actual.length; i++) {
		result |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
	}
	return result === 0;
}
