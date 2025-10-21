import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send } from 'lucide-react';

interface InterviewFeedbackProps {
  interviewId: string;
  employerId: string;
  onSubmitted?: () => void;
}

export function InterviewFeedback({ interviewId, employerId, onSubmitted }: InterviewFeedbackProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    communicationScore: 3,
    technicalScore: 3,
    problemSolvingScore: 3,
    culturalFitScore: 3,
    strengths: '',
    areasForImprovement: '',
    feedbackText: '',
    wouldHire: false
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const overallRating = Math.round(
        (formData.communicationScore + 
         formData.technicalScore + 
         formData.problemSolvingScore + 
         formData.culturalFitScore) / 4
      );

      const { error } = await supabase
        .from('interview_feedback')
        .insert({
          interview_id: interviewId,
          employer_id: employerId,
          communication_score: formData.communicationScore,
          technical_score: formData.technicalScore,
          problem_solving_score: formData.problemSolvingScore,
          cultural_fit_score: formData.culturalFitScore,
          overall_rating: overallRating,
          strengths: formData.strengths,
          areas_for_improvement: formData.areasForImprovement,
          feedback_text: formData.feedbackText,
          would_hire: formData.wouldHire
        });

      if (error) throw error;

      // Update interview status based on feedback
      await supabase
        .from('interviews')
        .update({ 
          status: formData.wouldHire ? 'completed' : 'rejected',
          rating: overallRating
        })
        .eq('id', interviewId);

      toast({
        title: "Feedback Submitted",
        description: "Interview feedback has been recorded successfully."
      });

      onSubmitted?.();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit interview feedback.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Interview Feedback
        </CardTitle>
        <CardDescription>
          Provide detailed feedback to help improve candidate matching
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Sliders */}
          <div className="space-y-4">
            <div>
              <Label>Communication Skills</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[formData.communicationScore]}
                  onValueChange={([value]) => setFormData({ ...formData, communicationScore: value })}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">{formData.communicationScore}/5</span>
              </div>
            </div>

            <div>
              <Label>Technical Knowledge</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[formData.technicalScore]}
                  onValueChange={([value]) => setFormData({ ...formData, technicalScore: value })}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">{formData.technicalScore}/5</span>
              </div>
            </div>

            <div>
              <Label>Problem Solving</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[formData.problemSolvingScore]}
                  onValueChange={([value]) => setFormData({ ...formData, problemSolvingScore: value })}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">{formData.problemSolvingScore}/5</span>
              </div>
            </div>

            <div>
              <Label>Cultural Fit</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[formData.culturalFitScore]}
                  onValueChange={([value]) => setFormData({ ...formData, culturalFitScore: value })}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">{formData.culturalFitScore}/5</span>
              </div>
            </div>
          </div>

          {/* Text Feedback */}
          <div>
            <Label htmlFor="strengths">Key Strengths</Label>
            <Textarea
              id="strengths"
              value={formData.strengths}
              onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
              placeholder="What did the candidate excel at?"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="improvements">Areas for Improvement</Label>
            <Textarea
              id="improvements"
              value={formData.areasForImprovement}
              onChange={(e) => setFormData({ ...formData, areasForImprovement: e.target.value })}
              placeholder="What could the candidate work on?"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="feedback">Additional Feedback</Label>
            <Textarea
              id="feedback"
              value={formData.feedbackText}
              onChange={(e) => setFormData({ ...formData, feedbackText: e.target.value })}
              placeholder="Any other comments or observations?"
              className="mt-2"
            />
          </div>

          {/* Hiring Decision */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <Label htmlFor="wouldHire">Would you hire this candidate?</Label>
              <p className="text-sm text-muted-foreground">Based on this interview performance</p>
            </div>
            <Switch
              id="wouldHire"
              checked={formData.wouldHire}
              onCheckedChange={(checked) => setFormData({ ...formData, wouldHire: checked })}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              'Submitting...'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Feedback
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}