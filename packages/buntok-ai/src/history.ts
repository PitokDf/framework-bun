import type { HistoryMessage, HistorySession, Message, MessageRole } from "./types"

/**
 * In-memory chat history manager.
 * Persists messages per session ID.
 */
export class ChatHistory {
  private sessions = new Map<string, HistorySession>()

  /**
   * Get or create a session.
   */
  getSession(sessionId: string): HistorySession {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
    return this.sessions.get(sessionId)!
  }

  /**
   * Add a message to a session.
   */
  add(
    sessionId: string,
    role: MessageRole,
    content: string,
    metadata?: Record<string, any>,
  ): HistoryMessage {
    const session = this.getSession(sessionId)
    const msg: HistoryMessage = {
      role,
      content,
      timestamp: Date.now(),
      metadata,
    }
    session.messages.push(msg)
    session.updatedAt = Date.now()
    return msg
  }

  /**
   * Get all messages in a session.
   */
  getMessages(sessionId: string): HistoryMessage[] {
    return this.getSession(sessionId).messages
  }

  /**
   * Get messages as AI Message format (for passing to provider).
   */
  toAIMessages(sessionId: string, systemPrompt?: string): Message[] {
    const messages: Message[] = []
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt })
    }
    for (const msg of this.getMessages(sessionId)) {
      messages.push({ role: msg.role, content: msg.content })
    }
    return messages
  }

  /**
   * Clear all messages in a session.
   */
  clear(sessionId: string): void {
    const session = this.getSession(sessionId)
    session.messages = []
    session.updatedAt = Date.now()
  }

  /**
   * Delete a session entirely.
   */
  delete(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  /**
   * Get all session IDs.
   */
  listSessions(): string[] {
    return Array.from(this.sessions.keys())
  }

  /**
   * Trim old messages to keep only the last N messages.
   */
  trim(sessionId: string, keepLast: number): void {
    const session = this.getSession(sessionId)
    if (session.messages.length > keepLast) {
      session.messages = session.messages.slice(-keepLast)
      session.updatedAt = Date.now()
    }
  }
}
