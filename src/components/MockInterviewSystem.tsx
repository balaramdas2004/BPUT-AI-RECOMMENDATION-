import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Mic, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface MockInterview {
  id: string;
  interview_type: string;
  difficulty: string;
  questions: any[];
  responses: any[];
  overall_score: number;
  status: string;
}

export function MockInterviewSystem({ studentId }: { studentId: string }) {
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [currentInterview, setCurrentInterview] = useState<MockInterview | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const [newInterviewType, setNewInterviewType] = useState('technical');
  const [newInterviewDifficulty, setNewInterviewDifficulty] = useState('medium');

  useEffect(() => {
    fetchInterviews();
  }, [studentId]);

  const fetchInterviews = async () => {
    const { data } = await supabase
      .from('mock_interviews' as any)
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (data) setInterviews(data as any);
  };

  const generateInterview = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-mock-interview', {
        body: {
          studentId,
          interviewType: newInterviewType,
          difficulty: newInterviewDifficulty
        }
      });

      if (error) throw error;

      toast({
        title: "Interview Generated",
        description: "Your mock interview is ready to start!"
      });

      fetchInterviews();
    } catch (error: any) {
      console.error('Error generating interview:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate mock interview.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const startInterview = (interview: MockInterview) => {
    setCurrentInterview(interview);
    setCurrentQuestionIndex(0);
    setUserResponse('');
  };

  const submitResponse = async () => {
    if (!currentInterview || !userResponse.trim()) return;

    setLoading(true);
    try {
      const responses = currentInterview.responses || [];
      responses.push({
        questionIndex: currentQuestionIndex,
        response: userResponse
      });

      await supabase
        .from('mock_interviews' as any)
        .update({
          responses,
          status: currentQuestionIndex === currentInterview.questions.length - 1 ? 'completed' : 'in_progress'
        })
        .eq('id', currentInterview.id);

      if (currentQuestionIndex < currentInterview.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setUserResponse('');
      } else {
        toast({
          title: "Interview Completed",
          description: "Your responses have been recorded. Feedback will be generated."
        });
        setCurrentInterview(null);
        fetchInterviews();
      }
    } catch (error: any) {
      console.error('Error submitting response:', error);
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (currentInterview) {
    const currentQuestion = currentInterview.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentInterview.questions.length) * 100;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mock Interview in Progress</CardTitle>
              <CardDescription>
                Question {currentQuestionIndex + 1} of {currentInterview.questions.length}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="capitalize">
              {currentInterview.interview_type}
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Question:</h4>
            <p className="text-muted-foreground">{currentQuestion.question}</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Your Response:</label>
            <Textarea
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Type your answer here..."
              className="min-h-[200px]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={submitResponse}
              disabled={loading || !userResponse.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : currentQuestionIndex === currentInterview.questions.length - 1 ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit & Complete
                </>
              ) : (
                'Next Question'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentInterview(null);
                setUserResponse('');
              }}
            >
              Exit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Mock Interview Practice
        </CardTitle>
        <CardDescription>
          Practice with AI-generated interview questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Interview */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-semibold">Start New Interview</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={newInterviewType} onValueChange={setNewInterviewType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="hr">HR Round</SelectItem>
                  <SelectItem value="case_study">Case Study</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={newInterviewDifficulty} onValueChange={setNewInterviewDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generateInterview} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Interview
              </>
            )}
          </Button>
        </div>

        {/* Previous Interviews */}
        <div>
          <h4 className="font-semibold mb-4">Previous Interviews</h4>
          <div className="space-y-3">
            {interviews.length > 0 ? (
              interviews.map((interview) => (
                <div key={interview.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {interview.interview_type}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {interview.difficulty}
                      </Badge>
                      {interview.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    {interview.overall_score && (
                      <span className="font-semibold">{interview.overall_score}%</span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {interview.questions.length} questions • {interview.status === 'completed' ? 'Completed' : 'In Progress'}
                  </p>

                  {interview.status !== 'completed' && (
                    <Button
                      onClick={() => startInterview(interview)}
                      variant="outline"
                      size="sm"
                    >
                      Continue Interview
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No interviews yet. Generate your first mock interview above!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}