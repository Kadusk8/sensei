-- Add due_day column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS due_day INTEGER DEFAULT 10 CHECK (due_day BETWEEN 1 AND 31);
