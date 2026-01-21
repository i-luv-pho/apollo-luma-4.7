import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-access-key, content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

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

    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "Access key expired" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Return success with usage info
    return new Response(
      JSON.stringify({
        success: true,
        name: keyData.name,
        usage: {
          decks_used: keyData.decks_used,
          decks_limit: keyData.decks_limit
        }
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
