import { useState, useEffect } from 'react';
import { Check, Sparkles, Building, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function Pricing() {
  const { user, role } = useAuth();
  const { availablePlans, currentPlan, loading } = useSubscription();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const studentPlans = availablePlans.filter(p => p.user_type === 'student');
  const employerPlans = availablePlans.filter(p => p.user_type === 'employer');
  const institutionPlans = availablePlans.filter(p => p.user_type === 'admin');

  const formatPrice = (monthly: number, annual: number) => {
    if (monthly === 0 && annual === 0) return 'Free';
    if (billingCycle === 'monthly') return `₹${monthly.toLocaleString()}/mo`;
    return `₹${annual.toLocaleString()}/year`;
  };

  const handleSelectPlan = (planId: string, planName: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upgrade your plan",
      });
      navigate('/auth');
      return;
    }

    if (currentPlan?.id === planId) {
      toast({
        title: "Current Plan",
        description: "You're already on this plan",
      });
      return;
    }

    // For demo purposes, show success message
    // In production, this would trigger payment flow
    toast({
      title: "Upgrade Initiated",
      description: `Your upgrade to ${planName} is being processed. This is a demo - no payment required.`,
    });
  };

  const PlanCard = ({ plan, popular = false }: { plan: any; popular?: boolean }) => {
    const isCurrent = currentPlan?.id === plan.id;
    const features = Array.isArray(plan.features) ? plan.features : [];

    return (
      <Card className={`relative ${popular ? 'border-primary shadow-lg' : ''}`}>
        {popular && (
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
            Most Popular
          </Badge>
        )}
        {isCurrent && (
          <Badge className="absolute -top-3 right-4 bg-green-500">
            Current Plan
          </Badge>
        )}
        
        <CardHeader>
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription>
            <span className="text-3xl font-bold text-foreground">
              {formatPrice(plan.price_monthly, plan.price_annual)}
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {features.map((feature: string, idx: number) => (
              <li key={idx} className="flex gap-2 items-start">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        
        <CardFooter>
          <Button
            className="w-full"
            variant={isCurrent ? 'outline' : popular ? 'default' : 'outline'}
            onClick={() => handleSelectPlan(plan.id, plan.name)}
            disabled={isCurrent}
          >
            {isCurrent ? 'Current Plan' : 'Select Plan'}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Unlock your full potential with our premium features
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={billingCycle === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
              Monthly
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative"
            >
              <div className={`w-12 h-6 rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-primary' : 'bg-muted'
              }`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </div>
            </Button>
            <span className={billingCycle === 'annual' ? 'font-semibold' : 'text-muted-foreground'}>
              Annual
              <Badge variant="secondary" className="ml-2">Save 17%</Badge>
            </span>
          </div>
        </div>

        {/* Plans Tabs */}
        <Tabs defaultValue={role || 'student'} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="student">
              <GraduationCap className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="employer">
              <Building className="h-4 w-4 mr-2" />
              Employers
            </TabsTrigger>
            <TabsTrigger value="admin">
              <Sparkles className="h-4 w-4 mr-2" />
              Institutions
            </TabsTrigger>
          </TabsList>

          {/* Student Plans */}
          <TabsContent value="student">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {studentPlans.map((plan, idx) => (
                <PlanCard 
                  key={plan.id} 
                  plan={plan} 
                  popular={plan.name === 'Premium Student'}
                />
              ))}
            </div>
          </TabsContent>

          {/* Employer Plans */}
          <TabsContent value="employer">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {employerPlans.map((plan, idx) => (
                <PlanCard 
                  key={plan.id} 
                  plan={plan} 
                  popular={plan.name === 'Premium Employer'}
                />
              ))}
            </div>
          </TabsContent>

          {/* Institution Plans */}
          <TabsContent value="admin">
            <div className="max-w-2xl mx-auto">
              {institutionPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} popular={true} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">How does the billing work?</h3>
              <p className="text-muted-foreground">
                Choose between monthly or annual billing. Annual plans save you 17% compared to monthly billing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can change your plan at any time. Upgrades are immediate, and downgrades take effect at the end of your billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, debit cards, UPI, and net banking through secure payment gateways.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                All users start with our Free plan with no credit card required. You can explore premium features and upgrade when ready.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="max-w-2xl mx-auto bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-2xl">Need Help Choosing?</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Contact our team for personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button variant="secondary" size="lg">
                Contact Sales
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
