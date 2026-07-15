import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/exports.ts", "src/cli/index.ts"],
	format: ["cjs", "esm"],
	dts: false,
	splitting: false,
	sourcemap: true,
	clean: true,
	target: "node18",
	outDir: "dist",
	external: [/^bun:.*/],
	shims: true,
});
