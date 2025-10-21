import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ChatWidget from '@/components/ChatWidget';
import SupportChat from '@/components/SupportChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { GraduationCap, Briefcase, Award, TrendingUp, Settings, BookOpen, Calendar, FileText, Users, Brain, MessageSquare, Target, Trophy, Sparkles, Video } from 'lucide-react';
import { StudentInterviews } from '@/components/StudentInterviews';
import { ApplicationTracker } from '@/components/ApplicationTracker';
import { GamificationStats } from '@/components/GamificationStats';
import { AchievementsPanel } from '@/components/AchievementsPanel';
import { Leaderboard } from '@/components/Leaderboard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { PlacementPrediction } from '@/components/PlacementPrediction';
import { SalaryEstimator } from '@/components/SalaryEstimator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CareerReadinessScore } from '@/components/CareerReadinessScore';
import { AlumniNetwork } from '@/components/AlumniNetwork';
import { SkillVerification } from '@/components/SkillVerification';
import { MockInterviewSystem } from '@/components/MockInterviewSystem';
import { MessagingSystem } from '@/components/MessagingSystem';
import { SubscriptionWidget } from '@/components/SubscriptionWidget';
import { useTranslation } from 'react-i18next';

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (studentData) {
        setStudentId(studentData.id);

        const { data: appsData } = await supabase
          .from('applications')
          .select(`
            *,
            job_postings(title, employers(company_name))
          `)
          .eq('student_id', studentData.id)
          .order('applied_at', { ascending: false });

        setApplications(appsData || []);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Student Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button variant="outline" onClick={() => navigate('/analytics')}>
              Analytics
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('/student/profile')}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        {/* Gamification Stats */}
        <div className="mb-8">
          <GamificationStats />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Career Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Complete your profile to get started</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-muted-foreground">
                {applications.length === 0 ? 'No applications yet' : 'Total applications'}
              </p>
              <Button 
                variant="link" 
                className="p-0 h-auto mt-2" 
                onClick={() => navigate('/student/jobs')}
              >
                Browse Jobs →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skills</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Add your skills</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">Profile incomplete</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Complete these steps to unlock all features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors"
                onClick={() => navigate('/student/profile')}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <div>
                  <p className="font-medium">Complete Your Profile</p>
                  <p className="text-sm text-muted-foreground">Add your academic details and skills</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="font-semibold">2</span>
                </div>
                <div>
                  <p className="font-medium">Upload Your Resume</p>
                  <p className="text-sm text-muted-foreground">Get AI-powered analysis and suggestions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="font-semibold">3</span>
                </div>
                <div>
                  <p className="font-medium">Explore Career Paths</p>
                  <p className="text-sm text-muted-foreground">Get AI-powered career recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <SubscriptionWidget />
        </div>

        <Tabs defaultValue="overview" className="mt-8">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max min-w-full lg:grid lg:grid-cols-10 gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Overview')}</span>
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Applications')}</span>
              </TabsTrigger>
              <TabsTrigger value="interviews" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Interviews')}</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Skills</span>
              </TabsTrigger>
              <TabsTrigger value="alumni" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Alumni</span>
              </TabsTrigger>
              <TabsTrigger value="mock-interview" className="flex items-center gap-1">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Mock Interview</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Achievements')}</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Leaderboard')}</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Predictions')}</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="overview" className="space-y-6">
            {/* Career Readiness Score Widget */}
            {studentId && <CareerReadinessScore studentId={studentId} />}
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/student/career-path')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5" />
                    Career Path
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Get AI-powered career recommendations</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/student/resume-analysis')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5" />
                    Resume Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">YouTube recommendations & company matches</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/student/ai-interview')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="w-5 h-5" />
                    AI Interview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Practice with AI analyzing facial gestures</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/student/jobs')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="w-5 h-5" />
                    Job Board
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Browse and apply for job opportunities</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">My Applications</h2>
            </div>
            <ApplicationTracker studentId={studentId || undefined} />
          </TabsContent>

          <TabsContent value="interviews" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">My Interviews</h2>
            </div>
            <StudentInterviews studentId={studentId || undefined} />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {studentId && <AchievementsPanel studentId={studentId} />}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            {studentId && <SkillVerification studentId={studentId} />}
          </TabsContent>

          <TabsContent value="alumni" className="space-y-4">
            {studentId && <AlumniNetwork studentId={studentId} />}
          </TabsContent>

          <TabsContent value="mock-interview" className="space-y-4">
            {studentId && <MockInterviewSystem studentId={studentId} />}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {user?.id && <MessagingSystem currentUserId={user.id} />}
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            {studentId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PlacementPrediction studentId={studentId} />
                <SalaryEstimator studentId={studentId} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* AI Career Assistant Widget */}
      <ChatWidget contextType="student" />
      
      {/* Support Chat */}
      <SupportChat userType="student" />
    </div>
  );
}
