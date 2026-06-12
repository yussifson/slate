import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from "@/api/PowerSyncConnector";
import { useCompanyId } from '@/hooks/useCompanyId';

export function useSubscription() {
  const companyId = useCompanyId();

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscription', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      // Fetch the company's subscription and join with the plan
      const { data: subData, error: subError } = await supabase
        .from('company_subscriptions')
        .select(`
          *,
          plan:subscription_plans (*)
        `)
        .eq('company_id', companyId)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      // Fetch today's usage for AI credits
      const today = new Date().toISOString().split('T')[0];
      const { data: usageData, error: usageError } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('company_id', companyId)
        .eq('metric_name', 'ai_credits_daily')
        .gte('period_start', today);

      const aiCreditsUsed = usageData?.[0]?.used_amount || 0;

      return {
        subscription: subData || null,
        plan: subData?.plan || null,
        usage: {
          ai_credits_daily: aiCreditsUsed
        }
      };
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000 // Cache for 5 mins
  });

  const plan = data?.plan || { name: 'Free', features: {}, limits: { ai_credits_daily: 0 } };
  const subscription = data?.subscription;
  const status = subscription?.status || 'none';
  const isActive = status === 'active' || status === 'trialing';

  // Helper to check if a feature is enabled
  const hasFeature = (featureName) => {
    return !!plan.features[featureName] && isActive;
  };

  // Helper to check if user has reached a specific limit
  const checkLimit = (limitName) => {
    const limitMax = plan.limits[limitName] || 0;
    const currentUsage = data?.usage[limitName] || 0;
    return {
      allowed: currentUsage < limitMax,
      current: currentUsage,
      max: limitMax
    };
  };

  return {
    isLoading,
    error,
    subscription,
    plan,
    isActive,
    status,
    hasFeature,
    checkLimit
  };
}
