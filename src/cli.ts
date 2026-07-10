#!/usr/bin/env bun

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
  create <entity>        Generate all files for entity (schema, repo, service, controller, route)

\x1b[36mOptions:\x1b[0m
  --schema               Generate only Drizzle schema
  --repo                 Generate only repository
  --service              Generate only service
  --controller           Generate only controller
  --route                Generate only route

\x1b[36mExamples:\x1b[0m
  buntok create user                    # Generate all files for user entity
  buntok create user --schema           # Generate only Drizzle schema
  buntok create user --repo --service   # Generate repository and service only
  buntok create user --route            # Generate route only
`);
}

function toSnakeCase(str: string): string {
	return str
		.replace(/([A-Z])/g, "_$1")
		.toLowerCase()
		.replace(/^_/, "")
		.replace(/-/g, "_");
}

function toPascalCase(str: string): string {
	return str
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

// Generators
function generateSchema(entityName: string): string {
	const tableName = toSnakeCase(entityName);
	const pascalName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

	return `import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const ${tableName} = pgTable("${tableName}", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // TODO: Add your columns here
  // Example:
  // name: varchar("name", { length: 255 }).notNull(),
  // email: varchar("email", { length: 255 }).notNull().unique(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ${pascalName} = typeof ${tableName}.$inferSelect;
export type New${pascalName} = typeof ${tableName}.$inferInsert;
`;
}

function generateRepository(entityName: string, pascalName: string): string {
	return `import { db } from "@/db";
import { ${toSnakeCase(entityName)}, type ${pascalName}, type New${pascalName} } from "@/db/schemas/${entityName}";
import { eq } from "drizzle-orm";

export class ${pascalName}Repository {
  async findAll(): Promise<${pascalName}[]> {
    return db.select().from(${toSnakeCase(entityName)});
  }

  async findById(id: string): Promise<${pascalName} | undefined> {
    const result = await db
      .select()
      .from(${toSnakeCase(entityName)})
      .where(eq(${toSnakeCase(entityName)}.id, id))
      .limit(1);
    return result[0];
  }

  async create(data: New${pascalName}): Promise<${pascalName}> {
    const result = await db.insert(${toSnakeCase(entityName)}).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<New${pascalName}>): Promise<${pascalName} | undefined> {
    const result = await db
      .update(${toSnakeCase(entityName)})
      .set({ ...data, updatedAt: new Date() })
      .where(eq(${toSnakeCase(entityName)}.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(${toSnakeCase(entityName)})
      .where(eq(${toSnakeCase(entityName)}.id, id))
      .returning();
    return result.length > 0;
  }
}
`;
}

function generateService(entityName: string, pascalName: string): string {
	return `import { ${pascalName}Repository } from "@/repositories/${entityName}.repository";
import type { ${pascalName}, New${pascalName} } from "@/db/schemas/${entityName}";
import { NotFoundError } from "buntok";

export class ${pascalName}Service {
  private repository: ${pascalName}Repository;

  constructor(repository?: ${pascalName}Repository) {
    this.repository = repository ?? new ${pascalName}Repository();
  }

  async getAll(): Promise<${pascalName}[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<${pascalName}> {
    const ${entityName} = await this.repository.findById(id);
    if (!${entityName}) {
      throw new NotFoundError("${pascalName} not found");
    }
    return ${entityName};
  }

  async create(data: New${pascalName}): Promise<${pascalName}> {
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<New${pascalName}>): Promise<${pascalName}> {
    const ${entityName} = await this.repository.update(id, data);
    if (!${entityName}) {
      throw new NotFoundError("${pascalName} not found");
    }
    return ${entityName};
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError("${pascalName} not found");
    }
    return true;
  }
}
`;
}

function generateController(entityName: string, pascalName: string): string {
	return `import { asyncHandler } from "buntok";
import { ${pascalName}Service } from "@/services/${entityName}.service";
import type { New${pascalName} } from "@/db/schemas/${entityName}";

export class ${pascalName}Controller {
  private service: ${pascalName}Service;

  constructor(service?: ${pascalName}Service) {
    this.service = service ?? new ${pascalName}Service();
  }

  // GET /${entityName}
  getAll = asyncHandler(async (ctx) => {
    const ${entityName}s = await this.service.getAll();
    return ctx.json({ data: ${entityName}s });
  });

  // GET /${entityName}/:id
  getById = asyncHandler(async (ctx) => {
    const ${entityName} = await this.service.getById(ctx.params.id);
    return ctx.json({ data: ${entityName} });
  });

  // POST /${entityName}
  create = asyncHandler(async (ctx) => {
    const body = await ctx.body<New${pascalName}>();
    const ${entityName} = await this.service.create(body);
    return ctx.json({ data: ${entityName} }, 201);
  });

  // PUT /${entityName}/:id
  update = asyncHandler(async (ctx) => {
    const body = await ctx.body<Partial<New${pascalName}>>();
    const ${entityName} = await this.service.update(ctx.params.id, body);
    return ctx.json({ data: ${entityName} });
  });

  // DELETE /${entityName}/:id
  delete = asyncHandler(async (ctx) => {
    await this.service.delete(ctx.params.id);
    return ctx.status(204);
  });
}
`;
}

function generateRoute(entityName: string, pascalName: string): string {
	return `import type { App } from "buntok";
import { ${pascalName}Repository } from "@/repositories/${entityName}.repository";
import { ${pascalName}Service } from "@/services/${entityName}.service";
import { ${pascalName}Controller } from "@/controllers/${entityName}.controller";

export function register${pascalName}Routes(app: App) {
  // Register to DI
  const repository = new ${pascalName}Repository();
  const service = new ${pascalName}Service(repository);
  const controller = new ${pascalName}Controller(service);

  app.set("${entityName}Repository", repository);
  app.set("${entityName}Service", service);
  app.set("${entityName}Controller", controller);

  // Register routes
  app.get("/${entityName}", (ctx) => controller.getAll(ctx));
  app.get("/${entityName}/:id", (ctx) => controller.getById(ctx));
  app.post("/${entityName}", (ctx) => controller.create(ctx));
  app.put("/${entityName}/:id", (ctx) => controller.update(ctx));
  app.delete("/${entityName}/:id", (ctx) => controller.delete(ctx));
}
`;
}

interface CreateOptions {
	schema: boolean;
	repo: boolean;
	service: boolean;
	controller: boolean;
	route: boolean;
}

function parseOptions(args: string[]): CreateOptions {
	const options: CreateOptions = {
		schema: false,
		repo: false,
		service: false,
		controller: false,
		route: false,
	};

	for (const arg of args) {
		switch (arg) {
			case "--schema":
				options.schema = true;
				break;
			case "--repo":
				options.repo = true;
				break;
			case "--service":
				options.service = true;
				break;
			case "--controller":
				options.controller = true;
				break;
			case "--route":
				options.route = true;
				break;
		}
	}

	// If no specific option, generate all
	if (
		!options.schema &&
		!options.repo &&
		!options.service &&
		!options.controller &&
		!options.route
	) {
		return {
			schema: true,
			repo: true,
			service: true,
			controller: true,
			route: true,
		};
	}

	return options;
}

async function createCommand(entityName: string, args: string[]) {
	const options = parseOptions(args);
	const pascalName = toPascalCase(entityName);

	console.log(`\n\x1b[36mCreating ${pascalName} entity...\x1b[0m\n`);

	// Ensure directories exist
	const dirs = [
		"src/db/schemas",
		"src/repositories",
		"src/services",
		"src/controllers",
		"src/routes",
	];
	for (const dir of dirs) {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	}

	const results: string[] = [];

	// Generate schema
	if (options.schema) {
		const schemaPath = join("src/db/schemas", `${entityName}.ts`);
		if (!existsSync(schemaPath)) {
			writeFileSync(schemaPath, generateSchema(entityName));
			results.push(`✓ Schema: ${schemaPath}`);

			// Update schemas/index.ts to export the new schema
			const indexPath = join("src/db/schemas", "index.ts");
			let indexContent = "";
			if (existsSync(indexPath)) {
				const fs = await import("node:fs");
				indexContent = fs.readFileSync(indexPath, "utf-8");
			}
			const exportLine = `export * from "./${entityName}";\n`;
			if (!indexContent.includes(exportLine.trim())) {
				writeFileSync(indexPath, indexContent + exportLine);
				results.push(`✓ Updated: ${indexPath}`);
			}
		} else {
			results.push(`• Schema: ${schemaPath} (already exists)`);
		}
	}

	// Generate repository
	if (options.repo) {
		const repoPath = join("src/repositories", `${entityName}.repository.ts`);
		if (!existsSync(repoPath)) {
			writeFileSync(repoPath, generateRepository(entityName, pascalName));
			results.push(`✓ Repository: ${repoPath}`);
		} else {
			results.push(`• Repository: ${repoPath} (already exists)`);
		}
	}

	// Generate service
	if (options.service) {
		const servicePath = join("src/services", `${entityName}.service.ts`);
		if (!existsSync(servicePath)) {
			writeFileSync(servicePath, generateService(entityName, pascalName));
			results.push(`✓ Service: ${servicePath}`);
		} else {
			results.push(`• Service: ${servicePath} (already exists)`);
		}
	}

	// Generate controller
	if (options.controller) {
		const controllerPath = join(
			"src/controllers",
			`${entityName}.controller.ts`,
		);
		if (!existsSync(controllerPath)) {
			writeFileSync(controllerPath, generateController(entityName, pascalName));
			results.push(`✓ Controller: ${controllerPath}`);
		} else {
			results.push(`• Controller: ${controllerPath} (already exists)`);
		}
	}

	// Generate route
	if (options.route) {
		const routePath = join("src/routes", `${entityName}.routes.ts`);
		if (!existsSync(routePath)) {
			writeFileSync(routePath, generateRoute(entityName, pascalName));
			results.push(`✓ Route: ${routePath}`);
		} else {
			results.push(`• Route: ${routePath} (already exists)`);
		}
	}

	// Print results
	console.log("\x1b[32mGenerated files:\x1b[0m");
	for (const result of results) {
		console.log(`  ${result}`);
	}

	console.log(`
\x1b[36mNext steps:\x1b[0m
  1. Import and register routes in src/index.ts:
     import { register${pascalName}Routes } from "@/routes/${entityName}.routes";
     register${pascalName}Routes(app);
  2. Run migrations: bun run db:push
  3. Start dev: bun run dev
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
