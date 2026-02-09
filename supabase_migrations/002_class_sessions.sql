-- Create table for tracking specific class sessions (occurrences)
create table class_sessions (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references classes(id) on delete cascade not null,
  date date not null,
  professor_id uuid references professors(id), -- Null means default professor came. Value means override.
  status text check (status in ('scheduled', 'investigating', 'completed', 'canceled')) default 'scheduled',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(class_id, date) -- One record per class per day
);

-- Enable RLS
alter table class_sessions enable row level security;

-- Policies
create policy "Public Access" on class_sessions for all using (auth.role() = 'authenticated');
