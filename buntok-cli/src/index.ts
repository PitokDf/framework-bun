#!/usr/bin/env bun

import { createCommand } from "./commands/create.js";

function printBanner() {
  console.log(`
\x1b[36m  Buntok CLI v0.1.0\x1b[0m
`);
}

function printUsage() {
  console.log(`
\x1b[36mUsage:\x1b[0m
  buntok create <entity> [options]

\x1b[36mCommands:\x1b[0m
  create <entity>        Generate all files for entity (schema, repo, service, controller)

\x1b[36mOptions:\x1b[0m
  --schema               Generate only Drizzle schema
  --repo                 Generate only repository
  --service              Generate only service
  --controller           Generate only controller

\x1b[36mExamples:\x1b[0m
  buntok create user                    # Generate all files for user entity
  buntok create user --schema           # Generate only Drizzle schema
  buntok create user --repo --service   # Generate repository and service only
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const entityName = args[1];

  if (!command || !entityName) {
    printBanner();
    printUsage();
    process.exit(1);
  }

  switch (command) {
    case "create":
      await createCommand(entityName, args.slice(2));
      break;
    default:
      console.error(`\x1b[31mUnknown command: ${command}\x1b[0m`);
      printUsage();
      process.exit(1);
  }
}

main();
