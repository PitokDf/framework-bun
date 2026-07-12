import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function generateSeeder(name: string, pascalName: string): string {
  return `import { db } from "@/db";
import { ${name} } from "@/db/schemas/${name}"; // Adjust schema import if needed

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

export async function makeSeederCommand(name: string) {
  const pascalName = toPascalCase(name);
  console.log(`\n\x1b[36mScaffolding Seeder for ${pascalName}...\x1b[0m\n`);

  const seederDir = "src/db/seeders";
  
  if (!existsSync(seederDir)) {
    await fs.mkdir(seederDir, { recursive: true });
  }

  const filePath = join(seederDir, `${name}.seeder.ts`);
  
  if (existsSync(filePath)) {
    console.error(`\x1b[31mError: Seeder file already exists at ${filePath}\x1b[0m`);
    process.exit(1);
  }

  const content = generateSeeder(name, pascalName);
  await fs.writeFile(filePath, content);

  const biomeProc = Bun.spawnSync(["bunx", "biome", "format", "--write", filePath], {
    stdio: ["ignore", "ignore", "ignore"]
  });
  
  if (biomeProc.exitCode === 0) {
    console.log("\x1b[90m✨ Auto-formatted generated seeder file with Biome\x1b[0m");
  }

  console.log(`\x1b[32m✓ Generated seeder:\x1b[0m ${filePath}`);
}
