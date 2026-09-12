import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ORM = "prisma" | "drizzle" | "typeorm";

/**
 * Auto-detect ORM from project dependencies
 */
export function detectORM(): ORM {
	const pkgPath = join(process.cwd(), "package.json");
	if (existsSync(pkgPath)) {
		try {
			const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
			const deps = { ...pkg.dependencies, ...pkg.devDependencies };

			if (deps["@prisma/client"] || deps["prisma"]) {
				return "prisma";
			}
			if (deps["drizzle-orm"] || deps["drizzle-kit"]) {
				return "drizzle";
			}
			if (deps["typeorm"]) {
				return "typeorm";
			}
		} catch {
			// ignore parse errors
		}
	}

	// Fallback: check for config files
	if (existsSync(join(process.cwd(), "prisma/schema.prisma"))) return "prisma";
	if (existsSync(join(process.cwd(), "drizzle.config.ts"))) return "drizzle";
	if (existsSync(join(process.cwd(), "ormconfig.json"))) return "typeorm";

	// Default to Prisma
	return "prisma";
}

function generatePrismaRepository(entityName: string, pascalName: string): string {
	return `import { BaseRepository } from "@buntok/prisma";
import { prisma } from "@/lib/prisma";
import type { ${pascalName}, Prisma } from "@prisma/client";

export class ${pascalName}Repository extends BaseRepository<
  ${pascalName},
  Prisma.${pascalName}CreateInput,
  Prisma.${pascalName}UpdateInput
> {
  constructor() {
    super(prisma, "${entityName}");
  }
}
`;
}

function generateDrizzleRepository(entityName: string, pascalName: string): string {
	return `import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ${entityName} } from "@/lib/db/schema";

export class ${pascalName}Repository {
  async findAll() {
    return db.select().from(${entityName});
  }

  async findById(id: number) {
    const results = await db.select().from(${entityName}).where(eq(${entityName}.id, id));
    return results[0] ?? null;
  }

  async create(data: typeof ${entityName}.$inferInsert) {
    const results = await db.insert(${entityName}).values(data).returning();
    return results[0];
  }

  async update(id: number, data: typeof ${entityName}.$inferUpdate) {
    const results = await db.update(${entityName}).set(data).where(eq(${entityName}.id, id)).returning();
    return results[0];
  }

  async delete(id: number) {
    await db.delete(${entityName}).where(eq(${entityName}.id, id));
    return true;
  }
}
`;
}

function generateTypeORMRepository(entityName: string, pascalName: string): string {
	return `import { AppDataSource } from "@/lib/data-source";
import { ${pascalName} } from "@/lib/entities/${pascalName}";

export class ${pascalName}Repository {
  private repo = AppDataSource.getRepository(${pascalName});

  async findAll() {
    return this.repo.find();
  }

  async findById(id: number) {
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<${pascalName}>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<${pascalName}>) {
    await this.repo.update(id, data);
    return this.repo.findOneBy({ id });
  }

  async delete(id: number) {
    await this.repo.delete(id);
    return true;
  }
}
`;
}

/**
 * Generate repository file content based on ORM
 */
export function generateRepository(
	entityName: string,
	pascalName: string,
	orm?: ORM,
): string {
	const detectedOrm = orm ?? detectORM();

	switch (detectedOrm) {
		case "drizzle":
			return generateDrizzleRepository(entityName, pascalName);
		case "typeorm":
			return generateTypeORMRepository(entityName, pascalName);
		case "prisma":
		default:
			return generatePrismaRepository(entityName, pascalName);
	}
}
