#!/usr/bin/env bun

import {
	existsSync,
} from "node:fs";
import fs from "node:fs/promises";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";

const TEMPLATES_DIR = join(import.meta.dir, "..", "templates");

function printBanner() {
	console.log(`
\x1b[36m
  ██████╗ ██╗   ██╗███╗   ██╗████████╗ ██████╗ ██╗  ██╗
  ██╔══██╗██║   ██║████╗  ██║╚══██╔══╝██╔═══██╗██║ ██╔╝
  ██████╔╝██║   ██║██╔██╗ ██║   ██║   ██║   ██║█████╔╝ 
  ██╔══██╗██║   ██║██║╚██╗██║   ██║   ██║   ██║██╔═██╗ 
  ██████╔╝╚██████╔╝██║ ╚████║   ██║   ╚██████╔╝██║  ██╗
  ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝	
\x1b[0m`);
}

function printUsage() {
	console.log("Usage: bunx create-buntok <project-name>\n");
	console.log("Example:");
	console.log("  bunx create-buntok my-api\n");
}

function validateProjectName(name: string): boolean {
	if (!name || name.length === 0) {
		console.error("\x1b[31mError: Project name is required\x1b[0m");
		return false;
	}

	if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
		console.error(
			"\x1b[31mError: Project name can only contain letters, numbers, hyphens, and underscores\x1b[0m",
		);
		return false;
	}

	return true;
}

function replaceTemplate(content: string, projectName: string): string {
	return content.replace(/{PROJECT_NAME}/g, projectName);
}

function askQuestion(question: string): Promise<boolean> {
	return new Promise((resolve) => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.question(question, (answer) => {
			rl.close();
			const normalized = answer.trim().toLowerCase();
			resolve(normalized === "y" || normalized === "yes" || normalized === "");
		});
	});
}

async function main() {
	printBanner();

	const args = process.argv.slice(2);
	const projectName = args[0];

	if (!projectName) {
		printUsage();
		process.exit(1);
	}

	if (!validateProjectName(projectName)) {
		process.exit(1);
	}

	const projectPath = resolve(process.cwd(), projectName);

	if (existsSync(projectPath)) {
		console.error(
			`\x1b[31mError: Directory "${projectName}" already exists\x1b[0m`,
		);
		process.exit(1);
	}

	console.log(`\x1b[36mCreating Buntok project: ${projectName}\x1b[0m\n`);

	// Ask about Docker support
	const useDocker = await askQuestion(
		"\x1b[36mDo you want to include Docker support? (Y/n): \x1b[0m",
	);

	// Create project directory and copy templates asynchronously
	console.log("\n\x1b[90m  Copying template files...\x1b[0m");
	await fs.mkdir(projectPath, { recursive: true });
	
	// Use native recursive copy for maximum performance
	await fs.cp(TEMPLATES_DIR, projectPath, { recursive: true });

	// Handle Docker files based on user choice
	const dockerFiles = ["Dockerfile", ".dockerignore", "docker-compose.yml"];
	if (!useDocker) {
		// Remove Docker files if user declined
		for (const file of dockerFiles) {
			const filePath = join(projectPath, file);
			if (existsSync(filePath)) {
				await fs.unlink(filePath);
			}
		}
		console.log("\x1b[90m  Skipped Docker files\x1b[0m");
	} else {
		console.log("\x1b[90m  Included Docker support\x1b[0m");
	}

	// Process template files (replace placeholders) concurrently
	const filesToProcess = ["package.json", "tsconfig.json"];
	
	await Promise.all(
		filesToProcess.map(async (file) => {
			const filePath = join(projectPath, file);
			if (existsSync(filePath)) {
				const content = await fs.readFile(filePath, "utf-8");
				await fs.writeFile(filePath, replaceTemplate(content, projectName));
			}
		})
	);

	// Run bun install
	console.log("\n\x1b[90m  Installing dependencies...\x1b[0m\n");

	const proc = Bun.spawnSync(["bun", "install"], {
		cwd: projectPath,
		stdio: ["inherit", "inherit", "inherit"],
	});

	if (proc.exitCode !== 0) {
		console.error("\x1b[31mFailed to install dependencies\x1b[0m");
		process.exit(1);
	}

	// Initialize Git repository
	console.log("\n\x1b[90m  Initializing git repository...\x1b[0m");
	const gitProc = Bun.spawnSync(["git", "init"], {
		cwd: projectPath,
		stdio: ["ignore", "ignore", "ignore"], // Hide git output for cleaner terminal
	});
	
	if (gitProc.exitCode === 0) {
		// Add all files to initial commit staging to be ready
		Bun.spawnSync(["git", "add", "."], { cwd: projectPath, stdio: ["ignore", "ignore", "ignore"] });
	}

	// Success message
	console.log(`
\x1b[32m✓ Project "${projectName}" created successfully!\x1b[0m

\x1b[36mGetting started:\x1b[0m
  cd ${projectName}
  bun run dev

\x1b[36mCode generation:\x1b[0m
  bunx buntok create <entity>        # Generate all (schema, repo, service, controller)
  bunx buntok create <entity> --schema  # Generate only schema
${useDocker ? `
\x1b[36mDocker:\x1b[0m
  docker compose up --build
` : ""}
\x1b[90mHappy coding with Buntok! ⚡\x1b[0m
`);
}

main();
