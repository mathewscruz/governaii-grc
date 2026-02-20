
-- Add secao column to questions for grouping
ALTER TABLE public.due_diligence_questions ADD COLUMN IF NOT EXISTS secao text DEFAULT 'Geral';

-- Create storage bucket for due diligence evidence files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('due-diligence-evidencias', 'due-diligence-evidencias', false)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload files to due-diligence-evidencias (assessment respondents are anonymous)
CREATE POLICY "Anyone can upload due diligence evidence"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'due-diligence-evidencias');

-- Allow anyone to read due diligence evidence files  
CREATE POLICY "Anyone can read due diligence evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'due-diligence-evidencias');

-- Allow authenticated users to delete evidence files
CREATE POLICY "Authenticated users can delete due diligence evidence"
ON storage.objects FOR DELETE
USING (bucket_id = 'due-diligence-evidencias' AND auth.role() = 'authenticated');
