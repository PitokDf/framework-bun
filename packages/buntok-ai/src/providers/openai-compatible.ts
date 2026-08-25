import type {
  ChatOptions,
  ChatResponse,
  Message,
  StreamChunk,
  Tool,
  Usage,
} from "../types"
import { BaseProvider } from "./base"

/**
 * Base class for OpenAI-compatible providers.
 * Groq, Ollama, xAI, OpenRouter, and Llama all use the same API format.
 */
export abstract class OpenAICompatibleProvider extends BaseProvider {
  abstract override readonly name: string

  protected getApiBase(): string {
    return this.config.baseUrl || "https://api.openai.com/v1"
  }

  protected async request(path: string, body: any, stream = false) {
    const apiKey = this.config.apiKey
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`

    const response = await fetch(`${this.getApiBase()}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`${this.name} API error: ${response.status} - ${error}`)
    }

    return response
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const model = this.resolveModel(options)

    const params: Record<string, any> = {
      model,
      messages: options.messages.map(toChatMessage),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stop,
    }

    if (options.tools?.length) {
      params.tools = options.tools.map(toChatTool)
      if (options.toolChoice) {
        params.tool_choice = options.toolChoice
      }
    }

    const response = await this.request("/chat/completions", params)
    const data: any = await response.json()
    const choice = data.choices[0]

    return {
      content: choice.message?.content || "",
      finishReason: mapFinishReason(choice.finish_reason),
      toolCalls: choice.message?.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
      })),
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      model: data.model,
      id: data.id,
    }
  }

  async *stream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const model = this.resolveModel(options)

    const params: Record<string, any> = {
      model,
      messages: options.messages.map(toChatMessage),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stop,
      stream: true,
      stream_options: { include_usage: true },
    }

    if (options.tools?.length) {
      params.tools = options.tools.map(toChatTool)
      if (options.toolChoice) params.tool_choice = options.toolChoice
    }

    const response = await this.request("/chat/completions", params, true)
    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data: ")) continue
        const data = trimmed.slice(6)
        if (data === "[DONE]") return

        try {
          const chunk = JSON.parse(data)
          const delta = chunk.choices[0]?.delta
          const finishReason = chunk.choices[0]?.finish_reason

          if (delta?.content) {
            yield { type: "text", content: delta.content }
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              yield {
                type: "tool_call",
                toolCall: {
                  id: tc.id,
                  name: tc.function?.name,
                  arguments: tc.function?.arguments,
                },
              }
            }
          }

          if (finishReason) {
            yield {
              type: "finish",
              finishReason: mapFinishReason(finishReason),
            }
          }

          if (chunk.usage) {
            yield {
              type: "finish",
              finishReason: "stop",
              usage: {
                promptTokens: chunk.usage.prompt_tokens || 0,
                completionTokens: chunk.usage.completion_tokens || 0,
                totalTokens: chunk.usage.total_tokens || 0,
              },
            }
          }
        } catch {
          // skip unparseable lines
        }
      }
    }
  }
}

function toChatMessage(msg: Message) {
  const m: Record<string, any> = { role: msg.role, content: msg.content }
  if (msg.name) m.name = msg.name
  if (msg.toolCalls) m.tool_calls = msg.toolCalls
  if (msg.toolCallId) m.tool_call_id = msg.toolCallId
  return m
}

function toChatTool(tool: Tool) {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters ? JSON.parse(JSON.stringify(tool.parameters)) : undefined,
    },
  }
}

function mapFinishReason(reason: string | null): ChatResponse["finishReason"] {
  switch (reason) {
    case "stop":
      return "stop"
    case "length":
      return "length"
    case "tool_calls":
      return "tool_calls"
    case "content_filter":
      return "content_filter"
    default:
      return "unknown"
  }
}
