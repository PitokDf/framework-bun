import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";

function toPascalCase(str: string): string {
	return str
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

function generateSchema(name: string, pascalName: string): string {
	return `import { z } from "@buntok/core/middlewares/validator";

export const Create${pascalName}Schema = z.object({
  name: z.string().min(1).max(100),
  // TODO: Add more fields
});

export const Update${pascalName}Schema = Create${pascalName}Schema.partial();

export type Create${pascalName}Input = z.infer<typeof Create${pascalName}Schema>;
export type Update${pascalName}Input = z.infer<typeof Update${pascalName}Schema>;
`;
}

export async function generateSchemaFile(name: string, moduleDir: string): Promise<string | null> {
	const pascalName = toPascalCase(name);
	const filePath = join(moduleDir, `${name}.schema.ts`);

	if (existsSync(filePath)) {
		return null;
	}

	await fs.writeFile(filePath, generateSchema(name, pascalName));
	return filePath;
}
