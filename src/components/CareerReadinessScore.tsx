import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, TrendingUp, Award, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CareerReadinessScoreProps {
  studentId: string;
}

export function CareerReadinessScore({ studentId }: CareerReadinessScoreProps) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [scoreData, setScoreData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLatestScore();
  }, [studentId]);

  const fetchLatestScore = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('career_readiness_scores')
        .select('*')
        .eq('student_id', studentId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setScoreData(data);
    } catch (error: any) {
      console.error('Error fetching score:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = async () => {
    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-career-readiness', {
        body: { studentId }
      });

      if (error) throw error;

      toast({
        title: "Score Calculated",
        description: "Your career readiness score has been updated successfully."
      });

      await fetchLatestScore();
    } catch (error: any) {
      console.error('Error calculating score:', error);
      toast({
        title: "Calculation Failed",
        description: error.message || "Failed to calculate career readiness score.",
        variant: "destructive"
      });
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Career Readiness Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-16 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scoreData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Career Readiness Score
          </CardTitle>
          <CardDescription>
            Get AI-powered insights into your career preparedness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No score calculated yet</p>
            <Button onClick={calculateScore} disabled={calculating}>
              {calculating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Calculate My Score
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Career Readiness Score
            </CardTitle>
            <CardDescription>
              Last updated: {new Date(scoreData.calculated_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <Button onClick={calculateScore} disabled={calculating} variant="outline" size="sm">
            {calculating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor(scoreData.overall_score)}`}>
            {scoreData.overall_score}
          </div>
          <Badge variant="secondary" className="mt-2">
            {getScoreLabel(scoreData.overall_score)}
          </Badge>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Score Breakdown</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Academic Performance</span>
                <span className="font-medium">{scoreData.academic_score}%</span>
              </div>
              <Progress value={scoreData.academic_score} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Technical Skills</span>
                <span className="font-medium">{scoreData.skills_score}%</span>
              </div>
              <Progress value={scoreData.skills_score} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Practical Experience</span>
                <span className="font-medium">{scoreData.experience_score}%</span>
              </div>
              <Progress value={scoreData.experience_score} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Professional Profile</span>
                <span className="font-medium">{scoreData.soft_skills_score}%</span>
              </div>
              <Progress value={scoreData.soft_skills_score} className="h-2" />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {scoreData.recommendations && scoreData.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Award className="h-4 w-4" />
              Recommendations
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {scoreData.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Analysis */}
        {scoreData.analysis && (
          <div className="space-y-3 pt-4 border-t">
            {scoreData.analysis.strengths && scoreData.analysis.strengths.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-green-600 mb-1">Strengths</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {scoreData.analysis.strengths.map((s: string, i: number) => (
                    <li key={i}>✓ {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {scoreData.analysis.weaknesses && scoreData.analysis.weaknesses.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-orange-600 mb-1">Areas for Improvement</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {scoreData.analysis.weaknesses.map((w: string, i: number) => (
                    <li key={i}>→ {w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}