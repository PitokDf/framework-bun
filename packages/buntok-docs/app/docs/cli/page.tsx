"use client";

import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";

export default function CLIPage() {
  return (
    <div>
      <Heading level={1} className="text-4xl font-bold mt-8 mb-4 text-text-primary">CLI</Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Buntok provides a CLI for scaffolding and managing projects.
      </p>

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Commands
      </Heading>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">init</Heading>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed rounded-lg border border-border-primary bg-bg-tertiary my-4">
        <code>bunx buntok init</code>
      </pre>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">dev</Heading>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed rounded-lg border border-border-primary bg-bg-tertiary my-4">
        <code>bunx buntok dev</code>
      </pre>

      <Heading level={3} className="text-xl font-semibold mt-6 mb-2 text-text-primary">db</Heading>
      <CodeBlock
        code={`bunx buntok db migrate
bunx buntok db reset
bunx buntok db seed
bunx buntok db generate`}
      />

      <Heading level={2} className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2">
        Project Structure
      </Heading>
      <CodeBlock
        code={`my-app/
├── src/
│   ├── index.ts
│   ├── controllers/
│   ├── services/
│   └── models/
├── prisma/
│   └── schema.prisma
├── package.json
└── tsconfig.json`}
      />
    </div>
  );
}
