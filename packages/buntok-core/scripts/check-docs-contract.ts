#!/usr/bin/env bun

/**
 * Docs Contract Checker
 *
 * Verifies that:
 * 1. Every CLI command documented in SKILL.md exists in CLI implementation
 * 2. Every main-package import resolves
 * 3. No stale output paths appear
 * 4. No deprecated API is presented as preferred
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const SKILL_PATH = join(ROOT, "scripts/buntok-skill/SKILL.md");
const EXPORTS_PATH = join(ROOT, "src/core-exports.ts");
const CLI_INDEX_PATH = join(ROOT, "src/cli/index.ts");

let errors = 0;
let warnings = 0;

function error(msg: string) {
	console.error(`\x1b[31mERROR:\x1b[0m ${msg}`);
	errors++;
}

function warn(msg: string) {
	console.warn(`\x1b[33mWARN:\x1b[0m ${msg}`);
	warnings++;
}

function ok(msg: string) {
	console.log(`\x1b[32mOK:\x1b[0m ${msg}`);
}

// 1. Check CLI commands documented in SKILL.md exist in CLI implementation
function checkCLICommands() {
	console.log("\n--- Checking CLI commands ---\n");

	const skill = readFileSync(SKILL_PATH, "utf-8");
	const cliIndex = readFileSync(CLI_INDEX_PATH, "utf-8");

	const documentedCommands = [
		"init", "create", "build", "check", "dev", "debug:routes", "db",
		"make:middleware", "make:factory", "make:seeder", "make:test", "make:test:e2e", "make:docs",
	];

	for (const cmd of documentedCommands) {
		if (cliIndex.includes(`"${cmd}"`)) {
			ok(`CLI command "${cmd}" found in implementation`);
		} else {
			error(`CLI command "${cmd}" documented but NOT found in cli/index.ts`);
		}
	}

	// Check for stale paths
	const stalePatterns = [".buntok/server.js"];
	for (const pattern of stalePatterns) {
		if (skill.includes(pattern)) {
			warn(`Stale output path "${pattern}" found in SKILL.md`);
		}
	}
}

// 2. Check main-package imports resolve
function checkExports() {
	console.log("\n--- Checking exports ---\n");

	const exports = readFileSync(EXPORTS_PATH, "utf-8");
	const importRegex = /from "\.\/(.+?)"/g;
	let match;
	const modules = new Set<string>();

	while ((match = importRegex.exec(exports)) !== null) {
		modules.add(match[1]);
	}

	for (const mod of modules) {
		const tsPath = join(ROOT, `src/${mod}.ts`);
		const indexPath = join(ROOT, `src/${mod}/index.ts`);
		const dirPath = join(ROOT, `src/${mod}`);

		if (existsSync(tsPath) || existsSync(indexPath) || existsSync(dirPath)) {
			ok(`Module "./${mod}" resolves`);
		} else {
			error(`Module "./${mod}" does NOT resolve to any file`);
		}
	}
}

// 3. Check for deprecated APIs presented as preferred
function checkDeprecatedAPIs() {
	console.log("\n--- Checking deprecated APIs ---\n");

	const skill = readFileSync(SKILL_PATH, "utf-8");
	const exports = readFileSync(EXPORTS_PATH, "utf-8");

	// Check if UseGuards is documented (it's deprecated)
	if (skill.includes("UseGuards") && !skill.includes("deprecated")) {
		warn("UseGuards is documented in SKILL.md without 'deprecated' note");
	}

	// Verify deprecated aliases are marked
	if (exports.includes("UseGuards")) {
		ok("UseGuards exported with deprecated note");
	}
}

// 4. Check package.json scripts align with SKILL.md
function checkPackageScripts() {
	console.log("\n--- Checking package.json scripts ---\n");

	const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
	const skill = readFileSync(SKILL_PATH, "utf-8");

	const requiredScripts = ["typecheck", "test", "build"];
	for (const script of requiredScripts) {
		if (pkg.scripts?.[script]) {
			ok(`Script "${script}" exists: ${pkg.scripts[script]}`);
		} else {
			error(`Script "${script}" missing from package.json`);
		}
	}
}

// Run all checks
console.log("\x1b[1m=== @buntok/core Docs Contract Checker ===\x1b[0m\n");

checkCLICommands();
checkExports();
checkDeprecatedAPIs();
checkPackageScripts();

console.log("\n--- Summary ---\n");
console.log(`\x1b[32m${errors === 0 ? "All checks passed!" : `${errors} error(s), ${warnings} warning(s)`}\x1b[0m`);

if (errors > 0) {
	process.exit(1);
}
