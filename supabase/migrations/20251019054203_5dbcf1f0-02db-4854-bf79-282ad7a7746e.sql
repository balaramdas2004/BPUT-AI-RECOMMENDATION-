-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'employer', 'admin')),
  price_monthly DECIMAL(10,2),
  price_annual DECIMAL(10,2),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'trial')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  payment_method TEXT,
  last_payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create feature usage tracking table
CREATE TABLE public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_type, usage_date)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Subscription plans are viewable by everyone"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
  ON public.subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for feature_usage
CREATE POLICY "Users can view their own usage"
  ON public.feature_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can track their own usage"
  ON public.feature_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update usage counts"
  ON public.feature_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage"
  ON public.feature_usage FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_feature_usage_user_date ON public.feature_usage(user_id, usage_date);
CREATE INDEX idx_feature_usage_feature_type ON public.feature_usage(feature_type);

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, user_type, price_monthly, price_annual, features, limits, display_order) VALUES
-- Free Student Plan
('Free', 'student', 0, 0, 
  '["Basic profile creation", "10 job applications/month", "20 AI assistant queries/month", "Access to job board", "Community features", "Career readiness score (monthly)"]'::jsonb,
  '{"job_applications": 10, "ai_queries": 20, "mock_interviews": 0, "resume_downloads": 5}'::jsonb,
  1),

-- Premium Student Plan
('Premium Student', 'student', 199, 1999,
  '["All Free features", "Unlimited job applications", "Unlimited AI career assistant", "Priority in employer search (3x visibility)", "Resume ATS optimizer", "Mock interview with AI feedback (5/month)", "Skill verification certificates", "Weekly career readiness updates", "LinkedIn profile optimization", "Early access to new jobs (24h before free users)"]'::jsonb,
  '{"job_applications": -1, "ai_queries": -1, "mock_interviews": 5, "resume_downloads": -1}'::jsonb,
  2),

-- Free Employer Plan
('Free', 'employer', 0, 0,
  '["Basic company profile", "3 job postings/month", "View applicants", "Basic search filters"]'::jsonb,
  '{"job_postings": 3, "candidate_messages": 20, "featured_jobs": 0}'::jsonb,
  1),

-- Premium Employer Plan
('Premium Employer', 'employer', 9999, 99999,
  '["All Free features", "Unlimited job postings", "AI-powered candidate matching", "Advanced filtering & search", "Bulk messaging to candidates", "Custom company branding page", "Detailed analytics dashboard", "Priority support (24h response)", "Featured employer badge", "Access to verified student pool"]'::jsonb,
  '{"job_postings": -1, "candidate_messages": -1, "featured_jobs": -1, "ai_matching": -1}'::jsonb,
  2),

-- Institutional Plan
('Institutional Access', 'admin', NULL, 49999,
  '["All features for all students & staff", "White-label option (custom branding)", "Dedicated admin dashboard", "Custom analytics & reports", "API access for integration", "Dedicated account manager", "Training & onboarding", "Data export capabilities", "BPUT integration support"]'::jsonb,
  '{"users": -1, "all_features": -1}'::jsonb,
  1);