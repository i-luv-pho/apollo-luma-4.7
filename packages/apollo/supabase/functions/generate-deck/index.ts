import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-access-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Apollo color themes
const THEMES = {
  "pure-white": { bg: "#FFFFFF", headline: "#0d2137", text: "#374151", accent: "#2563eb" },
  "warm-white": { bg: "#FAFAF8", headline: "#1a1814", text: "#44403c", accent: "#b45309" },
  "light-gray": { bg: "#F2F2F2", headline: "#1a1a1a", text: "#525252", accent: "#0891b2" },
  "charcoal": { bg: "#1a1a1a", headline: "#ffffff", text: "#d4d4d4", accent: "#f59e0b" },
  "dark-forest": { bg: "#0f1f1a", headline: "#e8fff4", text: "#a7f3d0", accent: "#10b981" },
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
      "imageQuery": "specific search term for stock photo"
    }
  ]
}

# Content Guidelines
1. HEADLINE: Action-oriented, specific, intriguing (max 60 chars)
2. BULLETS: 3-5 per slide, each max 50 chars, start with verbs
3. IMAGE QUERY: Specific, visual, will search Pexels (e.g., "startup team celebrating", "rocket launch night sky")

# Slide Flow for a Pitch Deck
1. TITLE - Hook in 5 seconds
2. PROBLEM - Feel the pain with real data
3. SOLUTION - The answer, clear and simple
4. HOW IT WORKS - Feel simple (optional)
5. MARKET - Big and real numbers (optional)
6. IMPACT/TRACTION - Transformation or results
7. CTA - Exact next action

# Research & Quality
- Research the topic thoroughly
- Use specific numbers, dates, names when possible
- Make it compelling, not generic
- Each slide should tell part of a story

Return ONLY the JSON object, no markdown, no explanation.`

interface SlideContent {
  headline: string
  bullets: string[]
  imageQuery: string
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
  documentContext: string
): Promise<ContentResponse> {
  const userPrompt = documentContext
    ? `Create a ${numSlides}-slide presentation about: "${topic}"\n\nUse this document as source material:\n${documentContext}`
    : `Create a ${numSlides}-slide presentation about: "${topic}"`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: CONTENT_PROMPT,
      messages: [{ role: "user", content: userPrompt }]
    })
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
        headers: { "Authorization": apiKey }
      }
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

async function getPhotosForSlides(
  apiKey: string,
  slides: SlideContent[]
): Promise<(string | null)[]> {
  // Search for all photos in parallel
  const photoPromises = slides.map(slide => searchPhoto(apiKey, slide.imageQuery))
  return Promise.all(photoPromises)
}

/**
 * Stage 3: Gamma creates the presentation
 */
async function createGammaPresentation(
  apiKey: string,
  title: string,
  slides: SlideContent[],
  photos: (string | null)[],
  theme: keyof typeof THEMES
): Promise<{ generationId: string }> {
  // Format content for Gamma with photo URLs embedded
  // Use \n---\n to separate slides
  const inputParts: string[] = []

  // First slide: Title slide
  inputParts.push(`# ${title}`)

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    const photo = photos[i]

    let slideText = `# ${slide.headline}\n\n`
    slideText += slide.bullets.map(b => `- ${b}`).join("\n")

    // Embed photo URL if available
    if (photo) {
      slideText += `\n\n![](${photo})`
    }

    inputParts.push(slideText)
  }

  const inputText = inputParts.join("\n\n---\n\n")

  // Get theme colors for additionalInstructions
  const colors = THEMES[theme]
  const styleInstructions = `Use these exact colors:
- Background: ${colors.bg}
- Headlines: ${colors.headline}
- Body text: ${colors.text}
- Accent/highlights: ${colors.accent}
Use clean, minimal design. Professional spacing. No decorative elements.`

  const response = await fetch("https://public-api.gamma.app/v1.0/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey
    },
    body: JSON.stringify({
      inputText,
      textMode: "preserve", // Keep Claude's exact text
      format: "presentation",
      numCards: slides.length + 1, // +1 for title slide
      cardSplit: "inputTextBreaks", // Respect our \n---\n markers
      additionalInstructions: styleInstructions,
      textOptions: {
        amount: "medium"
      },
      imageOptions: {
        source: "noImages" // We already embedded Pexels photos
      },
      cardOptions: {
        dimensions: "16x9"
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gamma API error: ${response.status} ${error}`)
  }

  return response.json()
}

/**
 * Check Gamma generation status
 */
async function waitForGammaCompletion(
  apiKey: string,
  generationId: string,
  maxWaitMs: number = 120000
): Promise<{ gammaUrl: string; credits: { deducted: number; remaining: number } }> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`https://public-api.gamma.app/v1.0/generate/${generationId}`, {
      headers: { "X-API-KEY": apiKey }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gamma status check failed: ${response.status} ${error}`)
    }

    const data = await response.json()

    if (data.status === "completed") {
      return { gammaUrl: data.gammaUrl, credits: data.credits }
    }

    if (data.status === "failed") {
      throw new Error("Gamma generation failed")
    }

    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  throw new Error("Gamma generation timed out")
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })

  try {
    // Validate access key
    const accessKey = req.headers.get("x-access-key")
    if (!accessKey) {
      return new Response(JSON.stringify({ success: false, error: "Access key required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: keyData, error } = await supabase
      .from("deck_api_keys")
      .select("*")
      .eq("key", accessKey)
      .single()

    if (error || !keyData) {
      return new Response(JSON.stringify({ success: false, error: "Invalid access key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
    if (!keyData.active) {
      return new Response(JSON.stringify({ success: false, error: "Key disabled" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
    if (keyData.decks_used >= keyData.decks_limit) {
      return new Response(JSON.stringify({ success: false, error: `Limit reached (${keyData.decks_used}/${keyData.decks_limit})` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // Parse request
    const { topic, slides = 7, theme = "pure-white", documentContext = "" } = await req.json()
    if (!topic) {
      return new Response(JSON.stringify({ success: false, error: "Topic required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // Get API keys from environment
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
    const pexelsKey = Deno.env.get("PEXELS_API_KEY")
    const gammaKey = Deno.env.get("GAMMA_API_KEY")

    if (!anthropicKey || !pexelsKey || !gammaKey) {
      return new Response(JSON.stringify({ success: false, error: "Server not configured (missing API keys)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    console.log(`[Stage 1] Generating content for: ${topic}`)

    // Stage 1: Claude generates content
    const content = await generateContent(anthropicKey, topic, slides, documentContext)
    console.log(`[Stage 1] Got ${content.slides.length} slides`)

    // Stage 2: Pexels finds photos
    console.log(`[Stage 2] Searching photos...`)
    const photos = await getPhotosForSlides(pexelsKey, content.slides)
    const photosFound = photos.filter(p => p !== null).length
    console.log(`[Stage 2] Found ${photosFound}/${content.slides.length} photos`)

    // Stage 3: Gamma creates presentation
    console.log(`[Stage 3] Creating Gamma presentation...`)
    const validTheme = (theme in THEMES) ? theme as keyof typeof THEMES : "pure-white"
    const { generationId } = await createGammaPresentation(
      gammaKey,
      content.title,
      content.slides,
      photos,
      validTheme
    )
    console.log(`[Stage 3] Generation started: ${generationId}`)

    // Wait for completion
    const { gammaUrl, credits } = await waitForGammaCompletion(gammaKey, generationId)
    console.log(`[Stage 3] Presentation ready: ${gammaUrl}`)

    // Increment usage
    await supabase.rpc("increment_deck_usage", { access_key: accessKey })

    return new Response(JSON.stringify({
      success: true,
      gammaUrl,
      title: content.title,
      slideCount: content.slides.length + 1, // +1 for title slide
      photosUsed: photosFound,
      gammaCredits: credits,
      usage: { decks_used: keyData.decks_used + 1, decks_limit: keyData.decks_limit }
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

  } catch (e: any) {
    console.error("Error:", e)
    return new Response(JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})
