import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"
import os from "os"

const supabaseUrl = "https://advpygqokfxmomlumkgl.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdnB5Z3Fva2Z4bW9tbHVta2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjY5NzMsImV4cCI6MjA4NDQwMjk3M30.2OK3fN17IkBpFJL8c1BfTfr2WtJ4exlBDikNvGw9zXg"

const supabase = createClient(supabaseUrl, supabaseKey)

// Generate unique machine ID based on hostname + username + platform
export function getMachineId(): string {
  const data = `${os.hostname()}-${os.userInfo().username}-${os.platform()}-${os.arch()}`
  return createHash("sha256").update(data).digest("hex").slice(0, 16)
}

export interface AccessKeyData {
  id: string
  key: string
  name: string | null
  decks_limit: number
  decks_used: number
  expires_at: string | null
  active: boolean
  machine_id: string | null
}

export async function validateAccessKey(key: string): Promise<{ valid: boolean; data?: AccessKeyData; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("deck_api_keys")
      .select("*")
      .eq("key", key)
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

    // Check machine binding
    const currentMachineId = getMachineId()

    if (data.machine_id) {
      // Key is already bound to a machine
      if (data.machine_id !== currentMachineId) {
        return { valid: false, error: "Access key is bound to another computer" }
      }
    } else {
      // First use - bind to this machine
      await supabase
        .from("deck_api_keys")
        .update({ machine_id: currentMachineId })
        .eq("key", key)
    }

    return { valid: true, data }
  } catch (e) {
    return { valid: false, error: "Failed to validate access key" }
  }
}

export async function incrementUsage(key: string): Promise<void> {
  try {
    // Try atomic RPC first (best approach - no race condition)
    const { error } = await supabase.rpc("increment_deck_usage", { access_key: key })

    if (error) {
      // RPC doesn't exist - fall back to read-then-write
      // Note: This has a race condition if two requests happen simultaneously
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
    }
  } catch (e) {
    console.error("Failed to increment usage:", e)
  }
}

// ============================================
// Asset Management
// ============================================

export interface Asset {
  id: string
  access_key_id: string
  storage_path: string
  public_url: string
  label: string
  description: string | null
  tags: string[]
  created_at: string
}

async function getAccessKeyId(key: string): Promise<string | null> {
  const { data } = await supabase
    .from("deck_api_keys")
    .select("id")
    .eq("key", key)
    .single()
  return data?.id || null
}

export async function uploadAsset(
  accessKey: string,
  fileBuffer: Buffer,
  fileName: string,
  label: string,
  description?: string
): Promise<{ success: boolean; asset?: Asset; error?: string }> {
  try {
    const keyId = await getAccessKeyId(accessKey)
    if (!keyId) {
      return { success: false, error: "Invalid access key" }
    }

    // Generate unique filename
    const ext = fileName.split(".").pop() || "png"
    const uniqueName = `${keyId}/${Date.now()}-${fileName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("deck-assets")
      .upload(uniqueName, fileBuffer, {
        contentType: `image/${ext}`,
        upsert: false
      })

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("deck-assets")
      .getPublicUrl(uniqueName)

    // Create database record
    const { data: asset, error: dbError } = await supabase
      .from("deck_assets")
      .insert({
        access_key_id: keyId,
        storage_path: uniqueName,
        public_url: urlData.publicUrl,
        label,
        description: description || null,
        tags: []
      })
      .select()
      .single()

    if (dbError) {
      // Cleanup uploaded file if db insert fails
      await supabase.storage.from("deck-assets").remove([uniqueName])
      return { success: false, error: `Database error: ${dbError.message}` }
    }

    return { success: true, asset }
  } catch (e) {
    return { success: false, error: `Failed to upload: ${e}` }
  }
}

export async function getAssetsForKey(accessKey: string): Promise<Asset[]> {
  try {
    const keyId = await getAccessKeyId(accessKey)
    if (!keyId) return []

    const { data, error } = await supabase
      .from("deck_assets")
      .select("*")
      .eq("access_key_id", keyId)
      .order("created_at", { ascending: false })

    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function deleteAsset(accessKey: string, assetId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const keyId = await getAccessKeyId(accessKey)
    if (!keyId) {
      return { success: false, error: "Invalid access key" }
    }

    // Get asset to find storage path
    const { data: asset } = await supabase
      .from("deck_assets")
      .select("*")
      .eq("id", assetId)
      .eq("access_key_id", keyId)
      .single()

    if (!asset) {
      return { success: false, error: "Asset not found" }
    }

    // Delete from storage
    await supabase.storage.from("deck-assets").remove([asset.storage_path])

    // Delete from database
    await supabase
      .from("deck_assets")
      .delete()
      .eq("id", assetId)

    return { success: true }
  } catch (e) {
    return { success: false, error: `Failed to delete: ${e}` }
  }
}
