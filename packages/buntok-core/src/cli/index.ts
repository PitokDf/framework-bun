#!/usr/bin/env bun

import { buildCommand } from "./commands/build.js";
import { checkCommand } from "./commands/check.js";
import { createCommand } from "./commands/create.js";
import { dbCommand } from "./commands/db.js";
import { initCommand } from "./commands/init.js";
import { makeDocsCommand } from "./commands/make-docs.js";
import { makeMiddlewareCommand } from "./commands/make-middleware.js";
import { makeSeederCommand } from "./commands/make-seeder.js";
import { makeTestCommand } from "./commands/make-test.js";
import { makeTestE2ECommand } from "./commands/make-test-e2e.js";
import { VERSION } from "../core-exports.js";

function printBanner() {
	console.log(`
\x1b[36m  Buntok CLI v${VERSION}\x1b[0m
`);
}

function printUsage() {
	console.log(`
\x1b[36mUsage:\x1b[0m
  buntok <command> [arguments] [options]

\x1b[36mCommands:\x1b[0m
  init                   Setup project: copy SKILL.md + configure package.json + generate env.ts
  build                  Build project for production (output → .buntok/)
  check                  Run TypeScript type check
  create <entity>        Generate all files for entity (repo, service, controller, schema)
  db <command>           Database operations (migrate, seed, reset, generate, studio, status)
  make:docs              Generate OpenAPI documentation automatically
  make:test <entity>     Generate unit test for entity
  make:test:e2e <entity> Generate E2E test for entity
  make:seeder <entity>   Generate database seeder for entity
  make:middleware <name>  Generate middleware file

\x1b[36mOptions (for create command):\x1b[0m
  --repo                 Generate only repository
  --service              Generate only service
  --controller           Generate only controller
  --schema               Generate only schema
  --prisma               Use Prisma ORM (default: auto-detect)
  --drizzle              Use Drizzle ORM
  --typeorm              Use TypeORM
  --dry-run              Preview files without writing

\x1b[36mAliases:\x1b[0m
  g, gen, generate       Shortcut for create

\x1b[36mExamples:\x1b[0m
  buntok init                             # Initialize project setup
  buntok build                            # Build project for production
  buntok check                            # Run TypeScript type check
  buntok create user                      # Generate all files for user entity
  buntok g user --repo --service          # Generate repository and service only
  buntok g user --drizzle                 # Generate with Drizzle ORM
  buntok g user --dry-run                 # Preview what would be generated
  buntok db migrate                       # Run pending migrations
  buntok db seed                          # Seed database
  buntok make:docs                        # Generate OpenAPI documentation
  buntok make:test user                   # Generate unit test for user
  buntok make:test:e2e user               # Generate E2E test for user API
  buntok make:seeder user                 # Generate user seeder
  buntok make:middleware auth             # Generate auth middleware
`);
}

export async function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const arg1 = args[1];

	if (!command) {
		printBanner();
		printUsage();
		process.exitCode = 1;
		return;
	}

	switch (command) {
		case "init":
			await initCommand();
			break;
		case "build":
			await buildCommand();
			break;
		case "check":
			await checkCommand();
			break;
		case "g":
		case "gen":
		case "generate":
		case "create":
			if (!arg1) {
				console.error(
					"\x1b[31mError: entity name is required for create command\x1b[0m",
				);
				process.exitCode = 1;
				return;
			}
			await createCommand(arg1, args.slice(2));
			break;
		case "db":
			await dbCommand(args.slice(1));
			break;
		case "make:docs":
			await makeDocsCommand();
			break;
		case "make:test":
			if (!arg1) {
				console.error(
					"\x1b[31mError: entity name is required for make:test command\x1b[0m",
				);
				process.exitCode = 1;
				return;
			}
			await makeTestCommand(arg1);
			break;
		case "make:test:e2e":
			if (!arg1) {
				console.error(
					"\x1b[31mError: entity name is required for make:test:e2e command\x1b[0m",
				);
				process.exitCode = 1;
				return;
			}
			await makeTestE2ECommand(arg1);
			break;
		case "make:seeder":
			if (!arg1) {
				console.error(
					"\x1b[31mError: entity name is required for make:seeder command\x1b[0m",
				);
				process.exitCode = 1;
				return;
			}
			await makeSeederCommand(arg1);
			break;
		case "make:middleware":
			if (!arg1) {
				console.error(
					"\x1b[31mError: middleware name is required for make:middleware command\x1b[0m",
				);
				process.exitCode = 1;
				return;
			}
			await makeMiddlewareCommand(arg1);
			break;
		default: {
			const commands = [
				"init",
				"build",
				"check",
				"create",
				"g",
				"db",
				"make:docs",
				"make:test",
				"make:test:e2e",
				"make:seeder",
				"make:middleware",
			];
			// Simple fuzzy match: prefix or contains
			const closest = commands.find(
				(c) =>
					c.startsWith(command) ||
					command.startsWith(c) ||
					c.includes(command) ||
					command.includes(c),
			);
			const hint = closest ? `\n  Did you mean: buntok ${closest}?` : "";
			console.error(`\x1b[31mUnknown command: ${command}\x1b[0m${hint}`);
			printUsage();
			process.exitCode = 1;
			return;
		}
	}
}

main();
