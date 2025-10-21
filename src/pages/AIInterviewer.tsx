import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, Video, VideoOff, Loader2, Check, AlertCircle,
  Eye, Smile, Zap, MessageSquare, TrendingUp, Target, Mic, MicOff,
  Brain, Activity, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line, Cell } from 'recharts';
import { toast } from 'sonner';
import { 
  initializeMediaPipe,
  detectAndDraw,
  cleanup,
  DetectionResult
} from '@/utils/MediaPipeDetection';
import { analyzeGrammar, getSpeakingPace, GrammarAnalysis } from '@/utils/GrammarChecker';
import { 
  generateSoftSkillRecommendations 
} from '@/utils/SoftSkillRecommendations';
import { RealTimeSpeechRecognition, SpeechRecognitionResult } from '@/utils/SpeechRecognition';
import SoftSkillRecommendations from '@/components/SoftSkillRecommendations';
import InterviewAnalyticsTable from '@/components/InterviewAnalyticsTable';
import CompanyRecommendations from '@/components/CompanyRecommendations';
import InterviewAnswerAnalysis from '@/components/InterviewAnswerAnalysis';
import AIQuizTest from '@/components/AIQuizTest';

export default function AIInterviewer() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [interviewQuestion, setInterviewQuestion] = useState('');
  const [spokenResponse, setSpokenResponse] = useState('');
  const [isAIReady, setIsAIReady] = useState(false);
  const [liveDetection, setLiveDetection] = useState<DetectionResult | null>(null);
  const [grammarAnalysis, setGrammarAnalysis] = useState<GrammarAnalysis | null>(null);
  const [liveGrammarAnalysis, setLiveGrammarAnalysis] = useState<GrammarAnalysis | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [aiAnswerAnalysis, setAiAnswerAnalysis] = useState<any>(null);
  const [isAnalyzingAnswer, setIsAnalyzingAnswer] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const detectionIntervalRef = useRef<number | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const speechRecognitionRef = useRef<RealTimeSpeechRecognition | null>(null);

  const questions = [
    "Tell me about yourself and your background.",
    "What are your greatest strengths?",
    "Describe a challenging situation you faced and how you handled it.",
    "Where do you see yourself in 5 years?",
    "Why should we hire you?"
  ];

  useEffect(() => {
    fetchStudentId();
    setInterviewQuestion(questions[Math.floor(Math.random() * questions.length)]);
    initializeAI();
    
    // Initialize speech recognition
    speechRecognitionRef.current = new RealTimeSpeechRecognition();
    if (!speechRecognitionRef.current.isSupported()) {
      toast.error('Speech recognition not supported in this browser. Please use Chrome.');
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        cancelAnimationFrame(detectionIntervalRef.current);
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      cleanup();
    };
  }, [user]);

  const initializeAI = async () => {
    toast.loading('Initializing MediaPipe AI models...');
    const success = await initializeMediaPipe();
    if (success) {
      setIsAIReady(true);
      toast.success('AI detection models ready!');
    } else {
      toast.error('AI initialization failed. Some features may be limited.');
    }
  };

  const fetchStudentId = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (data) setStudentId(data.id);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Start live detection
      if (isAIReady) {
        startLiveDetection();
      }
      
      toast.success('Camera and microphone ready');
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const startLiveDetection = () => {
    let startTime = performance.now();
    
    const detect = async () => {
      if (!videoRef.current || !overlayCanvasRef.current || !isRecording || !isAIReady) {
        detectionIntervalRef.current = requestAnimationFrame(detect);
        return;
      }
      
      try {
        const timestamp = performance.now() - startTime;
        const result = await detectAndDraw(
          videoRef.current,
          overlayCanvasRef.current,
          timestamp
        );
        setLiveDetection(result);
      } catch (error) {
        console.error('Detection error:', error);
      }
      
      detectionIntervalRef.current = requestAnimationFrame(detect);
    };

    detectionIntervalRef.current = requestAnimationFrame(detect);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const startInterview = () => {
    if (!stream) {
      toast.error('Please start camera first');
      return;
    }
    
    setIsRecording(true);
    setCapturedFrames([]);
    setAnalysis(null);
    setGrammarAnalysis(null);
    setLiveGrammarAnalysis(null);
    setLiveDetection(null);
    setFinalTranscript('');
    setInterimTranscript('');
    
    // Start live detection if AI is ready
    if (isAIReady) {
      startLiveDetection();
    }
    
    // Start speech recognition
    if (speechRecognitionRef.current && speechRecognitionRef.current.isSupported()) {
      speechRecognitionRef.current.start((result: SpeechRecognitionResult) => {
        if (result.isFinal) {
          setFinalTranscript(prev => prev + ' ' + result.transcript);
          // Analyze grammar in real-time
          const fullText = finalTranscript + ' ' + result.transcript;
          const grammarResult = analyzeGrammar(fullText);
          setLiveGrammarAnalysis(grammarResult);
        } else {
          setInterimTranscript(result.transcript);
        }
      });
      toast.success('🎤 Listening to your response...');
    }
    
    // Start audio recording
    startAudioRecording();
    
    // Capture frames every 2 seconds
    const interval = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        setCapturedFrames(prev => [...prev, frame]);
      }
    }, 2000);
    
    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      setIsRecording(false);
      stopAudioRecording();
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      toast.success('Interview recording complete! Analyzing...');
      setTimeout(() => {
        analyzeInterview();
        analyzeSpokenAnswer();
      }, 1000);
    }, 30000);
  };

  const startAudioRecording = async () => {
    if (!stream) return;
    
    try {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
      setIsRecordingAudio(true);
      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      console.log('Audio recording stopped');
    }
  };

  const analyzeSpokenAnswer = async () => {
    const fullTranscript = finalTranscript.trim();
    if (!fullTranscript) {
      console.log('No transcript to analyze');
      return;
    }

    setIsAnalyzingAnswer(true);
    toast.loading('AI is analyzing your answer...');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-spoken-answer', {
        body: {
          question: interviewQuestion,
          candidateAnswer: fullTranscript
        }
      });

      if (error) throw error;

      setAiAnswerAnalysis(data.analysis);
      toast.success('AI answer analysis complete!');
    } catch (error: any) {
      console.error('Error analyzing answer:', error);
      toast.error(error.message || 'Failed to analyze answer');
    } finally {
      setIsAnalyzingAnswer(false);
    }
  };

  const analyzeInterview = async () => {
    if (!studentId || capturedFrames.length === 0) {
      toast.error('No frames captured');
      return;
    }
    
    setAnalyzing(true);
    
    try {
      // Use the transcript from speech recognition
      const fullTranscript = finalTranscript.trim();
      
      // Analyze grammar with the spoken transcript
      let grammarResult = null;
      if (fullTranscript) {
        grammarResult = analyzeGrammar(fullTranscript);
        const paceResult = getSpeakingPace(fullTranscript, 30);
        setGrammarAnalysis({
          ...grammarResult,
          ...paceResult
        });
      }

      const { data, error } = await supabase.functions.invoke('analyze-interview-video', {
        body: {
          studentId,
          videoFrames: capturedFrames,
          transcript: fullTranscript || `Question asked: ${interviewQuestion}`
        }
      });
      
      if (error) throw error;
      
      // Enhance analysis with grammar data
      const enhancedAnalysis = {
        ...data.analysis,
        grammar_analysis: grammarResult,
        soft_skill_recommendations: generateSoftSkillRecommendations(data.analysis)
      };
      
      setAnalysis(enhancedAnalysis);
      toast.success('Complete analysis ready!');
      stopCamera();
    } catch (error: any) {
      console.error('Error analyzing interview:', error);
      toast.error(error.message || 'Failed to analyze interview');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getNervousnessColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[level] || colors.medium;
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
              <Video className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">AI Interview Analyzer</h1>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>Sign Out</Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>AI-Powered Interview Analysis</CardTitle>
            <CardDescription>
              Practice your interview skills with our AI analyzer. We'll assess your confidence, body language,
              facial expressions, and communication skills to help you improve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Enable your camera and position yourself in frame</li>
                    <li>Answer the interview question naturally (30 seconds)</li>
                    <li>Our AI will analyze your facial expressions, posture, confidence, and more</li>
                    <li>Receive detailed feedback and company recommendations</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Section */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Interview Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-lg font-medium">{interviewQuestion}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover absolute inset-0"
                    />
                    <canvas
                      ref={overlayCanvasRef}
                      className="w-full h-full object-cover absolute inset-0 pointer-events-none"
                    />
                    {!stream && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <VideoOff className="w-16 h-16 text-gray-500" />
                      </div>
                    )}
                    {isRecording && liveDetection && (
                      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg space-y-2 max-w-[250px]">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="font-semibold">🎯 Live Detection Active</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-300">Face:</span>
                            <span className="ml-1 font-semibold">{liveDetection.faceDetected ? '✓' : '✗'}</span>
                          </div>
                          <div>
                            <span className="text-gray-300">Hands:</span>
                            <span className="ml-1 font-semibold">{liveDetection.handGestures.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-300">Eye Contact:</span>
                            <span className="ml-1 font-semibold">{Math.round(liveDetection.eyeContact)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-300">Engagement:</span>
                            <span className="ml-1 font-semibold">{Math.round(liveDetection.engagement)}%</span>
                          </div>
                        </div>
                        {liveDetection.handGestures.length > 0 && (
                          <div className="text-xs">
                            <span className="text-gray-300">Gestures:</span>
                            <span className="ml-1 font-semibold text-cyan-300">
                              {liveDetection.handGestures.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Real-time Transcript Display */}
                {isRecording && (finalTranscript || interimTranscript) && (
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Mic className="w-4 h-4 text-blue-500 animate-pulse" />
                        Live Transcript
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold text-foreground">{finalTranscript}</span>
                        <span className="text-muted-foreground italic"> {interimTranscript}</span>
                      </div>
                      {liveGrammarAnalysis && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                          <div className="text-xs">
                            <div className="text-muted-foreground">Grammar</div>
                            <div className="font-bold text-lg">{liveGrammarAnalysis.grammarScore}%</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-muted-foreground">Fluency</div>
                            <div className="font-bold text-lg">{liveGrammarAnalysis.fluencyScore}%</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-muted-foreground">Vocabulary</div>
                            <div className="font-bold text-lg">{liveGrammarAnalysis.vocabularyScore}%</div>
                          </div>
                        </div>
                      )}
                      {liveGrammarAnalysis && liveGrammarAnalysis.errors.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-xs font-semibold mb-1 text-red-600">Issues Detected:</div>
                          {liveGrammarAnalysis.errors.slice(0, 3).map((error, idx) => (
                            <div key={idx} className="text-xs text-red-600 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{error.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  {!stream ? (
                    <Button onClick={startCamera} className="flex-1">
                      <Video className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={startInterview}
                        disabled={isRecording || analyzing}
                        className="flex-1"
                      >
                        {isRecording ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Recording ({Math.floor(capturedFrames.length * 2)}s)
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Start 30s Interview
                          </>
                        )}
                      </Button>
                      <Button onClick={stopCamera} variant="outline">
                        Stop Camera
                      </Button>
                    </>
                  )}
                </div>

                {analyzing && (
                  <div className="text-center py-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Analyzing your interview performance...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Stats */}
          <Card>
            <CardHeader>
              <CardTitle>What We Analyze</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Eye Contact & Confidence</p>
                    <p className="text-sm text-muted-foreground">
                      Camera engagement and confidence level
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Smile className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Facial Expressions</p>
                    <p className="text-sm text-muted-foreground">
                      Emotional appropriateness and engagement
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Body Language & Posture</p>
                    <p className="text-sm text-muted-foreground">
                      Professional demeanor and positioning
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Communication & Grammar</p>
                    <p className="text-sm text-muted-foreground">
                      Clarity, pace, grammar, and articulation
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Deep Learning AI Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Real-time facial emotion and gesture detection
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Personalized Recommendations</p>
                    <p className="text-sm text-muted-foreground">
                      YouTube tutorials and practice exercises
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Overall Score with Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Interview Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-center">
                    <div className={`text-6xl font-bold ${getScoreColor(analysis.overall_soft_skills_score)}`}>
                      {analysis.overall_soft_skills_score}
                    </div>
                    <span className="text-2xl text-muted-foreground">/100</span>
                    <p className="text-sm text-muted-foreground mt-2">Overall Score</p>
                    <div className="mt-4 w-full">
                      <Progress value={analysis.overall_soft_skills_score} className="h-3" />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={[
                      { skill: 'Confidence', score: analysis.confidence_score },
                      { skill: 'Eye Contact', score: analysis.eye_contact_score },
                      { skill: 'Expression', score: analysis.facial_expression_score },
                      { skill: 'Posture', score: analysis.posture_score },
                      { skill: 'Communication', score: analysis.communication_clarity_score }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar name="Your Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Scores with Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Confidence', score: analysis.confidence_score },
                      { name: 'Eye Contact', score: analysis.eye_contact_score },
                      { name: 'Expression', score: analysis.facial_expression_score },
                      { name: 'Posture', score: analysis.posture_score },
                      { name: 'Communication', score: analysis.communication_clarity_score }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                        {[
                          { label: 'Confidence', score: analysis.confidence_score },
                          { label: 'Eye Contact', score: analysis.eye_contact_score },
                          { label: 'Expression', score: analysis.facial_expression_score },
                          { label: 'Posture', score: analysis.posture_score },
                          { label: 'Communication', score: analysis.communication_clarity_score }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.score >= 80 ? 'rgb(34, 197, 94)' : 
                            entry.score >= 60 ? 'rgb(234, 179, 8)' : 
                            'rgb(249, 115, 22)'
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Confidence', score: analysis.confidence_score, icon: Zap },
                    { label: 'Eye Contact', score: analysis.eye_contact_score, icon: Eye },
                    { label: 'Facial Expressions', score: analysis.facial_expression_score, icon: Smile },
                    { label: 'Posture', score: analysis.posture_score, icon: TrendingUp },
                    { label: 'Communication Clarity', score: analysis.communication_clarity_score, icon: MessageSquare }
                  ].map(({ label, score, icon: Icon }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="font-medium">{label}</span>
                        </div>
                        <span className={`text-lg font-semibold ${getScoreColor(score)}`}>
                          {score}/100
                        </span>
                      </div>
                      <Progress value={score} />
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Nervousness Level</span>
                      <Badge className={getNervousnessColor(analysis.nervousness_level)}>
                        {analysis.nervousness_level}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-medium">Speaking Pace</span>
                      <Badge variant="outline">{analysis.speaking_pace}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedback */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.strengths?.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-600">Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.areas_for_improvement?.map((area: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Grammar Analysis with Charts */}
            {grammarAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Grammar & Communication Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Grammar</span>
                          <span className="text-sm font-semibold">{grammarAnalysis.grammarScore}/100</span>
                        </div>
                        <Progress value={grammarAnalysis.grammarScore} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Fluency</span>
                          <span className="text-sm font-semibold">{grammarAnalysis.fluencyScore}/100</span>
                        </div>
                        <Progress value={grammarAnalysis.fluencyScore} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Vocabulary</span>
                          <span className="text-sm font-semibold">{grammarAnalysis.vocabularyScore}/100</span>
                        </div>
                        <Progress value={grammarAnalysis.vocabularyScore} />
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[
                        { name: 'Grammar', score: grammarAnalysis.grammarScore },
                        { name: 'Fluency', score: grammarAnalysis.fluencyScore },
                        { name: 'Vocabulary', score: grammarAnalysis.vocabularyScore }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {grammarAnalysis.errors && grammarAnalysis.errors.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Grammar Suggestions:</h4>
                      <ul className="space-y-2">
                        {grammarAnalysis.errors.map((error: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              error.severity === 'major' ? 'text-red-500' : 
                              error.severity === 'moderate' ? 'text-orange-500' : 
                              'text-yellow-500'
                            }`} />
                            <div>
                              <p className="font-medium">{error.message}</p>
                              <p className="text-muted-foreground">{error.suggestion}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {grammarAnalysis.wordsPerMinute && (
                    <div className="border-t pt-4">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Speaking Pace:</span>
                          <Badge variant="outline">{grammarAnalysis.wordsPerMinute} WPM ({grammarAnalysis.pace})</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{grammarAnalysis.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Detailed Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>AI Comprehensive Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{analysis.detailed_feedback}</p>
              </CardContent>
            </Card>

            {/* Analytics Table */}
            <InterviewAnalyticsTable analysis={analysis} grammarAnalysis={grammarAnalysis} />

            {/* Company Recommendations */}
            <CompanyRecommendations analysis={analysis} />

            {/* AI-Powered Answer Analysis */}
            {finalTranscript && aiAnswerAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    AI Answer Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <InterviewAnswerAnalysis
                    question={interviewQuestion}
                    candidateAnswer={finalTranscript}
                    expectedPoints={aiAnswerAnalysis.expectedPoints || []}
                    correctAnswer={aiAnswerAnalysis.correctAnswer}
                  />

                  {/* AI Grammar Issues */}
                  {aiAnswerAnalysis.grammarIssues && aiAnswerAnalysis.grammarIssues.length > 0 && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        AI-Detected Language Issues
                      </h3>
                      <div className="space-y-3">
                        {aiAnswerAnalysis.grammarIssues.map((issue: any, idx: number) => (
                          <div key={idx} className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <div className="flex items-start gap-3">
                              <Badge variant="outline" className="mt-0.5">{issue.category}</Badge>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-orange-900 dark:text-orange-100">{issue.issue}</p>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                  ✓ <span className="font-semibold">Correction:</span> {issue.correction}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Quality */}
                  {aiAnswerAnalysis.contentQuality && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Content Quality Assessment</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Overall Content Score</span>
                            <span className="text-2xl font-bold text-primary">{aiAnswerAnalysis.contentQuality.score}/100</span>
                          </div>
                          <Progress value={aiAnswerAnalysis.contentQuality.score} className="h-3" />
                        </div>

                        {aiAnswerAnalysis.contentQuality.strengths && aiAnswerAnalysis.contentQuality.strengths.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                              <Check className="w-4 h-4" />
                              Strengths
                            </h4>
                            <ul className="space-y-1">
                              {aiAnswerAnalysis.contentQuality.strengths.map((strength: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiAnswerAnalysis.contentQuality.improvements && aiAnswerAnalysis.contentQuality.improvements.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Areas for Improvement
                            </h4>
                            <ul className="space-y-1">
                              {aiAnswerAnalysis.contentQuality.improvements.map((improvement: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                  <span>{improvement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Overall AI Feedback */}
                  {aiAnswerAnalysis.overallFeedback && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-3">AI Comprehensive Feedback</h3>
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiAnswerAnalysis.overallFeedback}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isAnalyzingAnswer && (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-lg">AI is analyzing your answer...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Soft Skill Recommendations */}
            {analysis.soft_skill_recommendations && (
              <SoftSkillRecommendations recommendations={analysis.soft_skill_recommendations} />
            )}

            {/* AI Quiz Test */}
            {studentId && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Test Your Knowledge</h2>
                <AIQuizTest studentId={studentId} topic="Interview Skills" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
