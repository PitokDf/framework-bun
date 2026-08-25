import type { CacheDriver } from "./cache";
import type { Context } from "./context";

/**
 * Transforms an async iterable (like OpenAI chat completions stream) into a
 * Vercel AI SDK compatible stream response (Data Stream Protocol v1).
 *
 * @param ctx - The Buntok context
 * @param stream - An AsyncIterable representing the LLM chunks
 * @param options - Optional callbacks (e.g. onCompletion)
 * @returns A Response object with Server-Sent Events headers
 */
export function streamAI(
	_ctx: Context,
	// biome-ignore lint/suspicious/noExplicitAny: generic stream
	stream: AsyncIterable<any> | any,
	options?: {
		onCompletion?: (fullText: string) => void | Promise<void>;
	},
): Response {
	const readable = new ReadableStream({
		async start(controller) {
			try {
				let fullText = "";

				// Handle standard AsyncIterable (OpenAI, Anthropic standard)
				if (stream && Symbol.asyncIterator in stream) {
					for await (const chunk of stream) {
						// Very naive check for OpenAI/Anthropic chunk formats
						const content =
							chunk?.choices?.[0]?.delta?.content ||
							chunk?.message?.content ||
							(typeof chunk === "string" ? chunk : "");

						if (content) {
							fullText += content;
							// Format according to Vercel AI SDK Data Stream Protocol: 0:"text"
							const data = `0:${JSON.stringify(content)}\n`;
							controller.enqueue(new TextEncoder().encode(data));
						}
					}
				} else {
					throw new Error("Provided stream is not an AsyncIterable");
				}

				// Fire completion callback
				if (options?.onCompletion) {
					await options.onCompletion(fullText);
				}

				// End of stream protocol: d:{"finishReason":"stop"}
				controller.enqueue(
					new TextEncoder().encode(`d:{"finishReason":"stop"}\n`),
				);
				// biome-ignore lint/suspicious/noExplicitAny: catching unknown error type
			} catch (e: any) {
				// Send error stream protocol: e:{"message":"..."}
				controller.enqueue(
					new TextEncoder().encode(
						`e:${JSON.stringify({ message: e.message })}\n`,
					),
				);
			} finally {
				controller.close();
			}
		},
	});

	return new Response(readable, {
		headers: {
			"Content-Type": "text/x-unknown", // Standard for Vercel AI stream
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"x-vercel-ai-data-stream": "v1",
		},
	});
}

/**
 * Safely injects a system prompt into an array of messages.
 * Removes any existing system prompts from user input to prevent prompt injection.
 *
 * @param messages - Array of existing chat messages
 * @param systemPrompt - The strict system instruction
 * @returns Cleaned array of messages with system prompt at the top
 */
// biome-ignore lint/suspicious/noExplicitAny: standard AI message array
export function injectSystemPrompt(messages: any[], systemPrompt: string) {
	const safeMessages = messages.filter((m) => m.role !== "system");
	return [{ role: "system", content: systemPrompt }, ...safeMessages];
}

/**
 * Semantic Cache for AI responses using Buntok CacheDrivers.
 * It caches exact matches of chat histories to save LLM costs.
 */
export class AICache {
	constructor(private driver: CacheDriver) {}

	/**
	 * Generates a unique key based on the last few user messages.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: standard AI message array
	private hashMessages(messages: any[]): string {
		const relevantMessages = messages
			.filter((m) => m.role === "user" || m.role === "assistant")
			.slice(-3);
		const content = JSON.stringify(relevantMessages);
		let hash = 0;
		for (let i = 0; i < content.length; i++) {
			hash = (hash << 5) - hash + content.charCodeAt(i);
			hash = hash & hash;
		}
		return `ai_cache_${hash}`;
	}

	/**
	 * Checks if an identical conversation history has been answered recently.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: standard AI message array
	async get(messages: any[]): Promise<string | null> {
		const key = this.hashMessages(messages);
		return this.driver.get<string>(key);
	}

	/**
	 * Saves the generated AI response to cache.
	 */
	async set(
		// biome-ignore lint/suspicious/noExplicitAny: standard AI message array
		messages: any[],
		responseText: string,
		ttlSeconds: number = 3600,
	): Promise<void> {
		const key = this.hashMessages(messages);
		await this.driver.set(key, responseText, ttlSeconds);
	}
}
