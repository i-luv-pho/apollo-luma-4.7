import type { Argv } from "yargs"
import path from "path"
import fs from "fs"
import os from "os"
import { cmd } from "./cmd"
import { UI } from "../ui"
import open from "open"
import { getAssetsForKey, type Asset } from "../../deck/supabase"
import { extractPDF, chunkText, isScannedPDF } from "../../util/pdf"
import { summarizeDocument } from "../../util/summarize"

const DECK_DIR = path.join(os.homedir(), "Apollo", "decks")

// Apollo API endpoint (Supabase Edge Function)
const APOLLO_API_URL = "https://advpygqokfxmomlumkgl.supabase.co/functions/v1/generate-deck"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdnB5Z3Fva2Z4bW9tbHVta2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjY5NzMsImV4cCI6MjA4NDQwMjk3M30.2OK3fN17IkBpFJL8c1BfTfr2WtJ4exlBDikNvGw9zXg"

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

interface GenerateDeckResponse {
  success: boolean
  html?: string
  researchQueries?: string[]
  usage?: {
    decks_used: number
    decks_limit: number
  }
  error?: string
}

/**
 * Call Apollo API to generate deck
 * All AI calls happen server-side - user only needs access key
 */
async function generateDeckViaAPI(
  accessKey: string,
  topic: string,
  slides: number,
  documentContext: string,
  assets: Asset[]
): Promise<GenerateDeckResponse> {
  const response = await fetch(APOLLO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "x-access-key": accessKey
    },
    body: JSON.stringify({
      topic,
      slides,
      documentContext,
      assets: assets.map(a => ({
        label: a.label,
        public_url: a.public_url,
        description: a.description
      }))
    })
  })

  const data = await response.json()

  if (!response.ok) {
    return { success: false, error: data.error || `API error: ${response.status}` }
  }

  return data
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
    const accessKey = process.env.APOLLO_ACCESS_KEY
    if (!accessKey) {
      UI.error("Access key required")
      UI.println()
      UI.println("Set your access key to generate decks:")
      UI.println(UI.Style.TEXT_INFO_BOLD + "  export APOLLO_ACCESS_KEY=sk_xxxxx" + UI.Style.TEXT_NORMAL)
      UI.println()
      UI.println("Get your access key at: https://apollo.app/keys")
      UI.println()
      process.exit(1)
    }

    UI.println()
    UI.println(UI.Style.TEXT_HIGHLIGHT_BOLD + "Deck" + UI.Style.TEXT_NORMAL + " — AI Pitch Deck Builder")
    UI.println()

    // Fetch user's assets
    const assets = await getAssetsForKey(accessKey)
    if (assets.length > 0) {
      UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓" + UI.Style.TEXT_NORMAL + ` ${assets.length} asset(s) available`)
    }

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
          documentContext = `\n\n--- DOCUMENT CONTENT ---\nSource: ${metadata.title || path.basename(filePath)}\nPages: ${pages}\n\n${text}\n--- END DOCUMENT ---\n`
        } else {
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

    UI.println(UI.Style.TEXT_INFO_BOLD + "Generating deck..." + UI.Style.TEXT_NORMAL)
    UI.println()

    try {
      const result = await generateDeckViaAPI(
        accessKey,
        topic,
        args.slides,
        documentContext,
        assets
      )

      if (!result.success || !result.html) {
        UI.error(result.error || "Generation failed")
        process.exit(1)
      }

      // Show research queries
      if (result.researchQueries && result.researchQueries.length > 0) {
        for (const query of result.researchQueries) {
          UI.println(UI.Style.TEXT_DIM + `  Researched: ${query}` + UI.Style.TEXT_NORMAL)
        }
        UI.println()
      }

      // Save HTML file
      fs.writeFileSync(htmlPath, result.html)
      UI.println(UI.Style.TEXT_SUCCESS_BOLD + "✓" + UI.Style.TEXT_NORMAL + " Deck generated!")

      // Show usage
      if (result.usage) {
        UI.println(UI.Style.TEXT_DIM + `Usage: ${result.usage.decks_used}/${result.usage.decks_limit} decks` + UI.Style.TEXT_NORMAL)
      }

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
