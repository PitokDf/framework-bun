// ── Core ───────────────────────────────────────────────────────────
export { AI } from "./ai"
export * from "./types"

// ── Streaming ──────────────────────────────────────────────────────
export { streamResponse, collectStream, injectSystemPrompt } from "./streaming"

// ── Tools ──────────────────────────────────────────────────────────
export { executeTools, toolResultsToMessages, chatWithTools } from "./tools"

// ── History ────────────────────────────────────────────────────────
export { ChatHistory } from "./history"

// ── Middleware ──────────────────────────────────────────────────────
export {
  rateLimiter,
  usageTracker,
  costEstimator,
  aiLogger,
  aiCache,
} from "./middleware"

// ── Providers (tree-shakeable) ─────────────────────────────────────
export { OpenAIProvider } from "./providers/openai"
export type { OpenAIProviderConfig } from "./providers/openai"

export { AnthropicProvider } from "./providers/anthropic"
export type { AnthropicProviderConfig } from "./providers/anthropic"

export { GeminiProvider } from "./providers/gemini"
export type { GeminiProviderConfig } from "./providers/gemini"

export { MistralProvider } from "./providers/mistral"
export type { MistralProviderConfig } from "./providers/mistral"

export { CohereProvider } from "./providers/cohere"
export type { CohereProviderConfig } from "./providers/cohere"

export { GroqProvider } from "./providers/groq"
export type { GroqProviderConfig } from "./providers/groq"

export { OllamaProvider } from "./providers/ollama"
export type { OllamaProviderConfig } from "./providers/ollama"

export { XAIProvider } from "./providers/xai"
export type { XAIProviderConfig } from "./providers/xai"

export { OpenRouterProvider } from "./providers/openrouter"
export type { OpenRouterProviderConfig } from "./providers/openrouter"

export { LlamaProvider } from "./providers/llama"
export type { LlamaProviderConfig } from "./providers/llama"

// ── Base Provider ──────────────────────────────────────────────────
export { BaseProvider } from "./providers/base"
export { OpenAICompatibleProvider } from "./providers/openai-compatible"
