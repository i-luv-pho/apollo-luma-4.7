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
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

// Access Key operations
export async function getAccessKeys(): Promise<AccessKey[]> {
  const { data, error } = await supabase
    .from('deck_access_keys')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createAccessKey(name: string, decksLimit: number): Promise<AccessKey> {
  const key = generateAccessKey()

  const { data, error } = await supabase
    .from('deck_access_keys')
    .insert({ key, name, decks_limit: decksLimit })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function toggleAccessKey(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('deck_access_keys')
    .update({ active })
    .eq('id', id)

  if (error) throw error
}

export async function deleteAccessKey(id: string): Promise<void> {
  const { error } = await supabase
    .from('deck_access_keys')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function validateAccessKey(key: string): Promise<AccessKey | null> {
  const { data, error } = await supabase
    .from('deck_access_keys')
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
    await supabase
      .from('deck_access_keys')
      .update({ decks_used: supabase.rpc('', {}) })
      .eq('key', key)
  }
}
