import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		"src/core-exports.ts",
		"src/exports.ts",
		"src/index.ts",
		"src/cli/index.ts",
		"src/client.ts",
		"src/dev.ts",
		"src/plugin.ts",
		"src/plugins/opentelemetry.ts",
		"src/plugins/graphql/index.ts",
		"src/plugins/graphql/apollo.ts",
		"src/plugins/graphql/yoga.ts",
		"src/queue-drivers/index.ts",
	],
	format: ["cjs", "esm"],
	dts: false,
	splitting: true,
	sourcemap: true,
	clean: true,
	target: "es2022",
	outDir: "dist",
	external: [
		/^bun:.*/,
		// Peer deps — users install these
		"@apollo/server",
		"graphql",
		"graphql-yoga",
		"@opentelemetry/api",
		"@opentelemetry/sdk-node",
		"@opentelemetry/resources",
		"@opentelemetry/semantic-conventions",
		"@opentelemetry/sdk-trace-node",
		"@opentelemetry/exporter-trace-otlp-http",
		// Queue driver peer deps
		"ioredis",
		"bullmq",
		"amqplib",
	],
	// Force bundle these deps into @buntok/core output
	// (they're in dependencies but tsup externalizes deps by default with splitting)
	noExternal: ["zod", "croner", "@asteasolutions/zod-to-openapi"],
	shims: true,
});
