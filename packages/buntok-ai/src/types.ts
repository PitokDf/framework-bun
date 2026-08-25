import type { z } from "zod"

// ── Message Types ──────────────────────────────────────────────────

export type MessageRole = "system" | "user" | "assistant" | "tool"

export interface Message {
  role: MessageRole
  content: string
  name?: string
  toolCalls?: ToolCall[]
  toolCallId?: string
}

export interface ToolCall {
  id: string
  name: string
  arguments: string
}

// ── Tool Types ─────────────────────────────────────────────────────

export interface Tool {
  name: string
  description?: string
  parameters?: z.ZodObject<any> | z.ZodType<any>
  execute: (args: any) => Promise<any> | any
}

export interface ToolResult {
  toolCallId: string
  name: string
  result: any
  error?: string
}

// ── Provider Types ─────────────────────────────────────────────────

export interface ChatOptions {
  messages: Message[]
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stop?: string[]
  stream?: boolean
  tools?: Tool[]
  toolChoice?: "auto" | "none" | "required" | { type: "function"; name: string }
  frequencyPenalty?: number
  presencePenalty?: number
  seed?: number
  user?: string
}

export interface ChatResponse {
  content: string
  finishReason: "stop" | "length" | "tool_calls" | "content_filter" | "unknown"
  toolCalls?: ToolCall[]
  usage: Usage
  model: string
  id?: string
}

export interface Usage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface EmbeddingOptions {
  input: string | string[]
  model?: string
  dimensions?: number
}

export interface EmbeddingResponse {
  embeddings: number[][]
  usage: Usage
  model: string
}

export interface StreamChunk {
  type: "text" | "tool_call" | "tool_result" | "finish" | "error"
  content?: string
  toolCall?: Partial<ToolCall>
  toolResult?: ToolResult
  finishReason?: string
  usage?: Usage
}

// ── Provider Interface ─────────────────────────────────────────────

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  model: string
  [key: string]: any
}

export interface Provider {
  readonly name: string
  chat(options: ChatOptions): Promise<ChatResponse>
  stream(options: ChatOptions): AsyncIterable<StreamChunk>
  embed?(options: EmbeddingOptions): Promise<EmbeddingResponse>
}

// ── History Types ──────────────────────────────────────────────────

export interface HistoryMessage {
  role: MessageRole
  content: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface HistorySession {
  id: string
  messages: HistoryMessage[]
  createdAt: number
  updatedAt: number
}

// ── Middleware Types ────────────────────────────────────────────────

export interface MiddlewareContext {
  messages: Message[]
  model: string
  options: ChatOptions
  usage?: Usage
  startTime: number
  /** @internal Used by cache middleware */
  _cachedResponse?: string | null
  [key: string]: any
}

export interface Middleware {
  name: string
  before?: (ctx: MiddlewareContext) => Promise<MiddlewareContext | void> | MiddlewareContext | void
  after?: (ctx: MiddlewareContext, response: ChatResponse) => Promise<ChatResponse | void> | ChatResponse | void
  onError?: (ctx: MiddlewareContext, error: Error) => Promise<void> | void
}

// ── Config Types ───────────────────────────────────────────────────

export interface AIConfig {
  provider: Provider
  model?: string
  middleware?: Middleware[]
  maxToolRounds?: number
  onStream?: (chunk: StreamChunk) => void
  onToolCall?: (call: ToolCall) => void
  onToolResult?: (result: ToolResult) => void
}
