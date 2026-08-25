import type { Tool, ToolCall, ToolResult } from "./types"

/**
 * Execute tools based on tool calls from AI response.
 * Returns array of tool results.
 */
export async function executeTools(
  tools: Tool[],
  toolCalls: ToolCall[],
): Promise<ToolResult[]> {
  const toolMap = new Map(tools.map((t) => [t.name, t]))
  const results: ToolResult[] = []

  for (const call of toolCalls) {
    const tool = toolMap.get(call.name)
    if (!tool) {
      results.push({
        toolCallId: call.id,
        name: call.name,
        result: null,
        error: `Tool "${call.name}" not found`,
      })
      continue
    }

    try {
      const args = JSON.parse(call.arguments)
      const result = await tool.execute(args)
      results.push({
        toolCallId: call.id,
        name: call.name,
        result,
      })
    } catch (e: any) {
      results.push({
        toolCallId: call.id,
        name: call.name,
        result: null,
        error: e.message,
      })
    }
  }

  return results
}

/**
 * Convert tool results to messages for the next chat round.
 */
export function toolResultsToMessages(results: ToolResult[]) {
  return results.map((r) => ({
    role: "tool" as const,
    content: r.error ? `Error: ${r.error}` : JSON.stringify(r.result),
    toolCallId: r.toolCallId,
    name: r.name,
  }))
}

/**
 * Auto-execute tools and continue chat until no more tool calls or max rounds.
 */
export async function chatWithTools(
  chatFn: (messages: any[]) => Promise<{ content: string; toolCalls?: ToolCall[] }>,
  tools: Tool[],
  messages: any[],
  maxRounds = 5,
): Promise<{ content: string; allMessages: any[] }> {
  const allMessages = [...messages]

  for (let round = 0; round < maxRounds; round++) {
    const response = await chatFn(allMessages)

    if (!response.toolCalls?.length) {
      return { content: response.content, allMessages }
    }

    // Add assistant message with tool calls
    allMessages.push({
      role: "assistant",
      content: response.content,
      toolCalls: response.toolCalls,
    })

    // Execute tools
    const results = await executeTools(tools, response.toolCalls)

    // Add tool results as messages
    allMessages.push(...toolResultsToMessages(results))
  }

  // Max rounds reached, return last response
  const lastResponse = await chatFn(allMessages)
  return { content: lastResponse.content, allMessages }
}
