#!/usr/bin/env bun

import { buildCommand } from "./commands/build.js";
import { checkCommand } from "./commands/check.js";
import { createCommand } from "./commands/create.js";
import { dbCommand } from "./commands/db.js";
import { initCommand } from "./commands/init.js";
import { makeDocsCommand } from "./commands/make-docs.js";
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
  create <entity>        Generate all files for entity (repo, service, controller)
  db <command>           Database operations (migrate, seed, reset, generate, studio, status)
  make:docs              Generate OpenAPI documentation automatically

\x1b[36mOptions (for create command):\x1b[0m
  --repo                 Generate only repository
  --service              Generate only service
  --controller           Generate only controller
  --dry-run              Preview files without writing

\x1b[36mAliases:\x1b[0m
  g, gen, generate       Shortcut for create

\x1b[36mExamples:\x1b[0m
  buntok init                             # Initialize project setup
  buntok build                            # Build project for production
  buntok check                            # Run TypeScript type check
  buntok create user                      # Generate all files for user entity
  buntok g user --repo --service          # Generate repository and service only
  buntok g user --dry-run                 # Preview what would be generated
  buntok db migrate                       # Run pending migrations
  buntok db seed                          # Seed database
  buntok make:docs                        # Generate OpenAPI documentation
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
		default: {
			const commands = [
				"init",
				"build",
				"check",
				"create",
				"g",
				"db",
				"make:docs",
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
