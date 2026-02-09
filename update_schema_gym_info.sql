-- Create table for Gym Info (expecting single row)
CREATE TABLE IF NOT EXISTS public.gym_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Sua Academia',
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.gym_info ENABLE ROW LEVEL SECURITY;

-- Policies (Open for now as it's a single tenant app for all intents)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gym_info' AND policyname = 'Enable access for all users') THEN
        CREATE POLICY "Enable access for all users" ON public.gym_info FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Insert default row if not exists
INSERT INTO public.gym_info (name)
SELECT 'Minha Academia'
WHERE NOT EXISTS (SELECT 1 FROM public.gym_info);
