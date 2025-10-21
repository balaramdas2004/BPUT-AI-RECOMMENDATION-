-- Create skills master table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('technical', 'soft', 'domain')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create student_skills mapping table
CREATE TABLE public.student_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, skill_id)
);

-- Create academic_records table
CREATE TABLE public.academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  sgpa DECIMAL(4,2) CHECK (sgpa >= 0 AND sgpa <= 10),
  subjects JSONB,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, semester)
);

-- Create certifications table
CREATE TABLE public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  technologies TEXT[],
  project_url TEXT,
  github_url TEXT,
  start_date DATE,
  end_date DATE,
  is_ongoing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create extracurricular_activities table
CREATE TABLE public.extracurricular_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('sports', 'cultural', 'technical', 'social', 'other')),
  description TEXT,
  role TEXT,
  achievement TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create career_readiness_scores table
CREATE TABLE public.career_readiness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  academic_score INTEGER CHECK (academic_score >= 0 AND academic_score <= 100),
  skills_score INTEGER CHECK (skills_score >= 0 AND skills_score <= 100),
  experience_score INTEGER CHECK (experience_score >= 0 AND experience_score <= 100),
  soft_skills_score INTEGER CHECK (soft_skills_score >= 0 AND soft_skills_score <= 100),
  analysis JSONB,
  recommendations TEXT[],
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracurricular_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_readiness_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skills (public read)
CREATE POLICY "Skills are viewable by everyone"
  ON public.skills FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage skills"
  ON public.skills FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_skills
CREATE POLICY "Students can view their own skills"
  ON public.student_skills FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can manage their own skills"
  ON public.student_skills FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Employers can view student skills"
  ON public.student_skills FOR SELECT
  USING (public.has_role(auth.uid(), 'employer'));

CREATE POLICY "Admins can view all student skills"
  ON public.student_skills FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for academic_records
CREATE POLICY "Students can view their own academic records"
  ON public.academic_records FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can manage their own academic records"
  ON public.academic_records FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all academic records"
  ON public.academic_records FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for certifications
CREATE POLICY "Students can view their own certifications"
  ON public.certifications FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can manage their own certifications"
  ON public.certifications FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Employers can view student certifications"
  ON public.certifications FOR SELECT
  USING (public.has_role(auth.uid(), 'employer'));

CREATE POLICY "Admins can view all certifications"
  ON public.certifications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for projects
CREATE POLICY "Students can view their own projects"
  ON public.projects FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can manage their own projects"
  ON public.projects FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Employers can view student projects"
  ON public.projects FOR SELECT
  USING (public.has_role(auth.uid(), 'employer'));

CREATE POLICY "Admins can view all projects"
  ON public.projects FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for extracurricular_activities
CREATE POLICY "Students can view their own activities"
  ON public.extracurricular_activities FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can manage their own activities"
  ON public.extracurricular_activities FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Employers can view student activities"
  ON public.extracurricular_activities FOR SELECT
  USING (public.has_role(auth.uid(), 'employer'));

CREATE POLICY "Admins can view all activities"
  ON public.extracurricular_activities FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for career_readiness_scores
CREATE POLICY "Students can view their own scores"
  ON public.career_readiness_scores FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can insert their own scores"
  ON public.career_readiness_scores FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all scores"
  ON public.career_readiness_scores FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_academic_records_updated_at
  BEFORE UPDATE ON public.academic_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extracurricular_activities_updated_at
  BEFORE UPDATE ON public.extracurricular_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_student_skills_student_id ON public.student_skills(student_id);
CREATE INDEX idx_student_skills_skill_id ON public.student_skills(skill_id);
CREATE INDEX idx_academic_records_student_id ON public.academic_records(student_id);
CREATE INDEX idx_certifications_student_id ON public.certifications(student_id);
CREATE INDEX idx_projects_student_id ON public.projects(student_id);
CREATE INDEX idx_extracurricular_activities_student_id ON public.extracurricular_activities(student_id);
CREATE INDEX idx_career_readiness_scores_student_id ON public.career_readiness_scores(student_id);

-- Insert some common skills
INSERT INTO public.skills (name, category, description) VALUES
  ('Python', 'technical', 'Python programming language'),
  ('Java', 'technical', 'Java programming language'),
  ('JavaScript', 'technical', 'JavaScript programming language'),
  ('React', 'technical', 'React web framework'),
  ('Node.js', 'technical', 'Node.js runtime'),
  ('SQL', 'technical', 'SQL database querying'),
  ('Machine Learning', 'domain', 'Machine learning and AI'),
  ('Data Analysis', 'domain', 'Data analysis and visualization'),
  ('Web Development', 'domain', 'Web application development'),
  ('Mobile Development', 'domain', 'Mobile app development'),
  ('Communication', 'soft', 'Effective communication skills'),
  ('Teamwork', 'soft', 'Collaboration and teamwork'),
  ('Leadership', 'soft', 'Leadership and management'),
  ('Problem Solving', 'soft', 'Analytical problem solving'),
  ('Time Management', 'soft', 'Time management and organization');