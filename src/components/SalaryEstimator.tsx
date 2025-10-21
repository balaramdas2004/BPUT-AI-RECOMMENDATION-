import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface SalaryEstimatorProps {
  studentId: string;
}

export const SalaryEstimator = ({ studentId }: SalaryEstimatorProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [careerDomains, setCareerDomains] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [location, setLocation] = useState('Metro City');
  const [experience, setExperience] = useState('0');

  useEffect(() => {
    loadCareerDomains();
  }, []);

  const loadCareerDomains = async () => {
    const { data } = await supabase
      .from('career_domains')
      .select('*')
      .order('name');
    
    if (data) {
      setCareerDomains(data);
      if (data.length > 0) setSelectedDomain(data[0].id);
    }
  };

  const generateEstimate = async () => {
    if (!selectedDomain) {
      toast({
        title: "Error",
        description: "Please select a career domain",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-salary', {
        body: { 
          studentId, 
          careerDomainId: selectedDomain,
          location,
          experienceYears: parseInt(experience)
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      setEstimate(data.estimate);
      toast({
        title: "Estimate Generated",
        description: "Salary estimate has been calculated."
      });
    } catch (error: any) {
      console.error('Error generating estimate:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate estimate",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatSalary = (amount: number) => {
    return `₹${amount.toFixed(2)} LPA`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t('Salary Estimator')}
        </CardTitle>
        <CardDescription>
          {t('AI-powered salary estimation based on your profile')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('Career Domain')}</label>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Select career" />
              </SelectTrigger>
              <SelectContent>
                {careerDomains.map(domain => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('Location')}</label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Metro City">Metro City</SelectItem>
                <SelectItem value="Tier 1 City">Tier 1 City</SelectItem>
                <SelectItem value="Tier 2 City">Tier 2 City</SelectItem>
                <SelectItem value="Small Town">Small Town</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('Experience (Years)')}</label>
            <Select value={experience} onValueChange={setExperience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Fresher</SelectItem>
                <SelectItem value="1">1 Year</SelectItem>
                <SelectItem value="2">2 Years</SelectItem>
                <SelectItem value="3">3 Years</SelectItem>
                <SelectItem value="5">5+ Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!estimate ? (
          <Button onClick={generateEstimate} disabled={loading || !selectedDomain} className="w-full">
            {loading ? t('Calculating...') : t('Estimate Salary')}
          </Button>
        ) : (
          <>
            {/* Salary Range */}
            <div className="text-center space-y-4 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('Expected Salary Range')}</p>
                <div className="text-4xl font-bold text-primary">
                  {formatSalary(estimate.minSalary)} - {formatSalary(estimate.maxSalary)}
                </div>
                <div className="text-lg text-muted-foreground">
                  {t('Most Likely')}: <span className="font-semibold text-foreground">{formatSalary(estimate.mostLikely)}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">{t('Confidence')}:</span>
                <Badge className={getConfidenceColor(estimate.confidence)}>
                  {estimate.confidence.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Positive Factors */}
            {estimate.factors?.positive?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  {t('Factors Increasing Salary')}
                </h4>
                <ul className="space-y-1">
                  {estimate.factors.positive.map((factor: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Negative Factors */}
            {estimate.factors?.negative?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-orange-600">
                  <Info className="h-4 w-4" />
                  {t('Limiting Factors')}
                </h4>
                <ul className="space-y-1">
                  {estimate.factors.negative.map((factor: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-orange-500 mt-1">!</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Growth Potential */}
            {estimate.growthPotential && (
              <div className="space-y-2">
                <h4 className="font-semibold">{t('Growth Potential')}</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Year 1</div>
                    <div className="font-semibold">{formatSalary(estimate.growthPotential.year1)}</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Year 3</div>
                    <div className="font-semibold">{formatSalary(estimate.growthPotential.year3)}</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Year 5</div>
                    <div className="font-semibold">{formatSalary(estimate.growthPotential.year5)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {estimate.recommendations?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">{t('How to Increase Salary Potential')}</h4>
                <ul className="space-y-1">
                  {estimate.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-1">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Market Comparison */}
            {estimate.comparisonToMarket && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>{t('Market Comparison')}:</strong> {estimate.comparisonToMarket}
                </p>
              </div>
            )}

            <Button 
              onClick={generateEstimate} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {t('Recalculate')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
