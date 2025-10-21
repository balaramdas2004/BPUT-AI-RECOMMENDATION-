-- Create security definer functions to break RLS recursion
CREATE OR REPLACE FUNCTION public.get_student_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_employer_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employers WHERE user_id = _user_id LIMIT 1
$$;

-- Drop existing problematic policies on students table
DROP POLICY IF EXISTS "Students can manage their own academic records" ON public.academic_records;
DROP POLICY IF EXISTS "Students can view their own academic records" ON public.academic_records;
DROP POLICY IF EXISTS "Students can manage their own activities" ON public.extracurricular_activities;
DROP POLICY IF EXISTS "Students can view their own activities" ON public.extracurricular_activities;
DROP POLICY IF EXISTS "Students can manage their own certifications" ON public.certifications;
DROP POLICY IF EXISTS "Students can view their own certifications" ON public.certifications;
DROP POLICY IF EXISTS "Students can manage their own projects" ON public.projects;
DROP POLICY IF EXISTS "Students can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Students can create applications" ON public.applications;
DROP POLICY IF EXISTS "Students can update their own applications" ON public.applications;
DROP POLICY IF EXISTS "Students can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Students can view their own interviews" ON public.interviews;
DROP POLICY IF EXISTS "Students can insert their own analyses" ON public.ai_interview_analyses;
DROP POLICY IF EXISTS "Students can view their own analyses" ON public.ai_interview_analyses;
DROP POLICY IF EXISTS "Students can insert their own scores" ON public.career_readiness_scores;
DROP POLICY IF EXISTS "Students can view their own scores" ON public.career_readiness_scores;
DROP POLICY IF EXISTS "Students can insert their own recommendations" ON public.career_recommendations;
DROP POLICY IF EXISTS "Students can view their own recommendations" ON public.career_recommendations;
DROP POLICY IF EXISTS "Students can manage their own learning paths" ON public.learning_paths;
DROP POLICY IF EXISTS "Students can view their own learning paths" ON public.learning_paths;
DROP POLICY IF EXISTS "Students can insert their own mock interviews" ON public.mock_interviews;
DROP POLICY IF EXISTS "Students can update their own mock interviews" ON public.mock_interviews;
DROP POLICY IF EXISTS "Students can view their own mock interviews" ON public.mock_interviews;
DROP POLICY IF EXISTS "Students can view history of their applications" ON public.application_status_history;

-- Drop existing problematic policies on employers table
DROP POLICY IF EXISTS "Employers can update application status" ON public.applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.applications;
DROP POLICY IF EXISTS "Employers can manage interviews for their jobs" ON public.interviews;
DROP POLICY IF EXISTS "Employers can view history for their jobs" ON public.application_status_history;
DROP POLICY IF EXISTS "Employers can create feedback for their interviews" ON public.interview_feedback;
DROP POLICY IF EXISTS "Employers can view their own feedback" ON public.interview_feedback;
DROP POLICY IF EXISTS "Employers can manage their job requirements" ON public.job_requirements;
DROP POLICY IF EXISTS "Employers can view shortlists for their jobs" ON public.shortlists;

-- Recreate student policies using security definer function
CREATE POLICY "Students can manage their own academic records"
ON public.academic_records
FOR ALL
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can manage their own activities"
ON public.extracurricular_activities
FOR ALL
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can manage their own certifications"
ON public.certifications
FOR ALL
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can manage their own projects"
ON public.projects
FOR ALL
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can create applications"
ON public.applications
FOR INSERT
WITH CHECK (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can update their own applications"
ON public.applications
FOR UPDATE
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can view their own applications"
ON public.applications
FOR SELECT
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can view their own interviews"
ON public.interviews
FOR SELECT
USING (application_id IN (
  SELECT id FROM public.applications WHERE student_id = public.get_student_id(auth.uid())
));

CREATE POLICY "Students can insert their own analyses"
ON public.ai_interview_analyses
FOR INSERT
WITH CHECK (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can view their own analyses"
ON public.ai_interview_analyses
FOR SELECT
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can insert their own scores"
ON public.career_readiness_scores
FOR INSERT
WITH CHECK (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can view their own scores"
ON public.career_readiness_scores
FOR SELECT
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can insert their own recommendations"
ON public.career_recommendations
FOR INSERT
WITH CHECK (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can view their own recommendations"
ON public.career_recommendations
FOR SELECT
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can manage their own learning paths"
ON public.learning_paths
FOR ALL
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can insert their own mock interviews"
ON public.mock_interviews
FOR INSERT
WITH CHECK (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can update their own mock interviews"
ON public.mock_interviews
FOR UPDATE
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can view their own mock interviews"
ON public.mock_interviews
FOR SELECT
USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Students can view history of their applications"
ON public.application_status_history
FOR SELECT
USING (application_id IN (
  SELECT id FROM public.applications WHERE student_id = public.get_student_id(auth.uid())
));

-- Recreate employer policies using security definer function
CREATE POLICY "Employers can update application status"
ON public.applications
FOR UPDATE
USING (job_posting_id IN (
  SELECT id FROM public.job_postings WHERE employer_id = public.get_employer_id(auth.uid())
));

CREATE POLICY "Employers can view applications for their jobs"
ON public.applications
FOR SELECT
USING (job_posting_id IN (
  SELECT id FROM public.job_postings WHERE employer_id = public.get_employer_id(auth.uid())
));

CREATE POLICY "Employers can manage interviews for their jobs"
ON public.interviews
FOR ALL
USING (application_id IN (
  SELECT a.id FROM public.applications a
  JOIN public.job_postings jp ON a.job_posting_id = jp.id
  WHERE jp.employer_id = public.get_employer_id(auth.uid())
));

CREATE POLICY "Employers can view history for their jobs"
ON public.application_status_history
FOR SELECT
USING (application_id IN (
  SELECT a.id FROM public.applications a
  JOIN public.job_postings jp ON a.job_posting_id = jp.id
  WHERE jp.employer_id = public.get_employer_id(auth.uid())
));

CREATE POLICY "Employers can create feedback for their interviews"
ON public.interview_feedback
FOR INSERT
WITH CHECK (employer_id = public.get_employer_id(auth.uid()));

CREATE POLICY "Employers can view their own feedback"
ON public.interview_feedback
FOR SELECT
USING (employer_id = public.get_employer_id(auth.uid()));

CREATE POLICY "Employers can manage their job requirements"
ON public.job_requirements
FOR ALL
USING (job_posting_id IN (
  SELECT id FROM public.job_postings WHERE employer_id = public.get_employer_id(auth.uid())
));

CREATE POLICY "Employers can view shortlists for their jobs"
ON public.shortlists
FOR SELECT
USING (job_posting_id IN (
  SELECT id FROM public.job_postings WHERE employer_id = public.get_employer_id(auth.uid())
));

-- Fix user_roles policies to allow signup
DROP POLICY IF EXISTS "Users can create their own role" ON public.user_roles;

CREATE POLICY "Users can create their own role"
ON public.user_roles
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_employers_user_id ON public.employers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);