import { useState } from 'react';
import { Crown, CreditCard, Calendar, Download, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function BillingDashboard() {
  const { currentSubscription, currentPlan, usageData, isPremium, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isFree = !isPremium();

  // Mock billing history
  const billingHistory = currentSubscription ? [
    {
      id: '1',
      date: new Date(),
      amount: currentPlan?.price_monthly || 0,
      status: 'paid',
      invoice: 'INV-2024-001'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2 space-y-6">
            <Card className={isPremium() ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {isPremium() && <Crown className="h-5 w-5 text-yellow-500" />}
                      Current Plan: {currentPlan?.name || 'Free'}
                    </CardTitle>
                    <CardDescription>
                      {isFree ? 'Upgrade to unlock premium features' : 'Premium features unlocked'}
                    </CardDescription>
                  </div>
                  <Badge variant={isPremium() ? 'default' : 'secondary'}>
                    {currentSubscription?.status || 'Free'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentSubscription && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Started</span>
                      <span className="font-medium">
                        {format(new Date(currentSubscription.started_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {currentSubscription.expires_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Renews on</span>
                        <span className="font-medium">
                          {format(new Date(currentSubscription.expires_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                    <Separator />
                  </>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Plan Features:</p>
                  <ul className="space-y-1">
                    {currentPlan?.features?.slice(0, 5).map((feature: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  {isFree ? (
                    <Button className="flex-1" onClick={() => navigate('/pricing')}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => navigate('/pricing')}>
                        Change Plan
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Cancel Subscription
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
                <CardDescription>Track your feature usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(usageData).map(([feature, count]) => (
                    <div key={feature} className="flex justify-between items-center">
                      <span className="text-sm capitalize">
                        {feature.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium">
                        {count} {currentPlan?.limits[feature] === -1 ? '(Unlimited)' : `/ ${currentPlan?.limits[feature] || 'N/A'}`}
                      </span>
                    </div>
                  ))}
                  {Object.keys(usageData).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No usage data yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            {!isFree && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>View your past invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {billingHistory.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{invoice.invoice}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(invoice.date, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">₹{invoice.amount}</span>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Method */}
            {!isFree && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">•••• 4242</p>
                      <p className="text-xs text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Update Payment Method
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/pricing')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View All Plans
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Billing History
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoices
                </Button>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Need Help?</CardTitle>
                <CardDescription>
                  Contact our support team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
