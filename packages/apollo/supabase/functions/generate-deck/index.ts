// Supabase Edge Function: generate-deck
// Handles all AI calls server-side - user only needs access key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-access-key",
}

// API keys stored as Supabase secrets (set via CLI: supabase secrets set ANTHROPIC_API_KEY=xxx)
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

interface DeckRequest {
  topic: string
  slides: number
  documentContext?: string
  assets?: Array<{ label: string; public_url: string; description?: string }>
}

interface ResearchResult {
  answer: string
  sources: string[]
}

// Validate access key and check quota
async function validateAccessKey(accessKey: string): Promise<{ valid: boolean; error?: string; data?: any }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from("deck_api_keys")
    .select("*")
    .eq("key", accessKey)
    .single()

  if (error || !data) {
    return { valid: false, error: "Invalid access key" }
  }

  if (!data.active) {
    return { valid: false, error: "Access key is disabled" }
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: "Access key has expired" }
  }

  if (data.decks_used >= data.decks_limit) {
    return { valid: false, error: `Deck limit reached (${data.decks_used}/${data.decks_limit})` }
  }

  return { valid: true, data }
}

// Increment usage after successful generation
async function incrementUsage(accessKey: string): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data } = await supabase
    .from("deck_api_keys")
    .select("decks_used")
    .eq("key", accessKey)
    .single()

  if (data) {
    await supabase
      .from("deck_api_keys")
      .update({ decks_used: data.decks_used + 1 })
      .eq("key", accessKey)
  }
}

// Call Perplexity for research
async function research(query: string): Promise<string> {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "sonar",
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
      temperature: 0.1,
      max_tokens: 1024
    })
  })

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`)
  }

  const data = await response.json()
  const answer = data.choices?.[0]?.message?.content || ""
  const sources = data.citations || []

  let formatted = answer
  if (sources.length > 0) {
    formatted += "\n\n---\nSources:\n"
    sources.forEach((source: string, i: number) => {
      formatted += `[${i + 1}] ${source}\n`
    })
  }

  return formatted
}

// Research tool definition
const RESEARCH_TOOL = {
  name: "research",
  description: "Search for real statistics, market data, case studies, and facts. Use this to find compelling, sourced data for your slides. Returns answer with sources.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "What to research. Be specific, e.g., 'AI tutoring market size 2024' or 'online education dropout rates statistics'"
      }
    },
    required: ["query"]
  }
}

// System prompt for deck generation
const SYSTEM_PROMPT = `You are Apollo, an AI that creates world-class presentation slides.

# Your Process
1. RESEARCH - Use the research tool 3-5 times to gather real data
2. BUILD - Generate the HTML deck with researched statistics

# 7 Slides Structure
1. TITLE - Hook in 5 seconds
2. PROBLEM - Feel the pain with stats
3. SOLUTION - THE answer
4. HOW - Feel simple
5. MARKET - Big and real numbers
6. IMPACT - Transformation proof
7. CTA - Exact action

# Design Rules
- Background: #ffffff only
- Text: #000000 only
- Headlines: Fraunces font
- Body: Inter font
- 1280×720 slides

Output a complete HTML file with all slides.`

// Main deck generation with tool loop
async function generateDeck(
  topic: string,
  slides: number,
  documentContext: string,
  assets: Array<{ label: string; public_url: string; description?: string }>,
  onResearch: (query: string) => void
): Promise<string> {

  // Build assets section
  let assetsSection = ""
  if (assets.length > 0) {
    assetsSection = `\n\n## Available Images\n${assets.map(a =>
      `- **${a.label}**${a.description ? `: ${a.description}` : ""}\n  URL: ${a.public_url}`
    ).join("\n\n")}\n`
  }

  const userMessage = `Create a ${slides}-slide pitch deck about: "${topic}"

${documentContext ? "Use the document content provided below as the primary source. Use the research tool to supplement with additional data." : "Use the research tool to find real statistics, market data, and relevant information. Make 3-5 research calls to gather compelling data."}
${assetsSection}
Research thoroughly, then generate the complete HTML file.${documentContext}`

  let messages: any[] = [
    { role: "user", content: userMessage }
  ]

  let iteration = 0
  const maxIterations = 10

  while (iteration < maxIterations) {
    iteration++

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        tools: [RESEARCH_TOOL],
        messages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }

    const result = await response.json()

    // Check for tool use
    const toolUseBlocks = result.content.filter((block: any) => block.type === "tool_use")

    // If no tool use or end turn, extract HTML
    if (toolUseBlocks.length === 0 || result.stop_reason === "end_turn") {
      for (const block of result.content) {
        if (block.type === "text") {
          const codeBlockMatch = block.text.match(/```html\s*([\s\S]*?)```/)
          if (codeBlockMatch) {
            return codeBlockMatch[1].trim()
          } else if (block.text.includes("<!DOCTYPE html>")) {
            return block.text.trim()
          }
        }
      }

      if (toolUseBlocks.length > 0) {
        // Continue processing tools
      } else {
        throw new Error("AI did not return valid HTML")
      }
    }

    // Add assistant response
    messages.push({
      role: "assistant",
      content: result.content
    })

    // Process tool calls
    const toolResults: any[] = []

    for (const toolUse of toolUseBlocks) {
      if (toolUse.name === "research") {
        const query = toolUse.input.query
        onResearch(query)

        try {
          const researchResult = await research(query)
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: researchResult
          })
        } catch (error) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: `Research failed: ${error}. Please try a different query or proceed with available data.`,
            is_error: true
          })
        }
      }
    }

    // Add tool results
    messages.push({
      role: "user",
      content: toolResults
    })
  }

  throw new Error("Reached max iterations without completing deck")
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Get access key from header
    const accessKey = req.headers.get("x-access-key")
    if (!accessKey) {
      return new Response(
        JSON.stringify({ error: "Access key required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Validate access key
    const validation = await validateAccessKey(accessKey)
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Parse request
    const body: DeckRequest = await req.json()
    const { topic, slides = 7, documentContext = "", assets = [] } = body

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Track research queries for response
    const researchQueries: string[] = []

    // Generate deck
    const html = await generateDeck(
      topic,
      slides,
      documentContext,
      assets,
      (query) => researchQueries.push(query)
    )

    // Increment usage
    await incrementUsage(accessKey)

    return new Response(
      JSON.stringify({
        success: true,
        html,
        researchQueries,
        usage: {
          decks_used: validation.data.decks_used + 1,
          decks_limit: validation.data.decks_limit
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
