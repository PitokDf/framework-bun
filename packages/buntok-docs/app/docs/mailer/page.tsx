"use client";

import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export default function MailerPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        Mailer
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Email sending with built-in support for Resend, SendGrid, and Mailgun
        (zero-deps HTTP). SMTP via optional <code>nodemailer</code> import.
      </p>

      {/* ──────────────── PROVIDERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Providers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Provider
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Requires
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["resend", "apiKey", "Zero-deps, HTTP-based"],
              ["sendgrid", "apiKey", "Zero-deps, HTTP-based"],
              ["mailgun", "apiKey + domain", "Zero-deps, HTTP-based"],
              ["smtp", "smtp config", "Requires nodemailer (bun add nodemailer)"],
            ].map(([provider, req, notes]) => (
              <tr
                key={provider}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{provider}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {req}
                </td>
                <td className="px-4 py-2">{notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── RESEND EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Resend
      </Heading>
      <CodeBlock
        code={`import { Mailer } from "@buntok/core";

const mailer = new Mailer({
  provider: "resend",
  apiKey: process.env.RESEND_API_KEY,
});

const result = await mailer.send({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Welcome to our platform</h1>",
});

console.log(result); // { success: true, id: "..." }`}
      />

      {/* ──────────────── SENDGRID EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        SendGrid
      </Heading>
      <CodeBlock
        code={`const mailer = new Mailer({
  provider: "sendgrid",
  apiKey: process.env.SENDGRID_API_KEY,
});

await mailer.send({
  from: "noreply@example.com",
  to: ["user1@example.com", "user2@example.com"],
  subject: "Newsletter",
  text: "Plain text version",
  html: "<p>HTML version</p>",
});`}
      />

      {/* ──────────────── MAILGUN EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Mailgun
      </Heading>
      <CodeBlock
        code={`const mailer = new Mailer({
  provider: "mailgun",
  apiKey: process.env.MAILGUN_API_KEY,
  domain: "mg.example.com",
});

await mailer.send({
  from: "noreply@mg.example.com",
  to: "user@example.com",
  subject: "Hello",
  html: "<h1>Hello World</h1>",
});`}
      />

      {/* ──────────────── SMTP EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        SMTP (nodemailer)
      </Heading>
      <Callout type="warning">
        SMTP requires <code>nodemailer</code>:{" "}
        <code>bun add nodemailer</code>
      </Callout>
      <CodeBlock
        code={`const mailer = new Mailer({
  provider: "smtp",
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
});

await mailer.send({
  from: "user@gmail.com",
  to: "recipient@example.com",
  subject: "Hello via SMTP",
  html: "<p>Sent via SMTP</p>",
});`}
      />

      {/* ──────────────── MAIL OPTIONS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        MailOptions
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Field
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Required
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["from", "string", "Yes", "Sender email address"],
              ["to", "string | string[]", "Yes", "Recipient(s)"],
              ["subject", "string", "Yes", "Email subject"],
              ["text", "string", "No", "Plain text body"],
              ["html", "string", "No", "HTML body"],
            ].map(([field, type, req, desc]) => (
              <tr
                key={field}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{field}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {type}
                </td>
                <td className="px-4 py-2">{req}</td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── FIRE AND FORGET ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Fire-and-Forget
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Don't await for non-critical emails — they'll send in the background:
      </p>
      <CodeBlock
        code={`// Don't await — runs in background
mailer.send({
  from: "noreply@example.com",
  to: user.email,
  subject: "Welcome!",
  html: welcomeTemplate,
});

// Response is instant
return ctx.json({ message: "Account created" });`}
      />
    </div>
  );
}
