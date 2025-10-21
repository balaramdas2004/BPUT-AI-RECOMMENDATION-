-- Fix RLS policies for security issues - simplified version

-- Fix profiles table - only users can see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Employers and admins can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users update own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Fix students table - students can only see their own profile
DROP POLICY IF EXISTS "Employers can view all students" ON public.students;
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
DROP POLICY IF EXISTS "Employers can view applicant students only" ON public.students;
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Students view own profile" ON public.students;
DROP POLICY IF EXISTS "Employers view applicants only" ON public.students;
DROP POLICY IF EXISTS "Admins view all students" ON public.students;

CREATE POLICY "Students see own data only"
ON public.students
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins see all student data"
ON public.students
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix leaderboard table - remove open write access
DROP POLICY IF EXISTS "System can manage leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Service role can manage leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "View leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Service manages leaderboard" ON public.leaderboard;

CREATE POLICY "All users view leaderboard"
ON public.leaderboard
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only service role updates leaderboard"
ON public.leaderboard
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);