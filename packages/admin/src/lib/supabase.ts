import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://advpygqokfxmomlumkgl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdnB5Z3Fva2Z4bW9tbHVta2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjY5NzMsImV4cCI6MjA4NDQwMjk3M30.2OK3fN17IkBpFJL8c1BfTfr2WtJ4exlBDikNvGw9zXg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AccessKey {
  id: string
  key: string
  name: string | null
  decks_limit: number
  decks_used: number
  created_at: string
  expires_at: string | null
  active: boolean
}

// Generate a new access key
export function generateAccessKey(): string {
  const chars = 'abcdef0123456789'
  let result = 'sk_'
  for (let i = 0; i < 48; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

// Access Key operations
export async function getAccessKeys(): Promise<AccessKey[]> {
  const { data, error } = await supabase
    .from('deck_api_keys')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createAccessKey(name: string, decksLimit: number): Promise<AccessKey> {
  const key = generateAccessKey()

  const { data, error } = await supabase
    .from('deck_api_keys')
    .insert({ key, name, decks_limit: decksLimit })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function toggleAccessKey(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('deck_api_keys')
    .update({ active })
    .eq('id', id)

  if (error) throw error
}

export async function deleteAccessKey(id: string): Promise<void> {
  const { error } = await supabase
    .from('deck_api_keys')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function validateAccessKey(key: string): Promise<AccessKey | null> {
  const { data, error } = await supabase
    .from('deck_api_keys')
    .select('*')
    .eq('key', key)
    .eq('active', true)
    .single()

  if (error || !data) return null

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null
  }

  // Check usage
  if (data.decks_used >= data.decks_limit) {
    return null
  }

  return data
}

export async function incrementUsage(key: string): Promise<void> {
  const { error } = await supabase.rpc('increment_deck_usage', { access_key: key })

  // Fallback if RPC doesn't exist
  if (error) {
    const { data } = await supabase
      .from('deck_api_keys')
      .select('decks_used')
      .eq('key', key)
      .single()

    if (data) {
      await supabase
        .from('deck_api_keys')
        .update({ decks_used: data.decks_used + 1 })
        .eq('key', key)
    }
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

export async function getAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('deck_assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAssetsForKey(keyId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('deck_assets')
    .select('*')
    .eq('access_key_id', keyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function uploadAsset(
  keyId: string,
  file: File,
  label: string,
  description?: string
): Promise<Asset> {
  // Generate unique filename
  const ext = file.name.split('.').pop() || 'png'
  const uniqueName = `${keyId}/${Date.now()}-${file.name}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('deck-assets')
    .upload(uniqueName, file, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) throw uploadError

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('deck-assets')
    .getPublicUrl(uniqueName)

  // Create database record
  const { data, error } = await supabase
    .from('deck_assets')
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

  if (error) {
    // Cleanup uploaded file
    await supabase.storage.from('deck-assets').remove([uniqueName])
    throw error
  }

  return data
}

export async function updateAsset(id: string, updates: { label?: string; description?: string }): Promise<void> {
  const { error } = await supabase
    .from('deck_assets')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function deleteAsset(id: string): Promise<void> {
  // Get asset to find storage path
  const { data: asset } = await supabase
    .from('deck_assets')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (asset) {
    // Delete from storage
    await supabase.storage.from('deck-assets').remove([asset.storage_path])
  }

  // Delete from database
  const { error } = await supabase
    .from('deck_assets')
    .delete()
    .eq('id', id)

  if (error) throw error
}
