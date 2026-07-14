import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function generateE2ETest(name: string, pascalName: string): string {
  return `import { describe, it, expect } from "bun:test";
import { app } from "../src/index"; // Adjust this import if your app instance is exported elsewhere

describe("${pascalName} API (E2E)", () => {
  it("should return a list of items (GET /${name}s)", async () => {
    const response = await app.request("/${name}s", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    
    // const body = await response.json();
    // expect(Array.isArray(body)).toBe(true);
  });

  it("should create a new item (POST /${name}s)", async () => {
    const response = await app.request("/${name}s", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // TODO: add payload here
      }),
    });

    // expect(response.status).toBe(201);
  });

  it("should handle not found items (GET /${name}s/999999)", async () => {
    const response = await app.request("/${name}s/999999", {
      method: "GET",
    });

    // expect(response.status).toBe(404);
  });
});
`;
}

export async function makeTestE2ECommand(name: string) {
  const pascalName = toPascalCase(name);
  console.log(`\n\x1b[36mScaffolding E2E Test for ${pascalName} API...\x1b[0m\n`);

  const testsDir = "tests/e2e";
  
  if (!existsSync(testsDir)) {
    await fs.mkdir(testsDir, { recursive: true });
  }

  const filePath = join(testsDir, `${name}.e2e.spec.ts`);
  
  if (existsSync(filePath)) {
    console.error(`\x1b[31mError: E2E Test file already exists at ${filePath}\x1b[0m`);
    process.exitCode = 1;
    return;
  }

  const content = generateE2ETest(name, pascalName);
  await fs.writeFile(filePath, content);

  // Auto-format generated file with Biome if available
  const biomeProc = Bun.spawnSync(["bunx", "biome", "format", "--write", filePath], {
    stdio: ["ignore", "ignore", "ignore"]
  });
  
  if (biomeProc.exitCode === 0) {
    console.log("\x1b[90m✨ Auto-formatted generated E2E test file with Biome\x1b[0m");
  }

  console.log(`\x1b[32m✓ Generated E2E test suite:\x1b[0m ${filePath}`);
  
  console.log(`
\x1b[36mNext steps:\x1b[0m
  Run all E2E tests:
     \x1b[33mbun test tests/e2e\x1b[0m
`);
}
