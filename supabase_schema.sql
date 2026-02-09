-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (Users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'professor')) DEFAULT 'professor',
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PLANS
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    weekly_limit INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    plan_id UUID REFERENCES public.plans(id),
    status TEXT CHECK (status IN ('active', 'debt', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLASSES (Turmas)
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    schedule_time TIME NOT NULL,
    days_of_week TEXT[] NOT NULL, -- Ex: ['Mon', 'Wed', 'Fri']
    professor_id UUID REFERENCES public.profiles(id),
    color TEXT DEFAULT 'bg-zinc-800',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENROLLMENTS (Pivot Table)
CREATE TABLE public.enrollments (
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (student_id, class_id)
);

-- ATTENDANCE
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    present BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, class_id, date)
);

-- TRANSACTIONS (Financeiro)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT CHECK (status IN ('paid', 'pending', 'overdue')) DEFAULT 'pending',
    due_date DATE DEFAULT CURRENT_DATE,
    related_user_id UUID, -- Can link to student or profile depending on logic
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES (Básico)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write everything for this ERP context
-- (In a real SaaS we would be stricter, but for this specific request acting as an internal tool):
CREATE POLICY "Public Access" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public Access" ON plans FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public Access" ON students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public Access" ON classes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public Access" ON enrollments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public Access" ON attendance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public Access" ON transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public Access" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Mock Data Injection Script (Optional usage)
INSERT INTO plans (name, price, weekly_limit) VALUES 
('Gold Annual', 120.00, 7),
('Silver Monthly', 80.00, 3),
('Basic', 60.00, 2);

INSERT INTO products (name, price, stock_quantity, image_url) VALUES 
('Whey Protein Gold', 250.00, 15, 'https://placehold.co/200x200?text=Whey'),
('Creatine Monohydrate', 120.00, 8, 'https://placehold.co/200x200?text=Creatine'),
('Pre-Workout', 180.00, 20, 'https://placehold.co/200x200?text=Pre-Work');
