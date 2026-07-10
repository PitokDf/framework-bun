export class Context<DI = Record<string, unknown>> {
	public request: Request;
	public params: Record<string, string>;

	private _store: Record<string, unknown> | undefined;
	private _di: DI | undefined;
	private _appState: Map<string, unknown>;

	constructor(
		request: Request,
		params: Record<string, string>,
		appState: Map<string, unknown> = new Map(),
	) {
		this.request = request;
		this.params = params;
		this._appState = appState;
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

	public get di(): DI {
		if (!this._di) {
			this._di = new Proxy({} as Record<string, unknown>, {
				get: (_, prop: string) => {
					const value = this._appState.get(prop);
					if (value === undefined) {
						throw new Error(`Dependency '${prop}' belum didaftarkan di App!`);
					}
					return value;
				},
			}) as DI;
		}
		return this._di;
	}

	public get ip(): string {
		const forwardedFor = this.request.headers.get("x-forwarded-for");
		if (forwardedFor) {
			return forwardedFor.split(",")[0]?.trim() ?? "";
		}
		return "127.0.0.1";
	}

	/**
	 * Get a cookie value from request
	 */
	public getCookie(name: string): string | undefined {
		const cookieHeader = this.request.headers.get("Cookie");
		if (!cookieHeader) return undefined;

		const cookies = cookieHeader.split(";").reduce(
			(acc, pair) => {
				const [key, ...valueParts] = pair.split("=");
				if (key) {
					acc[key.trim()] = decodeURIComponent(valueParts.join("=").trim());
				}
				return acc;
			},
			{} as Record<string, string>,
		);

		return cookies[name];
	}

	/**
	 * Get all cookies from request
	 */
	public getCookies(): Record<string, string> {
		const cookieHeader = this.request.headers.get("Cookie");
		if (!cookieHeader) return {};

		return cookieHeader.split(";").reduce(
			(acc, pair) => {
				const [key, ...valueParts] = pair.split("=");
				if (key) {
					acc[key.trim()] = decodeURIComponent(valueParts.join("=").trim());
				}
				return acc;
			},
			{} as Record<string, string>,
		);
	}

	public async body<T = unknown>(): Promise<T> {
		return (await this.request.json()) as T;
	}

	public json(data: unknown, status = 200): Response {
		return Response.json(data, { status });
	}

	public text(text: string, status = 200): Response {
		return new Response(text, {
			status,
			headers: { "Content-Type": "text/plain" },
		});
	}

	/**
	 * Return HTML response
	 */
	public html(html: string, status = 200): Response {
		return new Response(html, {
			status,
			headers: { "Content-Type": "text/html" },
		});
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
}
