-- ============================================================
-- SENSEI / IRONGYM SYSTEM — DATABASE SETUP COMPLETO
-- Execute este arquivo inteiro no SQL Editor do Supabase
-- ============================================================

-- ─────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- 1. PROFILES  (vinculado ao auth.users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('admin', 'professor', 'secretary')) DEFAULT 'secretary',
    full_name   TEXT NOT NULL,
    avatar_url  TEXT,
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    modality    TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.profiles;
CREATE POLICY "Public Access" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 2. PLANS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    price        DECIMAL(10,2) NOT NULL,
    weekly_limit INTEGER NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.plans;
CREATE POLICY "Public Access" ON public.plans FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 3. PROFESSORS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.professors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name   TEXT NOT NULL,
    modality    TEXT,
    hourly_rate DECIMAL(10,2),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.professors;
CREATE POLICY "Public Access" ON public.professors FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 4. CLASSES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.classes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL,
    schedule_time  TEXT NOT NULL,
    professor_id   UUID REFERENCES public.professors(id) ON DELETE SET NULL,
    days_of_week   TEXT[],
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.classes;
CREATE POLICY "Public Access" ON public.classes FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 5. STUDENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.students (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name    TEXT NOT NULL,
    cpf          TEXT,
    phone        TEXT,
    email        TEXT,
    avatar_url   TEXT,
    plan_id      UUID REFERENCES public.plans(id) ON DELETE SET NULL,
    status       TEXT NOT NULL CHECK (status IN ('active', 'debt', 'inactive')) DEFAULT 'active',
    modality     TEXT,
    belt         TEXT DEFAULT 'Branca',
    degrees      INTEGER DEFAULT 0 CHECK (degrees BETWEEN 0 AND 5),
    due_day      INTEGER DEFAULT 10 CHECK (due_day BETWEEN 1 AND 31),
    professor_id UUID REFERENCES public.professors(id) ON DELETE SET NULL,
    class_id     UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.students;
CREATE POLICY "Public Access" ON public.students FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 6. CATEGORIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    type       TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.categories;
CREATE POLICY "Public Access" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 7. FIXED EXPENSES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    category    TEXT NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    due_day     INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.fixed_expenses;
CREATE POLICY "Public Access" ON public.fixed_expenses FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 8. TRANSACTIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category        TEXT NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'overdue')) DEFAULT 'pending',
    due_date        TIMESTAMP WITH TIME ZONE,
    related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.transactions;
CREATE POLICY "Public Access" ON public.transactions FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 9. PRODUCTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL,
    price          DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER,
    image_url      TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.products;
CREATE POLICY "Public Access" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 10. ATTENDANCE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id   UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    date       DATE NOT NULL,
    present    BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.attendance;
CREATE POLICY "Public Access" ON public.attendance FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 11. CLASS SESSIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id          UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    date              DATE NOT NULL,
    professor_id      UUID REFERENCES public.professors(id) ON DELETE SET NULL,
    professor_present BOOLEAN DEFAULT false,
    status            TEXT NOT NULL CHECK (status IN ('scheduled', 'investigating', 'completed', 'canceled')) DEFAULT 'scheduled',
    notes             TEXT,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (class_id, date)
);

ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.class_sessions;
CREATE POLICY "Public Access" ON public.class_sessions FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 12. STUDENT GRADUATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_graduations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id     UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    belt           TEXT NOT NULL,
    degrees        INTEGER NOT NULL DEFAULT 0,
    promotion_date DATE NOT NULL,
    professor_id   UUID REFERENCES public.professors(id) ON DELETE SET NULL,
    notes          TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.student_graduations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.student_graduations;
CREATE POLICY "Public Access" ON public.student_graduations FOR ALL USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 13. GYM INFO
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gym_info (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL DEFAULT 'Minha Academia',
    phone      TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.gym_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.gym_info;
CREATE POLICY "Public Access" ON public.gym_info FOR ALL USING (auth.role() = 'authenticated');

-- Garante que sempre haverá exatamente 1 linha em gym_info
INSERT INTO public.gym_info (name) VALUES ('Minha Academia')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────
-- 14. TRIGGER — criar profile ao registrar usuário
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Novo Usuário'),
    COALESCE(new.raw_user_meta_data->>'role', 'secretary'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────────
-- 15. STORAGE — bucket de fotos de alunos
-- ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read student-photos" ON storage.objects;
CREATE POLICY "Public read student-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos');

DROP POLICY IF EXISTS "Auth upload student-photos" ON storage.objects;
CREATE POLICY "Auth upload student-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth update student-photos" ON storage.objects;
CREATE POLICY "Auth update student-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth delete student-photos" ON storage.objects;
CREATE POLICY "Auth delete student-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 16. SEED — Categorias padrão
-- ─────────────────────────────────────────
INSERT INTO public.categories (name, type) VALUES
  ('Mensalidade',    'income'),
  ('PDV',            'income'),
  ('Outros',         'both'),
  ('Infraestrutura', 'expense'),
  ('Pessoal',        'expense'),
  ('Marketing',      'expense'),
  ('Equipamentos',   'expense')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────
-- FIM DO SETUP
-- ─────────────────────────────────────────
