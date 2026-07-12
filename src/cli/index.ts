#!/usr/bin/env bun

import { createCommand } from "./commands/create.js";
import { dbSeedCommand } from "./commands/db-seed.js";
import { makeDocsCommand } from "./commands/make-docs.js";
import { makeMiddlewareCommand } from "./commands/make-middleware.js";
import { makeSeederCommand } from "./commands/make-seeder.js";
import { makeTestCommand } from "./commands/make-test.js";
import { makeTestE2ECommand } from "./commands/make-test-e2e.js";

function printBanner() {
	console.log(`
\x1b[36m  Buntok CLI v0.1.0\x1b[0m
`);
}

function printUsage() {
	console.log(`
\x1b[36mUsage:\x1b[0m
  buntok <command> [arguments] [options]

\x1b[36mCommands:\x1b[0m
  create <entity>        Generate all files for entity (schema, repo, service, controller)
  make:middleware <name> Generate a new middleware template
  make:test <name>       Generate a unit test suite for an entity's service
  make:test-e2e <name>   Generate an E2E test suite for an entity's API endpoints
  make:seeder <name>     Generate a database seeder script
  make:docs              Generate OpenAPI documentation automatically
  db:seed                Execute all seeders in src/db/seeders

\x1b[36mOptions (for create command):\x1b[0m
  --schema               Generate only Drizzle schema
  --repo                 Generate only repository
  --service              Generate only service
  --controller           Generate only controller

\x1b[36mExamples:\x1b[0m
  buntok create user                    # Generate all files for user entity
  buntok make:middleware auth           # Generate auth.middleware.ts
  buntok make:test user                 # Generate user.spec.ts test suite
  buntok make:test-e2e user             # Generate user.e2e.spec.ts test suite
  buntok make:seeder user               # Generate user.seeder.ts
  buntok db:seed                        # Run database seeders
  buntok make:docs                      # Generate OpenAPI documentation
`);
}

export async function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const arg1 = args[1];

	if (!command) {
		printBanner();
		printUsage();
		process.exit(1);
	}

	switch (command) {
		case "create":
			if (!arg1) {
				console.error(
					"\x1b[31mError: entity name is required for create command\x1b[0m",
				);
				process.exit(1);
			}
			await createCommand(arg1, args.slice(2));
			break;
		case "make:middleware":
			if (!arg1) {
				console.error("\x1b[31mError: middleware name is required\x1b[0m");
				process.exit(1);
			}
			await makeMiddlewareCommand(arg1);
			break;
		case "make:test":
			if (!arg1) {
				console.error(
					"\x1b[31mError: entity name is required for make:test command\x1b[0m",
				);
				process.exit(1);
			}
			await makeTestCommand(arg1);
			break;
		case "make:test-e2e":
			if (!arg1) {
				console.error(
					"\x1b[31mError: entity name is required for make:test-e2e command\x1b[0m",
				);
				process.exit(1);
			}
			await makeTestE2ECommand(arg1);
			break;
		case "make:seeder":
			if (!arg1) {
				console.error(
					"\x1b[31mError: entity name is required for make:seeder command\x1b[0m",
				);
				process.exit(1);
			}
			await makeSeederCommand(arg1);
			break;
		case "db:seed":
			await dbSeedCommand();
			break;
		case "make:docs":
			await makeDocsCommand();
			break;
		default:
			console.error(`\x1b[31mUnknown command: ${command}\x1b[0m`);
			printUsage();
			process.exit(1);
	}
}

// Only execute automatically if this is the entry script
const isEntryFile =
	typeof process !== "undefined" &&
	(process.argv[1]?.endsWith("cli/index.js") ||
		process.argv[1]?.endsWith("cli/index.ts") ||
		process.argv[1]?.endsWith("buntok"));

if (isEntryFile) {
	main();
}
