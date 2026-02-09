-- 1. Create table for Categories (Task: Gestão de Categorias)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies for Categories
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Enable read access for all users') THEN
        CREATE POLICY "Enable read access for all users" ON public.categories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Enable insert access for all users') THEN
        CREATE POLICY "Enable insert access for all users" ON public.categories FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Enable update access for all users') THEN
        CREATE POLICY "Enable update access for all users" ON public.categories FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Enable delete access for all users') THEN
        CREATE POLICY "Enable delete access for all users" ON public.categories FOR DELETE USING (true);
    END IF;
END $$;

-- Insert Default Categories (Only if empty)
INSERT INTO public.categories (name, type) 
SELECT 'Infraestrutura', 'expense' WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Infraestrutura');
INSERT INTO public.categories (name, type) 
SELECT 'Pessoal', 'expense' WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Pessoal');
INSERT INTO public.categories (name, type) 
SELECT 'Marketing', 'expense' WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Marketing');
INSERT INTO public.categories (name, type) 
SELECT 'Equipamentos', 'expense' WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Equipamentos');
INSERT INTO public.categories (name, type) 
SELECT 'Vendas', 'both' WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Vendas');
INSERT INTO public.categories (name, type) 
SELECT 'Mensalidade', 'income' WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Mensalidade');
INSERT INTO public.categories (name, type) 
SELECT 'Outros', 'both' WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Outros');


-- 2. Add due_day column to students table (Task: Contas a Receber)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS due_day INTEGER DEFAULT 10 CHECK (due_day BETWEEN 1 AND 31);


-- 3. Create table for Fixed Expenses (Task: Despesas Recorrentes)
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    owner_id UUID
);

-- Add column to link Real Transactions to Fixed Expenses
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS fixed_expense_id UUID REFERENCES public.fixed_expenses(id);

-- Enable RLS for Fixed Expenses
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

-- Policies for Fixed Expenses
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fixed_expenses' AND policyname = 'Enable read access for all users') THEN
        CREATE POLICY "Enable read access for all users" ON public.fixed_expenses FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fixed_expenses' AND policyname = 'Enable insert access for all users') THEN
        CREATE POLICY "Enable insert access for all users" ON public.fixed_expenses FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fixed_expenses' AND policyname = 'Enable update access for all users') THEN
        CREATE POLICY "Enable update access for all users" ON public.fixed_expenses FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fixed_expenses' AND policyname = 'Enable delete access for all users') THEN
        CREATE POLICY "Enable delete access for all users" ON public.fixed_expenses FOR DELETE USING (true);
    END IF;
END $$;
