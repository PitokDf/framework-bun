import { appendFile, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

interface LoggerOptions {
	level?: LogLevel;
	format?: "text" | "json";
	// Disable request logging (useful for benchmarks)
	logRequests?: boolean;
}

// Pre-computed ANSI colors for each log level
const COLORS: Record<number, string> = {
	[LogLevel.DEBUG]: "\x1b[34m", // Blue
	[LogLevel.INFO]: "\x1b[32m", // Green
	[LogLevel.WARN]: "\x1b[33m", // Yellow
	[LogLevel.ERROR]: "\x1b[31m", // Red
};
const RESET = "\x1b[0m";
const GRAY = "\x1b[90m";

export class Logger {
	private level: LogLevel;
	private format: "text" | "json";
	private logDir: string | undefined;
	private isProd: boolean;
	private logRequests: boolean;
	private flushScheduled = false;
	private stdoutBuffer: string[] = [];
	private stderrBuffer: string[] = [];

	constructor(options?: LoggerOptions) {
		this.isProd = process.env.NODE_ENV === "production";
		this.level =
			options?.level ?? (this.isProd ? LogLevel.WARN : LogLevel.INFO);
		this.format = options?.format ?? (this.isProd ? "json" : "text");
		this.logRequests = options?.logRequests ?? true;

		this.logDir = process.env.LOG_DIR;
		if (this.logDir && !existsSync(this.logDir)) {
			mkdirSync(this.logDir, { recursive: true });
		}
	}

	private flush() {
		if (this.stdoutBuffer.length > 0) {
			process.stdout.write(this.stdoutBuffer.join(""));
			this.stdoutBuffer.length = 0;
		}
		if (this.stderrBuffer.length > 0) {
			process.stderr.write(this.stderrBuffer.join(""));
			this.stderrBuffer.length = 0;
		}
		this.flushScheduled = false;
	}

	private scheduleFlush() {
		if (this.flushScheduled) return;
		this.flushScheduled = true;
		queueMicrotask(() => this.flush());
	}

	private print(
		level: LogLevel,
		levelName: string,
		message: string,
		meta?: Record<string, unknown>,
	) {
		if (level < this.level) return;

		const isStderr = level === LogLevel.ERROR;

		if (this.format === "json") {
			const timestamp = new Date().toISOString();
			const logEntryObj = { timestamp, level: levelName, message, ...meta };
			const jsonString = JSON.stringify(logEntryObj);
			const line = `${jsonString}\n`;

			// Non-blocking: buffer and schedule flush
			if (isStderr) {
				this.stderrBuffer.push(line);
			} else {
				this.stdoutBuffer.push(line);
			}
			this.scheduleFlush();

			// File logging (already async with appendFile)
			if (this.logDir) {
				const dateStr = timestamp.split("T")[0];
				const filePath = join(this.logDir, `app-${dateStr}.log`);
				appendFile(filePath, line, () => {});
			}
		} else {
			const now = Date.now();
			const color = COLORS[level] ?? COLORS[LogLevel.INFO];

			let logString = `[${now}] ${color}[${levelName}]${RESET} ${message}`;

			if (meta) {
				const keys = Object.keys(meta);
				if (keys.length > 0) {
					if (keys.length === 1) {
						const val = meta[keys[0]];
						logString += ` ${GRAY}{${JSON.stringify(keys[0])}:${JSON.stringify(val)}}${RESET}`;
					} else {
						logString += ` ${GRAY}${JSON.stringify(meta)}${RESET}`;
					}
				}
			}

			// Non-blocking: buffer and schedule flush
			if (isStderr) {
				this.stderrBuffer.push(`${logString}\n`);
			} else {
				this.stdoutBuffer.push(`${logString}\n`);
			}
			this.scheduleFlush();
		}
	}

	public debug(message: string, meta?: Record<string, unknown>) {
		this.print(LogLevel.DEBUG, "DEBUG", message, meta);
	}

	public info(message: string, meta?: Record<string, unknown>) {
		if (!this.logRequests) return;
		this.print(LogLevel.INFO, "INFO", message, meta);
	}

	public warn(message: string, meta?: Record<string, unknown>) {
		this.print(LogLevel.WARN, "WARN", message, meta);
	}

	public error(message: string, meta?: Record<string, unknown>) {
		this.print(LogLevel.ERROR, "ERROR", message, meta);
	}

	// Flush remaining logs (useful for graceful shutdown)
	public flushSync() {
		if (this.stdoutBuffer.length > 0) {
			process.stdout.write(this.stdoutBuffer.join(""));
			this.stdoutBuffer.length = 0;
		}
		if (this.stderrBuffer.length > 0) {
			process.stderr.write(this.stderrBuffer.join(""));
			this.stderrBuffer.length = 0;
		}
	}
}

// Create logger with env-based configuration
// Set LOG_REQUESTS=false to disable request logging (useful for benchmarks)
export const logger = new Logger({
	logRequests: process.env.LOG_REQUESTS !== "false",
});
