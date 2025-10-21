import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, ArrowLeft, Loader2, Sparkles, TrendingUp, ExternalLink, CheckCircle, Play, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function LearningResources() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentData) return;
      setStudent(studentData);

      const [coursesRes, pathsRes, progressRes] = await Promise.all([
        supabase.from('courses').select('*').order('rating', { ascending: false }),
        supabase.from('learning_paths').select('*, career_domains(name)').eq('student_id', studentData.id),
        supabase.from('student_progress').select('*').eq('student_id', studentData.id)
      ]);

      setCourses(coursesRes.data || []);
      setLearningPaths(pathsRes.data || []);
      setStudentProgress(progressRes.data || []);
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
      const { data, error } = await supabase.functions.invoke('recommend-courses', {
        body: { studentId: student.id }
      });

      if (error) throw error;

      toast.success('Course recommendations generated!');
      loadData();
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      toast.error(error.message || 'Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  const startCourse = async (courseId: string) => {
    if (!student) return;

    try {
      const { error } = await supabase.from('student_progress').insert({
        student_id: student.id,
        course_id: courseId,
        status: 'in_progress',
        progress_percentage: 0,
        started_at: new Date().toISOString()
      });

      if (error) throw error;

      toast.success('Course started!');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to start course');
    }
  };

  const updateProgress = async (progressId: string, percentage: number) => {
    try {
      const updateData: any = {
        progress_percentage: percentage,
        status: percentage === 100 ? 'completed' : 'in_progress'
      };

      if (percentage === 100) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('student_progress')
        .update(updateData)
        .eq('id', progressId);

      if (error) throw error;

      toast.success('Progress updated!');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update progress');
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || course.level === filterLevel;
    const matchesCategory = filterCategory === 'all' || 
                           course.skills_covered?.some((skill: string) => 
                             skill.toLowerCase().includes(filterCategory.toLowerCase())
                           );
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const getCourseProgress = (courseId: string) => {
    return studentProgress.find(p => p.course_id === courseId);
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500',
      intermediate: 'bg-yellow-500',
      advanced: 'bg-orange-500',
      expert: 'bg-red-500'
    };
    return colors[level] || 'bg-gray-500';
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
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Learning Resources</h1>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="courses">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="courses">All Courses</TabsTrigger>
            <TabsTrigger value="my-courses">My Courses</TabsTrigger>
            <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          </TabsList>

          {/* All Courses Tab */}
          <TabsContent value="courses">
            <div className="space-y-6">
              {/* AI Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Course Recommendations</CardTitle>
                  <CardDescription>
                    Get personalized course suggestions based on your profile and career goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={generateRecommendations} disabled={generating} className="w-full">
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Recommendations...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Personalized Recommendations
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Select value={filterLevel} onValueChange={setFilterLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Filter by skill..."
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Courses List */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course) => {
                  const progress = getCourseProgress(course.id);
                  return (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getLevelColor(course.level)}>
                            {course.level}
                          </Badge>
                          {course.rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium">⭐ {course.rating}</span>
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{course.provider}</span>
                          <span className="font-medium">{course.price || 'Free'}</span>
                        </div>

                        {course.duration && (
                          <div className="text-sm text-muted-foreground">
                            Duration: {course.duration}
                          </div>
                        )}

                        {course.skills_covered && course.skills_covered.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {course.skills_covered.slice(0, 3).map((skill: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {course.skills_covered.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{course.skills_covered.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {progress ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span className="font-medium">{progress.progress_percentage}%</span>
                            </div>
                            <Progress value={progress.progress_percentage} />
                            {progress.status === 'completed' ? (
                              <Button variant="outline" className="w-full" disabled>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Completed
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => course.url && window.open(course.url, '_blank')}
                              >
                                Continue Learning
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Button onClick={() => startCourse(course.id)} className="w-full">
                            <Play className="w-4 h-4 mr-2" />
                            Start Course
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* My Courses Tab */}
          <TabsContent value="my-courses">
            <div className="space-y-4">
              {studentProgress.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Courses Started</h3>
                    <p className="text-muted-foreground mb-6">
                      Start learning by enrolling in courses from the All Courses tab
                    </p>
                  </CardContent>
                </Card>
              ) : (
                studentProgress.map((progress) => {
                  const course = courses.find(c => c.id === progress.course_id);
                  if (!course) return null;

                  return (
                    <Card key={progress.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{course.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {course.provider} • {course.duration}
                            </CardDescription>
                          </div>
                          <Badge variant={progress.status === 'completed' ? 'default' : 'secondary'}>
                            {progress.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span className="font-medium">{progress.progress_percentage}%</span>
                          </div>
                          <Progress value={progress.progress_percentage} />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => course.url && window.open(course.url, '_blank')}
                          >
                            Continue Learning
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                          {progress.status !== 'completed' && (
                            <Select
                              value={progress.progress_percentage.toString()}
                              onValueChange={(val) => updateProgress(progress.id, parseInt(val))}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="25">25%</SelectItem>
                                <SelectItem value="50">50%</SelectItem>
                                <SelectItem value="75">75%</SelectItem>
                                <SelectItem value="100">100%</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Learning Paths Tab */}
          <TabsContent value="paths">
            <div className="space-y-4">
              {learningPaths.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Learning Paths Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Generate career recommendations to create personalized learning paths
                    </p>
                    <Button onClick={() => navigate('/student/career-path')}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Go to Career Path
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                learningPaths.map((path) => (
                  <Card key={path.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        {path.title}
                      </CardTitle>
                      <CardDescription>
                        {path.career_domains?.name} • {path.estimated_duration}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{path.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Current Level:</span>
                          <span className="ml-2 font-medium">{path.current_level}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target Level:</span>
                          <span className="ml-2 font-medium">{path.target_level}</span>
                        </div>
                      </div>

                      {path.recommended_courses && path.recommended_courses.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Recommended Courses</h4>
                          <div className="space-y-1">
                            {path.recommended_courses.map((courseId: string, i: number) => {
                              const course = courses.find(c => c.id === courseId);
                              return course ? (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                                  <span>{course.title}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
