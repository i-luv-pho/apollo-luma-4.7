import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://advpygqokfxmomlumkgl.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdnB5Z3Fva2Z4bW9tbHVta2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjY5NzMsImV4cCI6MjA4NDQwMjk3M30.2OK3fN17IkBpFJL8c1BfTfr2WtJ4exlBDikNvGw9zXg"

const supabase = createClient(supabaseUrl, supabaseKey)

export interface ApiKeyData {
  id: string
  key: string
  name: string | null
  decks_limit: number
  decks_used: number
  expires_at: string | null
  active: boolean
}

export async function validateApiKey(key: string): Promise<{ valid: boolean; data?: ApiKeyData; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("deck_api_keys")
      .select("*")
      .eq("key", key)
      .single()

    if (error || !data) {
      return { valid: false, error: "Invalid API key" }
    }

    if (!data.active) {
      return { valid: false, error: "API key is disabled" }
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: "API key has expired" }
    }

    if (data.decks_used >= data.decks_limit) {
      return { valid: false, error: `Deck limit reached (${data.decks_used}/${data.decks_limit})` }
    }

    return { valid: true, data }
  } catch (e) {
    return { valid: false, error: "Failed to validate API key" }
  }
}

export async function incrementUsage(key: string): Promise<void> {
  try {
    // Get current usage
    const { data } = await supabase
      .from("deck_api_keys")
      .select("decks_used")
      .eq("key", key)
      .single()

    if (data) {
      await supabase
        .from("deck_api_keys")
        .update({ decks_used: data.decks_used + 1 })
        .eq("key", key)
    }
  } catch (e) {
    console.error("Failed to increment usage:", e)
  }
}
