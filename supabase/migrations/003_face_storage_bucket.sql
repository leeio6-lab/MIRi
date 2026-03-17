-- Create face-images storage bucket for transformed portrait images
-- Replaces storing 1MB+ base64 in analyses.input_data JSONB column

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'face-images',
  'face-images',
  false,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can upload to their own folder (user_id/*)
CREATE POLICY "Users upload own face images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'face-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: users can read their own face images
CREATE POLICY "Users read own face images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'face-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: users can delete their own face images
CREATE POLICY "Users delete own face images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'face-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
