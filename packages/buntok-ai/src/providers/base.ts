import type {
  ChatOptions,
  ChatResponse,
  EmbeddingOptions,
  EmbeddingResponse,
  Provider,
  ProviderConfig,
  StreamChunk,
} from "../types"

/**
 * Abstract base provider class.
 * All providers extend this and implement chat/stream/embed.
 */
export abstract class BaseProvider implements Provider {
  abstract readonly name: string
  protected config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = config
  }

  abstract chat(options: ChatOptions): Promise<ChatResponse>
  abstract stream(options: ChatOptions): AsyncIterable<StreamChunk>

  async embed(_options: EmbeddingOptions): Promise<EmbeddingResponse> {
    throw new Error(`${this.name} does not support embeddings`)
  }

  protected resolveModel(options: ChatOptions): string {
    return options.model || this.config.model
  }

  protected resolveApiKey(): string {
    const key = this.config.apiKey
    if (!key) {
      throw new Error(`${this.name}: API key is required`)
    }
    return key
  }
}
