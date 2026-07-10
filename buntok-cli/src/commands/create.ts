import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateSchema } from "../generators/schema.js";
import { generateRepository } from "../generators/repository.js";
import { generateService } from "../generators/service.js";
import { generateController } from "../generators/controller.js";

interface CreateOptions {
  schema: boolean;
  repo: boolean;
  service: boolean;
  controller: boolean;
  all: boolean;
}

function parseOptions(args: string[]): CreateOptions {
  const options: CreateOptions = {
    schema: false,
    repo: false,
    service: false,
    controller: false,
    all: true,
  };

  for (const arg of args) {
    switch (arg) {
      case "--schema":
        options.schema = true;
        options.all = false;
        break;
      case "--repo":
        options.repo = true;
        options.all = false;
        break;
      case "--service":
        options.service = true;
        options.all = false;
        break;
      case "--controller":
        options.controller = true;
        options.all = false;
        break;
    }
  }

  // If any specific option is set, don't generate all
  if (!options.all) {
    return options;
  }

  // Generate all by default
  return {
    schema: true,
    repo: true,
    service: true,
    controller: true,
    all: false,
  };
}

function ensureDirectories(entityName: string) {
  const dirs = ["src/db/schemas", "src/repositories", "src/services", "src/controllers"];
  
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

export async function createCommand(entityName: string, args: string[]) {
  const options = parseOptions(args);
  const pascalName = toPascalCase(entityName);

  console.log(`\n\x1b[36mCreating ${pascalName} entity...\x1b[0m\n`);

  // Ensure directories exist
  ensureDirectories(entityName);

  const results: string[] = [];

  // Generate schema
  if (options.schema) {
    const schemaPath = join("src/db/schemas", `${entityName}.ts`);
    if (!existsSync(schemaPath)) {
      const content = generateSchema(entityName);
      writeFileSync(schemaPath, content);
      results.push(`✓ Schema: ${schemaPath}`);
    } else {
      results.push(`• Schema: ${schemaPath} (already exists)`);
    }
  }

  // Generate repository
  if (options.repo) {
    const repoPath = join("src/repositories", `${entityName}.repository.ts`);
    if (!existsSync(repoPath)) {
      const content = generateRepository(entityName, pascalName);
      writeFileSync(repoPath, content);
      results.push(`✓ Repository: ${repoPath}`);
    } else {
      results.push(`• Repository: ${repoPath} (already exists)`);
    }
  }

  // Generate service
  if (options.service) {
    const servicePath = join("src/services", `${entityName}.service.ts`);
    if (!existsSync(servicePath)) {
      const content = generateService(entityName, pascalName);
      writeFileSync(servicePath, content);
      results.push(`✓ Service: ${servicePath}`);
    } else {
      results.push(`• Service: ${servicePath} (already exists)`);
    }
  }

  // Generate controller
  if (options.controller) {
    const controllerPath = join("src/controllers", `${entityName}.controller.ts`);
    if (!existsSync(controllerPath)) {
      const content = generateController(entityName, pascalName);
      writeFileSync(controllerPath, content);
      results.push(`✓ Controller: ${controllerPath}`);
    } else {
      results.push(`• Controller: ${controllerPath} (already exists)`);
    }
  }

  // Print results
  console.log("\x1b[32mGenerated files:\x1b[0m");
  for (const result of results) {
    console.log(`  ${result}`);
  }

  console.log(`
\x1b[36mNext steps:\x1b[0m
  1. Import and register routes in src/index.ts
  2. Run migrations: bunx drizzle-kit push
  3. Start dev: bun run dev
`);
}
