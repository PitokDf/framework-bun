export function generateRepository(
	entityName: string,
	pascalName: string,
): string {
	return `import { BaseRepository } from "@buntok/prisma";
// Replace with your own Prisma client instance
import { prisma } from "@/lib/prisma";
import type { ${pascalName}, PrismaClient, Prisma } from "@prisma/client";

export class ${pascalName}Repository extends BaseRepository<
  ${pascalName},
  PrismaClient,
  Prisma.${pascalName}CreateInput,
  Prisma.${pascalName}UpdateInput
> {
  constructor() {
    super(prisma, "${entityName}");
  }
}
`;
}
