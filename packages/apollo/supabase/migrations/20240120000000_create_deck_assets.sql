CREATE TABLE IF NOT EXISTS deck_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_key_id UUID REFERENCES deck_api_keys(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deck_assets_key ON deck_assets(access_key_id);
