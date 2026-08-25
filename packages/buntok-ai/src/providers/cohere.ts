import type {
  ChatOptions,
  ChatResponse,
  EmbeddingOptions,
  EmbeddingResponse,
  Message,
  StreamChunk,
  Tool,
  Usage,
} from "../types"
import { BaseProvider } from "./base"

export interface CohereProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
}

export class CohereProvider extends BaseProvider {
  readonly name = "cohere"

  private async request(path: string, body: any) {
    const apiKey = this.resolveApiKey()
    const baseUrl = this.config.baseUrl || "https://api.cohere.com"

    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Cohere API error: ${response.status} - ${error}`)
    }

    return response
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const model = this.resolveModel(options)
    const { system, messages } = splitSystemMessages(options.messages)

    const body: Record<string, any> = {
      model,
      messages: messages.map((m) => ({ role: m.role, message: m.content })),
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      p: options.topP,
    }

    if (system) body.preamble = system
    if (options.tools?.length) {
      body.tools = options.tools.map(toCohereTool)
    }

    const response = await this.request("/v2/chat", body)
    const data: any = await response.json()

    const textContent = data.message?.content?.find((c: any) => c.type === "text")
    const toolCalls = data.message?.toolCalls || []

    return {
      content: textContent?.text || "",
      finishReason: mapFinishReason(data.finishReason),
      toolCalls: toolCalls.map((tc: any) => ({
        id: tc.id || `call_${Date.now()}`,
        name: tc.functionName,
        arguments: JSON.stringify(tc.parameters),
      })),
      usage: {
        promptTokens: data.usage?.tokens?.inputTokens || 0,
        completionTokens: data.usage?.tokens?.outputTokens || 0,
        totalTokens: data.usage?.tokens?.inputTokens + data.usage?.tokens?.outputTokens || 0,
      },
      model: data.model,
    }
  }

  async *stream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const model = this.resolveModel(options)
    const { system, messages } = splitSystemMessages(options.messages)

    const body: Record<string, any> = {
      model,
      messages: messages.map((m) => ({ role: m.role, message: m.content })),
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      p: options.topP,
      stream: true,
    }

    if (system) body.preamble = system
    if (options.tools?.length) {
      body.tools = options.tools.map(toCohereTool)
    }

    const response = await this.request("/v2/chat", body)
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
        if (!line.startsWith("data: ")) continue
        const data = line.slice(6)
        if (data === "[DONE]") return

        try {
          const event = JSON.parse(data)

          if (event.type === "content-delta" && event.delta?.message) {
            yield { type: "text", content: event.delta.message }
          }

          if (event.type === "tool-call-delta" && event.delta?.toolCalls) {
            for (const tc of event.delta.toolCalls) {
              yield {
                type: "tool_call",
                toolCall: {
                  id: tc.id || `call_${Date.now()}`,
                  name: tc.functionName,
                  arguments: JSON.stringify(tc.parameters),
                },
              }
            }
          }

          if (event.type === "message-end") {
            yield {
              type: "finish",
              finishReason: mapFinishReason(event.delta?.finishReason),
              usage: event.delta?.usage
                ? {
                    promptTokens: event.delta.usage.tokens?.inputTokens || 0,
                    completionTokens: event.delta.usage.tokens?.outputTokens || 0,
                    totalTokens:
                      (event.delta.usage.tokens?.inputTokens || 0) +
                      (event.delta.usage.tokens?.outputTokens || 0),
                  }
                : undefined,
            }
          }
        } catch {
          // skip unparseable lines
        }
      }
    }
  }

  async embed(options: EmbeddingOptions): Promise<EmbeddingResponse> {
    const model = options.model || this.config.model || "embed-english-v3.0"
    const input = Array.isArray(options.input) ? options.input : [options.input]

    const response = await this.request("/v2/embed", {
      model,
      texts: input,
      inputType: "search_document",
      embeddingTypes: ["float"],
    })

    const data: any = await response.json()

    return {
      embeddings: data.embeddings?.float || [],
      usage: {
        promptTokens: data.meta?.apiVersion?.inputTokens || 0,
        completionTokens: 0,
        totalTokens: data.meta?.apiVersion?.inputTokens || 0,
      },
      model,
    }
  }
}

function splitSystemMessages(messages: Message[]) {
  const systemMsgs = messages.filter((m) => m.role === "system")
  const nonSystemMsgs = messages.filter((m) => m.role !== "system")
  return {
    system: systemMsgs.map((m) => m.content).join("\n") || undefined,
    messages: nonSystemMsgs,
  }
}

function toCohereTool(tool: Tool) {
  const schema = tool.parameters
    ? JSON.parse(JSON.stringify(tool.parameters))
    : { type: "object", properties: {} }

  return {
    name: tool.name,
    description: tool.description,
    parameterDefinitions: schema.properties
      ? Object.fromEntries(
          Object.entries(schema.properties).map(([key, val]: [string, any]) => [
            key,
            {
              description: val.description || "",
              type: val.type || "string",
              required: schema.required?.includes(key) || false,
            },
          ]),
        )
      : {},
  }
}

function mapFinishReason(reason: string | undefined): ChatResponse["finishReason"] {
  switch (reason) {
    case "STOP":
      return "stop"
    case "MAX_TOKENS":
      return "length"
    case "TOOL_CALLS":
      return "tool_calls"
    default:
      return "unknown"
  }
}
