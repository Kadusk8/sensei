-- Create a new storage bucket for student photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read access to student photos
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'student-photos' );

-- Policy to allow authenticated users to upload photos
CREATE POLICY "Auth Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'student-photos' AND auth.role() = 'authenticated' );

-- Policy to allow authenticated users to update their own photos or admin updates
-- For simplicity in this system given the RLS context, we allow auth users to update
CREATE POLICY "Auth Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'student-photos' AND auth.role() = 'authenticated' );

-- Policy to allow delete
CREATE POLICY "Auth Delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'student-photos' AND auth.role() = 'authenticated' );
