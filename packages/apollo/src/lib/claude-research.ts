/**
 * Claude Web Search Research Client
 * Uses Claude's built-in web_search tool to research topics
 */

import Anthropic from "@anthropic-ai/sdk"

export interface ClaudeResearchConfig {
  timeout?: number
}

const DEFAULT_TIMEOUT = 30000

/**
 * Research a topic using Claude's web search capability
 * Returns formatted answer with sources
 */
export async function claudeResearch(
  query: string,
  config?: ClaudeResearchConfig
): Promise<string> {
  const timeout = config?.timeout || DEFAULT_TIMEOUT
  const anthropic = new Anthropic()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      tools: [{
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3
      }],
      messages: [{
        role: "user",
        content: `Research this topic and provide specific statistics, numbers, and facts. Be concise and data-focused. Include source URLs when available.\n\nTopic: ${query}`
      }]
    }, {
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // Extract text content and sources from response
    return formatClaudeResponse(response)
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Claude research timed out after ${timeout}ms`)
    }

    throw error
  }
}

/**
 * Format Claude's response, extracting text and any cited sources
 */
function formatClaudeResponse(response: Anthropic.Message): string {
  const textParts: string[] = []
  const sources: string[] = []

  for (const block of response.content) {
    if (block.type === "text") {
      textParts.push(block.text)
    } else if (block.type === "tool_use" && block.name === "web_search") {
      // Web search tool was used - results will be in the text
    }
  }

  // Check for web_search_tool_result in the response to extract sources
  // The sources are typically embedded in the text response with citations
  const text = textParts.join("\n")

  // Extract URLs from the text as sources (simple regex for common URL patterns)
  const urlRegex = /https?:\/\/[^\s\)>\]]+/g
  const foundUrls = text.match(urlRegex) || []

  // Deduplicate URLs
  const uniqueUrls = [...new Set(foundUrls)]

  let formatted = text

  if (uniqueUrls.length > 0 && !text.includes("Sources:")) {
    formatted += "\n\n---\nSources:\n"
    uniqueUrls.slice(0, 5).forEach((url, i) => {
      formatted += `[${i + 1}] ${url}\n`
    })
  }

  return formatted
}
