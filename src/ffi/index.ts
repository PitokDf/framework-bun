import { JSTrie, jsEscapeString, jsParseQuery, jsParseCookies } from "./fallback";

// ─── Lazy Native Loading ─────────────────────────────────────────────────────

let _nativeAvailable: boolean | undefined;
// biome-ignore lint/suspicious/noExplicitAny: FFI libs are dynamic
let _nativeTrieLib: any = undefined;
// biome-ignore lint/suspicious/noExplicitAny: FFI libs are dynamic
let _nativeJsonLib: any = undefined;
// biome-ignore lint/suspicious/noExplicitAny: FFI ptr cache
let _ffi: any = undefined;

function tryLoadNative(): void {
	if (_nativeAvailable !== undefined) return;
	try {
		// biome-ignore lint: dynamic require for optional FFI
		_ffi = require("bun:ffi");
		// biome-ignore lint: dynamic require
		const fs = require("node:fs");
		// biome-ignore lint: dynamic require
		const path = require("node:path");

		const ext = process.platform === "win32" ? ".dll" : process.platform === "darwin" ? ".dylib" : ".so";
		const prefix = process.platform === "win32" ? "" : "lib";

		function findLib(name: string): string {
			const candidates = [
				path.join(process.cwd(), "node_modules", ".buntok-native", `${prefix}${name}${ext}`),
				path.join(process.cwd(), "dist", "native", `${prefix}${name}${ext}`),
				path.join(process.cwd(), "zig-out", "lib", `${prefix}${name}${ext}`),
			];
			for (const p of candidates) {
				if (fs.existsSync(p)) return p;
			}
			return "";
		}

		const FFIType = _ffi.FFIType;
		const triePath = findLib("buntok_trie");
		const jsonPath = findLib("buntok_json");

		if (triePath) {
			_nativeTrieLib = _ffi.dlopen(triePath, {
				trie_init: { args: [], returns: FFIType.void },
				trie_deinit: { args: [], returns: FFIType.void },
				trie_insert: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.void },
				trie_find: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
				trie_node_count: { args: [], returns: FFIType.u32 },
			});
			_nativeTrieLib.symbols.trie_init();
		}

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

// Key optimization: Pre-serialized path Buffers avoid Buffer.from() per call
// biome-ignore lint/suspicious/noExplicitAny: Pre-serialized cache
const _pathBufferCache = new Map<string, { buf: Buffer; ptr: any }>();

// biome-ignore lint/suspicious/noExplicitAny: Pre-serialized cache
const _insertBufferCache = new Map<string, { buf: Buffer; ptr: any }>();

function getOrCreatePathBuf(cache: Map<string, { buf: Buffer; ptr: any }>, path: string): { buf: Buffer; ptr: any } {
	let entry = cache.get(path);
	if (!entry) {
		const buf = Buffer.from(path, "utf-8");
		entry = { buf, ptr: _ffi.ptr(buf) };
		cache.set(path, entry);
	}
	return entry;
}

export class Trie {
	private jsImpl: JSTrie;
	// biome-ignore lint/suspicious/noExplicitAny: Native lib is dynamic
	private nativeImpl: any;
	private useNative: boolean;

	constructor() {
		this.jsImpl = new JSTrie();
		this.nativeImpl = null;
		this.useNative = false;

		tryLoadNative();
		if (_nativeAvailable && _nativeTrieLib) {
			this.nativeImpl = _nativeTrieLib;
			this.useNative = true;
		}
	}

	insert(path: string, handlerId: number): void {
		if (this.useNative) {
			const { buf, ptr } = getOrCreatePathBuf(_insertBufferCache, path);
			this.nativeImpl.symbols.trie_insert(ptr, buf.length, handlerId);
		}
		// Always keep JS trie in sync for fallback
		this.jsImpl.insert(path, handlerId);
	}

	find(path: string): { handlerId: number; params: Record<string, string> } {
		if (this.useNative) {
			const { buf, ptr } = getOrCreatePathBuf(_pathBufferCache, path);
			const handlerId = this.nativeImpl.symbols.trie_find(ptr, buf.length);
			// Params are extracted by JS trie (native returns only handler_id)
			const jsResult = this.jsImpl.find(path);
			return { handlerId, params: jsResult.params };
		}
		return this.jsImpl.find(path);
	}

	getNodeCount(): number {
		if (this.useNative) {
			return this.nativeImpl.symbols.trie_node_count();
		}
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
