import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, Sparkles, Loader2, Youtube, Building2, ExternalLink, Target, CheckCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function ResumeAnalysis() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [learningResources, setLearningResources] = useState<any[]>([]);
  const [companyRecommendations, setCompanyRecommendations] = useState<any[]>([]);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [resumeText, setResumeText] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const analyzeResume = async () => {
    if (!file) {
      toast.error('Please select a resume file');
      return;
    }

    setUploading(true);
    setAnalyzing(true);

    try {
      // Extract text from resume
      const extractedText = await extractTextFromPDF(file);
      setResumeText(extractedText);

      // Parse resume
      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-resume', {
        body: { resumeText: extractedText }
      });

      if (parseError) throw parseError;

      setResumeData(parseData.data);
      toast.success('Resume parsed successfully!');

      // Analyze resume faults
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-resume-faults', {
        body: { 
          resumeText: extractedText,
          resumeData: parseData.data
        }
      });

      if (analysisError) {
        console.error('Resume analysis error:', analysisError);
        toast.error('Failed to analyze resume quality');
      } else {
        setResumeAnalysis(analysisData.data);
      }

      // Get learning resources
      const { data: learningData, error: learningError } = await supabase.functions.invoke('recommend-learning-resources', {
        body: { 
          skills: parseData.data.skills,
          targetRole: 'career advancement'
        }
      });

      if (learningError) {
        console.error('Learning resources error:', learningError);
      } else {
        setLearningResources(learningData.data.recommendations);
      }

      // Get company recommendations
      const { data: companyData, error: companyError } = await supabase.functions.invoke('recommend-companies', {
        body: { resumeData: parseData.data }
      });

      if (companyError) {
        console.error('Company recommendations error:', companyError);
        toast.error('Failed to get company recommendations');
      } else {
        if (companyData.data.recommendations && Array.isArray(companyData.data.recommendations)) {
          setCompanyRecommendations(companyData.data.recommendations.sort((a: any, b: any) => b.match_score - a.match_score));
        }
      }

      toast.success('Analysis complete!');

    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      toast.error(error.message || 'Failed to analyze resume');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

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
              <h1 className="text-xl font-bold">AI Resume Analysis</h1>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Upload Section */}
        <Card className="mb-8 border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-primary animate-pulse" />
              Upload Your Resume
            </CardTitle>
            <CardDescription>
              Get AI-powered learning recommendations, company matches with success probability, and direct application links
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  file ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5'
                }`}>
                  <Upload className={`w-12 h-12 mx-auto mb-4 transition-all duration-300 ${
                    file ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-primary group-hover:scale-110'
                  }`} />
                  <Input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <p className="text-sm font-medium mb-1">
                    {file ? (
                      <span className="flex items-center justify-center gap-2 text-primary">
                        <CheckCircle className="w-4 h-4" />
                        {file.name}
                      </span>
                    ) : (
                      'Click to upload or drag and drop'
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, or TXT (max 10MB)
                  </p>
                </div>
              </div>
              <Button
                onClick={analyzeResume}
                disabled={!file || uploading}
                className="w-full relative overflow-hidden group"
                size="lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center justify-center">
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analyze Resume with AI
                    </>
                  )}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {analyzing && (
          <Card className="mb-8 border-primary/20">
            <CardContent className="py-12 text-center">
              <div className="relative inline-block">
                <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
                <Sparkles className="w-6 h-6 absolute top-0 right-0 text-yellow-500 animate-pulse" />
              </div>
              <p className="text-lg font-semibold animate-pulse">Analyzing your resume with AI...</p>
              <p className="text-sm text-muted-foreground mt-2">Extracting skills, calculating match scores, and finding opportunities</p>
              <div className="mt-6 max-w-xs mx-auto">
                <Progress value={66} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resume Analysis with Faults */}
        {resumeAnalysis && !analyzing && (
          <Card className="mb-8 border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  AI Resume Analysis
                </CardTitle>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">{resumeAnalysis.overall_score}/100</div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Strengths */}
              {resumeAnalysis.strengths && resumeAnalysis.strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Strengths
                  </h4>
                  <div className="space-y-2">
                    {resumeAnalysis.strengths.map((strength: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <p className="text-sm text-green-900">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues */}
              {resumeAnalysis.issues && resumeAnalysis.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Issues Found</h4>
                  <div className="space-y-3">
                    {resumeAnalysis.issues.map((issue: any, idx: number) => (
                      <Card key={idx} className={`border ${getSeverityColor(issue.severity)}`}>
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                                  {issue.severity.toUpperCase()}
                                </Badge>
                                <Badge variant="secondary">{issue.category}</Badge>
                              </div>
                              <p className="font-medium text-sm mb-2">{issue.description}</p>
                              <div className="space-y-1">
                                <p className="text-xs">
                                  <span className="font-semibold">Suggestion:</span> {issue.suggestion}
                                </p>
                                <p className="text-xs">
                                  <span className="font-semibold">Impact:</span> {issue.impact}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Recommendations */}
              {resumeAnalysis.recommendations && resumeAnalysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Key Recommendations
                  </h4>
                  <div className="space-y-2">
                    {resumeAnalysis.recommendations.map((rec: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resume Data Summary */}
        {resumeData && !analyzing && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Resume Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills?.map((skill: any, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Education</h4>
                {resumeData.education?.map((edu: any, idx: number) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    {edu.degree} from {edu.institution} ({edu.year})
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learning Resources */}
        {learningResources.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Youtube className="w-6 h-6 text-red-600" />
              Recommended Learning Resources
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {learningResources.map((resource, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {resource.channel_name}
                      <Badge variant="outline">{resource.skill_focus}</Badge>
                    </CardTitle>
                    <CardDescription>{resource.topic}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{resource.reason}</p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(resource.search_query)}`, '_blank')}
                    >
                      <Youtube className="w-4 h-4 mr-2" />
                      Watch on YouTube
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Company Recommendations */}
        {companyRecommendations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              AI-Powered Company Matches & Success Probability
            </h2>
            
            {/* Match Score Distribution Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Match Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={companyRecommendations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="company_name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="match_score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {companyRecommendations.map((company, idx) => (
                <Card key={idx} className="hover:shadow-xl transition-all duration-300 border-l-4" style={{
                  borderLeftColor: company.match_score >= 80 ? 'rgb(34, 197, 94)' : company.match_score >= 60 ? 'rgb(234, 179, 8)' : 'rgb(249, 115, 22)'
                }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-bold text-primary">#{idx + 1}</span>
                          <div>
                            <CardTitle className="text-xl">{company.company_name}</CardTitle>
                            <Badge variant="outline" className="mt-1">{company.industry}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getMatchColor(company.match_score)}`}>
                          {company.match_score}%
                        </div>
                        <p className="text-sm text-muted-foreground">Match</p>
                        <Badge variant="secondary" className="mt-2">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {company.match_score >= 80 ? 'High' : company.match_score >= 60 ? 'Medium' : 'Fair'} Success Rate
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        AI Analysis: Why You're a Great Match
                      </h4>
                      <p className="text-sm">{company.why_good_match}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Suggested Roles:</h4>
                        <div className="flex flex-wrap gap-2">
                          {company.role_suggestions?.map((role: string, roleIdx: number) => (
                            <Badge key={roleIdx} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Your Skills They Value:</h4>
                        <div className="flex flex-wrap gap-2">
                          {company.skills_valued?.map((skill: string, skillIdx: number) => (
                            <Badge key={skillIdx} className="bg-primary/10 text-primary hover:bg-primary/20 text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Application Success Probability</h4>
                        <span className="text-sm font-medium">{company.match_score}%</span>
                      </div>
                      <Progress value={company.match_score} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on skills match, experience alignment, and role compatibility
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 group"
                        onClick={() => window.open(company.career_site_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Apply Now
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(company.company_name + ' careers interview tips')}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Interview Prep
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!resumeData && !analyzing && (
          <Card>
            <CardContent className="py-12 text-center">
              <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
              <p className="text-muted-foreground">
                Get personalized learning recommendations and company matches
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
