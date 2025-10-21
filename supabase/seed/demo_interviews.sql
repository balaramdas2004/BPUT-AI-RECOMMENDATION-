-- Demo Interview Data (15-20 interviews)
-- Creates interviews for applications with 'interview_scheduled' or 'accepted' status

-- Insert interviews for scheduled applications
INSERT INTO public.interviews (
  application_id,
  round_number,
  interview_type,
  status,
  scheduled_at,
  duration_minutes,
  interviewer_name,
  meeting_link,
  location
)
SELECT 
  a.id,
  1,
  CASE 
    WHEN RANDOM() < 0.4 THEN 'technical'
    WHEN RANDOM() < 0.7 THEN 'hr'
    ELSE 'behavioral'
  END,
  CASE 
    WHEN RANDOM() < 0.3 THEN 'scheduled'
    WHEN RANDOM() < 0.6 THEN 'completed'
    ELSE 'scheduled'
  END,
  NOW() + (RANDOM() * INTERVAL '30 days'),
  CASE 
    WHEN RANDOM() < 0.5 THEN 45
    ELSE 60
  END,
  CASE 
    WHEN RANDOM() < 0.25 THEN 'Rajesh Kumar'
    WHEN RANDOM() < 0.5 THEN 'Priya Sharma'
    WHEN RANDOM() < 0.75 THEN 'Amit Patel'
    ELSE 'Sneha Reddy'
  END,
  'https://meet.google.com/abc-defg-hij',
  CASE 
    WHEN RANDOM() < 0.7 THEN 'Virtual'
    ELSE 'Office - Bangalore'
  END
FROM public.applications a
WHERE a.status IN ('interview_scheduled', 'accepted')
LIMIT 20;

-- Insert interview feedback for completed interviews
INSERT INTO public.interview_feedback (
  interview_id,
  employer_id,
  communication_score,
  technical_score,
  problem_solving_score,
  cultural_fit_score,
  overall_rating,
  strengths,
  areas_for_improvement,
  feedback_text,
  would_hire
)
SELECT 
  i.id,
  jp.employer_id,
  70 + FLOOR(RANDOM() * 30)::INT,
  65 + FLOOR(RANDOM() * 35)::INT,
  70 + FLOOR(RANDOM() * 30)::INT,
  75 + FLOOR(RANDOM() * 25)::INT,
  7 + FLOOR(RANDOM() * 3)::INT,
  'Strong technical knowledge, good communication skills, demonstrates enthusiasm and eagerness to learn',
  'Could improve system design knowledge, practice more coding problems for optimization',
  'Overall a strong candidate with solid fundamentals. Shows promise and potential for growth. Recommended for next round.',
  CASE WHEN RANDOM() < 0.7 THEN true ELSE false END
FROM public.interviews i
JOIN public.applications a ON i.application_id = a.id
JOIN public.job_postings jp ON a.job_posting_id = jp.id
WHERE i.status = 'completed'
LIMIT 12;

-- Add second round interviews for top candidates
INSERT INTO public.interviews (
  application_id,
  round_number,
  interview_type,
  status,
  scheduled_at,
  duration_minutes,
  interviewer_name,
  meeting_link
)
SELECT 
  a.id,
  2,
  'technical',
  'scheduled',
  NOW() + (RANDOM() * INTERVAL '45 days'),
  90,
  'Vikram Singh - Tech Lead',
  'https://meet.google.com/xyz-abcd-efg'
FROM public.applications a
WHERE a.status = 'interview_scheduled' 
  AND a.match_score > 85
LIMIT 5;
