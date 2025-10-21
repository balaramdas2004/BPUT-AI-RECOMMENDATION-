import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  benefits?: string[];
  inline?: boolean;
}

export function UpgradePrompt({ 
  feature, 
  description, 
  benefits = [],
  inline = false 
}: UpgradePromptProps) {
  const navigate = useNavigate();

  const defaultBenefits = benefits.length > 0 ? benefits : [
    'Unlimited access',
    'Priority support',
    'Advanced features',
    'No restrictions'
  ];

  if (inline) {
    return (
      <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center bg-primary/5">
        <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h3 className="font-semibold text-lg mb-2">Premium Feature</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {description || `Upgrade to access ${feature}`}
        </p>
        <Button onClick={() => navigate('/pricing')}>
          <Sparkles className="h-4 w-4 mr-2" />
          Upgrade Now
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-primary/50">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Crown className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Unlock {feature}</CardTitle>
        <CardDescription>
          {description || `Upgrade to Premium to access ${feature} and more`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="font-medium text-sm">Premium Benefits:</p>
          <ul className="space-y-2">
            {defaultBenefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ArrowRight className="h-3 w-3 text-primary" />
                </div>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => navigate('/pricing')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/pricing')}
          >
            View All Plans
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Starting from ₹199/month • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}
