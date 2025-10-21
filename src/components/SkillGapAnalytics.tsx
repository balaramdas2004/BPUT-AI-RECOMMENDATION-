import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SkillGapAnalytics() {
  const [loading, setLoading] = useState(false);
  const [gapData, setGapData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchGapAnalysis();
  }, []);

  const fetchGapAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-custom-report', {
        body: { 
          reportType: 'skill_gap_analysis',
          filters: {}
        }
      });

      if (error) throw error;
      setGapData(data.data);
    } catch (error: any) {
      console.error('Error fetching gap analysis:', error);
      toast({
        title: "Failed to Load Data",
        description: error.message || "Could not load skill gap analysis.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getGapSeverity = (gap: number) => {
    if (gap > 50) return { label: 'Critical', color: 'destructive' };
    if (gap > 20) return { label: 'High', color: 'default' };
    if (gap > 10) return { label: 'Medium', color: 'secondary' };
    return { label: 'Low', color: 'outline' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Skill Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredGaps = selectedCategory === 'all' 
    ? gapData?.topGaps 
    : gapData?.byCategory?.[selectedCategory];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Skill Gap Analysis
            </CardTitle>
            <CardDescription>
              Identify critical skill shortages across departments
            </CardDescription>
          </div>
          <Button onClick={fetchGapAnalysis} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {gapData?.byCategory && Object.keys(gapData.byCategory).map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gap List */}
        <div className="space-y-4">
          {filteredGaps && filteredGaps.length > 0 ? (
            filteredGaps.map((gap: any, idx: number) => {
              const severity = getGapSeverity(gap.gap);
              return (
                <div key={idx} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{gap.skill}</h4>
                        <Badge variant={severity.color as any}>
                          {severity.label}
                        </Badge>
                        <Badge variant="outline">{gap.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Gap: {gap.gap} students needed
                      </p>
                    </div>
                    {gap.gap > 0 ? (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Demand:</span>
                      <span className="ml-2 font-medium">{gap.demand}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Supply:</span>
                      <span className="ml-2 font-medium">{gap.supply}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No skill gaps found in this category
            </div>
          )}
        </div>

        {/* Recommendations */}
        {gapData?.recommendations && gapData.recommendations.length > 0 && (
          <div className="pt-6 border-t">
            <h4 className="font-semibold mb-4">Recommended Actions</h4>
            <div className="space-y-3">
              {gapData.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="flex gap-3">
                  <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                    {rec.priority}
                  </Badge>
                  <p className="text-sm flex-1">{rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}