import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-access-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const SYSTEM_PROMPT = `You are Apollo, an AI presentation consultant. Your job is to understand what the user wants to build and gather enough information to create a great presentation.

You need to understand:
1. The TOPIC - What is the presentation about?
2. The AUDIENCE - Who will see this presentation?
3. The GOAL - What should the audience do/feel/know after?

Keep your responses SHORT and conversational (1-2 sentences). Ask ONE question at a time.

When you have enough information (topic, audience, and goal are clear), respond with a JSON block:
\`\`\`json
{
  "ready": true,
  "summary": {
    "topic": "the topic",
    "audience": "the audience",
    "goal": "the goal",
    "slides": 7
  }
}
\`\`\`

Start by greeting the user and asking what they want to create.`

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get access key from header
    const accessKey = req.headers.get("x-access-key")
    if (!accessKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Access key required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Validate access key
    const { data: keyData, error: keyError } = await supabase
      .from("deck_api_keys")
      .select("*")
      .eq("key", accessKey)
      .single()

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid access key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!keyData.active) {
      return new Response(
        JSON.stringify({ success: false, error: "Access key disabled" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Parse request
    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ success: false, error: "Messages required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Get API key
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Call Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content
        }))
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.content[0]?.text || ""

    // Check if response contains ready JSON
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.ready && parsed.summary) {
          // Extract message before JSON block
          const messageBeforeJson = text.split("```json")[0].trim()
          return new Response(
            JSON.stringify({
              success: true,
              message: messageBeforeJson || "Great! I have everything I need. Ready to create your presentation!",
              ready: true,
              summary: parsed.summary
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }
      } catch {
        // JSON parse failed, treat as regular message
      }
    }

    // Regular message response
    return new Response(
      JSON.stringify({
        success: true,
        message: text,
        ready: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (e: any) {
    console.error("Error:", e)
    return new Response(
      JSON.stringify({ success: false, error: e?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
