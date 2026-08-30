export function generateService(
	entityName: string,
	pascalName: string,
	withRepo: boolean = true,
): string {
	if (withRepo) {
		return `import { BaseService } from "@buntok/core";
import { ${pascalName}Repository } from "@/repositories/${entityName}.repository";
import type { ${pascalName} } from "@prisma/client";

export class ${pascalName}Service extends BaseService<${pascalName}> {
  constructor(private readonly ${entityName}Repository: ${pascalName}Repository) {
    super(${entityName}Repository);
  }
}
`;
	}

	return `export class ${pascalName}Service {
  async getAll(): Promise<any[]> {
    return [];
  }

  async getById(id: string): Promise<any> {
    return { id };
  }

  async create(data: any): Promise<any> {
    return data;
  }

  async update(id: string, data: any): Promise<any> {
    return { id, ...data };
  }

  async delete(id: string): Promise<boolean> {
    return true;
  }
}
`;
}
