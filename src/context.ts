import { createSSE, type SSE, type SSEOptions } from "./sse";

export class Context<
	DI = Record<string, unknown>,
	Params = Record<string, string>,
> {
	public request: Request;
	public params: Params & Record<string, string>;

	private _store: Record<string, unknown> | undefined;
	private _cookies: Record<string, string> | undefined;
	private _query: Record<string, string> | undefined;
	private _validated: Record<string, unknown> | undefined;
	public readonly di: DI;
	public _afterHooks?: Array<(res: Response) => Response | undefined>;

	constructor(request: Request, params: Record<string, string>, di: DI) {
		this.request = request;
		this.params = params as unknown as Params & Record<string, string>;
		this.di = di;
	}

	public get store(): Record<string, unknown> {
		if (!this._store) {
			this._store = {};
		}
		return this._store;
	}

	public set store(value: Record<string, unknown>) {
		this._store = value;
	}

	public get ip(): string {
		const forwardedFor = this.request.headers.get("x-forwarded-for");
		if (forwardedFor) {
			return forwardedFor.split(",")[0]?.trim() ?? "";
		}
		return "127.0.0.1";
	}

	private parseCookies(): Record<string, string> {
		if (this._cookies) return this._cookies;

		const nativeCookies = (this.request as { cookies?: unknown }).cookies;
		if (nativeCookies && typeof nativeCookies === "object") {
			const map = nativeCookies as Iterable<[string, string]>;
			const result: Record<string, string> = {};
			for (const [key, value] of map) {
				result[key] = value;
			}
			this._cookies = result;
			return this._cookies;
		}

		const cookieHeader = this.request.headers.get("Cookie");
		if (!cookieHeader) {
			this._cookies = {};
			return this._cookies;
		}

		const result: Record<string, string> = {};
		let start = 0;
		while (start < cookieHeader.length) {
			let end = cookieHeader.indexOf(";", start);
			if (end === -1) end = cookieHeader.length;

			const eqIdx = cookieHeader.indexOf("=", start);
			if (eqIdx !== -1 && eqIdx < end) {
				let keyStart = start;
				while (keyStart < eqIdx && cookieHeader[keyStart] === " ") keyStart++;

				let valStart = eqIdx + 1;
				while (valStart < end && cookieHeader[valStart] === " ") valStart++;

				const key = cookieHeader.substring(keyStart, eqIdx);
				const val = cookieHeader.substring(valStart, end);
				if (key && val) result[key] = decodeURIComponent(val);
			}
			start = end + 1;
		}

		this._cookies = result;
		return this._cookies;
	}

	/**
	 * Get a cookie value from request
	 */
	public getCookie(name: string): string | undefined {
		const nativeCookies = (this.request as { cookies?: unknown }).cookies;
		if (
			!this._cookies &&
			nativeCookies &&
			typeof (nativeCookies as { get?: unknown }).get === "function"
		) {
			return (
				(nativeCookies as { get: (name: string) => string | null }).get(name) ??
				undefined
			);
		}
		return this.parseCookies()[name];
	}

	/**
	 * Get all cookies from request
	 */
	public getCookies(): Record<string, string> {
		return this.parseCookies();
	}

	/**
	 * Parsed query string parameters, cached after first access.
	 */
	public query(): Record<string, string> {
		if (!this._query) {
			this._query = {};
			const url = this.request.url;
			const queryIdx = url.indexOf("?");
			if (queryIdx !== -1) {
				const queryStr = url.substring(queryIdx + 1);
				if (queryStr) {
					const pairs = queryStr.split("&");
					for (let i = 0; i < pairs.length; i++) {
						const pair = pairs[i] as string;
						if (!pair) continue;
						const eqIdx = pair.indexOf("=");
						if (eqIdx !== -1) {
							const key = decodeURIComponent(
								pair.substring(0, eqIdx).replace(/\+/g, " "),
							);
							const value = decodeURIComponent(
								pair.substring(eqIdx + 1).replace(/\+/g, " "),
							);
							this._query[key] = value;
						} else {
							const key = decodeURIComponent(pair.replace(/\+/g, " "));
							this._query[key] = "";
						}
					}
				}
			}
		}
		return this._query;
	}

	/**
	 * Internal: used by validator middleware to stash parsed/validated data.
	 * Not intended to be called directly from route handlers.
	 */
	public setValidated(
		target: "body" | "query" | "params",
		data: unknown,
	): void {
		if (!this._validated) this._validated = {};
		this._validated[target] = data;
	}

	/**
	 * Read data previously validated by `zValidator()` for the given target,
	 * typed as `T`. Throws if no validator ran for that target, so a typo'd
	 * target (or forgetting to add the middleware) fails loudly instead of
	 * silently returning `undefined`.
	 */
	public valid<T>(target: "body" | "query" | "params"): T {
		if (!this._validated || !(target in this._validated)) {
			throw new Error(
				`ctx.valid("${target}") called but no zValidator("${target}", ...) middleware ran for this route`,
			);
		}
		return this._validated[target] as T;
	}

	private _body: unknown | undefined;

	public async body<T = unknown>(): Promise<T> {
		if (this._body !== undefined) {
			return this._body as T;
		}
		this._body = await this.request.json();
		return this._body as T;
	}

	public json(data: unknown, status = 200): Response {
		return Response.json(data, { status });
	}

	public success(data?: unknown, message = "Success", status = 200): Response {
		return this.json({ success: true, message, data }, status);
	}

	public error(message: string, status = 400, details?: unknown): Response {
		return this.json({ success: false, message, details }, status);
	}

	private static readonly TEXT_HEADERS = {
		"Content-Type": "text/plain; charset=utf-8",
	};
	public text(text: string, status = 200): Response {
		return new Response(text, {
			status,
			headers: Context.TEXT_HEADERS,
		});
	}

	private static readonly HTML_HEADERS = { "Content-Type": "text/html" };
	/**
	 * Return HTML response
	 */
	public html(html: string, status = 200): Response {
		return new Response(html, {
			status,
			headers: Context.HTML_HEADERS,
		});
	}

	public onAfterResponse(hook: (res: Response) => Response | undefined): void {
		if (!this._afterHooks) this._afterHooks = [];
		this._afterHooks.push(hook);
	}

	/**
	 * Redirect to URL
	 */
	public redirect(
		url: string,
		status: 301 | 302 | 303 | 307 | 308 = 302,
	): Response {
		return new Response(null, {
			status,
			headers: { Location: url },
		});
	}

	/**
	 * Return empty response with status code
	 */
	public status(code: number): Response {
		return new Response(null, { status: code });
	}

	/**
	 * Start a Server-Sent Events (SSE) stream
	 */
	public sse(
		callback: (stream: SSE) => void | Promise<void>,
		options?: SSEOptions,
	): Response {
		const stream = createSSE(this.request, options);

		// Run the callback asynchronously so we can return the response immediately
		setTimeout(async () => {
			try {
				await callback(stream);
			} catch (err) {
				console.error("[SSE Error]", err);
				stream.close();
			}
		}, 0);

		return stream.connect();
	}
}
