import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Sparkles, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";

export const SkillDemandForecast = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [timeframe, setTimeframe] = useState('6months');
  const [industry, setIndustry] = useState('');

  const generateForecast = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('forecast-skill-demand', {
        body: { timeframe, industry: industry || undefined }
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

      setForecast(data.forecast);
      toast({
        title: "Forecast Generated",
        description: "Skill demand forecast has been generated."
      });
    } catch (error: any) {
      console.error('Error generating forecast:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate forecast",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'surging':
      case 'growing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <span className="h-4 w-4 text-gray-500">—</span>;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'surging': return 'bg-green-600';
      case 'growing': return 'bg-green-500';
      case 'stable': return 'bg-blue-500';
      case 'declining': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'very_high': return 'bg-purple-600';
      case 'high': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-gray-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {t('Skill Demand Forecast')}
        </CardTitle>
        <CardDescription>
          {t('AI-powered prediction of future skill demand')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('Timeframe')}</label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
                <SelectItem value="2years">2 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('Industry')} ({t('Optional')})</label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Industries</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!forecast ? (
          <Button onClick={generateForecast} disabled={loading} className="w-full">
            {loading ? t('Analyzing...') : t('Generate Forecast')}
          </Button>
        ) : (
          <>
            {/* Top Skills Forecast */}
            {forecast.forecast?.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">{t('Skill Demand Forecast')}</h4>
                <div className="space-y-3">
                  {forecast.forecast.slice(0, 10).map((item: any, idx: number) => (
                    <div key={idx} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(item.trend)}
                          <span className="font-medium">{item.skill}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTrendColor(item.trend)} variant="secondary">
                            {item.trend}
                          </Badge>
                          <Badge className={getDemandColor(item.predictedDemand)} variant="secondary">
                            {item.predictedDemand.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={item.confidence} className="h-1" />
                      <p className="text-xs text-muted-foreground">{item.reasoning}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Confidence: {item.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emerging Skills */}
            {forecast.emergingSkills?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-green-600">
                  <Sparkles className="h-4 w-4" />
                  {t('Emerging Skills')}
                </h4>
                <div className="space-y-2">
                  {forecast.emergingSkills.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{item.skill}</span>
                        <Badge variant="outline" className={
                          item.potentialImpact === 'high' ? 'bg-green-100' :
                          item.potentialImpact === 'medium' ? 'bg-yellow-100' : 'bg-gray-100'
                        }>
                          {item.potentialImpact} impact
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Declining Skills */}
            {forecast.decliningSkills?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {t('Declining Skills')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {forecast.decliningSkills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-red-50 dark:bg-red-950/20">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {forecast.recommendations?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">{t('Recommendations')}</h4>
                <ul className="space-y-1">
                  {forecast.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-1">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              onClick={generateForecast} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {t('Regenerate Forecast')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
