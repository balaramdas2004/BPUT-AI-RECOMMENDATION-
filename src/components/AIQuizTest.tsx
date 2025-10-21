import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, Clock, CheckCircle, XCircle, Award } from 'lucide-react';
import InterviewAnswerAnalysis from './InterviewAnswerAnalysis';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  expectedPoints: string[];
}

interface AIQuizTestProps {
  studentId: string;
  topic?: string;
}

export default function AIQuizTest({ studentId, topic = 'Technical Interview' }: AIQuizTestProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizStarted && !showResults && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleFinishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, showResults, timeLeft]);

  const generateQuiz = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-mock-interview', {
        body: {
          interviewType: topic,
          difficulty: 'medium',
          studentId
        }
      });

      if (error) throw error;

      const quizQuestions: QuizQuestion[] = data.questions.map((q: any) => ({
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || q.expectedPoints?.[0] || '',
        explanation: q.explanation || '',
        expectedPoints: q.expectedPoints || []
      }));

      setQuestions(quizQuestions);
      setQuizStarted(true);
      toast({
        title: 'Quiz Generated',
        description: `${quizQuestions.length} questions ready!`
      });
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate quiz',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setSelectedAnswer('');

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = () => {
    const finalAnswers = [...answers];
    finalAnswers[currentQuestion] = selectedAnswer;
    setAnswers(finalAnswers);
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quizStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            AI-Powered Quiz Test
          </CardTitle>
          <CardDescription>
            Test your knowledge with an AI-generated quiz on {topic}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Quiz Details:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 5 AI-generated questions</li>
              <li>• 5 minutes time limit</li>
              <li>• Instant feedback with detailed analysis</li>
              <li>• Grammar and answer quality assessment</li>
            </ul>
          </div>
          <Button 
            onClick={generateQuiz} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Generating Quiz...' : 'Start Quiz'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Quiz Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-5xl font-bold text-primary">{score}%</div>
              <p className="text-muted-foreground">
                You got {questions.filter((q, idx) => answers[idx] === q.correctAnswer).length} out of {questions.length} correct
              </p>
              <Progress value={score} className="h-3" />
            </div>
            
            <Alert className={score >= 70 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                {score >= 70 ? '🎉 Great job! You have a solid understanding.' : '📚 Keep practicing to improve your knowledge.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {questions.map((q, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Question {idx + 1}
                {answers[idx] === q.correctAnswer ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InterviewAnswerAnalysis
                question={q.question}
                candidateAnswer={answers[idx] || ''}
                expectedPoints={q.expectedPoints}
                correctAnswer={q.explanation}
              />
            </CardContent>
          </Card>
        ))}

        <Button 
          onClick={() => {
            setQuizStarted(false);
            setShowResults(false);
            setCurrentQuestion(0);
            setAnswers([]);
            setTimeLeft(300);
          }}
          className="w-full"
        >
          Take Another Quiz
        </Button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Question {currentQuestion + 1} of {questions.length}
          </CardTitle>
          <Badge variant={timeLeft < 60 ? 'destructive' : 'secondary'}>
            <Clock className="w-3 h-3 mr-1" />
            {formatTime(timeLeft)}
          </Badge>
        </div>
        <Progress value={(currentQuestion / questions.length) * 100} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-4">{currentQ.question}</h3>
          
          <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
            <div className="space-y-3">
              {currentQ.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={option} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleNextQuestion}
            disabled={!selectedAnswer}
            className="flex-1"
          >
            {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </Button>
          {currentQuestion === questions.length - 1 && (
            <Button
              onClick={handleFinishQuiz}
              variant="outline"
            >
              Submit Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
