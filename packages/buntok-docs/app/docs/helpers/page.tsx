import { Heading } from "@/components/ui/Heading";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata = {
  title: "Helpers",
  description: "Utility functions for async, password hashing, crypto, strings, and more.",
};


export default function HelpersPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Helpers
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Utility functions available in <code>@buntok/core</code>.
      </p>

      {/* ──────────────── PASSWORD ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Password Hashing
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                hashPassword(password)
              </td>
              <td className="px-4 py-2">
                Hash password using scrypt (memory-hard)
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                verifyPassword(password, hash)
              </td>
              <td className="px-4 py-2">
                Verify password (supports scrypt + legacy PBKDF2)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { hashPassword, verifyPassword } from "@buntok/core";

// Hash
const hash = await hashPassword("my-password");

// Verify
const isValid = await verifyPassword("my-password", hash);`}
      />
      <Callout type="info">
        Uses <strong>scrypt</strong> (built-in, memory-hard). Backward compatible
        with legacy PBKDF2 hashes.
      </Callout>

      {/* ──────────────── TIMEZONE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Timezone Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                parseTime(time, tz)
              </td>
              <td className="px-4 py-2">Parse time string in timezone</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                formatInTimezone(date, tz, format)
              </td>
              <td className="px-4 py-2">Format date in timezone</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                toTimezoneParts(date, tz)
              </td>
              <td className="px-4 py-2">Get timezone parts</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                nowInTimezone(tz)
              </td>
              <td className="px-4 py-2">Get current time in timezone</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                getTimezoneOffset(tz)
              </td>
              <td className="px-4 py-2">Get offset in minutes</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                isValidTimezone(tz)
              </td>
              <td className="px-4 py-2">Check if timezone is valid</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import {
  parseTime, formatInTimezone, toTimezoneParts,
  nowInTimezone, getTimezoneOffset, isValidTimezone,
} from "@buntok/core";

const date = parseTime("14:30", "Asia/Jakarta");
const formatted = formatInTimezone(new Date(), "Asia/Jakarta", "HH:mm:ss");
const offset = getTimezoneOffset("Asia/Jakarta"); // 420
isValidTimezone("Asia/Jakarta"); // true`}
      />

      {/* ──────────────── ASYNC HELPERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Async Helpers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Function
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                delay(ms)
              </td>
              <td className="px-4 py-2">Promise-based sleep</td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                retry(fn, options?)
              </td>
              <td className="px-4 py-2">
                Retry with configurable backoff
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        code={`import { delay, retry } from "@buntok/core";

// Promise-based sleep
await delay(1000); // 1 second

// Retry with exponential backoff
const data = await retry(
  () => fetch("https://api.example.com/data").then(r => r.json()),
  { retries: 3, delay: 1000, backoff: "exponential" }
);

// Retry with custom error filter
await retry(
  () => db.query("SELECT ..."),
  {
    retries: 5,
    delay: 500,
    backoff: "fixed",
    onError: (err, attempt) => {
      // Only retry on connection errors
      return err instanceof ConnectionError;
    },
  }
);`}
      />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Option
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Default
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["retries", "number", "3", "Max retry attempts"],
              ["delay", "number", "1000", "Base delay in ms"],
              ["backoff", '"fixed" | "exponential"', '"exponential"', "Backoff strategy"],
              ["onError", "(err, attempt) => boolean", "always retry", "Decide if error is retryable"],
            ].map(([opt, type, def, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{type}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">{def}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="info">
        <code>delay</code> is a simple Promise-based sleep. <code>retry</code> wraps
        an async function with configurable retries, backoff, and error filtering.
      </Callout>

      {/* ──────────────── FILE UPLOAD ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        File Upload
      </Heading>
      <CodeBlock
        code={`import { parseUploads, LocalDiskStorage } from "@buntok/core";

const result = await parseUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  maxFileSize: 5 * 1024 * 1024,
  fields: {
    avatar: { required: true, allowedMimeTypes: ["image/png"] },
  },
});

result.fields.avatar // UploadedFile
result.files         // UploadedFile[]`}
      />
      <Callout type="info">
        See the{" "}
        <a href="/docs/upload" className="text-accent hover:underline">
          Upload
        </a>{" "}
        page for full documentation including storage drivers, custom filenames,
        and middleware.
      </Callout>
    </div>
  );
}
