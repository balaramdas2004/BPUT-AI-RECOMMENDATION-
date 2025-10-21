import { Crown, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

export function SubscriptionWidget() {
  const { currentPlan, usageData, isPremium, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const planName = currentPlan?.name || 'Free';
  const isPremiumUser = isPremium();

  // Calculate usage percentages for free tier
  const jobAppsLimit = currentPlan?.limits?.job_applications ?? 10;
  const aiQueriesLimit = currentPlan?.limits?.ai_queries ?? 20;
  const jobAppsUsed = usageData?.job_applications ?? 0;
  const aiQueriesUsed = usageData?.ai_queries ?? 0;

  const jobAppsPercent = jobAppsLimit > 0 ? (jobAppsUsed / jobAppsLimit) * 100 : 0;
  const aiQueriesPercent = aiQueriesLimit > 0 ? (aiQueriesUsed / aiQueriesLimit) * 100 : 0;

  return (
    <Card className={isPremiumUser ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isPremiumUser ? (
                <>
                  <Crown className="h-5 w-5 text-yellow-500" />
                  {planName}
                </>
              ) : (
                planName
              )}
            </CardTitle>
            <CardDescription>
              {isPremiumUser ? 'Premium features unlocked' : 'Your current plan'}
            </CardDescription>
          </div>
          {isPremiumUser && (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isPremiumUser && (
          <>
            {/* Job Applications Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Job Applications</span>
                <span className="font-medium">
                  {jobAppsUsed} / {jobAppsLimit}
                </span>
              </div>
              <Progress value={jobAppsPercent} className="h-2" />
              {jobAppsPercent >= 80 && (
                <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>Nearing limit - Upgrade for unlimited</span>
                </div>
              )}
            </div>

            {/* AI Queries Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">AI Assistant Queries</span>
                <span className="font-medium">
                  {aiQueriesUsed} / {aiQueriesLimit}
                </span>
              </div>
              <Progress value={aiQueriesPercent} className="h-2" />
              {aiQueriesPercent >= 80 && (
                <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>Nearing limit - Upgrade for unlimited</span>
                </div>
              )}
            </div>

            {/* Upgrade CTA */}
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate('/pricing')}
              variant="default"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Get unlimited access + priority features
            </p>
          </>
        )}

        {isPremiumUser && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>Unlimited access to all features</span>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/pricing')}
            >
              Manage Subscription
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
