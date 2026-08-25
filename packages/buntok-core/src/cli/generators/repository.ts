export function generateRepository(
	entityName: string,
	pascalName: string,
): string {
	return `import { BaseRepository } from "@buntok/prisma";
import type { ${pascalName} } from "../types/${entityName}";

export class ${pascalName}Repository extends BaseRepository<${pascalName}> {
  // Define your table name and methods here
  // Example:
  // async findAll(): Promise<${pascalName}[]> {
  //   return this.delegate.findMany();
  // }
}
`;
}
