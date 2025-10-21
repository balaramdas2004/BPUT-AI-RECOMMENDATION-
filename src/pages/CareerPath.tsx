import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, ArrowLeft, Sparkles, Loader2, TrendingUp, Award, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function CareerPath() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [readinessScore, setReadinessScore] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get student ID
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentData) {
        toast.error('Student profile not found');
        return;
      }

      setStudent(studentData);

      // Load recommendations
      const { data: recsData } = await supabase
        .from('career_recommendations')
        .select(`
          *,
          career_domains (
            name,
            description,
            category,
            average_salary_range,
            growth_rate
          )
        `)
        .eq('student_id', studentData.id)
        .order('confidence_score', { ascending: false });

      setRecommendations(recsData || []);

      // Load latest readiness score
      const { data: scoreData } = await supabase
        .from('career_readiness_scores')
        .select('*')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setReadinessScore(scoreData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    if (!student) return;
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-career-recommendations', {
        body: { studentId: student.id }
      });

      if (error) throw error;

      toast.success('Career recommendations generated!');
      loadData();
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      toast.error(error.message || 'Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      technology: 'bg-blue-500',
      management: 'bg-purple-500',
      research: 'bg-green-500',
      design: 'bg-pink-500',
      other: 'bg-gray-500'
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/student/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Career Path</h1>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Career Readiness Overview */}
        {readinessScore && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Career Readiness Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-5">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(readinessScore.overall_score)}`}>
                    {readinessScore.overall_score}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Overall</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">{readinessScore.academic_score}</div>
                  <p className="text-sm text-muted-foreground mt-1">Academic</p>
                  <Progress value={readinessScore.academic_score} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">{readinessScore.skills_score}</div>
                  <p className="text-sm text-muted-foreground mt-1">Skills</p>
                  <Progress value={readinessScore.skills_score} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">{readinessScore.experience_score}</div>
                  <p className="text-sm text-muted-foreground mt-1">Experience</p>
                  <Progress value={readinessScore.experience_score} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">{readinessScore.soft_skills_score}</div>
                  <p className="text-sm text-muted-foreground mt-1">Soft Skills</p>
                  <Progress value={readinessScore.soft_skills_score} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Recommendations Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>AI-Powered Career Recommendations</CardTitle>
            <CardDescription>
              Get personalized career path suggestions based on your profile, skills, and interests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={generateRecommendations}
              disabled={generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Recommendations...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Career Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recommendations List */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Recommended Career Paths
            </h2>
            {recommendations.map((rec, index) => (
              <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl font-bold text-primary">#{index + 1}</span>
                        <div>
                          <CardTitle className="text-xl">{rec.career_domains.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getCategoryColor(rec.career_domains.category)}>
                              {rec.career_domains.category}
                            </Badge>
                            <Badge variant="outline">{rec.career_domains.average_salary_range}</Badge>
                            <Badge variant="secondary">{rec.career_domains.growth_rate} Growth</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(rec.confidence_score)}`}>
                        {rec.confidence_score}%
                      </div>
                      <p className="text-sm text-muted-foreground">Match</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{rec.career_domains.description}</p>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Why this career suits you:</h4>
                    <p className="text-sm">{rec.reasoning}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Skill Match</h4>
                      <span className="text-sm font-medium">{rec.skill_match_percentage}%</span>
                    </div>
                    <Progress value={rec.skill_match_percentage} />
                  </div>

                  {rec.recommended_skills && rec.recommended_skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Skills to Learn:</h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.recommended_skills.map((skill: string) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {recommendations.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Recommendations Yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate AI-powered career recommendations based on your profile
              </p>
              <Button onClick={generateRecommendations} disabled={generating}>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
