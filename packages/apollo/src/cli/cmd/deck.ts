import type { Argv } from "yargs"
import path from "path"
import fs from "fs"
import os from "os"
import { cmd } from "./cmd"
import { UI } from "../ui"
import open from "open"
import Anthropic from "@anthropic-ai/sdk"
import { validateAccessKey, incrementUsage, getAssetsForKey, type Asset } from "../../deck/supabase"
import { extractPDF, chunkText, isScannedPDF } from "../../util/pdf"
import { summarizeDocument } from "../../util/summarize"
import { research } from "../../lib/perplexity"

const DECK_DIR = path.join(os.homedir(), "Apollo", "decks")

// System prompt is embedded at build time
import SYSTEM_PROMPT from "../../session/prompt/anthropic.txt"

function getNextDeckId(): string {
  if (!fs.existsSync(DECK_DIR)) {
    fs.mkdirSync(DECK_DIR, { recursive: true })
  }

  const existing = fs.readdirSync(DECK_DIR)
    .filter(f => /^\d{3}-/.test(f))
    .map(f => parseInt(f.slice(0, 3)))
    .sort((a, b) => b - a)

  const next = (existing[0] || 0) + 1
  return String(next).padStart(3, "0")
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}

// Research tool definition for Claude
const RESEARCH_TOOL: Anthropic.Tool = {
  name: "research",
  description: "Search for real statistics, market data, case studies, and facts. Use this to find compelling, sourced data for your slides. Returns answer with sources.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "What to research. Be specific, e.g., 'AI tutoring market size 2024' or 'online education dropout rates statistics'"
      }
    },
    required: ["query"]
  }
}

/**
 * Handle Claude's tool calls in a loop
 * Keeps going until Claude finishes generating the deck
 */
async function runWithTools(
  anthropic: Anthropic,
  systemPrompt: string,
  userMessage: string,
  maxIterations: number = 10
): Promise<string> {
  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage }
  ]

  let iteration = 0

  while (iteration < maxIterations) {
    iteration++

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: systemPrompt,
      tools: [RESEARCH_TOOL],
      messages
    })

    // Check if Claude wants to use a tool
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    )

    // If no tool use, we're done - extract the final response
    if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
      // Extract HTML from the final response
      for (const block of response.content) {
        if (block.type === "text") {
          const codeBlockMatch = block.text.match(/```html\s*([\s\S]*?)```/)
          if (codeBlockMatch) {
            return codeBlockMatch[1].trim()
          } else if (block.text.includes("<!DOCTYPE html>")) {
            return block.text.trim()
          }
        }
      }

      // If we got here but have tool uses, continue the loop
      if (toolUseBlocks.length > 0) {
        // Process tool calls
      } else {
        throw new Error("Claude did not return valid HTML")
      }
    }

    // Add assistant response to messages
    messages.push({
      role: "assistant",
      content: response.content
    })

    // Process each tool call
    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const toolUse of toolUseBlocks) {
      if (toolUse.name === "research") {
        const input = toolUse.input as { query: string }
        UI.println(UI.Style.TEXT_DIM + `  Researching: ${input.query}...` + UI.Style.TEXT_NORMAL)

        try {
          const result = await research(input.query)
          UI.println(UI.Style.TEXT_SUCCESS_BOLD + "  ✓" + UI.Style.TEXT_NORMAL + " Got research data")

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: result
          })
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          UI.println(UI.Style.TEXT_DANGER + `  ✗ Research failed: ${errorMsg}` + UI.Style.TEXT_NORMAL)

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: `Research failed: ${errorMsg}. Please try a different query or proceed with available data.`,
            is_error: true
          })
        }
      }
    }

    // Add tool results to messages
    messages.push({
      role: "user",
      content: toolResults
    })
  }

  throw new Error(`Reached max iterations (${maxIterations}) without completing deck`)
}

export const DeckCommand = cmd({
  command: "deck [topic..]",
  describe: "Generate an AI-powered pitch deck",
  builder: (yargs: Argv) => {
    return yargs
      .positional("topic", {
        describe: "Topic for your pitch deck",
        type: "string",
        array: true,
        default: [],
      })
      .option("slides", {
        type: "number",
        default: 7,
        describe: "Number of slides",
      })
      .option("open", {
        type: "boolean",
        default: true,
        describe: "Auto-open browser",
      })
      .option("output", {
        type: "string",
        alias: "o",
        describe: "Output directory (default: ~/Apollo/decks)",
      })
      .option("file", {
        type: "string",
        alias: "f",
        describe: "PDF file to create deck from",
      })
  },
  handler: async (args) => {
    const topic = [...args.topic, ...(args["--"] || [])].join(" ").trim()

    if (!topic) {
      UI.error("Please provide a topic for your deck")
      UI.println("Usage: apollo deck \"AI-powered food delivery for students\"")
      process.exit(1)
    }

    // Check access key
    const accessKey = process.env.APOLLO_API_KEY
    if (!accessKey) {
      UI.error("Access key required")
      UI.println()
      UI.println("Set your access key to generate decks:")
      UI.println(UI.Style.TEXT_INFO_BOLD + "  export APOLLO_API_KEY=sk_xxxxx" + UI.Style.TEXT_NORMAL)
      UI.println()
      process.exit(1)
    }

    // Check Perplexity API key
    if (!process.env.PERPLEXITY_API_KEY) {
      UI.error("Perplexity API key required for research")
      UI.println()
      UI.println("Set your Perplexity API key:")
      UI.println(UI.Style.TEXT_INFO_BOLD + "  export PERPLEXITY_API_KEY=pplx-xxxxx" + UI.Style.TEXT_NORMAL)
      UI.println()
      process.exit(1)
    }

    // Validate access key
    UI.println(UI.Style.TEXT_DIM + "Validating access key..." + UI.Style.TEXT_NORMAL)
    const validation = await validateAccessKey(accessKey)

    if (!validation.valid) {
      UI.error(validation.error || "Invalid access key")
      process.exit(1)
    }

    const keyData = validation.data!
    UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓" + UI.Style.TEXT_NORMAL + ` Access key valid (${keyData.decks_used}/${keyData.decks_limit} decks used)`)

    // Fetch user's assets
    const assets = await getAssetsForKey(accessKey)
    if (assets.length > 0) {
      UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓" + UI.Style.TEXT_NORMAL + ` ${assets.length} asset(s) available`)
    }

    UI.println()
    UI.println(UI.Style.TEXT_HIGHLIGHT_BOLD + "Deck" + UI.Style.TEXT_NORMAL + " — AI Pitch Deck Builder")
    UI.println()

    // Process PDF file if provided
    let documentContext = ""

    if (args.file) {
      const filePath = path.resolve(args.file)

      if (!fs.existsSync(filePath)) {
        UI.error(`File not found: ${filePath}`)
        process.exit(1)
      }

      const ext = path.extname(filePath).toLowerCase()
      if (ext !== ".pdf") {
        UI.error("Only PDF files are supported")
        process.exit(1)
      }

      UI.println(UI.Style.TEXT_DIM + "Reading PDF..." + UI.Style.TEXT_NORMAL)

      try {
        const { text, pages, metadata } = await extractPDF(filePath)

        if (isScannedPDF(text, pages)) {
          UI.error("PDF appears to be scanned/image-based. Please use a text-based PDF.")
          process.exit(1)
        }

        if (!text.trim()) {
          UI.error("PDF contains no extractable text.")
          process.exit(1)
        }

        UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓" + UI.Style.TEXT_NORMAL + ` PDF loaded: ${pages} pages`)

        if (pages <= 50) {
          // Small PDF: include full text
          documentContext = `\n\n--- DOCUMENT CONTENT ---\nSource: ${metadata.title || path.basename(filePath)}\nPages: ${pages}\n\n${text}\n--- END DOCUMENT ---\n`
        } else {
          // Large PDF: chunk and summarize
          UI.println(UI.Style.TEXT_DIM + `Processing ${pages} pages...` + UI.Style.TEXT_NORMAL)

          const chunks = chunkText(text)
          const summary = await summarizeDocument(chunks, (msg) => {
            UI.println(UI.Style.TEXT_DIM + msg + UI.Style.TEXT_NORMAL)
          })

          documentContext = `\n\n--- DOCUMENT SUMMARY ---\nSource: ${metadata.title || path.basename(filePath)}\nPages: ${pages}\n\n${summary}\n--- END DOCUMENT ---\n`
        }

        UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓" + UI.Style.TEXT_NORMAL + " Document processed")
      } catch (error) {
        UI.error(`Failed to read PDF: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
      }

      UI.println()
    }

    // Create output directory
    const deckId = getNextDeckId()
    const slug = slugify(topic)
    const outputDir = args.output || path.join(DECK_DIR, `${deckId}-${slug}`)

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const htmlPath = path.join(outputDir, "deck.html")

    UI.println(UI.Style.TEXT_DIM + "Topic:  " + UI.Style.TEXT_NORMAL + topic)
    UI.println(UI.Style.TEXT_DIM + "Output: " + UI.Style.TEXT_NORMAL + outputDir)
    UI.println()

    // Build assets section for prompt
    let assetsSection = ""
    if (assets.length > 0) {
      assetsSection = `

## Available Images
You have access to the following images. Use them when they're relevant to the slide content:

${assets.map(a => `- **${a.label}**${a.description ? `: ${a.description}` : ""}
  URL: ${a.public_url}`).join("\n\n")}

When an image fits a slide's content, include it with: <img src="URL" alt="label" class="slide-image">
`
    }

    // Build user message
    const userMessage = `Create a ${args.slides}-slide pitch deck about: "${topic}"

${documentContext ? "Use the document content provided below as the primary source. Use the research tool to supplement with additional data." : "Use the research tool to find real statistics, market data, and relevant information. Make 3-5 research calls to gather compelling data."}
${assetsSection}
Research thoroughly, then generate the complete HTML file.${documentContext}`

    UI.println(UI.Style.TEXT_INFO_BOLD + "Generating deck..." + UI.Style.TEXT_NORMAL)
    UI.println()

    // Call Anthropic API with tool support
    const anthropic = new Anthropic()

    try {
      const html = await runWithTools(
        anthropic,
        SYSTEM_PROMPT,
        userMessage
      )

      if (!html) {
        UI.error("AI did not return valid HTML")
        process.exit(1)
      }

      // Save HTML file
      fs.writeFileSync(htmlPath, html)
      UI.println()
      UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓" + UI.Style.TEXT_NORMAL + " Deck generated!")

      // Increment access key usage
      await incrementUsage(accessKey)
      UI.println(UI.Style.TEXT_DIM + `Usage updated: ${keyData.decks_used + 1}/${keyData.decks_limit} decks` + UI.Style.TEXT_NORMAL)

      UI.println()
      UI.println(UI.Style.TEXT_DIM + "File:  " + UI.Style.TEXT_NORMAL + htmlPath)
      UI.println()

      // Open in browser and folder
      if (args.open) {
        await open(htmlPath)
        await open(outputDir)
        UI.println(UI.Style.TEXT_SUCCESS_BOLD + "Opened in browser!" + UI.Style.TEXT_NORMAL)
      }

    } catch (error) {
      UI.error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  },
})
