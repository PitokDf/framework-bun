/**
 * Postbuild script: rewrite bare Node.js builtin imports to use `node:` prefix.
 *
 * tsup targets es2022 so it emits `import { X } from "crypto"` (bare),
 * but Bun's runtime treats bare specifiers as browser polyfills.
 * Prefixing with `node:` makes Bun resolve them as native builtins.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BUILTINS = new Set([
	"assert",
	"buffer",
	"child_process",
	"crypto",
	"dgram",
	"dns",
	"events",
	"fs",
	"fs/promises",
	"http",
	"https",
	"net",
	"os",
	"path",
	"perf_hooks",
	"process",
	"punycode",
	"querystring",
	"readline",
	"stream",
	"string_decoder",
	"sys",
	"timers",
	"tls",
	"tty",
	"url",
	"util",
	"v8",
	"vm",
	"worker_threads",
	"zlib",
]);

const distDir = join(import.meta.dir, "..", "dist");

const jsFiles: string[] = [];
function walk(dir: string) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full);
		else if (entry.name.endsWith(".js") || entry.name.endsWith(".cjs")) jsFiles.push(full);
	}
}

walk(distDir);

let totalFixed = 0;

for (const file of jsFiles) {
	let content = readFileSync(file, "utf-8");
	let changed = false;

	for (const builtin of BUILTINS) {
		const patterns: [string, string][] = [
			[`from "${builtin}"`, `from "node:${builtin}"`],
			[`from '${builtin}'`, `from 'node:${builtin}'`],
			[`import "${builtin}"`, `import "node:${builtin}"`],
			[`import '${builtin}'`, `import 'node:${builtin}'`],
			[`require("${builtin}")`, `require("node:${builtin}")`],
			[`require('${builtin}')`, `require('node:${builtin}')`],
		];

		for (const [from, to] of patterns) {
			if (content.includes(from)) {
				content = content.split(from).join(to);
				changed = true;
			}
		}
	}

	if (changed) {
		writeFileSync(file, content);
		totalFixed++;
		console.log(`  ✓ ${file.replace(distDir + "/", "")}`);
	}
}

console.log(`\nFixed ${totalFixed} file(s)`);
