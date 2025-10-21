import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Award, CheckCircle, XCircle, Upload, FileCheck } from 'lucide-react';

interface SkillAssessment {
  id: string;
  skill_id: string;
  score: number;
  verified: boolean;
  assessment_type: string;
  skills: { name: string };
}

export function SkillVerification({ studentId }: { studentId: string }) {
  const [assessments, setAssessments] = useState<SkillAssessment[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [assessmentType, setAssessmentType] = useState<string>('quiz');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAssessments();
    fetchSkills();
  }, [studentId]);

  const fetchAssessments = async () => {
    const { data } = await supabase
      .from('skill_assessments' as any)
      .select('*, skills(name)')
      .eq('student_id', studentId)
      .order('assessed_at', { ascending: false });

    if (data) setAssessments(data as any);
  };

  const fetchSkills = async () => {
    const { data } = await supabase
      .from('skills')
      .select('*')
      .order('name');

    if (data) setSkills(data);
  };

  const addAssessment = async () => {
    if (!selectedSkill) {
      toast({
        title: "Select Skill",
        description: "Please select a skill to assess.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('skill_assessments' as any)
        .insert({
          student_id: studentId,
          skill_id: selectedSkill,
          assessment_type: assessmentType,
          score: 0, // Will be updated after assessment
          verified: false
        });

      if (error) throw error;

      toast({
        title: "Assessment Added",
        description: "Skill assessment has been created. Complete it to get verified."
      });

      fetchAssessments();
      setSelectedSkill('');
    } catch (error: any) {
      console.error('Error adding assessment:', error);
      toast({
        title: "Failed to Add",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerificationIcon = (verified: boolean) => {
    return verified ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skill Verification
            </CardTitle>
            <CardDescription>
              Verify your skills through assessments and certifications
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Add Assessment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Skill Assessment</DialogTitle>
                <DialogDescription>
                  Choose a skill and assessment type to get verified
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Skill</label>
                  <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {skills.map((skill) => (
                        <SelectItem key={skill.id} value={skill.id}>
                          {skill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Assessment Type</label>
                  <Select value={assessmentType} onValueChange={setAssessmentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz">Online Quiz</SelectItem>
                      <SelectItem value="project">Project Work</SelectItem>
                      <SelectItem value="certification">External Certification</SelectItem>
                      <SelectItem value="interview">Technical Interview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={addAssessment} disabled={loading} className="w-full">
                  {loading ? 'Adding...' : 'Add Assessment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assessments.length > 0 ? (
            assessments.map((assessment) => (
              <div key={assessment.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{assessment.skills.name}</h4>
                      {getVerificationIcon(assessment.verified)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileCheck className="h-3 w-3" />
                      <span className="capitalize">{assessment.assessment_type}</span>
                      {assessment.verified && (
                        <Badge variant="default" className="ml-2">Verified</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {assessment.score > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-medium">{assessment.score}%</span>
                    </div>
                    <Progress value={assessment.score} className="h-2" />
                  </div>
                )}

                {!assessment.verified && assessment.score > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Pending admin verification
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No skill assessments yet
              </p>
              <p className="text-sm text-muted-foreground">
                Add your first assessment to start building your verified skill portfolio
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}