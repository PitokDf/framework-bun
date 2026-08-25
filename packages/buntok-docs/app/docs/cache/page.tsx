import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Cache",
  description: "Cache responses and data with in-memory store, TTL, and pattern deletion.",
};


export default function CachePage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Cache
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        In-memory caching with TTL support. Use for rate limiting, memoization,
        or temporary data storage.
      </p>

      {/* ──────────────── CACHE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Cache
      </Heading>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { Cache } from "@buntok/core";

const cache = new Cache();

// Set with TTL (milliseconds)
cache.set("key", "value", 60_000); // 1 minute

// Get (returns undefined if expired)
const value = cache.get("key");

// Delete
cache.delete("key");

// Clear all entries
cache.clear();`}
      />

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Cache API
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Return
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["cache.get(key)", "T | null", "Get value (null if expired)"],
              ["cache.set(key, value, ttl?)", "void", "Set value with optional TTL (seconds)"],
              ["cache.delete(key)", "void", "Delete a key"],
              ["cache.clear()", "void", "Clear all entries"],
              ["cache.has(key)", "boolean", "Check if key exists and hasn't expired"],
              [
                "cache.getOrSet(key, factory, ttl?)",
                "T",
                "Get from cache or compute and cache",
              ],
              [
                "cache.increment(key, amount?, ttl?)",
                "number",
                "Increment numeric value (atomic)",
              ],
              [
                "cache.decrement(key, amount?, ttl?)",
                "number",
                "Decrement numeric value (atomic)",
              ],
              ["cache.mget(keys)", "(T | null)[]", "Get multiple keys at once"],
              [
                "cache.mset(entries, ttl?)",
                "void",
                "Set multiple key-value pairs",
              ],
              [
                "cache.deletePattern(pattern)",
                "number",
                "Delete keys matching glob pattern",
              ],
              ["cache.keys()", "string[]", "List all stored keys"],
            ].map(([method, ret, desc]) => (
              <tr
                key={method}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{method}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{ret}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Common Patterns
      </Heading>
      <CodeBlock
        code={`// getOrSet — cache-aside pattern
const user = await cache.getOrSet(
  \`user:\${id}\`,
  () => db.user.findUnique({ where: { id } }),
  300 // TTL in seconds
);

// Atomic counter
await cache.increment("page:views", 1, 3600);
const views = await cache.get<number>("page:views");

// Batch operations
await cache.mset([["user:1", data1], ["user:2", data2]], 300);
const [u1, u2] = await cache.mget(["user:1", "user:2"]);

// Pattern delete — clear all session keys
await cache.deletePattern("session:*");`}
      />

      {/* ──────────────── AICACHE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        AICache
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Cache for AI responses. Hashes messages to generate cache keys:
      </p>
      <CodeBlock
        code={`import { AICache } from "@buntok/core";

const aiCache = new AICache({ ttl: 3600_000 }); // 1 hour

app.post("/chat", async (ctx) => {
  const { messages } = await ctx.body();

  // Check cache first
  const cached = await aiCache.get(messages);
  if (cached) return ctx.json({ response: cached });

  // Call AI
  const response = await callAI(messages);

  // Cache the result
  await aiCache.set(messages, response);

  return ctx.json({ response });
});`}
      />

      <Callout type="info">
        <code>AICache</code> automatically generates cache keys by hashing the
        message array. Duplicate conversations are served from cache.
      </Callout>
    </div>
  );
}
