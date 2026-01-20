-- Insert storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deck-assets', 'deck-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects 
FOR SELECT USING (bucket_id = 'deck-assets');

-- Allow uploads
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
CREATE POLICY "Allow uploads" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'deck-assets');

-- Allow deletes  
DROP POLICY IF EXISTS "Allow deletes" ON storage.objects;
CREATE POLICY "Allow deletes" ON storage.objects 
FOR DELETE USING (bucket_id = 'deck-assets');
