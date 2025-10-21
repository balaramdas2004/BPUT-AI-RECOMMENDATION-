-- Demo Career Readiness Scores for all students
-- Generates realistic scores based on student year and CGPA

INSERT INTO public.career_readiness_scores (
  student_id,
  overall_score,
  academic_score,
  skills_score,
  experience_score,
  soft_skills_score,
  analysis,
  recommendations
)
SELECT 
  s.id,
  -- Overall score based on year and CGPA
  LEAST(100, GREATEST(50, 
    (s.cgpa * 8)::INT + 
    (s.current_year * 5) + 
    (RANDOM() * 15)::INT
  )),
  -- Academic score (heavily based on CGPA)
  LEAST(100, (s.cgpa * 10)::INT + (RANDOM() * 10)::INT),
  -- Skills score (increases with year)
  LEAST(100, (s.current_year * 20)::INT + (RANDOM() * 20)::INT),
  -- Experience score (4th year students have more)
  CASE 
    WHEN s.current_year = 4 THEN 70 + (RANDOM() * 30)::INT
    WHEN s.current_year = 3 THEN 50 + (RANDOM() * 30)::INT
    WHEN s.current_year = 2 THEN 30 + (RANDOM() * 30)::INT
    ELSE 10 + (RANDOM() * 20)::INT
  END,
  -- Soft skills score
  65 + (RANDOM() * 35)::INT,
  -- Analysis JSON
  jsonb_build_object(
    'strengths', ARRAY['Strong academic background', 'Good technical skills', 'Active learner'],
    'weaknesses', ARRAY['Limited industry experience', 'Could improve soft skills'],
    'key_insights', 'Student shows consistent academic performance and technical aptitude. Recommended to focus on practical projects and communication skills.'
  ),
  -- Recommendations array
  ARRAY[
    'Complete at least 2 internships before graduation',
    'Build a portfolio of 3-5 significant projects',
    'Participate in hackathons and coding competitions',
    'Improve communication and presentation skills',
    'Learn industry-relevant tools and frameworks',
    'Network with professionals in your field'
  ]
FROM public.students s;

-- Add historical scores for trending (3 months of data)
INSERT INTO public.career_readiness_scores (
  student_id,
  overall_score,
  academic_score,
  skills_score,
  experience_score,
  soft_skills_score,
  calculated_at
)
SELECT 
  s.id,
  LEAST(100, GREATEST(40, 
    (s.cgpa * 7)::INT + 
    (s.current_year * 4) + 
    (RANDOM() * 10)::INT
  )),
  LEAST(100, (s.cgpa * 9.5)::INT + (RANDOM() * 10)::INT),
  LEAST(100, (s.current_year * 18)::INT + (RANDOM() * 15)::INT),
  CASE 
    WHEN s.current_year = 4 THEN 60 + (RANDOM() * 25)::INT
    WHEN s.current_year = 3 THEN 40 + (RANDOM() * 25)::INT
    WHEN s.current_year = 2 THEN 25 + (RANDOM() * 20)::INT
    ELSE 5 + (RANDOM() * 15)::INT
  END,
  60 + (RANDOM() * 30)::INT,
  NOW() - INTERVAL '90 days'
FROM public.students s
WHERE s.current_year >= 2;

-- Add another historical point (2 months ago)
INSERT INTO public.career_readiness_scores (
  student_id,
  overall_score,
  academic_score,
  skills_score,
  experience_score,
  soft_skills_score,
  calculated_at
)
SELECT 
  s.id,
  LEAST(100, GREATEST(45, 
    (s.cgpa * 7.5)::INT + 
    (s.current_year * 4.5) + 
    (RANDOM() * 12)::INT
  )),
  LEAST(100, (s.cgpa * 9.7)::INT + (RANDOM() * 10)::INT),
  LEAST(100, (s.current_year * 19)::INT + (RANDOM() * 17)::INT),
  CASE 
    WHEN s.current_year = 4 THEN 65 + (RANDOM() * 27)::INT
    WHEN s.current_year = 3 THEN 45 + (RANDOM() * 27)::INT
    WHEN s.current_year = 2 THEN 27 + (RANDOM() * 23)::INT
    ELSE 7 + (RANDOM() * 17)::INT
  END,
  62 + (RANDOM() * 32)::INT,
  NOW() - INTERVAL '60 days'
FROM public.students s
WHERE s.current_year >= 3;
