-- Add image_url column to meals table
ALTER TABLE meals
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload meal images
CREATE POLICY "Vendors can upload meal images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meal-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own images
CREATE POLICY "Vendors can update their meal images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'meal-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own images
CREATE POLICY "Vendors can delete their meal images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'meal-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to meal images
CREATE POLICY "Public can view meal images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'meal-images');
