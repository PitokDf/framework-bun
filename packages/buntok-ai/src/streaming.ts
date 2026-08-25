import type { Context } from "@buntok/core"
import type {
  StreamChunk,
} from "./types"

/**
 * Transform an AsyncIterable of StreamChunks into a Vercel AI SDK
 * Data Stream Protocol v1 response.
 *
 * Usage:
 *   const stream = ai.stream({ messages })
 *   return streamResponse(ctx, stream)
 */
export function streamResponse(
  ctx: Context,
  stream: AsyncIterable<StreamChunk>,
  options?: {
    onFinish?: (fullText: string, chunks: StreamChunk[]) => void | Promise<void>
  },
): Response {
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let fullText = ""
      const allChunks: StreamChunk[] = []

      try {
        for await (const chunk of stream) {
          allChunks.push(chunk)

          switch (chunk.type) {
            case "text":
              if (chunk.content) {
                fullText += chunk.content
                controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk.content)}\n`))
              }
              break

            case "tool_call":
              if (chunk.toolCall) {
                const data = JSON.stringify({
                  toolCallId: chunk.toolCall.id,
                  toolName: chunk.toolCall.name,
                  args: chunk.toolCall.arguments,
                })
                controller.enqueue(encoder.encode(`9:${data}\n`))
              }
              break

            case "tool_result":
              if (chunk.toolResult) {
                const data = JSON.stringify({
                  toolCallId: chunk.toolResult.toolCallId,
                  result: chunk.toolResult.result,
                })
                controller.enqueue(encoder.encode(`a:${data}\n`))
              }
              break

            case "finish":
              controller.enqueue(
                encoder.encode(
                  `d:${JSON.stringify({ finishReason: chunk.finishReason || "stop" })}\n`,
                ),
              )
              break

            case "error":
              controller.enqueue(
                encoder.encode(`e:${JSON.stringify({ message: chunk.content || "Unknown error" })}\n`),
              )
              break
          }
        }

        if (options?.onFinish) {
          await options.onFinish(fullText, allChunks)
        }
      } catch (e: any) {
        controller.enqueue(
          encoder.encode(`e:${JSON.stringify({ message: e.message })}\n`),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/x-unknown",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "x-vercel-ai-data-stream": "v1",
    },
  })
}

/**
 * Collect all text chunks from a stream into a single string.
 */
export async function collectStream(stream: AsyncIterable<StreamChunk>): Promise<{
  content: string
  toolCalls: { id: string; name: string; arguments: string }[]
  finishReason: string
}> {
  let content = ""
  const toolCalls: { id: string; name: string; arguments: string }[] = []
  let finishReason = "stop"

  for await (const chunk of stream) {
    switch (chunk.type) {
      case "text":
        content += chunk.content || ""
        break
      case "tool_call":
        if (chunk.toolCall) {
          toolCalls.push({
            id: chunk.toolCall.id || "",
            name: chunk.toolCall.name || "",
            arguments: chunk.toolCall.arguments || "",
          })
        }
        break
      case "finish":
        finishReason = chunk.finishReason || "stop"
        break
    }
  }

  return { content, toolCalls, finishReason }
}

/**
 * Inject a system prompt into messages, removing any existing system messages.
 */
export function injectSystemPrompt(
  messages: { role: string; content: string }[],
  systemPrompt: string,
) {
  return [
    { role: "system", content: systemPrompt },
    ...messages.filter((m) => m.role !== "system"),
  ]
}
