import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "Queue",
  description: "Process background jobs with priority, delays, retries, and backoff strategies.",
};


export default function QueuePage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Queue
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Job queue for background processing with priority, delay, retries, and
        backoff strategies. In-memory by default - plug in your own driver for
        persistence.
      </p>

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { Queue } from "@buntok/core";

const emailQueue = new Queue<{ to: string; subject: string }>("emails");

// Add a job
await emailQueue.add({ to: "user@example.com", subject: "Welcome!" });

// Process jobs
emailQueue.process(async (job) => {
  console.log(\`Processing \${job.id}\`);
  await sendEmail(job.data.to, job.data.subject);
});`}
      />

      <Callout type="warning">
        The <strong>name</strong> (<code>&quot;emails&quot;</code>) is the first
        argument and is <strong>required</strong>. Each queue must have a unique
        name. This name is used for logging, debugging, and driver isolation.
        Passing no name or an empty string will throw.
      </Callout>

      {/* ──────────────── QUEUE API ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Queue API
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Method
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "queue.add(data, opts?)",
                "Add a job (opts: priority, delay)",
              ],
              [
                "queue.process(handler)",
                "Register a handler for jobs",
              ],
              ["queue.size()", "Number of pending jobs"],
              ["queue.clear()", "Remove all pending jobs"],
            ].map(([method, desc]) => (
              <tr
                key={method}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{method}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── JOB OBJECT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Job Object
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Property
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["job.id", "string", "Auto-generated UUID"],
              ["job.data", "T", "Payload passed by the caller"],
              ["job.priority", "number", "Higher = processed sooner (default: 0)"],
              ["job.delay", "number", "ms to wait before processing"],
              ["job.attempt", "number", "Current attempt (0 = first)"],
              ["job.createdAt", "number", "Timestamp when added"],
            ].map(([prop, type, desc]) => (
              <tr
                key={prop}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{prop}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {type}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── PRIORITY & DELAY ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Priority & Delay
      </Heading>
      <CodeBlock
        code={`// High priority job (processed first)
await queue.add({ task: "urgent" }, { priority: 10 });

// Delayed job (process after 5 seconds)
await queue.add({ task: "later" }, { delay: 5000 });

// Both
await queue.add({ task: "important-later" }, {
  priority: 5,
  delay: 10_000,
});`}
      />

      {/* ──────────────── RETRIES ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Retries & Backoff
      </Heading>
      <CodeBlock
        code={`// Retry failed jobs up to 3 times
const queue = new Queue("tasks", {
  maxRetries: 3,
  retryDelay: 1000,      // 1 second between retries
  backoff: "fixed",       // or "exponential"
});

// Exponential backoff: 1s, 2s, 4s, 8s...
const queue = new Queue("tasks", {
  maxRetries: 4,
  retryDelay: 1000,
  backoff: "exponential",
});`}
      />

      <Callout type="info">
        Jobs that exceed <code>maxRetries</code> are permanently failed and
        logged to console. The queue continues processing remaining jobs.
      </Callout>

      {/* ──────────────── MULTIPLE HANDLERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Multiple Handlers
      </Heading>
      <CodeBlock
        code={`// Register multiple handlers (all run for each job)
queue.process(async (job) => {
  await logJob(job);
});

queue.process(async (job) => {
  await processPayment(job.data);
});`}
      />

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import { App, Queue } from "@buntok/core";

const emailQueue = new Queue<{
  to: string;
  subject: string;
  body: string;
}>("emails", { maxRetries: 3, backoff: "exponential" });

// Process emails in background
emailQueue.process(async (job) => {
  console.log(\`[\${job.attempt + 1}] Sending to \${job.data.to}\`);
  await transporter.sendMail({
    to: job.data.to,
    subject: job.data.subject,
    html: job.data.body,
  });
});

// HTTP endpoint adds jobs
app.post("/send-email", async (ctx) => {
  const { to, subject, body } = await ctx.body();
  await emailQueue.add({ to, subject, body });
  return ctx.json({ queued: true });
});

app.listen(1212);`}
      />

      {/* ──────────────── CUSTOM DRIVERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Custom Drivers (BullMQ)
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        For production workloads with persistence, use a Redis-backed driver
        like BullMQ. Install <code>bullmq</code> and implement the{" "}
        <code>QueueDriver</code> interface:
      </p>
      <CodeBlock
        code={`import { Queue as BullMQQueue, Worker as BullMQWorker } from "bullmq";
import { type QueueDriver, type JobHandler } from "@buntok/core";

class BullMQDriver<T> implements QueueDriver<T> {
  private queue: BullMQQueue;
  private worker: BullMQWorker | null = null;

  constructor(name: string, redisUrl = "redis://localhost:6379") {
    this.queue = new BullMQQueue(name, {
      connection: { url: redisUrl },
    });
  }

  async add(data: T, opts?: { priority?: number; delay?: number }): Promise<void> {
    await this.queue.add("job", data, {
      priority: opts?.priority,
      delay: opts?.delay,
    });
  }

  process(handler: JobHandler<T>): void {
    this.worker = new BullMQWorker(
      this.queue.name,
      async (job) => {
        await handler({
          id: job.id!,
          data: job.data as T,
          priority: job.priority ?? 0,
          delay: job.delay ?? 0,
          attempt: job.attemptsMade,
          createdAt: job.timestamp,
        });
      },
      { connection: { url: "redis://localhost:6379" } },
    );
  }

  // BullMQ requires async for count — return -1 as placeholder
  size(): number { return -1; }

  clear(): void { this.queue.drain(); }
}

// Usage — drop-in replacement for the default memory driver
import { Queue } from "@buntok/core";

const emailQueue = new Queue<EmailData>("emails", new BullMQDriver("emails"));`}
      />

      <Callout type="warning">
        BullMQ&apos;s <code>getWaitingCount()</code> is async, but{" "}
        <code>QueueDriver.size()</code> is sync. The example returns{" "}
        <code>-1</code> as a placeholder. For accurate counts, use
        BullMQ&apos;s API directly.
      </Callout>

      <Callout type="info">
        BullMQ provides built-in support for concurrency, rate limiting,
        repeatable jobs, and a monitoring dashboard. See{" "}
        <a
          href="https://docs.bullmq.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          BullMQ docs
        </a>{" "}
        for details.
      </Callout>
    </div>
  );
}
