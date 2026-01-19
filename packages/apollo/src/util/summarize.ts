import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

export async function summarizeChunk(
  text: string,
  onProgress?: (message: string) => void
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Extract the key points from this text. Be concise but preserve important facts, statistics, and insights. Output as bullet points:\n\n${text}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === "text") {
      return content.text
    }
    return ""
  } catch (error) {
    if (onProgress) {
      onProgress(`Warning: Could not summarize chunk: ${error}`)
    }
    // Return truncated original if summarization fails
    return text.slice(0, 2000) + "..."
  }
}

export async function summarizeDocument(
  chunks: string[],
  onProgress?: (message: string) => void
): Promise<string> {
  const summaries: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    if (onProgress) {
      onProgress(`Summarizing section ${i + 1}/${chunks.length}...`)
    }
    const summary = await summarizeChunk(chunks[i], onProgress)
    summaries.push(summary)
  }

  return summaries.join("\n\n---\n\n")
}
