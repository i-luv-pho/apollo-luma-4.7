import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-access-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Apollo color themes (light mode only)
const THEMES = {
  "pure-white": { bg: "#FFFFFF", headline: "#0d2137", text: "#374151", accent: "#2563eb" },
  "warm-white": { bg: "#FAFAF8", headline: "#1a1814", text: "#44403c", accent: "#b45309" },
  "light-gray": { bg: "#F2F2F2", headline: "#1a1a1a", text: "#525252", accent: "#0891b2" },
}

const CONTENT_PROMPT = `You are Apollo, an AI that creates world-class presentation content.

Your job is to WRITE the content. Another AI (Gamma) will handle the visual layout.

# Your Output Format
Return a JSON object with this exact structure:
{
  "title": "Presentation title",
  "slides": [
    {
      "headline": "Short punchy headline (max 60 chars)",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "imageQuery": "specific search term for stock photo",
      "speakerNotes": "What the presenter should say for this slide",
      "mermaidDiagram": "flowchart LR\\n  A[Step 1] --> B[Step 2] --> C[Step 3]",
      "chartData": {
        "type": "bar",
        "title": "Chart Title",
        "labels": ["Label1", "Label2", "Label3"],
        "data": [100, 80, 60],
        "dataLabel": "What the data represents"
      }
    }
  ]
}

# Content Guidelines
1. HEADLINE: Action-oriented, specific, intriguing (max 60 chars)
2. BULLETS: 3-5 per slide, each max 50 chars, start with verbs
3. IMAGE QUERY: Specific, visual, will search Pexels (e.g., "startup team celebrating", "rocket launch night sky")
4. SPEAKER NOTES: 2-4 sentences the presenter should say. Include:
   - Opening line or question to engage audience
   - Key point to emphasize
   - Transition to next slide
5. MERMAID DIAGRAM (for SOLUTION and HOW IT WORKS slides ONLY):
   - Include a "mermaidDiagram" field with a simple flowchart
   - Use "flowchart LR" for left-to-right process flows
   - Keep it simple: 3-5 nodes maximum
   - Use short labels (1-3 words per node)
   - Use --> for arrows between steps
   - Example: "flowchart LR\\n  A[Input] --> B[Process] --> C[Output]"
   - For other slide types, omit this field entirely
6. DATA CHART (for slides with comparative data or statistics):
   - Include a "chartData" field when the slide presents numerical comparisons
   - Chart types:
     * "bar" - for comparing values across categories (GDP by country, revenue by year)
     * "pie" - for showing parts of a whole (market share, budget allocation)
     * "doughnut" - like pie but with a hole (looks more modern)
     * "line" - for showing trends over time (growth, historical data)
   - Structure:
     {
       "type": "bar" | "pie" | "line" | "doughnut",
       "title": "Chart title (e.g., 'GDP by Country 2024')",
       "labels": ["USA", "China", "Japan"],
       "data": [28.8, 18.5, 4.2],
       "dataLabel": "GDP in Trillions USD"
     }
   - IMPORTANT: Use REAL, RESEARCHED data - never make up numbers
   - Keep labels SHORT (1-3 words max)
   - Best slides for charts: PROBLEM (stats), MARKET (size comparison), IMPACT (metrics)
   - Charts take visual priority - only include ONE visual per slide (chart OR diagram OR photo)

# Slide Flow for a Pitch Deck
1. TITLE - Hook in 5 seconds (use photo)
2. PROBLEM - Feel the pain with real data (INCLUDE chartData if comparing statistics)
3. SOLUTION - The answer, clear and simple (INCLUDE mermaidDiagram for process flow)
4. HOW IT WORKS - Feel simple (INCLUDE mermaidDiagram for steps)
5. MARKET - Big and real numbers (INCLUDE chartData for market size/comparison)
6. IMPACT/TRACTION - Transformation or results (INCLUDE chartData for metrics)
7. CTA - Exact next action (use photo)

# Research & Quality
- Research the topic thoroughly
- Use specific numbers, dates, names when possible
- Make it compelling, not generic
- Each slide should tell part of a story
- ALWAYS use real data for charts - never placeholder numbers

Return ONLY the JSON object, no markdown, no explanation.`

interface ChartData {
  type: "bar" | "pie" | "line" | "doughnut"
  title: string
  labels: string[]
  data: number[]
  dataLabel?: string // Legend label like "GDP in Trillions"
}

interface SlideContent {
  headline: string
  bullets: string[]
  imageQuery: string
  speakerNotes: string
  mermaidDiagram?: string // Optional flowchart for Solution/How slides
  chartData?: ChartData // Optional data visualization chart
}

interface ContentResponse {
  title: string
  slides: SlideContent[]
}

/**
 * Stage 1: Claude generates structured content + image queries
 */
async function generateContent(
  apiKey: string,
  topic: string,
  numSlides: number,
  documentContext: string,
): Promise<ContentResponse> {
  const userPrompt = documentContext
    ? `Create a ${numSlides}-slide presentation about: "${topic}"\n\nUse this document as source material:\n${documentContext}`
    : `Create a ${numSlides}-slide presentation about: "${topic}"`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: CONTENT_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  const text = data.content[0]?.text || ""

  // Parse JSON response
  try {
    // Remove markdown code blocks if present
    const jsonStr = text.replace(/```json\s*|\s*```/g, "").trim()
    return JSON.parse(jsonStr)
  } catch {
    throw new Error("Failed to parse Claude response as JSON")
  }
}

/**
 * Stage 2: Pexels finds photos for each slide
 */
async function searchPhoto(apiKey: string, query: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: { Authorization: apiKey },
      },
    )

    if (!response.ok) {
      console.error(`Pexels error: ${response.status}`)
      return null
    }

    const data = await response.json()
    // Get high-res landscape image
    return data.photos?.[0]?.src?.large2x || data.photos?.[0]?.src?.large || null
  } catch (e) {
    console.error("Pexels search failed:", e)
    return null
  }
}

async function getPhotosForSlides(apiKey: string, slides: SlideContent[]): Promise<(string | null)[]> {
  // Search for all photos in parallel
  const photoPromises = slides.map((slide) => searchPhoto(apiKey, slide.imageQuery))
  return Promise.all(photoPromises)
}

/**
 * Stage 2.5: Render Mermaid diagrams via Kroki API
 * Kroki is a free diagram rendering service - no API key needed
 */
function renderMermaidToUrl(syntax: string): string | null {
  try {
    // Kroki expects base64-encoded diagram syntax
    // Use TextEncoder for proper UTF-8 handling in Deno
    const encoder = new TextEncoder()
    const data = encoder.encode(syntax)
    const base64 = btoa(String.fromCharCode(...data))
    // URL-safe base64
    const urlSafe = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    return `https://mermaid.ink/img/${urlSafe}`
  } catch (e) {
    console.error("Failed to encode Mermaid diagram:", e)
    return null
  }
}

function getDiagramsForSlides(slides: SlideContent[]): (string | null)[] {
  return slides.map((slide) => {
    if (slide.mermaidDiagram) {
      return renderMermaidToUrl(slide.mermaidDiagram)
    }
    return null
  })
}

/**
 * Stage 2.75: Render data charts via QuickChart.io
 * QuickChart is a free Chart.js rendering service - no API key needed
 */
function renderChartToUrl(chart: ChartData): string {
  // Blue color palette for lively, professional look
  const blueColors = [
    "#2563eb", // Primary blue
    "#3b82f6", // Lighter blue
    "#60a5fa", // Even lighter
    "#93c5fd", // Light blue
    "#bfdbfe", // Very light
    "#1d4ed8", // Darker blue
  ]

  const config = {
    type: chart.type,
    data: {
      labels: chart.labels,
      datasets: [
        {
          label: chart.dataLabel || chart.title,
          data: chart.data,
          backgroundColor:
            chart.type === "pie" || chart.type === "doughnut" ? blueColors.slice(0, chart.data.length) : "#2563eb",
          borderColor: chart.type === "pie" || chart.type === "doughnut" ? "#ffffff" : "#1d4ed8",
          borderWidth: chart.type === "pie" || chart.type === "doughnut" ? 2 : 1,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: chart.title,
          font: { size: 18, weight: "bold" },
          color: "#1a1a1a",
        },
        legend: {
          display: chart.type === "pie" || chart.type === "doughnut",
          position: "bottom",
        },
      },
      scales:
        chart.type === "pie" || chart.type === "doughnut"
          ? undefined
          : {
              y: { beginAtZero: true, grid: { color: "#e5e7eb" } },
              x: { grid: { display: false } },
            },
    },
  }

  const encoded = encodeURIComponent(JSON.stringify(config))
  return `https://quickchart.io/chart?c=${encoded}&w=600&h=400&bkg=white`
}

function getChartsForSlides(slides: SlideContent[]): (string | null)[] {
  return slides.map((slide) => {
    if (slide.chartData) {
      return renderChartToUrl(slide.chartData)
    }
    return null
  })
}

/**
 * Stage 3: Gamma creates the presentation
 */
async function createGammaPresentation(
  apiKey: string,
  title: string,
  slides: SlideContent[],
  photos: (string | null)[],
  diagrams: (string | null)[],
  charts: (string | null)[],
  theme: keyof typeof THEMES,
): Promise<{ generationId: string }> {
  // Format content for Gamma with photo URLs, diagrams, and charts embedded
  // Use \n---\n to separate slides
  const inputParts: string[] = []

  // First slide: Title slide
  inputParts.push(`# ${title}`)

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    const photo = photos[i]
    const diagram = diagrams[i]
    const chart = charts[i]

    let slideText = `# ${slide.headline}\n\n`
    slideText += slide.bullets.map((b) => `- ${b}`).join("\n")

    // Visual priority: Chart > Diagram > Photo
    // Charts for data visualization, diagrams for process flows, photos for everything else
    if (chart) {
      slideText += `\n\n![data visualization](${chart})`
    } else if (diagram) {
      slideText += `\n\n![process flow](${diagram})`
    } else if (photo) {
      slideText += `\n\n![](${photo})`
    }

    // Add speaker notes as HTML comment (Gamma includes these in PPTX export)
    if (slide.speakerNotes) {
      slideText += `\n\n<!-- notes: ${slide.speakerNotes} -->`
    }

    inputParts.push(slideText)
  }

  const inputText = inputParts.join("\n\n---\n\n")

  // Style instructions for Gamma (optimized for PPTX export to Canva/Google Slides)
  const styleInstructions = `CRITICAL DESIGN RULES FOR EXPORT COMPATIBILITY:
- Use SOLID WHITE background (#FFFFFF) - no patterns, no overlays
- NO gradients anywhere - not on backgrounds, not on shapes
- NO background images or textures
- NO layered background elements
- Keep all elements simple and flat
- Use solid color shapes only
- Clean, minimal design with lots of white space
- Text must be on solid backgrounds for easy editing`

  const response = await fetch("https://public-api.gamma.app/v1.0/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      inputText,
      textMode: "preserve", // Keep Claude's exact text
      format: "presentation",
      numCards: slides.length + 1, // +1 for title slide
      cardSplit: "inputTextBreaks", // Respect our \n---\n markers
      additionalInstructions: styleInstructions,
      exportAs: "pptx", // Export as PowerPoint for download
      textOptions: {
        amount: "medium",
      },
      imageOptions: {
        source: "noImages", // We already embedded Pexels photos
      },
      cardOptions: {
        dimensions: "16x9",
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gamma API error: ${response.status} ${error}`)
  }

  return response.json()
}

interface GammaCompletionResult {
  gammaUrl: string
  credits: { deducted: number; remaining: number }
  pptxUrl?: string
  pdfUrl?: string
}

/**
 * Check Gamma generation status and get export URLs
 * NOTE: Export URL may not be immediately available when status is "completed"
 * We need to poll a few more times after completion to get the download link
 */
async function waitForGammaCompletion(
  apiKey: string,
  generationId: string,
  maxWaitMs: number = 180000, // 3 minutes total
): Promise<GammaCompletionResult> {
  const startTime = Date.now()
  let exportPollCount = 0
  const maxExportPolls = 15 // Poll up to 15 more times (45 seconds) for export URL after completion

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`https://public-api.gamma.app/v1.0/generations/${generationId}`, {
      headers: { "X-API-KEY": apiKey },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gamma status check failed: ${response.status} ${error}`)
    }

    const data = await response.json()
    console.log(
      `[Gamma] Poll response (exportPollCount=${exportPollCount}): status=${data.status}, downloadLink=${data.downloadLink || "none"}`,
    )

    if (data.status === "completed") {
      // Extract export URLs if available
      const result: GammaCompletionResult = {
        gammaUrl: data.gammaUrl,
        credits: data.credits,
      }

      // Gamma returns downloadLink when exportAs is specified
      if (data.downloadLink) {
        // Check if it's PPTX or PDF based on URL
        if (data.downloadLink.includes("/pptx/") || data.downloadLink.endsWith(".pptx")) {
          result.pptxUrl = data.downloadLink
        } else if (data.downloadLink.includes("/pdf/") || data.downloadLink.endsWith(".pdf")) {
          result.pdfUrl = data.downloadLink
        } else {
          // Default to PPTX since we requested it
          result.pptxUrl = data.downloadLink
        }
      }

      // Also check alternative field names
      if (data.exportUrl) {
        result.pptxUrl = data.exportUrl
      }
      if (data.exports?.pptx) {
        result.pptxUrl = data.exports.pptx
      }
      if (data.exports?.pdf) {
        result.pdfUrl = data.exports.pdf
      }

      // CRITICAL FIX: Export URL may not be ready immediately after "completed"
      // According to Gamma docs, we need additional GET requests after completion
      if (!result.pptxUrl && !result.pdfUrl && exportPollCount < maxExportPolls) {
        exportPollCount++
        console.log(`[Gamma] Completed but no export URL yet, polling again (${exportPollCount}/${maxExportPolls})...`)
        await new Promise((resolve) => setTimeout(resolve, 3000)) // Wait 3 seconds
        continue // Poll again for export URL
      }

      console.log(`[Gamma] Final result: gammaUrl=${result.gammaUrl}, pptxUrl=${result.pptxUrl || "none"}`)
      return result
    }

    if (data.status === "failed") {
      throw new Error("Gamma generation failed")
    }

    // Wait 2 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error("Gamma generation timed out")
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })

  try {
    // Get access key from header
    const accessKey = req.headers.get("x-access-key")
    if (!accessKey) {
      return new Response(JSON.stringify({ success: false, error: "Access key required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create Supabase client with service role
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

    // Validate access key
    const { data: keyData, error: keyError } = await supabase
      .from("deck_api_keys")
      .select("*")
      .eq("key", accessKey)
      .single()

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ success: false, error: "Invalid access key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!keyData.active) {
      return new Response(JSON.stringify({ success: false, error: "Access key disabled" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ success: false, error: "Access key expired" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (keyData.decks_used >= keyData.decks_limit) {
      return new Response(
        JSON.stringify({ success: false, error: `Limit reached (${keyData.decks_used}/${keyData.decks_limit})` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // Parse request
    const { topic, slides = 7, theme = "pure-white", documentContext = "" } = await req.json()
    if (!topic) {
      return new Response(JSON.stringify({ success: false, error: "Topic required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Get API keys from environment
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
    const pexelsKey = Deno.env.get("PEXELS_API_KEY")
    const gammaKey = Deno.env.get("GAMMA_API_KEY")

    if (!anthropicKey || !pexelsKey || !gammaKey) {
      return new Response(JSON.stringify({ success: false, error: "Server not configured (missing API keys)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log(`[Stage 1] Generating content for: ${topic}`)

    // Stage 1: Claude generates content
    const content = await generateContent(anthropicKey, topic, slides, documentContext)
    console.log(`[Stage 1] Got ${content.slides.length} slides`)

    // Stage 2: Pexels finds photos
    console.log(`[Stage 2] Searching photos...`)
    const photos = await getPhotosForSlides(pexelsKey, content.slides)
    const photosFound = photos.filter((p) => p !== null).length
    console.log(`[Stage 2] Found ${photosFound}/${content.slides.length} photos`)

    // Stage 2.5: Render Mermaid diagrams
    console.log(`[Stage 2.5] Rendering diagrams...`)
    const diagrams = getDiagramsForSlides(content.slides)
    const diagramsFound = diagrams.filter((d) => d !== null).length
    console.log(`[Stage 2.5] Generated ${diagramsFound} diagrams`)

    // Stage 2.75: Render data charts
    console.log(`[Stage 2.75] Rendering charts...`)
    const charts = getChartsForSlides(content.slides)
    const chartsFound = charts.filter((c) => c !== null).length
    console.log(`[Stage 2.75] Generated ${chartsFound} charts`)

    // Stage 3: Gamma creates presentation
    console.log(`[Stage 3] Creating Gamma presentation...`)
    const validTheme = theme in THEMES ? (theme as keyof typeof THEMES) : "pure-white"
    const { generationId } = await createGammaPresentation(
      gammaKey,
      content.title,
      content.slides,
      photos,
      diagrams,
      charts,
      validTheme,
    )
    console.log(`[Stage 3] Generation started: ${generationId}`)

    // Wait for completion
    const { gammaUrl, credits, pptxUrl, pdfUrl } = await waitForGammaCompletion(gammaKey, generationId)
    console.log(`[Stage 3] Presentation ready: ${gammaUrl}`)
    if (pptxUrl) console.log(`[Stage 3] PPTX export: ${pptxUrl}`)
    if (pdfUrl) console.log(`[Stage 3] PDF export: ${pdfUrl}`)

    // Increment usage on the access key
    await supabase
      .from("deck_api_keys")
      .update({ decks_used: keyData.decks_used + 1 })
      .eq("id", keyData.id)

    return new Response(
      JSON.stringify({
        success: true,
        gammaUrl,
        pptxUrl,
        pdfUrl,
        title: content.title,
        slideCount: content.slides.length + 1, // +1 for title slide
        photosUsed: photosFound,
        diagramsUsed: diagramsFound,
        chartsUsed: chartsFound,
        gammaCredits: credits,
        usage: { decks_used: keyData.decks_used + 1, decks_limit: keyData.decks_limit },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (e: any) {
    console.error("Error:", e)
    const errorMsg = e?.message || String(e) || "Unknown error"
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
