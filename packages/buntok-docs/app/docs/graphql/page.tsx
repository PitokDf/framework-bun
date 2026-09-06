import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "GraphQL - BunTok",
  description: "GraphQL integration with Apollo Server and Yoga.",
};

export default function GraphQLPage() {
  return (
    <>
      <Heading level={1}>GraphQL</Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        BunTok supports GraphQL via Apollo Server and Yoga plugins. Both lazy-import peer dependencies
        — zero startup cost if not used.
      </p>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Installation
      </Heading>
      <CodeBlock
        language="bash"
        code={`# For Apollo
bun add graphql @apollo/server

# For Yoga
bun add graphql graphql-yoga`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Apollo Server
      </Heading>
      <CodeBlock
        language="typescript"
        code={`import { apolloPlugin } from "@buntok/core/plugins/graphql/apollo";

app.plugin(apolloPlugin({
  typeDefs: \`type Query { hello: String }\`,
  resolvers: { Query: { hello: () => "Hello from Apollo!" } },
}));`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        GraphQL Yoga
      </Heading>
      <CodeBlock
        language="typescript"
        code={`import { yogaPlugin } from "@buntok/core/plugins/graphql/yoga";

app.plugin(yogaPlugin({
  typeDefs: \`type Query { hello: String }\`,
  resolvers: { Query: { hello: () => "Hello from Yoga!" } },
}));`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Options
      </Heading>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="py-2 pr-4">Option</th>
              <th className="py-2 pr-4">Apollo</th>
              <th className="py-2 pr-4">Yoga</th>
              <th className="py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">typeDefs</td>
              <td className="py-2 pr-4 text-accent">&#10003;</td>
              <td className="py-2 pr-4 text-accent">&#10003;</td>
              <td className="py-2">GraphQL schema (SDL string or DocumentNode)</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">resolvers</td>
              <td className="py-2 pr-4 text-accent">&#10003;</td>
              <td className="py-2 pr-4 text-accent">&#10003;</td>
              <td className="py-2">Resolvers object</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">path</td>
              <td className="py-2 pr-4 text-accent">&#10003;</td>
              <td className="py-2 pr-4 text-accent">&#10003;</td>
              <td className="py-2">Route path (default: <code>/graphql</code>)</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">
                enablePlayground / graphiql
              </td>
              <td className="py-2 pr-4 text-accent">&#10003;</td>
              <td className="py-2 pr-4 text-accent">&#10003;</td>
              <td className="py-2">IDE in non-production (default: true)</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-mono text-xs text-accent">context</td>
              <td className="py-2 pr-4 text-accent">&#10003;</td>
              <td className="py-2 pr-4 text-text-secondary">&#8212;</td>
              <td className="py-2">Build GraphQL context from request</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Full Example with Yoga
      </Heading>
      <CodeBlock
        language="typescript"
        code={`import { App } from "@buntok/core";
import { yogaPlugin } from "@buntok/core/plugins/graphql/yoga";

const app = new App();

app.plugin(yogaPlugin({
  typeDefs: \`
    type Query {
      users: [User]
      user(id: ID!): User
    }
    type User {
      id: ID!
      name: String!
      email: String!
    }
  \`,
  resolvers: {
    Query: {
      users: () => db.user.findMany(),
      user: (_, { id }) => db.user.findUnique({ where: { id } }),
    },
  },
}));

app.listen(1212);`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Apollo with Context
      </Heading>
      <CodeBlock
        language="typescript"
        code={`app.plugin(apolloPlugin({
  typeDefs,
  resolvers,
  context: async ({ request }) => {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    const user = token ? await verifyToken(token) : null;
    return { user };
  },
}));`}
      />

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Playground
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Both plugins enable a GraphQL IDE in development:
      </p>
      <ul className="my-3 text-text-secondary leading-relaxed list-disc list-inside space-y-1">
        <li>
          <strong>Apollo</strong>: GraphiQL at <code>/graphql</code>
        </li>
        <li>
          <strong>Yoga</strong>: GraphiQL at <code>/graphql</code>
        </li>
      </ul>
      <p className="my-3 text-text-secondary leading-relaxed">
        Disable with <code>enablePlayground: false</code> (Apollo) or <code>graphiql: false</code>{" "}
        (Yoga).
      </p>

      <Heading level={2} className="text-xl font-semibold mt-8 mb-3 text-text-primary">
        Which to Choose?
      </Heading>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="py-2 pr-4"></th>
              <th className="py-2 pr-4">Apollo Server</th>
              <th className="py-2">Yoga</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-medium">Ecosystem</td>
              <td className="py-2 pr-4">Larger, more plugins</td>
              <td className="py-2">Smaller, focused</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-medium">Context</td>
              <td className="py-2 pr-4">Built-in context builder</td>
              <td className="py-2">Manual</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-medium">Performance</td>
              <td className="py-2 pr-4">Good</td>
              <td className="py-2">Better (native fetch)</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-medium">Bundle size</td>
              <td className="py-2 pr-4">Larger</td>
              <td className="py-2">Smaller</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info">
        Both plugins lazy-import their peer dependencies. The Apollo plugin wraps{" "}
        <code>@apollo/server</code> with Bun-compatible body parsing. The Yoga plugin uses the
        native <code>graphql-yoga</code> fetch adapter.
      </Callout>
    </>
  );
}
