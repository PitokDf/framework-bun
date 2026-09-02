import {
	JSTrie,
	jsEscapeString,
	jsParseCookies,
	jsParseQuery,
} from "./fallback";

// ─── Lazy Native Loading ─────────────────────────────────────────────────────

let _nativeAvailable: boolean | undefined;
// biome-ignore lint/suspicious/noExplicitAny: FFI libs are dynamic
let _nativeJsonLib: any;
// biome-ignore lint/suspicious/noExplicitAny: FFI ptr cache
let _ffi: any;

function tryLoadNative(): void {
	if (_nativeAvailable !== undefined) return;
	try {
		// biome-ignore lint: dynamic require for optional FFI
		_ffi = require("bun:ffi");
		// biome-ignore lint: dynamic require
		const fs = require("node:fs");
		// biome-ignore lint: dynamic require
		const path = require("node:path");

		const ext =
			process.platform === "win32"
				? ".dll"
				: process.platform === "darwin"
					? ".dylib"
					: ".so";
		const prefix = process.platform === "win32" ? "" : "lib";

		function findLib(name: string): string {
			const candidates = [
				path.join(
					process.cwd(),
					"node_modules",
					".buntok-native",
					`${prefix}${name}${ext}`,
				),
				path.join(process.cwd(), "dist", "native", `${prefix}${name}${ext}`),
				path.join(process.cwd(), "zig-out", "lib", `${prefix}${name}${ext}`),
			];
			for (const p of candidates) {
				if (fs.existsSync(p)) return p;
			}
			return "";
		}

		const FFIType = _ffi.FFIType;
		const jsonPath = findLib("buntok_json");

		if (jsonPath) {
			_nativeJsonLib = _ffi.dlopen(jsonPath, {
				json_init: { args: [], returns: FFIType.void },
				json_deinit: { args: [], returns: FFIType.void },
				json_escape_string: {
					args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr],
					returns: FFIType.i32,
				},
			});
			_nativeJsonLib.symbols.json_init();
		}

		_nativeAvailable = true;
	} catch {
		_nativeAvailable = false;
	}
}

// ─── Trie ────────────────────────────────────────────────────────────────────

// Native trie removed - JS trie is faster when not doing double-walk.
// Benchmark: native+JS was 38% SLOWER than JS-only due to syncing overhead.
// JS engines optimize Map.get/set in native C++, so pure JS is optimal.

export class Trie {
	private jsImpl: JSTrie;

	constructor() {
		this.jsImpl = new JSTrie();
	}

	insert(path: string, handlerId: number): void {
		this.jsImpl.insert(path, handlerId);
	}

	find(path: string): { handlerId: number; params: Record<string, string> } {
		return this.jsImpl.find(path);
	}

	getNodeCount(): number {
		return this.jsImpl.getNodeCount();
	}
}

// ─── JSON Escape ─────────────────────────────────────────────────────────────

export function escapeString(str: string): string {
	if (_nativeAvailable && _nativeJsonLib) {
		try {
			const inputBuf = Buffer.from(str, "utf-8");
			const outputPtrBuf = Buffer.alloc(8);
			const outputLenBuf = Buffer.alloc(4);

			const result = _nativeJsonLib.symbols.json_escape_string(
				_ffi.ptr(inputBuf),
				inputBuf.length,
				_ffi.ptr(outputPtrBuf),
				_ffi.ptr(outputLenBuf),
			);

			if (result === 0) {
				const outLen = outputLenBuf.readUint32LE(0);
				const outPtr = outputPtrBuf.readBigUInt64LE(0);
				// biome-ignore lint: reading native memory via FFI
				const mem = new ArrayBuffer(Number(outPtr) + outLen);
				const outBuf = Buffer.from(new Uint8Array(mem, Number(outPtr), outLen));
				return outBuf.toString("utf-8");
			}
		} catch {
			// Fall through to JS
		}
	}
	return jsEscapeString(str);
}

// ─── Query Parser ────────────────────────────────────────────────────────────

export function parseQuery(query: string): Record<string, string> {
	return jsParseQuery(query);
}

// ─── Cookie Parser ───────────────────────────────────────────────────────────

export function parseCookies(cookieHeader: string): Record<string, string> {
	return jsParseCookies(cookieHeader);
}

// ─── Status ──────────────────────────────────────────────────────────────────

export function isNativeAvailable(): boolean {
	tryLoadNative();
	return _nativeAvailable === true;
}

export function getBackend(): "native" | "js" {
	return isNativeAvailable() ? "native" : "js";
}
