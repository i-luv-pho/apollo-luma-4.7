-- User accounts table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  activated BOOLEAN DEFAULT FALSE,
  decks_used INTEGER DEFAULT 0,
  decks_limit INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_activated ON user_accounts(activated);

-- Trigger to auto-create account row when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_accounts (id, email, activated)
  VALUES (NEW.id, NEW.email, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS policies
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Users can read their own account
CREATE POLICY "Users can read own account" ON user_accounts
  FOR SELECT USING (auth.uid() = id);

-- Service role can do everything (for admin dashboard)
CREATE POLICY "Service role full access" ON user_accounts
  FOR ALL USING (auth.role() = 'service_role');

-- Atomic increment function for deck usage
CREATE OR REPLACE FUNCTION increment_user_deck_usage(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_accounts
  SET decks_used = decks_used + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
