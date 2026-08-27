import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata = {
  title: "Timezone",
  description:
    "Convert and format dates across timezones with built-in helpers.",
};

export default function TimezonePage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Timezone Helpers
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Timezone utilities for handling dates across different timezones. Uses
        the Intl API (built-in, zero-deps).
      </p>

      {/* ──────────────── PARSE TIME ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        parseTime
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Parse a time string in a specific timezone:
      </p>
      <CodeBlock
        code={`import { parseTime } from "@buntok/core";

// Time only
const date = parseTime("14:30", "Asia/Jakarta");

// Date + time
const date = parseTime("2024-01-15 14:30", "America/New_York");

// Returns a Date object in the specified timezone`}
      />

      {/* ──────────────── FORMAT IN TIMEZONE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        formatInTimezone
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Format a Date object in a specific timezone:
      </p>
      <CodeBlock
        code={`import { formatInTimezone } from "@buntok/core";

const formatted = formatInTimezone(
  new Date(),
  "Asia/Jakarta",
  "HH:mm:ss"  // 14:30:00
);

// Other formats
formatInTimezone(new Date(), "America/New_York", "yyyy-MM-dd HH:mm");
// 2024-01-15 02:30`}
      />

      {/* ──────────────── TO TIMEZONE PARTS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        toTimezoneParts
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Get individual timezone parts:
      </p>
      <CodeBlock
        code={`import { toTimezoneParts } from "@buntok/core";

const parts = toTimezoneParts(new Date(), "Asia/Jakarta");
// { year, month, day, hour, minute, second, weekday }`}
      />

      {/* ──────────────── NOW IN TIMEZONE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        nowInTimezone
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Get current time in a specific timezone:
      </p>
      <CodeBlock
        code={`import { nowInTimezone } from "@buntok/core";

const jakartaTime = nowInTimezone("Asia/Jakarta");
const nyTime = nowInTimezone("America/New_York");`}
      />

      {/* ──────────────── GET TIMEZONE OFFSET ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        getTimezoneOffset
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Get timezone offset in minutes from UTC:
      </p>
      <CodeBlock
        code={`import { getTimezoneOffset } from "@buntok/core";

getTimezoneOffset("Asia/Jakarta");      // 420 (7 hours × 60)
getTimezoneOffset("America/New_York");  // -300 (-5 hours × 60)
getTimezoneOffset("UTC");               // 0`}
      />

      {/* ──────────────── IS VALID TIMEZONE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        isValidTimezone
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Check if a timezone string is valid:
      </p>
      <CodeBlock
        code={`import { isValidTimezone } from "@buntok/core";

isValidTimezone("Asia/Jakarta");     // true
isValidTimezone("America/New_York"); // true
isValidTimezone("Invalid/Zone");     // false`}
      />

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import {
  parseTime, formatInTimezone, nowInTimezone,
  getTimezoneOffset, isValidTimezone, toTimezoneParts,
} from "@buntok/core";

// API endpoint returning user's local time
app.get("/time/:timezone", (ctx) => {
  const { timezone } = ctx.params;

  if (!isValidTimezone(timezone)) {
    return ctx.error("Invalid timezone", 400);
  }

  return ctx.json({
    timezone,
    now: nowInTimezone(timezone),
    formatted: formatInTimezone(new Date(), timezone, "HH:mm:ss dd/MM/yyyy"),
    offset: getTimezoneOffset(timezone),
    parts: toTimezoneParts(new Date(), timezone),
  });
});`}
      />
    </div>
  );
}
