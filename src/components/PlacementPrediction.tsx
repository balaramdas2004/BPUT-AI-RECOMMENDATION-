import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, AlertCircle, Target, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface PlacementPredictionProps {
  studentId: string;
}

export const PlacementPrediction = ({ studentId }: PlacementPredictionProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  const generatePrediction = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predict-placement', {
        body: { studentId }
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

      setPrediction(data.prediction);
      toast({
        title: "Prediction Generated",
        description: "Your placement probability has been calculated."
      });
    } catch (error: any) {
      console.error('Error generating prediction:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate prediction",
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

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'text-green-600';
    if (probability >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t('Placement Probability Prediction')}
        </CardTitle>
        <CardDescription>
          {t('AI-powered prediction based on your profile')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!prediction ? (
          <Button onClick={generatePrediction} disabled={loading} className="w-full">
            {loading ? t('Analyzing...') : t('Generate Prediction')}
          </Button>
        ) : (
          <>
            {/* Probability Score */}
            <div className="text-center space-y-2">
              <div className={`text-6xl font-bold ${getProbabilityColor(prediction.probability)}`}>
                {prediction.probability}%
              </div>
              <p className="text-muted-foreground">{t('Placement Probability')}</p>
              <Progress value={prediction.probability} className="h-2" />
            </div>

            {/* Confidence Level */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">{t('Confidence')}:</span>
              <Badge className={getConfidenceColor(prediction.confidence)}>
                {prediction.confidence.toUpperCase()}
              </Badge>
            </div>

            {/* Strengths */}
            {prediction.strengths?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  {t('Key Strengths')}
                </h4>
                <ul className="space-y-1">
                  {prediction.strengths.map((strength: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {prediction.weaknesses?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-orange-600">
                  <TrendingDown className="h-4 w-4" />
                  {t('Areas for Improvement')}
                </h4>
                <ul className="space-y-1">
                  {prediction.weaknesses.map((weakness: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {prediction.recommendations?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-blue-600">
                  <Lightbulb className="h-4 w-4" />
                  {t('Recommendations')}
                </h4>
                <ul className="space-y-1">
                  {prediction.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-1">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Info */}
            {prediction.estimatedTimeToPlacement && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>{t('Estimated Time to Placement')}:</strong>{' '}
                  {prediction.estimatedTimeToPlacement}
                </p>
              </div>
            )}

            {prediction.targetCompanyTypes?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t('Target Company Types')}</h4>
                <div className="flex flex-wrap gap-2">
                  {prediction.targetCompanyTypes.map((type: string, idx: number) => (
                    <Badge key={idx} variant="outline">{type}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={generatePrediction} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {t('Regenerate Prediction')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
