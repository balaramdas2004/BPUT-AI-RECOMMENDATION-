-- Demo Alumni Data (10+ alumni profiles)
-- Creates successful alumni profiles for mentorship

-- Insert alumni profiles
INSERT INTO public.alumni (
  user_id,
  student_id,
  graduation_year,
  current_company,
  current_role,
  current_location,
  career_path,
  linkedin_url,
  mentorship_available,
  areas_of_expertise,
  success_story
) VALUES
(gen_random_uuid(), (SELECT id FROM public.students WHERE enrollment_number = 'BPUT2019CS001' LIMIT 1), 2023, 'Google', 'Software Engineer', 'Bangalore, India', 
  '[{"year": 2023, "role": "SDE Intern", "company": "Google"}, {"year": 2024, "role": "Software Engineer", "company": "Google"}]'::jsonb,
  'https://linkedin.com/in/alumni1', true, ARRAY['Full Stack Development', 'Cloud Architecture', 'System Design'],
  'Started as an intern at Google during final year. Converted to full-time after graduation. Currently working on Google Maps backend infrastructure.'),

(gen_random_uuid(), (SELECT id FROM public.students WHERE enrollment_number = 'BPUT2019CS002' LIMIT 1), 2023, 'Microsoft', 'Software Development Engineer 2', 'Hyderabad, India',
  '[{"year": 2023, "role": "SDE 1", "company": "Microsoft"}, {"year": 2024, "role": "SDE 2", "company": "Microsoft"}]'::jsonb,
  'https://linkedin.com/in/alumni2', true, ARRAY['Azure Cloud', 'Microservices', 'DevOps'],
  'Joined Microsoft Azure team after campus placement. Promoted to SDE 2 within 18 months. Leading cloud infrastructure projects.'),

(gen_random_uuid(), NULL, 2022, 'Amazon', 'ML Engineer', 'Bangalore, India',
  '[{"year": 2022, "role": "SDE", "company": "Amazon"}, {"year": 2023, "role": "ML Engineer", "company": "Amazon"}]'::jsonb,
  'https://linkedin.com/in/alumni3', true, ARRAY['Machine Learning', 'Python', 'AWS'],
  'Transitioned from SDE to ML Engineer. Working on Alexa AI recommendation systems. Published 2 papers on NLP.'),

(gen_random_uuid(), NULL, 2022, 'Flipkart', 'Senior Product Engineer', 'Bangalore, India',
  '[{"year": 2022, "role": "Product Engineer", "company": "Flipkart"}, {"year": 2024, "role": "Senior Product Engineer", "company": "Flipkart"}]'::jsonb,
  'https://linkedin.com/in/alumni4', true, ARRAY['E-commerce', 'Backend Development', 'Kafka'],
  'Built scalable solutions for Flipkart checkout system. Handling 100K+ transactions per minute during sales.'),

(gen_random_uuid(), NULL, 2021, 'TCS', 'Tech Lead', 'Bhubaneswar, India',
  '[{"year": 2021, "role": "Assistant System Engineer", "company": "TCS"}, {"year": 2022, "role": "System Engineer", "company": "TCS"}, {"year": 2024, "role": "Tech Lead", "company": "TCS"}]'::jsonb,
  'https://linkedin.com/in/alumni5', true, ARRAY['Project Management', 'Java', 'Spring Boot'],
  'Grew from trainee to tech lead in 3 years. Leading a team of 8 engineers on banking domain projects.'),

(gen_random_uuid(), NULL, 2023, 'Infosys', 'Senior Systems Engineer', 'Pune, India',
  '[{"year": 2023, "role": "Systems Engineer", "company": "Infosys"}, {"year": 2024, "role": "Senior Systems Engineer", "company": "Infosys"}]'::jsonb,
  'https://linkedin.com/in/alumni6', true, ARRAY['SAP', 'ERP', 'Business Analytics'],
  'Specialized in SAP implementation. Working with Fortune 500 clients on digital transformation initiatives.'),

(gen_random_uuid(), NULL, 2022, 'Wipro', 'Project Engineer', 'Bangalore, India',
  '[{"year": 2022, "role": "Project Engineer", "company": "Wipro"}]'::jsonb,
  'https://linkedin.com/in/alumni7', false, ARRAY['Testing', 'Automation', 'Selenium'],
  'Working on automation testing for healthcare domain. Certified in ISTQB and Selenium.'),

(gen_random_uuid(), NULL, 2021, 'Tech Mahindra', 'Solution Architect', 'Mumbai, India',
  '[{"year": 2021, "role": "Software Engineer", "company": "Tech Mahindra"}, {"year": 2023, "role": "Senior Engineer", "company": "Tech Mahindra"}, {"year": 2024, "role": "Solution Architect", "company": "Tech Mahindra"}]'::jsonb,
  'https://linkedin.com/in/alumni8', true, ARRAY['Solution Design', 'Enterprise Architecture', 'Cloud'],
  'Rapid career growth through consistent performance. Now architecting solutions for telecom clients globally.'),

(gen_random_uuid(), NULL, 2020, 'Startup - Razorpay', 'Senior Backend Engineer', 'Bangalore, India',
  '[{"year": 2020, "role": "Backend Engineer", "company": "Razorpay"}, {"year": 2022, "role": "Senior Backend Engineer", "company": "Razorpay"}]'::jsonb,
  'https://linkedin.com/in/alumni9', true, ARRAY['FinTech', 'Payments', 'Node.js', 'Golang'],
  'Joined Razorpay as one of the early engineers. Worked on payment gateway infrastructure serving millions of transactions.'),

(gen_random_uuid(), NULL, 2023, 'Accenture', 'Application Development Analyst', 'Bangalore, India',
  '[{"year": 2023, "role": "ASE", "company": "Accenture"}, {"year": 2024, "role": "Application Development Analyst", "company": "Accenture"}]'::jsonb,
  'https://linkedin.com/in/alumni10', true, ARRAY['Web Development', 'React', 'Client Management'],
  'Working with international clients on web application development. Got promoted within first year.'),

(gen_random_uuid(), NULL, 2022, 'IBM', 'Cloud Engineer', 'Bangalore, India',
  '[{"year": 2022, "role": "Associate Engineer", "company": "IBM"}, {"year": 2024, "role": "Cloud Engineer", "company": "IBM"}]'::jsonb,
  'https://linkedin.com/in/alumni11', true, ARRAY['IBM Cloud', 'Kubernetes', 'OpenShift'],
  'Specialized in IBM Cloud platform. Multiple IBM certifications. Contributing to open-source projects.'),

(gen_random_uuid(), NULL, 2021, 'Cognizant', 'Senior Associate', 'Kolkata, India',
  '[{"year": 2021, "role": "Programmer Analyst", "company": "Cognizant"}, {"year": 2023, "role": "Senior Associate", "company": "Cognizant"}]'::jsonb,
  'https://linkedin.com/in/alumni12', false, ARRAY['Healthcare IT', 'Java', 'Angular'],
  'Working on healthcare domain applications. Received multiple spot awards for excellent delivery.');

-- Create some demo mentorship connections
INSERT INTO public.mentorship_connections (mentor_id, mentee_id, status, connection_reason)
SELECT 
  al.id,
  s.id,
  CASE 
    WHEN RANDOM() < 0.5 THEN 'active'
    ELSE 'requested'
  END,
  'Seeking guidance on career path in ' || (al.areas_of_expertise)[1]
FROM public.alumni al
CROSS JOIN public.students s
WHERE al.mentorship_available = true
  AND s.current_year IN (3, 4)
LIMIT 15;
