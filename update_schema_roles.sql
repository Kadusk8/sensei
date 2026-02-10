-- Drop the old constraint that only allowed 'admin' and 'professor'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint including 'secretary'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'professor', 'secretary'));

-- Verify the change (Optional, just to be sure)
-- SELECT constraint_name, check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'profiles_role_check';
