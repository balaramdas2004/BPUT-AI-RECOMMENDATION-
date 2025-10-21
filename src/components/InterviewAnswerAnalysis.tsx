import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, XCircle, AlertCircle, Lightbulb, 
  MessageSquare, TrendingUp, BarChart3 
} from 'lucide-react';
import { analyzeGrammar, GrammarAnalysis } from '@/utils/GrammarChecker';

interface AnswerAnalysisProps {
  question: string;
  candidateAnswer: string;
  expectedPoints: string[];
  correctAnswer?: string;
}

export default function InterviewAnswerAnalysis({ 
  question, 
  candidateAnswer, 
  expectedPoints,
  correctAnswer 
}: AnswerAnalysisProps) {
  const grammarAnalysis: GrammarAnalysis = analyzeGrammar(candidateAnswer);
  
  // Calculate answer accuracy based on expected points coverage
  const calculateAccuracy = () => {
    if (!candidateAnswer || !expectedPoints.length) return 0;
    
    const lowerAnswer = candidateAnswer.toLowerCase();
    const coveredPoints = expectedPoints.filter(point => 
      lowerAnswer.includes(point.toLowerCase().split(' ').slice(0, 3).join(' '))
    );
    
    return Math.round((coveredPoints.length / expectedPoints.length) * 100);
  };

  const accuracy = calculateAccuracy();
  const isCorrect = accuracy >= 60;
  const coveredPoints = expectedPoints.filter(point => 
    candidateAnswer.toLowerCase().includes(point.toLowerCase().split(' ').slice(0, 3).join(' '))
  );
  const missedPoints = expectedPoints.filter(point => 
    !candidateAnswer.toLowerCase().includes(point.toLowerCase().split(' ').slice(0, 3).join(' '))
  );

  return (
    <div className="space-y-6">
      {/* Overall Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            Answer Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Accuracy Score</span>
            <span className={`text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {accuracy}%
            </span>
          </div>
          <Progress value={accuracy} className="h-3" />
          
          <Alert className={isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription className="text-sm">
              {isCorrect 
                ? '✓ Good answer! You covered most key points.' 
                : '✗ Answer needs improvement. Review the feedback below.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Grammar Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Grammar & Communication Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Grammar</div>
              <div className="flex items-center gap-2">
                <Progress value={grammarAnalysis.grammarScore} className="flex-1" />
                <span className="text-sm font-semibold">{grammarAnalysis.grammarScore}%</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Fluency</div>
              <div className="flex items-center gap-2">
                <Progress value={grammarAnalysis.fluencyScore} className="flex-1" />
                <span className="text-sm font-semibold">{grammarAnalysis.fluencyScore}%</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Vocabulary</div>
              <div className="flex items-center gap-2">
                <Progress value={grammarAnalysis.vocabularyScore} className="flex-1" />
                <span className="text-sm font-semibold">{grammarAnalysis.vocabularyScore}%</span>
              </div>
            </div>
          </div>

          {grammarAnalysis.errors.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                Grammatical Issues Found
              </h4>
              <div className="space-y-2">
                {grammarAnalysis.errors.map((error, idx) => (
                  <Alert key={idx} variant="destructive" className="bg-red-50 border-red-200">
                    <AlertDescription className="text-sm">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">{error.category}</Badge>
                        <div className="flex-1">
                          <div className="font-medium">{error.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            💡 Suggestion: {error.suggestion}
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {grammarAnalysis.errors.length === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription>No grammatical errors detected. Excellent!</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Points Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Key Points Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {coveredPoints.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-green-600 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Covered Points ({coveredPoints.length}/{expectedPoints.length})
              </h4>
              <ul className="space-y-2">
                {coveredPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {missedPoints.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-red-600 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Missed Points ({missedPoints.length}/{expectedPoints.length})
              </h4>
              <ul className="space-y-2">
                {missedPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Correct Answer & Feedback */}
      {correctAnswer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Model Answer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm leading-relaxed">{correctAnswer}</p>
            </div>
            
            <Alert>
              <TrendingUp className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Improvement Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {missedPoints.length > 0 && (
                      <li>Include the {missedPoints.length} missed key point{missedPoints.length > 1 ? 's' : ''} in your answer</li>
                    )}
                    {grammarAnalysis.grammarScore < 80 && (
                      <li>Work on grammar fundamentals - review the errors above</li>
                    )}
                    {grammarAnalysis.fluencyScore < 80 && (
                      <li>Practice speaking more smoothly and coherently</li>
                    )}
                    {grammarAnalysis.vocabularyScore < 80 && (
                      <li>Expand your vocabulary with industry-specific terms</li>
                    )}
                    {accuracy < 60 && (
                      <li>Study the model answer to understand the expected depth</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
