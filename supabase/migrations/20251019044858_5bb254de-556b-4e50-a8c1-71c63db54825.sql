-- Add interview feedback table for recruiter feedback loop
CREATE TABLE IF NOT EXISTS public.interview_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
  employer_id UUID REFERENCES public.employers(id) NOT NULL,
  communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 5),
  technical_score INTEGER CHECK (technical_score >= 1 AND technical_score <= 5),
  problem_solving_score INTEGER CHECK (problem_solving_score >= 1 AND problem_solving_score <= 5),
  cultural_fit_score INTEGER CHECK (cultural_fit_score >= 1 AND cultural_fit_score <= 5),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  strengths TEXT,
  areas_for_improvement TEXT,
  feedback_text TEXT,
  would_hire BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add scheduled reports table for admin reports
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) NOT NULL,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  filters JSONB DEFAULT '{}'::jsonb,
  recipients TEXT[] NOT NULL,
  last_generated TIMESTAMPTZ,
  next_generation TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add bulk data imports table for BPUT integration
CREATE TABLE IF NOT EXISTS public.bulk_data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) NOT NULL,
  import_type TEXT NOT NULL CHECK (import_type IN ('students', 'placements', 'companies', 'skills')),
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_data_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interview_feedback
CREATE POLICY "Employers can create feedback for their interviews"
ON public.interview_feedback FOR INSERT
WITH CHECK (
  employer_id IN (
    SELECT id FROM public.employers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employers can view their own feedback"
ON public.interview_feedback FOR SELECT
USING (
  employer_id IN (
    SELECT id FROM public.employers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can view feedback for their interviews"
ON public.interview_feedback FOR SELECT
USING (
  interview_id IN (
    SELECT i.id FROM public.interviews i
    JOIN public.applications a ON i.application_id = a.id
    JOIN public.students s ON a.student_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all feedback"
ON public.interview_feedback FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for scheduled_reports
CREATE POLICY "Admins can manage their own scheduled reports"
ON public.scheduled_reports FOR ALL
USING (
  admin_id IN (
    SELECT id FROM public.admins WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all scheduled reports"
ON public.scheduled_reports FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for bulk_data_imports
CREATE POLICY "Admins can manage bulk imports"
ON public.bulk_data_imports FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_interview_feedback_updated_at
  BEFORE UPDATE ON public.interview_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_interview_feedback_interview_id ON public.interview_feedback(interview_id);
CREATE INDEX idx_interview_feedback_employer_id ON public.interview_feedback(employer_id);
CREATE INDEX idx_scheduled_reports_admin_id ON public.scheduled_reports(admin_id);
CREATE INDEX idx_scheduled_reports_next_generation ON public.scheduled_reports(next_generation) WHERE is_active = true;
CREATE INDEX idx_bulk_data_imports_status ON public.bulk_data_imports(status);
CREATE INDEX idx_bulk_data_imports_admin_id ON public.bulk_data_imports(admin_id);