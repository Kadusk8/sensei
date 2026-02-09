-- Add professor_id and class_id to students table

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES public.professors(id),
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id);
