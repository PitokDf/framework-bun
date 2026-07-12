import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { join } from "node:path";

function toPascalCase(str: string): string {
	return str
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

function generateTest(name: string, pascalName: string): string {
	return `import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ${pascalName}Service } from "../src/services/${name}.service";
import { ${pascalName}Repository } from "../src/repositories/${name}.repository";

describe("${pascalName}Service", () => {
  let service: ${pascalName}Service;
  let mockRepo: any;

  beforeEach(() => {
    // 1. Mock the repository layer
    mockRepo = {
      findAll: mock(() => Promise.resolve([])),
      findById: mock((id: number) => Promise.resolve({ id, name: "Test ${pascalName}" })),
      create: mock((data: any) => Promise.resolve({ id: 1, ...data })),
      update: mock((id: number, data: any) => Promise.resolve({ id, ...data })),
      delete: mock((id: number) => Promise.resolve({ id })),
    };

    // 2. Inject mock repo into the service
    service = new ${pascalName}Service(mockRepo as unknown as ${pascalName}Repository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return an array of items", async () => {
    const result = await service.findAll();
    expect(result).toBeInstanceOf(Array);
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it("should return a single item by id", async () => {
    const result = await service.findById(1);
    expect(result).toHaveProperty("id", 1);
    expect(result).toHaveProperty("name", "Test ${pascalName}");
    expect(mockRepo.findById).toHaveBeenCalledWith(1);
  });

  // TODO: Add more business logic tests here
});
`;
}

export async function makeTestCommand(name: string) {
	const pascalName = toPascalCase(name);
	console.log(`\n\x1b[36mScaffolding Unit Test for ${pascalName}...\x1b[0m\n`);

	const testsDir = "tests";

	if (!existsSync(testsDir)) {
		await fs.mkdir(testsDir, { recursive: true });
	}

	const filePath = join(testsDir, `${name}.spec.ts`);

	if (existsSync(filePath)) {
		console.error(
			`\x1b[31mError: Test file already exists at ${filePath}\x1b[0m`,
		);
		process.exit(1);
	}

	const content = generateTest(name, pascalName);
	await fs.writeFile(filePath, content);

	// Auto-format generated file with Biome if available
	const biomeProc = Bun.spawnSync(
		["bunx", "biome", "format", "--write", filePath],
		{
			stdio: ["ignore", "ignore", "ignore"],
		},
	);

	if (biomeProc.exitCode === 0) {
		console.log(
			"\x1b[90m✨ Auto-formatted generated test file with Biome\x1b[0m",
		);
	}

	console.log(`\x1b[32m✓ Generated test suite:\x1b[0m ${filePath}`);

	console.log(`
\x1b[36mNext steps:\x1b[0m
  Run your test suite instantly using Bun's native test runner:
     \x1b[33mbun test\x1b[0m
     \x1b[33mbun test --watch\x1b[0m  (For TDD / Live Reload)
`);
}
