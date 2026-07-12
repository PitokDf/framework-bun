export function generateService(entityName: string, pascalName: string, withRepo: boolean = true): string {
  if (withRepo) {
    return `import { ${pascalName}Repository } from "../repositories/${entityName}.repository";
import type { ${pascalName}, New${pascalName} } from "../db/schemas/${entityName}";

export class ${pascalName}Service {
  private repository: ${pascalName}Repository;

  constructor() {
    this.repository = new ${pascalName}Repository();
  }

  async getAll(): Promise<${pascalName}[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<${pascalName} | undefined> {
    const ${entityName} = await this.repository.findById(id);
    if (!${entityName}) {
      throw new Error("${pascalName} not found");
    }
    return ${entityName};
  }

  async create(data: New${pascalName}): Promise<${pascalName}> {
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<New${pascalName}>): Promise<${pascalName}> {
    const ${entityName} = await this.repository.update(id, data);
    if (!${entityName}) {
      throw new Error("${pascalName} not found");
    }
    return ${entityName};
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error("${pascalName} not found");
    }
    return true;
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
