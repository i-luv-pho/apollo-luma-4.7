-- Atomic increment function for deck usage (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_deck_usage(access_key TEXT)
RETURNS void AS $$
BEGIN
  UPDATE deck_api_keys
  SET decks_used = decks_used + 1
  WHERE key = access_key;
END;
$$ LANGUAGE plpgsql;
