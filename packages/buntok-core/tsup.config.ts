import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		"src/core-exports.ts",
		"src/exports.ts",
		"src/index.ts",
		"src/cli/index.ts",
	],
	format: ["cjs", "esm"],
	dts: false,
	splitting: false,
	sourcemap: true,
	clean: true,
	target: "esnext",
	outDir: "dist",
	external: [/^bun:.*/],
	shims: true,
});
