import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";
import { detectORM, type ORM } from "../generators/repository.js";

function toPascalCase(str: string): string {
	return str
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

function generatePrismaSeeder(name: string, pascalName: string): string {
	return `import { prisma } from "@/lib/prisma";

export async function seed${pascalName}() {
  console.log("Seeding ${pascalName}...");

  // TODO: Insert your dummy data here
  // await prisma.${name}.createMany({
  //   data: [
  //     { name: "Dummy 1" },
  //     { name: "Dummy 2" },
  //   ],
  // });

  console.log("✓ ${pascalName} seeded successfully");
}
`;
}

function generateDrizzleSeeder(name: string, pascalName: string): string {
	return `import { db } from "@/lib/db";
import { ${name} } from "@/lib/db/schema";

export async function seed${pascalName}() {
  console.log("Seeding ${pascalName}...");

  // TODO: Insert your dummy data here
  // await db.insert(${name}).values([
  //   { name: "Dummy 1" },
  //   { name: "Dummy 2" },
  // ]);

  console.log("✓ ${pascalName} seeded successfully");
}
`;
}

function generateTypeORMSeeder(name: string, pascalName: string): string {
	return `import { AppDataSource } from "@/lib/data-source";
import { ${pascalName} } from "@/lib/entities/${pascalName}";

export async function seed${pascalName}() {
  console.log("Seeding ${pascalName}...");

  const repo = AppDataSource.getRepository(${pascalName});

  // TODO: Insert your dummy data here
  // await repo.save(repo.create({ name: "Dummy 1" }));
  // await repo.save(repo.create({ name: "Dummy 2" }));

  console.log("✓ ${pascalName} seeded successfully");
}
`;
}

function generateSeeder(name: string, pascalName: string, orm: ORM): string {
	switch (orm) {
		case "drizzle":
			return generateDrizzleSeeder(name, pascalName);
		case "typeorm":
			return generateTypeORMSeeder(name, pascalName);
		case "prisma":
		default:
			return generatePrismaSeeder(name, pascalName);
	}
}

export async function makeSeederCommand(name: string) {
	const pascalName = toPascalCase(name);
	const orm = detectORM();
	console.log(`\n\x1b[36mScaffolding Seeder for ${pascalName} (orm: ${orm})...\x1b[0m\n`);

	const seederDir = "src/db/seeders";

	if (!existsSync(seederDir)) {
		await fs.mkdir(seederDir, { recursive: true });
	}

	const filePath = join(seederDir, `${name}.seeder.ts`);

	if (existsSync(filePath)) {
		console.error(
			`\x1b[31mError: Seeder file already exists at ${filePath}\x1b[0m`,
		);
		process.exitCode = 1;
		return;
	}

	const content = generateSeeder(name, pascalName, orm);
	await fs.writeFile(filePath, content);

	const biomeProc = Bun.spawnSync(
		["bunx", "biome", "format", "--write", filePath],
		{
			stdio: ["ignore", "ignore", "ignore"],
		},
	);

	if (biomeProc.exitCode === 0) {
		console.log(
			"\x1b[90m✨ Auto-formatted generated seeder file with Biome\x1b[0m",
		);
	}

	console.log(`\x1b[32m✓ Generated seeder:\x1b[0m ${filePath}`);
}
