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
	// Buffer settings
	flushInterval?: number; // ms between auto-flush (default: 2000)
	flushThreshold?: number; // lines before forced flush (default: 100)
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
	private _logRequests: boolean;

	// Buffered file writer
	private fileBuffer: string[] = [];
	private flushTimer: ReturnType<typeof setInterval> | null = null;
	private flushInterval: number;
	private flushThreshold: number;
	private flushing = false;

	// Stdout/stderr buffer (non-blocking terminal output)
	private flushScheduled = false;
	private stdoutBuffer: string[] = [];
	private stderrBuffer: string[] = [];

	constructor(options?: LoggerOptions) {
		this.isProd = process.env.NODE_ENV === "production";
		this.level =
			options?.level ?? (this.isProd ? LogLevel.WARN : LogLevel.INFO);
		this.format = options?.format ?? (this.isProd ? "json" : "text");
		this._logRequests = options?.logRequests ?? true;
		this.flushInterval = options?.flushInterval ?? 2000;
		this.flushThreshold = options?.flushThreshold ?? 100;

		this.logDir = process.env.LOG_DIR;
		if (this.logDir && !existsSync(this.logDir)) {
			mkdirSync(this.logDir, { recursive: true });
		}

		// Start flush timer if file logging is enabled
		if (this.logDir) {
			this.flushTimer = setInterval(() => this.flushFileBuffer(), this.flushInterval);
			// Allow process to exit even if timer is running
			if (this.flushTimer && typeof this.flushTimer.unref === "function") {
				this.flushTimer.unref();
			}
		}
	}

	// Flush stdout/stderr to terminal
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

	// Flush buffered log lines to file (batch write)
	private flushFileBuffer() {
		if (this.fileBuffer.length === 0 || !this.logDir) return;
		if (this.flushing) return; // prevent concurrent writes

		this.flushing = true;
		const lines = this.fileBuffer.splice(0); // take all buffered lines
		const data = lines.join("");

		// Determine date from first line's timestamp
		const now = new Date();
		const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
		const filePath = join(this.logDir, `app-${dateStr}.log`);

		appendFile(filePath, data, (err) => {
			if (err) {
				// Write failed lines back to buffer for retry
				this.fileBuffer.unshift(...lines);
			}
			this.flushing = false;
		});
	}

	// Enqueue a line for file writing
	private enqueueFile(line: string) {
		this.fileBuffer.push(line);
		if (this.fileBuffer.length >= this.flushThreshold) {
			this.flushFileBuffer();
		}
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

			// File logging (buffered batch write)
			if (this.logDir) {
				this.enqueueFile(line);
			}
		} else {
			const now = Date.now();
			const color = COLORS[level] ?? COLORS[LogLevel.INFO];

			let logString = `[${now}] ${color}[${levelName}]${RESET} ${message}`;

			if (meta) {
				const keys = Object.keys(meta);
				if (keys.length > 0) {
					if (keys.length === 1) {
						const val = meta[keys[0] || 0];
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

			// File logging (buffered batch write) - strip ANSI for clean log files
			if (this.logDir) {
				const cleanLine = `[${now}] [${levelName}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}\n`;
				this.enqueueFile(cleanLine);
			}
		}
	}

	public debug(message: string, meta?: Record<string, unknown>) {
		this.print(LogLevel.DEBUG, "DEBUG", message, meta);
	}

	public info(message: string, meta?: Record<string, unknown>) {
		this.print(LogLevel.INFO, "INFO", message, meta);
	}

	public warn(message: string, meta?: Record<string, unknown>) {
		this.print(LogLevel.WARN, "WARN", message, meta);
	}

	public error(message: string, meta?: Record<string, unknown>) {
		this.print(LogLevel.ERROR, "ERROR", message, meta);
	}

	public get logRequests(): boolean {
		return this._logRequests;
	}

	// Flush all buffers (useful for graceful shutdown)
	public flushSync() {
		// Flush terminal
		if (this.stdoutBuffer.length > 0) {
			process.stdout.write(this.stdoutBuffer.join(""));
			this.stdoutBuffer.length = 0;
		}
		if (this.stderrBuffer.length > 0) {
			process.stderr.write(this.stderrBuffer.join(""));
			this.stderrBuffer.length = 0;
		}
		// Flush file buffer synchronously
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}
		// One final async flush for remaining file lines
		if (this.fileBuffer.length > 0 && this.logDir) {
			const lines = this.fileBuffer.splice(0);
			const data = lines.join("");
			const now = new Date();
			const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
			const filePath = join(this.logDir, `app-${dateStr}.log`);
			// Synchronous append for shutdown
			try {
				const { writeFileSync, appendFileSync } = require("node:fs");
				appendFileSync(filePath, data);
			} catch {
				// Best effort
			}
		}
	}
}

// Create logger with env-based configuration
export const logger = new Logger({
	logRequests: process.env.LOG_REQUESTS !== "false",
});
