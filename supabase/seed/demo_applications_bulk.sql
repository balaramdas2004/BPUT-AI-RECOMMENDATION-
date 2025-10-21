-- Comprehensive Demo Applications Data (200+ applications)
-- Creates applications across all job postings with various statuses

-- Helper: Get student IDs and job posting IDs
-- Applications distributed across different statuses: submitted, reviewed, shortlisted, interview_scheduled, rejected, accepted

-- Generate 200+ applications with realistic distribution
DO $$
DECLARE
  student_ids UUID[];
  job_ids UUID[];
  statuses TEXT[] := ARRAY['submitted', 'reviewed', 'shortlisted', 'interview_scheduled', 'rejected', 'accepted'];
  status_weights INT[] := ARRAY[30, 25, 20, 15, 8, 2]; -- Percentage distribution
  i INT;
  j INT;
  student_id UUID;
  job_id UUID;
  random_status TEXT;
  match_score INT;
BEGIN
  -- Get all student IDs
  SELECT ARRAY_AGG(id) INTO student_ids FROM public.students;
  
  -- Get all job posting IDs
  SELECT ARRAY_AGG(id) INTO job_ids FROM public.job_postings WHERE status = 'active';
  
  -- Create applications for each student (average 4 applications per student)
  FOR i IN 1..ARRAY_LENGTH(student_ids, 1) LOOP
    student_id := student_ids[i];
    
    -- Each student applies to 3-5 jobs
    FOR j IN 1..(3 + FLOOR(RANDOM() * 3)::INT) LOOP
      -- Select a random job
      job_id := job_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(job_ids, 1))::INT];
      
      -- Select status based on weighted distribution
      CASE 
        WHEN RANDOM() < 0.30 THEN random_status := 'submitted';
        WHEN RANDOM() < 0.55 THEN random_status := 'reviewed';
        WHEN RANDOM() < 0.75 THEN random_status := 'shortlisted';
        WHEN RANDOM() < 0.90 THEN random_status := 'interview_scheduled';
        WHEN RANDOM() < 0.98 THEN random_status := 'rejected';
        ELSE random_status := 'accepted';
      END CASE;
      
      -- Generate realistic match scores
      match_score := 65 + FLOOR(RANDOM() * 35)::INT;
      
      -- Insert application (avoid duplicates with ON CONFLICT)
      INSERT INTO public.applications (
        student_id,
        job_posting_id,
        status,
        match_score,
        match_reasoning,
        cover_letter,
        applied_at
      ) VALUES (
        student_id,
        job_id,
        random_status,
        match_score,
        'Strong match based on technical skills and academic background. Candidate demonstrates proficiency in required technologies and has relevant project experience.',
        'I am writing to express my strong interest in this position. With my academic background and practical experience, I believe I would be a valuable addition to your team.',
        NOW() - (RANDOM() * INTERVAL '90 days')
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Add some specific high-quality applications for demo purposes
INSERT INTO public.applications (student_id, job_posting_id, status, match_score, match_reasoning, cover_letter, applied_at)
SELECT 
  s.id,
  jp.id,
  'accepted',
  95,
  'Exceptional candidate with perfect skill alignment. Strong academic record (CGPA 9.2) and demonstrated expertise in required tech stack. Previous internship experience highly relevant.',
  'I am excited about this opportunity and confident that my skills in AI/ML and full-stack development make me an ideal candidate for this role.',
  NOW() - INTERVAL '60 days'
FROM public.students s
CROSS JOIN public.job_postings jp
WHERE s.enrollment_number = 'BPUT2021CS002' 
  AND jp.title LIKE '%Software%'
  AND jp.status = 'active'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add applications for students with interviews scheduled
INSERT INTO public.applications (student_id, job_posting_id, status, match_score, match_reasoning, applied_at)
SELECT 
  s.id,
  jp.id,
  'interview_scheduled',
  88,
  'Strong technical background with relevant project experience. Good cultural fit based on profile analysis.',
  NOW() - INTERVAL '30 days'
FROM public.students s
CROSS JOIN public.job_postings jp
WHERE s.current_year = 4 
  AND jp.status = 'active'
  AND jp.job_type = 'Full-time'
LIMIT 25
ON CONFLICT DO NOTHING;
