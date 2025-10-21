import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export interface SubscriptionPlan {
  id: string;
  name: string;
  user_type: 'student' | 'employer' | 'admin';
  price_monthly: number;
  price_annual: number;
  features: string[];
  limits: Record<string, number>;
  is_active: boolean;
  display_order: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  started_at: string;
  expires_at: string | null;
  payment_method: string | null;
  plan?: SubscriptionPlan;
}

export interface FeatureUsage {
  feature_type: string;
  count: number;
  date: string;
}

export function useSubscription() {
  const { user, activeRole } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user && activeRole) {
      fetchSubscriptionData();
      fetchUsageData();
    } else {
      setLoading(false);
    }
  }, [user, activeRole]);

  const fetchSubscriptionData = async () => {
    try {
      // Fetch current subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError);
      } else if (subscription) {
        setCurrentSubscription(subscription as any);
      }

      // Fetch available plans for user's role
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('user_type', activeRole)
        .eq('is_active', true)
        .order('display_order');

      if (plansError) {
        console.error('Error fetching plans:', plansError);
      } else {
        setAvailablePlans(plans as any);
      }
    } catch (error) {
      console.error('Error in fetchSubscriptionData:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('feature_usage')
        .select('feature_type, count')
        .eq('user_id', user?.id)
        .eq('usage_date', today);

      if (error) {
        console.error('Error fetching usage:', error);
        return;
      }

      const usage: Record<string, number> = {};
      data?.forEach((item: any) => {
        usage[item.feature_type] = item.count;
      });
      setUsageData(usage);
    } catch (error) {
      console.error('Error in fetchUsageData:', error);
    }
  };

  const checkFeatureAccess = async (
    featureType: string,
    showUpgradePrompt: boolean = true
  ): Promise<{ allowed: boolean; remaining: number }> => {
    if (!user || !currentSubscription?.plan) {
      // No subscription, use free tier limits
      const freePlan = availablePlans.find(p => p.name === 'Free');
      const limit = freePlan?.limits[featureType] ?? 0;
      const used = usageData[featureType] ?? 0;
      const remaining = Math.max(0, limit - used);

      if (used >= limit && showUpgradePrompt) {
        toast({
          title: "Upgrade Required",
          description: `You've reached your ${featureType} limit. Upgrade to Premium for unlimited access!`,
          variant: "destructive",
        });
      }

      return { allowed: used < limit, remaining };
    }

    const plan = currentSubscription.plan as SubscriptionPlan;
    const limit = plan.limits[featureType];

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, remaining: -1 };
    }

    const used = usageData[featureType] ?? 0;
    const remaining = Math.max(0, limit - used);
    const allowed = used < limit;

    if (!allowed && showUpgradePrompt) {
      toast({
        title: "Limit Reached",
        description: `You've used all ${limit} ${featureType} for this month. Upgrade for more!`,
        variant: "destructive",
      });
    }

    return { allowed, remaining };
  };

  const trackFeatureUsage = async (featureType: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { allowed } = await checkFeatureAccess(featureType, false);
      if (!allowed) return false;

      const today = new Date().toISOString().split('T')[0];

      // Upsert usage
      const { error } = await supabase
        .from('feature_usage')
        .upsert({
          user_id: user.id,
          feature_type: featureType,
          usage_date: today,
          count: (usageData[featureType] ?? 0) + 1,
        }, {
          onConflict: 'user_id,feature_type,usage_date',
        });

      if (error) {
        console.error('Error tracking usage:', error);
        return false;
      }

      // Update local state
      setUsageData(prev => ({
        ...prev,
        [featureType]: (prev[featureType] ?? 0) + 1,
      }));

      return true;
    } catch (error) {
      console.error('Error in trackFeatureUsage:', error);
      return false;
    }
  };

  const getRemainingQuota = (featureType: string): number => {
    if (!currentSubscription?.plan) {
      const freePlan = availablePlans.find(p => p.name === 'Free');
      const limit = freePlan?.limits[featureType] ?? 0;
      const used = usageData[featureType] ?? 0;
      return Math.max(0, limit - used);
    }

    const plan = currentSubscription.plan as SubscriptionPlan;
    const limit = plan.limits[featureType];

    if (limit === -1) return -1; // Unlimited

    const used = usageData[featureType] ?? 0;
    return Math.max(0, limit - used);
  };

  const isPremium = (): boolean => {
    return currentSubscription?.plan?.name !== 'Free' && !!currentSubscription;
  };

  return {
    currentSubscription,
    currentPlan: currentSubscription?.plan as SubscriptionPlan | null,
    availablePlans,
    loading,
    usageData,
    checkFeatureAccess,
    trackFeatureUsage,
    getRemainingQuota,
    isPremium,
    refreshSubscription: fetchSubscriptionData,
    refreshUsage: fetchUsageData,
  };
}
