-- Create job_postings table
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('internship', 'full-time', 'part-time', 'contract')),
  location TEXT,
  location_type TEXT CHECK (location_type IN ('on-site', 'remote', 'hybrid')),
  department TEXT,
  experience_required TEXT,
  salary_range TEXT,
  skills_required TEXT[],
  qualifications TEXT[],
  responsibilities TEXT[],
  benefits TEXT[],
  application_deadline DATE,
  positions_available INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'filled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create job_requirements table
CREATE TABLE public.job_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('branch', 'cgpa', 'skill', 'certification', 'other')),
  requirement_value TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'rejected', 'accepted', 'withdrawn')),
  cover_letter TEXT,
  resume_url TEXT,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_reasoning TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_posting_id, student_id)
);

-- Create application_status_history table
CREATE TABLE public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create interviews table
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  interview_type TEXT CHECK (interview_type IN ('phone', 'video', 'in-person', 'technical', 'hr')),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  location TEXT,
  meeting_link TEXT,
  interviewer_name TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create shortlists table (AI-generated candidate rankings)
CREATE TABLE public.shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  rank INTEGER,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reasoning TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_posting_id, student_id)
);

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_postings
CREATE POLICY "Active jobs are viewable by everyone"
  ON public.job_postings FOR SELECT
  USING (status = 'active' OR auth.uid() IN (SELECT user_id FROM public.employers WHERE id = employer_id));

CREATE POLICY "Employers can manage their own job postings"
  ON public.job_postings FOR ALL
  USING (employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all job postings"
  ON public.job_postings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for job_requirements
CREATE POLICY "Requirements visible with job postings"
  ON public.job_requirements FOR SELECT
  USING (
    job_posting_id IN (
      SELECT id FROM public.job_postings 
      WHERE status = 'active' OR employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Employers can manage their job requirements"
  ON public.job_requirements FOR ALL
  USING (
    job_posting_id IN (
      SELECT id FROM public.job_postings 
      WHERE employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())
    )
  );

-- RLS Policies for applications
CREATE POLICY "Students can view their own applications"
  ON public.applications FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can create applications"
  ON public.applications FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can update their own applications"
  ON public.applications FOR UPDATE
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Employers can view applications for their jobs"
  ON public.applications FOR SELECT
  USING (
    job_posting_id IN (
      SELECT id FROM public.job_postings 
      WHERE employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Employers can update application status"
  ON public.applications FOR UPDATE
  USING (
    job_posting_id IN (
      SELECT id FROM public.job_postings 
      WHERE employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for application_status_history
CREATE POLICY "Students can view history of their applications"
  ON public.application_status_history FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM public.applications 
      WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Employers can view history for their jobs"
  ON public.application_status_history FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM public.applications a
      JOIN public.job_postings jp ON a.job_posting_id = jp.id
      WHERE jp.employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can insert status history"
  ON public.application_status_history FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policies for interviews
CREATE POLICY "Students can view their own interviews"
  ON public.interviews FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM public.applications 
      WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Employers can manage interviews for their jobs"
  ON public.interviews FOR ALL
  USING (
    application_id IN (
      SELECT a.id FROM public.applications a
      JOIN public.job_postings jp ON a.job_posting_id = jp.id
      WHERE jp.employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())
    )
  );

-- RLS Policies for shortlists
CREATE POLICY "Employers can view shortlists for their jobs"
  ON public.shortlists FOR SELECT
  USING (
    job_posting_id IN (
      SELECT id FROM public.job_postings 
      WHERE employer_id IN (SELECT id FROM public.employers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can manage shortlists"
  ON public.shortlists FOR ALL
  WITH CHECK (TRUE);

-- Create function to track application status changes
CREATE OR REPLACE FUNCTION public.track_application_status_change()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.application_status_history (application_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for application status tracking
CREATE TRIGGER track_application_status
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.track_application_status_change();

-- Create triggers for updated_at
CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_job_postings_employer_id ON public.job_postings(employer_id);
CREATE INDEX idx_job_postings_status ON public.job_postings(status);
CREATE INDEX idx_job_requirements_job_id ON public.job_requirements(job_posting_id);
CREATE INDEX idx_applications_job_id ON public.applications(job_posting_id);
CREATE INDEX idx_applications_student_id ON public.applications(student_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX idx_shortlists_job_id ON public.shortlists(job_posting_id);
CREATE INDEX idx_shortlists_student_id ON public.shortlists(student_id);