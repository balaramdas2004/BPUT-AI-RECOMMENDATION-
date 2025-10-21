-- Create gamification tables

-- Achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Student achievements junction table
CREATE TABLE public.student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, achievement_id)
);

-- Student gamification stats
CREATE TABLE public.student_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Leaderboard table
CREATE TABLE public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  branch TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, period, period_start)
);

-- Add language preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (viewable by all)
CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage achievements"
  ON public.achievements FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_achievements
CREATE POLICY "Students can view their own achievements"
  ON public.student_achievements FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can unlock achievements"
  ON public.student_achievements FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all achievements"
  ON public.student_achievements FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_gamification
CREATE POLICY "Students can view their own gamification stats"
  ON public.student_gamification FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can update their own gamification stats"
  ON public.student_gamification FOR ALL
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all gamification stats"
  ON public.student_gamification FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for leaderboard
CREATE POLICY "Leaderboard is viewable by everyone"
  ON public.leaderboard FOR SELECT
  USING (true);

CREATE POLICY "System can manage leaderboard"
  ON public.leaderboard FOR ALL
  USING (true);

-- Create indexes
CREATE INDEX idx_student_achievements_student ON public.student_achievements(student_id);
CREATE INDEX idx_student_achievements_achievement ON public.student_achievements(achievement_id);
CREATE INDEX idx_student_gamification_student ON public.student_gamification(student_id);
CREATE INDEX idx_student_gamification_points ON public.student_gamification(total_points DESC);
CREATE INDEX idx_leaderboard_period ON public.leaderboard(period, period_start);
CREATE INDEX idx_leaderboard_rank ON public.leaderboard(rank);
CREATE INDEX idx_leaderboard_branch ON public.leaderboard(branch);

-- Insert sample achievements
INSERT INTO public.achievements (title, description, icon, points, criteria_type, criteria_value, category) VALUES
('Welcome Aboard', 'Complete your profile with all basic information', 'UserCheck', 50, 'profile_completion', 100, 'profile'),
('First Step', 'Upload your first resume', 'FileText', 30, 'resume_uploaded', 1, 'profile'),
('Skill Master', 'Add at least 5 skills to your profile', 'Award', 40, 'skills_count', 5, 'skills'),
('Tech Enthusiast', 'Add at least 10 technical skills', 'Code', 80, 'skills_count', 10, 'skills'),
('Job Hunter', 'Apply to your first job', 'Briefcase', 20, 'applications_count', 1, 'applications'),
('Active Seeker', 'Apply to 5 different jobs', 'Target', 60, 'applications_count', 5, 'applications'),
('Persistent', 'Apply to 10 or more jobs', 'TrendingUp', 100, 'applications_count', 10, 'applications'),
('Project Showcase', 'Add your first project', 'Folder', 40, 'projects_count', 1, 'projects'),
('Portfolio Builder', 'Add 3 or more projects', 'FolderOpen', 70, 'projects_count', 3, 'projects'),
('Academic Excellence', 'Maintain CGPA above 8.5', 'GraduationCap', 120, 'cgpa', 85, 'academic'),
('Certified Pro', 'Add your first certification', 'Certificate', 50, 'certifications_count', 1, 'certifications'),
('Early Bird', 'Complete profile within first week', 'Sunrise', 80, 'early_completion', 7, 'special'),
('Social Connector', 'Add LinkedIn and GitHub profiles', 'Share2', 40, 'social_links', 2, 'profile'),
('Interview Ready', 'Get your first interview scheduled', 'Calendar', 90, 'interviews_count', 1, 'interviews'),
('Rising Star', 'Reach level 5', 'Star', 150, 'level', 5, 'progression');

-- Create trigger for updated_at
CREATE TRIGGER update_student_gamification_updated_at
  BEFORE UPDATE ON public.student_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();