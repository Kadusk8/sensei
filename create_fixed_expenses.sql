-- Create table for Fixed Expenses (Templates)
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    owner_id UUID -- Optional, references auth.users if needed later
);

-- Add column to link Real Transactions to Fixed Expenses
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS fixed_expense_id UUID REFERENCES public.fixed_expenses(id);

-- Policy (Open for now based on previous patterns, user manages all)
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.fixed_expenses FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.fixed_expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.fixed_expenses FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.fixed_expenses FOR DELETE USING (true);
