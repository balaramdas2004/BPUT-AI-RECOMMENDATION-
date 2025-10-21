-- Create career_domains table
CREATE TABLE public.career_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT CHECK (category IN ('technology', 'management', 'research', 'design', 'other')),
  average_salary_range TEXT,
  growth_rate TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create career_skills_mapping table
CREATE TABLE public.career_skills_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_domain_id UUID NOT NULL REFERENCES public.career_domains(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  importance_level TEXT NOT NULL CHECK (importance_level IN ('required', 'recommended', 'optional')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(career_domain_id, skill_id)
);

-- Create career_recommendations table
CREATE TABLE public.career_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  career_domain_id UUID NOT NULL REFERENCES public.career_domains(id) ON DELETE CASCADE,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reasoning TEXT,
  skill_match_percentage INTEGER CHECK (skill_match_percentage >= 0 AND skill_match_percentage <= 100),
  recommended_skills TEXT[],
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  url TEXT,
  duration TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  skills_covered TEXT[],
  price TEXT,
  rating DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create learning_paths table
CREATE TABLE public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  career_domain_id UUID NOT NULL REFERENCES public.career_domains(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  current_level TEXT,
  target_level TEXT,
  recommended_courses UUID[],
  milestones JSONB,
  estimated_duration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create student_progress table
CREATE TABLE public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.career_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_skills_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for career_domains (public read)
CREATE POLICY "Career domains are viewable by everyone"
  ON public.career_domains FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage career domains"
  ON public.career_domains FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for career_skills_mapping (public read)
CREATE POLICY "Career skill mappings are viewable by everyone"
  ON public.career_skills_mapping FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage career skill mappings"
  ON public.career_skills_mapping FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for career_recommendations
CREATE POLICY "Students can view their own recommendations"
  ON public.career_recommendations FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can insert their own recommendations"
  ON public.career_recommendations FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all recommendations"
  ON public.career_recommendations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for courses (public read)
CREATE POLICY "Courses are viewable by everyone"
  ON public.courses FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for learning_paths
CREATE POLICY "Students can view their own learning paths"
  ON public.learning_paths FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can manage their own learning paths"
  ON public.learning_paths FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all learning paths"
  ON public.learning_paths FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_progress
CREATE POLICY "Students can view their own progress"
  ON public.student_progress FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can manage their own progress"
  ON public.student_progress FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all progress"
  ON public.student_progress FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at
  BEFORE UPDATE ON public.student_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_career_skills_mapping_career_id ON public.career_skills_mapping(career_domain_id);
CREATE INDEX idx_career_skills_mapping_skill_id ON public.career_skills_mapping(skill_id);
CREATE INDEX idx_career_recommendations_student_id ON public.career_recommendations(student_id);
CREATE INDEX idx_career_recommendations_career_id ON public.career_recommendations(career_domain_id);
CREATE INDEX idx_learning_paths_student_id ON public.learning_paths(student_id);
CREATE INDEX idx_student_progress_student_id ON public.student_progress(student_id);

-- Insert sample career domains
INSERT INTO public.career_domains (name, description, category, average_salary_range, growth_rate) VALUES
  ('Full Stack Developer', 'Design and develop complete web applications', 'technology', '₹6-15 LPA', 'High'),
  ('Data Scientist', 'Analyze data and build ML models', 'technology', '₹8-20 LPA', 'Very High'),
  ('Mobile App Developer', 'Create iOS and Android applications', 'technology', '₹5-12 LPA', 'High'),
  ('DevOps Engineer', 'Manage infrastructure and deployment pipelines', 'technology', '₹7-18 LPA', 'High'),
  ('Machine Learning Engineer', 'Build and deploy ML/AI systems', 'technology', '₹10-25 LPA', 'Very High'),
  ('Frontend Developer', 'Create user interfaces and experiences', 'technology', '₹5-12 LPA', 'High'),
  ('Backend Developer', 'Build server-side applications and APIs', 'technology', '₹6-15 LPA', 'High'),
  ('Cloud Architect', 'Design cloud infrastructure solutions', 'technology', '₹12-30 LPA', 'Very High'),
  ('Cybersecurity Analyst', 'Protect systems from security threats', 'technology', '₹8-20 LPA', 'Very High'),
  ('Product Manager', 'Define product strategy and roadmap', 'management', '₹10-25 LPA', 'High'),
  ('UI/UX Designer', 'Design user interfaces and experiences', 'design', '₹5-15 LPA', 'High'),
  ('Embedded Systems Engineer', 'Develop firmware and embedded software', 'technology', '₹6-15 LPA', 'Medium'),
  ('Network Engineer', 'Design and maintain network infrastructure', 'technology', '₹5-12 LPA', 'Medium'),
  ('Business Analyst', 'Bridge business and technology teams', 'management', '₹6-15 LPA', 'Medium'),
  ('Research Scientist', 'Conduct research and publish findings', 'research', '₹8-20 LPA', 'Medium');

-- Map skills to career domains
INSERT INTO public.career_skills_mapping (career_domain_id, skill_id, importance_level)
SELECT 
  cd.id,
  s.id,
  CASE 
    WHEN cd.name = 'Full Stack Developer' AND s.name IN ('JavaScript', 'React', 'Node.js') THEN 'required'
    WHEN cd.name = 'Data Scientist' AND s.name IN ('Python', 'Machine Learning', 'Data Analysis') THEN 'required'
    WHEN cd.name = 'Frontend Developer' AND s.name IN ('JavaScript', 'React') THEN 'required'
    WHEN cd.name = 'Backend Developer' AND s.name IN ('Java', 'Node.js', 'SQL') THEN 'required'
    ELSE 'recommended'
  END
FROM public.career_domains cd
CROSS JOIN public.skills s
WHERE 
  (cd.name = 'Full Stack Developer' AND s.name IN ('JavaScript', 'React', 'Node.js', 'SQL', 'Python'))
  OR (cd.name = 'Data Scientist' AND s.name IN ('Python', 'Machine Learning', 'Data Analysis', 'SQL'))
  OR (cd.name = 'Frontend Developer' AND s.name IN ('JavaScript', 'React', 'Web Development'))
  OR (cd.name = 'Backend Developer' AND s.name IN ('Java', 'Node.js', 'SQL', 'Python'))
  OR (cd.name = 'Mobile App Developer' AND s.name IN ('Java', 'JavaScript', 'Mobile Development'))
  OR (cd.name = 'Machine Learning Engineer' AND s.name IN ('Python', 'Machine Learning', 'Data Analysis'));