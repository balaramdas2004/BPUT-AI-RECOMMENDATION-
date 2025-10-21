-- Create table for AI interview analyses
CREATE TABLE IF NOT EXISTS public.ai_interview_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  video_duration_seconds INTEGER,
  
  -- Facial expression analysis
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  eye_contact_score INTEGER CHECK (eye_contact_score >= 0 AND eye_contact_score <= 100),
  facial_expression_score INTEGER CHECK (facial_expression_score >= 0 AND facial_expression_score <= 100),
  posture_score INTEGER CHECK (posture_score >= 0 AND posture_score <= 100),
  
  -- Communication analysis
  communication_clarity_score INTEGER CHECK (communication_clarity_score >= 0 AND communication_clarity_score <= 100),
  nervousness_level TEXT CHECK (nervousness_level IN ('low', 'medium', 'high')),
  speaking_pace TEXT CHECK (speaking_pace IN ('slow', 'moderate', 'fast')),
  
  -- Soft skills assessment
  leadership_indicators JSONB DEFAULT '[]'::jsonb,
  problem_solving_indicators JSONB DEFAULT '[]'::jsonb,
  teamwork_indicators JSONB DEFAULT '[]'::jsonb,
  
  -- Overall assessment
  overall_soft_skills_score INTEGER CHECK (overall_soft_skills_score >= 0 AND overall_soft_skills_score <= 100),
  strengths TEXT[] DEFAULT ARRAY[]::TEXT[],
  areas_for_improvement TEXT[] DEFAULT ARRAY[]::TEXT[],
  detailed_feedback TEXT,
  
  -- Company recommendations based on soft skills
  recommended_company_types JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_interview_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view their own analyses"
  ON public.ai_interview_analyses
  FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Students can insert their own analyses"
  ON public.ai_interview_analyses
  FOR INSERT
  WITH CHECK (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all analyses"
  ON public.ai_interview_analyses
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for better performance
CREATE INDEX idx_ai_interview_analyses_student_id ON public.ai_interview_analyses(student_id);
CREATE INDEX idx_ai_interview_analyses_created_at ON public.ai_interview_analyses(created_at DESC);