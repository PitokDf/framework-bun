/**
 * Async sleep — returns a promise that resolves after `ms` milliseconds.
 *
 * @example
 * await delay(1000); // wait 1 second
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryOptions {
	/** Maximum number of retries (default: 3) */
	retries?: number;
	/** Delay between retries in ms (default: 1000) */
	delay?: number;
	/** Backoff strategy: "fixed" or "exponential" (default: "exponential") */
	backoff?: "fixed" | "exponential";
	/** Function to decide if the error is retryable. Default: always retry. */
	onError?: (error: unknown, attempt: number) => boolean;
}

/**
 * Retry an async function with configurable backoff.
 *
 * @example
 * const data = await retry(
 *   () => fetch("https://api.example.com/data").then(r => r.json()),
 *   { retries: 3, delay: 1000, backoff: "exponential" }
 * );
 */
export async function retry<T>(
	fn: () => Promise<T>,
	options?: RetryOptions,
): Promise<T> {
	const {
		retries = 3,
		delay: baseDelay = 1000,
		backoff = "exponential",
		onError,
	} = options ?? {};

	let lastError: unknown;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			return await fn();
		} catch (err) {
			lastError = err;

			if (onError && !onError(err, attempt)) {
				throw err;
			}

			if (attempt < retries) {
				const waitTime =
					backoff === "exponential" ? baseDelay * 2 ** attempt : baseDelay;
				await delay(waitTime);
			}
		}
	}

	throw lastError;
}
