-- Create mock_interviews table
CREATE TABLE public.mock_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  interview_type text NOT NULL,
  difficulty text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  responses jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_score integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view their own mock interviews"
  ON public.mock_interviews FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can insert their own mock interviews"
  ON public.mock_interviews FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can update their own mock interviews"
  ON public.mock_interviews FOR UPDATE
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all mock interviews"
  ON public.mock_interviews FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_mock_interviews_updated_at
  BEFORE UPDATE ON public.mock_interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();