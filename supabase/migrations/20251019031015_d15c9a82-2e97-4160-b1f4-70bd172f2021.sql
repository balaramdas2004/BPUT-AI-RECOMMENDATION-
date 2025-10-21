-- Create placement statistics table
CREATE TABLE public.placement_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year TEXT NOT NULL,
  department TEXT NOT NULL,
  branch TEXT,
  total_students INTEGER NOT NULL DEFAULT 0,
  placed_students INTEGER NOT NULL DEFAULT 0,
  placement_percentage NUMERIC(5,2),
  average_package NUMERIC(10,2),
  highest_package NUMERIC(10,2),
  median_package NUMERIC(10,2),
  companies_visited INTEGER DEFAULT 0,
  total_offers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(academic_year, department, branch)
);

-- Create skill demand trends table
CREATE TABLE public.skill_demand_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,
  demand_score INTEGER CHECK (demand_score >= 0 AND demand_score <= 100),
  job_postings_count INTEGER DEFAULT 0,
  salary_premium NUMERIC(5,2),
  trend TEXT CHECK (trend IN ('rising', 'stable', 'declining')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_placement_stats_year ON public.placement_statistics(academic_year);
CREATE INDEX idx_placement_stats_dept ON public.placement_statistics(department);
CREATE INDEX idx_skill_trends_skill ON public.skill_demand_trends(skill_name);
CREATE INDEX idx_skill_trends_category ON public.skill_demand_trends(category);
CREATE INDEX idx_skill_trends_period ON public.skill_demand_trends(period_start, period_end);

-- Enable RLS
ALTER TABLE public.placement_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_demand_trends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for placement_statistics
CREATE POLICY "Admins can manage placement statistics"
  ON public.placement_statistics
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view placement statistics"
  ON public.placement_statistics
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for skill_demand_trends
CREATE POLICY "Admins can manage skill demand trends"
  ON public.skill_demand_trends
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view skill demand trends"
  ON public.skill_demand_trends
  FOR SELECT
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_placement_statistics_updated_at
  BEFORE UPDATE ON public.placement_statistics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skill_demand_trends_updated_at
  BEFORE UPDATE ON public.skill_demand_trends
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample placement data
INSERT INTO public.placement_statistics (academic_year, department, branch, total_students, placed_students, placement_percentage, average_package, highest_package, median_package, companies_visited, total_offers) VALUES
('2024-25', 'Engineering', 'Computer Science', 120, 108, 90.00, 850000, 2500000, 750000, 45, 215),
('2024-25', 'Engineering', 'Electronics', 100, 82, 82.00, 720000, 1800000, 650000, 38, 168),
('2024-25', 'Engineering', 'Mechanical', 110, 88, 80.00, 680000, 1500000, 620000, 35, 145),
('2024-25', 'Engineering', 'Civil', 95, 71, 74.74, 620000, 1200000, 580000, 28, 118),
('2023-24', 'Engineering', 'Computer Science', 115, 98, 85.22, 780000, 2200000, 700000, 42, 198),
('2023-24', 'Engineering', 'Electronics', 105, 84, 80.00, 680000, 1600000, 620000, 36, 156),
('2023-24', 'Engineering', 'Mechanical', 108, 81, 75.00, 650000, 1400000, 600000, 32, 132),
('2023-24', 'Engineering', 'Civil', 92, 65, 70.65, 590000, 1100000, 550000, 26, 105);

-- Insert sample skill demand data
INSERT INTO public.skill_demand_trends (skill_name, category, demand_score, job_postings_count, salary_premium, trend, period_start, period_end, industry) VALUES
('JavaScript', 'Programming', 95, 3500, 15.5, 'stable', '2024-01-01', '2024-12-31', 'Technology'),
('Python', 'Programming', 92, 3200, 18.2, 'rising', '2024-01-01', '2024-12-31', 'Technology'),
('React', 'Framework', 88, 2800, 12.8, 'rising', '2024-01-01', '2024-12-31', 'Technology'),
('Node.js', 'Framework', 85, 2600, 14.3, 'stable', '2024-01-01', '2024-12-31', 'Technology'),
('Machine Learning', 'AI/ML', 90, 2400, 25.6, 'rising', '2024-01-01', '2024-12-31', 'Technology'),
('Data Analysis', 'Analytics', 87, 2200, 20.4, 'rising', '2024-01-01', '2024-12-31', 'Technology'),
('AWS', 'Cloud', 89, 2100, 22.1, 'rising', '2024-01-01', '2024-12-31', 'Technology'),
('Docker', 'DevOps', 84, 1900, 16.7, 'stable', '2024-01-01', '2024-12-31', 'Technology'),
('SQL', 'Database', 86, 3100, 10.2, 'stable', '2024-01-01', '2024-12-31', 'Technology'),
('Java', 'Programming', 82, 2700, 12.5, 'declining', '2024-01-01', '2024-12-31', 'Technology'),
('Angular', 'Framework', 78, 1600, 11.3, 'declining', '2024-01-01', '2024-12-31', 'Technology'),
('Communication', 'Soft Skills', 93, 4200, 8.5, 'stable', '2024-01-01', '2024-12-31', 'General'),
('Leadership', 'Soft Skills', 88, 3800, 15.2, 'stable', '2024-01-01', '2024-12-31', 'General'),
('Problem Solving', 'Soft Skills', 91, 4000, 12.8, 'stable', '2024-01-01', '2024-12-31', 'General');