import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REQUIRED_SCRIPTS: Record<string, string> = {
	dev: "bun --watch src/index.ts",
	start: "bun run src/index.ts",
	check: "bunx @biomejs/biome check --write .",
	format: "bunx @biomejs/biome format --write .",
	lint: "bunx @biomejs/biome lint .",
};

const BIOME_CONFIG = {
	$schema: "https://biomejs.dev/schemas/2.5.3/schema.json",
	vcs: {
		enabled: true,
		clientKind: "git",
		useIgnoreFile: true,
	},
	files: {
		ignoreUnknown: true,
		ignore: ["node_modules", "dist", ".buntok", "coverage"],
	},
	formatter: {
		enabled: true,
		indentStyle: "tab",
		indentWidth: 2,
		lineWidth: 100,
		lineEnding: "lf",
	},
	linter: {
		enabled: true,
		rules: {
			preset: "recommended",
			suspicious: {
				noExplicitAny: "off",
			},
		},
	},
	javascript: {
		formatter: {
			quoteStyle: "double",
			trailingCommas: "all",
		},
	},
};

const TSCONFIG_TEMPLATE = {
	compilerOptions: {
		// Environment setup & latest features
		lib: ["ESNext"],
		target: "ESNext",
		module: "Preserve",
		moduleDetection: "force",
		jsx: "react-jsx",
		allowJs: true,
		types: ["bun", "node"],

		// Bundler mode
		moduleResolution: "bundler",
		allowImportingTsExtensions: true,
		verbatimModuleSyntax: true,
		noEmit: true,

		// Strictness Options for TS 7+
		strict: true,
		noUncheckedIndexedAccess: true,
		exactOptionalPropertyTypes: true,
		noImplicitOverride: false,
		noFallthroughCasesInSwitch: true,
		isolatedModules: true,
		skipLibCheck: true,

		// Path alias
		paths: {
			"@/*": ["./src/*"],
		},
	},
	include: ["src/**/*"],
	exclude: ["node_modules", "dist"],
};

const VSCODE_SETTINGS = {
	"editor.formatOnSave": true,
	"editor.defaultFormatter": "biomejs.biome",
	"editor.codeActionsOnSave": {
		"source.fixAll.biome": "explicit",
		"source.organizeImports.biome": "explicit",
	},
};

const INDEX_TEMPLATE = `import { App, z, zResponse, zValidator, asyncHandler } from "buntok";

export const app = new App();

app.get("/welcome/:name",
	zValidator("params", z.object({
		name: z.string()
	}),
		{ contentType: "application/json" }
	),
	zResponse(200, { name: z.string() }),
	asyncHandler(async (ctx) => {
		return ctx.success({ name: "Hello " + ctx.params.name })
	})
);

app.listen(3000);
`;

function findSkillMdSource(): string | null {
	// 1. Relative path (works when running from @buntok/core package)
	const relativePath = join(
		__dirname,
		"..",
		"..",
		"scripts",
		"buntok-skill",
		"SKILL.md",
	);
	if (existsSync(relativePath)) return relativePath;

	// 2. Resolve from @buntok/core package (works when running from buntok CLI)
	try {
		// biome-ignore lint: dynamic import for package resolution
		const pkgJson = require.resolve("@buntok/core/package.json");
		const pkgDir = dirname(pkgJson);
		const skillPath = join(pkgDir, "scripts", "buntok-skill", "SKILL.md");
		if (existsSync(skillPath)) return skillPath;
	} catch {
		// package not found
	}

	return null;
}

function copySkillMd(projectRoot: string): boolean {
	const sourceSkill = findSkillMdSource();

	if (!sourceSkill) {
		console.warn(
			"\x1b[33m⚠ SKILL.md not found in @buntok/core, skipping.\x1b[0m",
		);
		return false;
	}

	const skillDir = join(projectRoot, ".agents", "skills", "buntok-skill");
	const destSkill = join(skillDir, "SKILL.md");

	if (!existsSync(skillDir)) {
		mkdirSync(skillDir, { recursive: true });
	}

	writeFileSync(destSkill, readFileSync(sourceSkill, "utf-8"), "utf-8");
	console.log(`\x1b[32m✓ Created\x1b[0m .agents/skills/buntok-skill/SKILL.md`);
	return true;
}

function updatePackageJson(projectRoot: string): boolean {
	const pkgPath = join(projectRoot, "package.json");

	let pkg: { name?: string; scripts?: Record<string, string>; devDependencies?: Record<string, string> };
	if (existsSync(pkgPath)) {
		pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
	} else {
		const folderName = projectRoot.split("/").pop() || "my-app";
		pkg = { name: folderName, scripts: {}, devDependencies: {} };
	}

	if (!pkg.scripts) pkg.scripts = {};

	let added = 0;
	for (const [key, value] of Object.entries(REQUIRED_SCRIPTS)) {
		if (!pkg.scripts[key]) {
			pkg.scripts[key] = value;
			added++;
		}
	}

	if (added === 0) {
		console.log("\x1b[90m• package.json: all scripts already present\x1b[0m");
		return false;
	}

	writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
	console.log(`\x1b[32m✓ Updated\x1b[0m package.json (added ${added} scripts)`);
	return true;
}

function stripJsonComments(text: string): string {
	// Remove single-line comments (// ...) but not inside strings
	return text.replace(/(?<!["':].*)\/\/.*$/gm, "");
}

function setupTsconfig(projectRoot: string): boolean {
	const tsconfigPath = join(projectRoot, "tsconfig.json");

	if (existsSync(tsconfigPath)) {
		// Merge paths into existing tsconfig
		const raw = readFileSync(tsconfigPath, "utf-8");
		const existing = JSON.parse(stripJsonComments(raw));
		if (!existing.compilerOptions) existing.compilerOptions = {};
		if (!existing.compilerOptions.paths) {
			existing.compilerOptions.paths = { "@/*": ["./src/*"] };
			writeFileSync(tsconfigPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
			console.log("\x1b[32m✓ Updated\x1b[0m tsconfig.json (added path alias)");
			return true;
		}
		if (!existing.compilerOptions.paths["@/*"]) {
			existing.compilerOptions.paths["@/*"] = ["./src/*"];
			writeFileSync(tsconfigPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
			console.log("\x1b[32m✓ Updated\x1b[0m tsconfig.json (added path alias)");
			return true;
		}
		console.log("\x1b[90m• tsconfig.json: path alias already present\x1b[0m");
		return false;
	}

	// Create new tsconfig
	writeFileSync(tsconfigPath, JSON.stringify(TSCONFIG_TEMPLATE, null, 2) + "\n", "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m tsconfig.json");
	return true;
}

function setupBiome(projectRoot: string): boolean {
	const biomePath = join(projectRoot, "biome.json");

	if (existsSync(biomePath)) {
		console.log("\x1b[90m• biome.json: already exists, skipping\x1b[0m");
		return false;
	}

	// Check if @biomejs/biome is installed
	const pkgPath = join(projectRoot, "package.json");
	let needsInstall = false;
	if (existsSync(pkgPath)) {
		const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
		const allDeps = {
			...pkg.dependencies,
			...pkg.devDependencies,
		};
		needsInstall = !allDeps["@biomejs/biome"];
	}

	if (needsInstall) {
		console.log("\x1b[90m• Installing @biomejs/biome...\x1b[0m");
		try {
			execSync("bun add -d @biomejs/biome", {
				cwd: projectRoot,
				stdio: "ignore",
			});
			console.log("\x1b[32m✓ Installed\x1b[0m @biomejs/biome");
		} catch {
			console.warn(
				"\x1b[33m⚠ Failed to install @biomejs/biome, please install manually\x1b[0m",
			);
		}
	}

	writeFileSync(biomePath, JSON.stringify(BIOME_CONFIG, null, 2) + "\n", "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m biome.json");
	return true;
}

function createIndexFile(projectRoot: string): boolean {
	const srcDir = join(projectRoot, "src");
	const indexPath = join(srcDir, "index.ts");

	if (existsSync(indexPath)) {
		console.log("\x1b[90m• src/index.ts: already exists, skipping\x1b[0m");
		return false;
	}

	if (!existsSync(srcDir)) {
		mkdirSync(srcDir, { recursive: true });
	}

	writeFileSync(indexPath, INDEX_TEMPLATE, "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m src/index.ts");
	return true;
}

function setupVscode(projectRoot: string): boolean {
	const vscodeDir = join(projectRoot, ".vscode");
	const settingsPath = join(vscodeDir, "settings.json");

	if (existsSync(settingsPath)) {
		console.log("\x1b[90m• .vscode/settings.json: already exists, skipping\x1b[0m");
		return false;
	}

	if (!existsSync(vscodeDir)) {
		mkdirSync(vscodeDir, { recursive: true });
	}

	writeFileSync(settingsPath, JSON.stringify(VSCODE_SETTINGS, null, 2) + "\n", "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m .vscode/settings.json");
	return true;
}

const ENV_CONTENT = `# Buntok Configuration
AUTH_STORE=header
AUTH_COOKIE=session
`;

const ENV_EXAMPLE_CONTENT = `# Buntok Configuration
#
# AUTH_STORE: Where to store/read JWT tokens
#   - "header" (default): Read from Authorization: Bearer <token> header
#   - "cookie": Read from HttpOnly cookie (set AUTH_COOKIE for cookie name)
#
# AUTH_COOKIE: Cookie name for JWT storage (only used when AUTH_STORE=cookie)
#
AUTH_STORE=header
AUTH_COOKIE=session
`;

const GITIGNORE_CONTENT = `# Dependencies
node_modules/

# Build output
dist/
.build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Buntok
.buntok/

# Logs
*.log
npm-debug.log*

# Coverage
coverage/
`;

function createEnvFiles(projectRoot: string): boolean {
	const envPath = join(projectRoot, ".env");
	const envExamplePath = join(projectRoot, ".env.example");
	let created = false;

	if (!existsSync(envPath)) {
		writeFileSync(envPath, ENV_CONTENT, "utf-8");
		console.log("\x1b[32m✓ Created\x1b[0m .env");
		created = true;
	} else {
		console.log("\x1b[90m• .env: already exists, skipping\x1b[0m");
	}

	if (!existsSync(envExamplePath)) {
		writeFileSync(envExamplePath, ENV_EXAMPLE_CONTENT, "utf-8");
		console.log("\x1b[32m✓ Created\x1b[0m .env.example");
		created = true;
	} else {
		console.log("\x1b[90m• .env.example: already exists, skipping\x1b[0m");
	}

	return created;
}

function createGitignore(projectRoot: string): boolean {
	const gitignorePath = join(projectRoot, ".gitignore");

	if (existsSync(gitignorePath)) {
		console.log("\x1b[90m• .gitignore: already exists, skipping\x1b[0m");
		return false;
	}

	writeFileSync(gitignorePath, GITIGNORE_CONTENT, "utf-8");
	console.log("\x1b[32m✓ Created\x1b[0m .gitignore");
	return true;
}

export async function initCommand() {
	const projectRoot = process.cwd();

	copySkillMd(projectRoot);
	updatePackageJson(projectRoot);
	setupTsconfig(projectRoot);
	setupBiome(projectRoot);
	setupVscode(projectRoot);
	createIndexFile(projectRoot);
	createEnvFiles(projectRoot);
	createGitignore(projectRoot);
}
