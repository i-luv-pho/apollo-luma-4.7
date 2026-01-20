/**
 * Dual Research Client
 * Runs both Perplexity and Claude web search in parallel for richer data
 */

import { claudeResearch } from "./claude-research"

export interface PerplexityResponse {
  answer: string
  sources: string[]
}

export interface PerplexityConfig {
  apiKey?: string
  model?: string
  timeout?: number
}

const DEFAULT_MODEL = "sonar"  // Fast search model, use "sonar-pro" for deeper research
const DEFAULT_TIMEOUT = 30000

/**
 * Call Perplexity API to research a topic
 * Returns answer with sources for Claude to use
 */
export async function callPerplexity(
  query: string,
  config?: PerplexityConfig
): Promise<PerplexityResponse> {
  const apiKey = config?.apiKey || process.env.PERPLEXITY_API_KEY

  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY not set. Export it or pass in config.")
  }

  const model = config?.model || DEFAULT_MODEL
  const timeout = config?.timeout || DEFAULT_TIMEOUT

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a research assistant. Provide specific statistics, numbers, and facts with sources. Be concise and data-focused."
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.1, // Low temperature for factual accuracy
        max_tokens: 1024
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Perplexity API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    const answer = data.choices?.[0]?.message?.content || ""
    const sources = data.citations || []

    return { answer, sources }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Perplexity request timed out after ${timeout}ms`)
    }

    throw error
  }
}

/**
 * Format research result for Claude
 * Returns a clean string with answer and sources
 */
export function formatResearchResult(result: PerplexityResponse): string {
  const { answer, sources } = result

  let formatted = answer

  if (sources.length > 0) {
    formatted += "\n\n---\nSources:\n"
    sources.forEach((source, i) => {
      formatted += `[${i + 1}] ${source}\n`
    })
  }

  return formatted
}

/**
 * Research a topic using both Perplexity and Claude in parallel
 * Returns combined results for richer data
 */
export async function research(
  query: string,
  config?: PerplexityConfig
): Promise<string> {
  // Run both research sources in parallel
  const [perplexityResult, claudeResult] = await Promise.allSettled([
    callPerplexity(query, config).then(formatResearchResult),
    claudeResearch(query, { timeout: config?.timeout })
  ])

  // Combine results
  const sections: string[] = []

  if (perplexityResult.status === "fulfilled" && perplexityResult.value) {
    sections.push("## Perplexity Research\n" + perplexityResult.value)
  } else if (perplexityResult.status === "rejected") {
    console.warn("Perplexity research failed:", perplexityResult.reason)
  }

  if (claudeResult.status === "fulfilled" && claudeResult.value) {
    sections.push("## Claude Research\n" + claudeResult.value)
  } else if (claudeResult.status === "rejected") {
    console.warn("Claude research failed:", claudeResult.reason)
  }

  // If both failed, throw error
  if (sections.length === 0) {
    const errors = [
      perplexityResult.status === "rejected" ? perplexityResult.reason : null,
      claudeResult.status === "rejected" ? claudeResult.reason : null
    ].filter(Boolean)
    throw new Error(`Both research sources failed: ${errors.map(e => e?.message || e).join(", ")}`)
  }

  return sections.join("\n\n")
}

/**
 * Research using only Perplexity (original behavior)
 * Use this if you only want one source
 */
export async function perplexityOnly(
  query: string,
  config?: PerplexityConfig
): Promise<string> {
  const result = await callPerplexity(query, config)
  return formatResearchResult(result)
}

/**
 * Batch research multiple queries in parallel
 * Useful for gathering data on multiple aspects of a topic
 */
export async function batchResearch(
  queries: string[],
  config?: PerplexityConfig
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  const promises = queries.map(async (query) => {
    try {
      const result = await research(query, config)
      results.set(query, result)
    } catch (error) {
      results.set(query, `Error researching "${query}": ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  await Promise.all(promises)
  return results
}
