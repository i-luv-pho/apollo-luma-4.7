import type { Argv } from "yargs"
import path from "path"
import fs from "fs"
import os from "os"
import { cmd } from "./cmd"
import { UI } from "../ui"
import open from "open"
import Anthropic from "@anthropic-ai/sdk"
import { validateAccessKey, incrementUsage } from "../../deck/supabase"
import { extractPDF, chunkText, isScannedPDF } from "../../util/pdf"
import { summarizeDocument } from "../../util/summarize"

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

    // Validate access key
    UI.println(UI.Style.TEXT_DIM + "Validating access key..." + UI.Style.TEXT_NORMAL)
    const validation = await validateAccessKey(accessKey)

    if (!validation.valid) {
      UI.error(validation.error || "Invalid access key")
      process.exit(1)
    }

    const keyData = validation.data!
    UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓" + UI.Style.TEXT_NORMAL + ` Access key valid (${keyData.decks_used}/${keyData.decks_limit} decks used)`)

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

    // System prompt is imported at build time
    const systemPrompt = SYSTEM_PROMPT

    // Build user message
    const userMessage = `Create a ${args.slides}-slide pitch deck about: "${topic}"

${documentContext ? "Use the document content provided below as the primary source. Supplement with web search for additional data." : "Use web search to find real statistics, market data, and relevant information."}

Research thoroughly, then generate the complete HTML file.${documentContext}`

    UI.println(UI.Style.TEXT_INFO_BOLD + "Generating deck..." + UI.Style.TEXT_NORMAL)
    UI.println()

    // Call Anthropic API directly
    const anthropic = new Anthropic()

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        system: systemPrompt,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 10
          }
        ],
        messages: [
          { role: "user", content: userMessage }
        ]
      })

      // Extract HTML from response
      let html = ""
      for (const block of response.content) {
        if (block.type === "text") {
          // Check if it's wrapped in code blocks
          const codeBlockMatch = block.text.match(/```html\s*([\s\S]*?)```/)
          if (codeBlockMatch) {
            html = codeBlockMatch[1].trim()
            break // Found HTML, stop looking
          } else if (block.text.includes("<!DOCTYPE html>")) {
            // Raw HTML without code blocks
            html = block.text.trim()
            break // Found HTML, stop looking
          }
        }
      }

      if (!html) {
        UI.error("AI did not return valid HTML")
        process.exit(1)
      }

      // Save HTML file
      fs.writeFileSync(htmlPath, html)
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
