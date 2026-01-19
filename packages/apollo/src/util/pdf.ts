import fs from "fs"
// @ts-ignore - pdf-parse types
import pdf from "pdf-parse"

export interface PDFResult {
  text: string
  pages: number
  metadata: {
    title?: string
    author?: string
    creator?: string
  }
}

export async function extractPDF(filePath: string): Promise<PDFResult> {
  const buffer = fs.readFileSync(filePath)
  const data = await pdf(buffer)

  return {
    text: data.text,
    pages: data.numpages,
    metadata: {
      title: data.info?.Title,
      author: data.info?.Author,
      creator: data.info?.Creator,
    },
  }
}

export function chunkText(text: string, maxTokens: number = 4000): string[] {
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let current = ""

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue

    if ((current.length + trimmed.length + 2) > maxChars) {
      if (current) {
        chunks.push(current.trim())
      }
      // If single paragraph exceeds max, split it
      if (trimmed.length > maxChars) {
        const sentences = trimmed.split(/(?<=[.!?])\s+/)
        let sentenceChunk = ""
        for (const sentence of sentences) {
          if ((sentenceChunk.length + sentence.length + 1) > maxChars) {
            if (sentenceChunk) chunks.push(sentenceChunk.trim())
            sentenceChunk = sentence
          } else {
            sentenceChunk += (sentenceChunk ? " " : "") + sentence
          }
        }
        current = sentenceChunk
      } else {
        current = trimmed
      }
    } else {
      current += (current ? "\n\n" : "") + trimmed
    }
  }

  if (current.trim()) {
    chunks.push(current.trim())
  }

  return chunks
}

export function isScannedPDF(text: string, pages: number): boolean {
  // If very little text extracted relative to page count, likely scanned
  const charsPerPage = text.length / pages
  return charsPerPage < 100 // Less than 100 chars per page = probably scanned
}
