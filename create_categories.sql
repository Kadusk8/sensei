-- Create table for Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.categories FOR DELETE USING (true);

-- Insert Default Categories
INSERT INTO public.categories (name, type) VALUES
('Infraestrutura', 'expense'),
('Pessoal', 'expense'),
('Marketing', 'expense'),
('Equipamentos', 'expense'),
('Vendas', 'both'),
('Mensalidade', 'income'),
('Outros', 'both');
