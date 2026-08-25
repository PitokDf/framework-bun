export interface MailOptions {
	from: string;
	to: string | string[];
	subject: string;
	text?: string;
	html?: string;
}

export interface MailerConfig {
	provider: "resend" | "sendgrid" | "mailgun" | "smtp";
	/** Required for Resend, SendGrid, and Mailgun */
	apiKey?: string;
	/** Required for Mailgun */
	domain?: string;
	/** Required for SMTP */
	smtp?: {
		host: string;
		port: number;
		secure?: boolean;
		auth: {
			user: string;
			pass: string;
		};
	};
}

/**
 * Built-in Mailer wrapper for Buntok.
 * Supports Resend, SendGrid, and Mailgun (HTTP-based, zero-deps).
 * Also supports SMTP via dynamic import of 'nodemailer' (requires user installation).
 */
export class Mailer {
	constructor(private config: MailerConfig) {}

	/**
	 * Send an email asynchronously.
	 * If you don't await this method, it acts as a background queue (fire-and-forget).
	 */
	async send(
		options: MailOptions,
	): Promise<{ success: boolean; id?: string; error?: string }> {
		if (this.config.provider === "resend") {
			try {
				const res = await fetch("https://api.resend.com/emails", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.config.apiKey}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						from: options.from,
						to: Array.isArray(options.to) ? options.to : [options.to],
						subject: options.subject,
						text: options.text,
						html: options.html,
					}),
				});

				const data = (await res.json()) as Record<string, unknown>;
				if (!res.ok) return { success: false, error: data.message as string };
				return { success: true, id: data.id as string };
			} catch (err: unknown) {
				const e = err as Error;
				return { success: false, error: e.message };
			}
		}

		if (this.config.provider === "sendgrid") {
			try {
				const toArray = Array.isArray(options.to) ? options.to : [options.to];
				const content = [];
				if (options.text)
					content.push({ type: "text/plain", value: options.text });
				if (options.html)
					content.push({ type: "text/html", value: options.html });

				const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.config.apiKey}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						personalizations: [{ to: toArray.map((email) => ({ email })) }],
						from: { email: options.from },
						subject: options.subject,
						content,
					}),
				});

				if (!res.ok) {
					const data = (await res.json()) as { errors?: { message: string }[] };
					return {
						success: false,
						error: data.errors?.[0]?.message || "SendGrid Error",
					};
				}
				return { success: true };
			} catch (err: unknown) {
				const e = err as Error;
				return { success: false, error: e.message };
			}
		}

		if (this.config.provider === "mailgun") {
			try {
				if (!this.config.domain)
					throw new Error("Mailgun requires a domain configured");
				const formData = new FormData();
				formData.append("from", options.from);
				const toArray = Array.isArray(options.to) ? options.to : [options.to];
				for (const t of toArray) formData.append("to", t);
				formData.append("subject", options.subject);
				if (options.text) formData.append("text", options.text);
				if (options.html) formData.append("html", options.html);

				const basicAuth = btoa(`api:${this.config.apiKey}`);
				const res = await fetch(
					`https://api.mailgun.net/v3/${this.config.domain}/messages`,
					{
						method: "POST",
						headers: { Authorization: `Basic ${basicAuth}` },
						body: formData,
					},
				);

				const data = (await res.json()) as Record<string, unknown>;
				if (!res.ok) return { success: false, error: data.message as string };
				return { success: true, id: data.id as string };
			} catch (err: unknown) {
				const e = err as Error;
				return { success: false, error: e.message };
			}
		}

		if (this.config.provider === "smtp") {
			if (!this.config.smtp)
				return { success: false, error: "SMTP configuration missing" };
			try {
				// Dynamic import to keep Buntok dependency-free
				// @ts-expect-error
				const nodemailer = await import("nodemailer");
				const transporter = nodemailer.createTransport(this.config.smtp);
				const info = await transporter.sendMail({
					from: options.from,
					to: Array.isArray(options.to) ? options.to.join(",") : options.to,
					subject: options.subject,
					text: options.text,
					html: options.html,
				});
				return { success: true, id: info.messageId };
			} catch (err: unknown) {
				const e = err as { code?: string; message: string };
				if (e.code === "ERR_MODULE_NOT_FOUND") {
					return {
						success: false,
						error: "Nodemailer is required for SMTP. Run 'bun add nodemailer'",
					};
				}
				return { success: false, error: e.message };
			}
		}

		return { success: false, error: "Unsupported provider" };
	}
}
