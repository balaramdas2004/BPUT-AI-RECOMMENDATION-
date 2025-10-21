-- Fix critical RLS policy for user_roles table
-- Allow users to insert their own role during signup
CREATE POLICY "Users can create their own role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update profiles RLS for cross-role visibility
-- Allow employers and admins to view student profiles
DROP POLICY IF EXISTS "Employers and admins can view profiles" ON public.profiles;
CREATE POLICY "Employers and admins can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    has_role(auth.uid(), 'employer'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );