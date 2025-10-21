import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Upload, ArrowLeft, Loader2, Plus, Trash2, Sparkles, Award, Target, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [readinessScore, setReadinessScore] = useState<any>(null);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    registration_no: '',
    department: '',
    branch: '',
    year_of_study: 1,
    cgpa: '' as string | number,
    bio: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: ''
  });

  const [newSkill, setNewSkill] = useState({ skill_id: '', proficiency_level: 'beginner' });
  const [newProject, setNewProject] = useState({ title: '', description: '', technologies: '', github_url: '' });
  const [newCert, setNewCert] = useState({ title: '', issuer: '', issue_date: '' });
  const [newActivity, setNewActivity] = useState({ title: '', description: '', category: '' });

  useEffect(() => {
    loadStudentData();
    loadAvailableSkills();
  }, [user]);

  const loadStudentData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading student data:', error);
      return;
    }

    if (data) {
      setStudent(data);
      setFormData({
        registration_no: data.registration_no || '',
        department: data.department || '',
        branch: data.branch || '',
        year_of_study: data.year_of_study || 1,
        cgpa: data.cgpa || '',
        bio: data.bio || '',
        linkedin_url: data.linkedin_url || '',
        github_url: data.github_url || '',
        portfolio_url: data.portfolio_url || ''
      });

      // Load additional data
      const [skillsRes, projectsRes, certsRes, activitiesRes, scoreRes] = await Promise.all([
        supabase.from('student_skills').select('*, skills(*)').eq('student_id', data.id),
        supabase.from('projects').select('*').eq('student_id', data.id),
        supabase.from('certifications').select('*').eq('student_id', data.id),
        supabase.from('extracurricular_activities').select('*').eq('student_id', data.id),
        supabase.from('career_readiness_scores').select('*').eq('student_id', data.id).order('created_at', { ascending: false }).limit(1).single()
      ]);

      setSkills(skillsRes.data || []);
      setProjects(projectsRes.data || []);
      setCertifications(certsRes.data || []);
      setActivities(activitiesRes.data || []);
      setReadinessScore(scoreRes.data);
    }
  };

  const loadAvailableSkills = async () => {
    const { data } = await supabase.from('skills').select('*').order('name');
    setAvailableSkills(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('students')
        .update({
          ...formData,
          cgpa: formData.cgpa ? parseFloat(String(formData.cgpa)) : null
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      // Update profile completion status
      await supabase
        .from('profiles')
        .update({ profile_completed: true })
        .eq('id', user!.id);

      toast.success('Profile completed successfully!');
      navigate('/student/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('students')
        .update({
          ...formData,
          cgpa: formData.cgpa ? parseFloat(String(formData.cgpa)) : null
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      toast.success('Profile saved as draft!');
      loadStudentData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setLoading(true);
    try {
      const fileName = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      await supabase
        .from('students')
        .update({ resume_url: publicUrl })
        .eq('user_id', user!.id);

      toast.success('Resume uploaded successfully!');
      loadStudentData();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  const analyzeProfile = async () => {
    if (!student) return;
    setAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-profile', {
        body: { studentId: student.id }
      });

      if (error) throw error;

      toast.success('Profile analyzed successfully!');
      loadStudentData();
    } catch (error: any) {
      console.error('Error analyzing profile:', error);
      toast.error(error.message || 'Failed to analyze profile');
    } finally {
      setAnalyzing(false);
    }
  };

  const addSkill = async () => {
    if (!newSkill.skill_id || !student) return;

    try {
      const { error } = await supabase.from('student_skills').insert({
        student_id: student.id,
        skill_id: newSkill.skill_id,
        proficiency_level: newSkill.proficiency_level
      });

      if (error) throw error;

      toast.success('Skill added!');
      setNewSkill({ skill_id: '', proficiency_level: 'beginner' });
      loadStudentData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add skill');
    }
  };

  const deleteSkill = async (id: string) => {
    try {
      const { error } = await supabase.from('student_skills').delete().eq('id', id);
      if (error) throw error;
      toast.success('Skill removed');
      loadStudentData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove skill');
    }
  };

  const addProject = async () => {
    if (!newProject.title || !student) return;

    try {
      const { error } = await supabase.from('projects').insert({
        student_id: student.id,
        ...newProject,
        technologies: newProject.technologies.split(',').map(t => t.trim())
      });

      if (error) throw error;

      toast.success('Project added!');
      setNewProject({ title: '', description: '', technologies: '', github_url: '' });
      loadStudentData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add project');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      toast.success('Project removed');
      loadStudentData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove project');
    }
  };

  const addCertification = async () => {
    if (!newCert.title || !newCert.issuer || !student) return;

    try {
      const { error } = await supabase.from('certifications').insert({
        student_id: student.id,
        ...newCert,
        issue_date: newCert.issue_date || null
      });

      if (error) throw error;

      toast.success('Certification added!');
      setNewCert({ title: '', issuer: '', issue_date: '' });
      loadStudentData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add certification');
    }
  };

  const deleteCertification = async (id: string) => {
    try {
      const { error } = await supabase.from('certifications').delete().eq('id', id);
      if (error) throw error;
      toast.success('Certification removed');
      loadStudentData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove certification');
    }
  };

  const addActivity = async () => {
    if (!newActivity.title || !student) return;

    try {
      const { error } = await supabase.from('extracurricular_activities').insert({
        student_id: student.id,
        ...newActivity
      });

      if (error) throw error;

      toast.success('Activity added!');
      setNewActivity({ title: '', description: '', category: '' });
      loadStudentData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add activity');
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase.from('extracurricular_activities').delete().eq('id', id);
      if (error) throw error;
      toast.success('Activity removed');
      loadStudentData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove activity');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
              <GraduationCap className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Complete Your Profile</h1>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Career Readiness Score */}
        {readinessScore && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Career Readiness Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(readinessScore.overall_score)}`}>
                    {readinessScore.overall_score}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Overall</p>
                </div>
                {['academic', 'skills', 'experience', 'soft_skills'].map((key) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-semibold">{readinessScore[`${key}_score`]}</div>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{key.replace('_', ' ')}</p>
                    <Progress value={readinessScore[`${key}_score`]} className="mt-2" />
                  </div>
                ))}
              </div>
              <Button onClick={analyzeProfile} disabled={analyzing} className="w-full mt-4" variant="outline">
                {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Refresh Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Profile</CardTitle>
                <CardDescription>
                  Complete your profile to get personalized career recommendations
                </CardDescription>
              </div>
              {!readinessScore && student && (
                <Button onClick={analyzeProfile} disabled={analyzing}>
                  {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
                  Analyze Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="certs">Certs</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="resume">Resume</TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="registration_no">Registration Number *</Label>
                      <Input
                        id="registration_no"
                        value={formData.registration_no}
                        onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g., Computer Science"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch *</Label>
                      <Input
                        id="branch"
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        placeholder="e.g., CSE, IT, ECE"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year_of_study">Year of Study *</Label>
                      <Input
                        id="year_of_study"
                        type="number"
                        min="1"
                        max="4"
                        value={formData.year_of_study}
                        onChange={(e) => setFormData({ ...formData, year_of_study: parseInt(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cgpa">CGPA</Label>
                      <Input
                        id="cgpa"
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={formData.cgpa}
                        onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                        placeholder="e.g., 8.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Links</h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                        <Input
                          id="linkedin_url"
                          type="url"
                          value={formData.linkedin_url}
                          onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="github_url">GitHub URL</Label>
                        <Input
                          id="github_url"
                          type="url"
                          value={formData.github_url}
                          onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                          placeholder="https://github.com/yourusername"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="portfolio_url">Portfolio URL</Label>
                        <Input
                          id="portfolio_url"
                          type="url"
                          value={formData.portfolio_url}
                          onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                          placeholder="https://yourportfolio.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSaveAsDraft}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      Save as Draft
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Complete Profile'
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills">
                <div className="space-y-4 mt-6">
                  <div className="flex gap-2">
                    <Select value={newSkill.skill_id} onValueChange={(val) => setNewSkill({ ...newSkill, skill_id: val })}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select skill" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSkills.map(skill => (
                          <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newSkill.proficiency_level} onValueChange={(val) => setNewSkill({ ...newSkill, proficiency_level: val })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addSkill}><Plus className="w-4 h-4" /></Button>
                  </div>

                  <div className="space-y-2">
                    {skills.map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{skill.skills.name}</span>
                          <Badge variant="secondary" className="ml-2">{skill.proficiency_level}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteSkill(skill.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects">
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Input placeholder="Project Title" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
                    <Textarea placeholder="Description" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
                    <Input placeholder="Technologies (comma-separated)" value={newProject.technologies} onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })} />
                    <Input placeholder="GitHub URL" value={newProject.github_url} onChange={(e) => setNewProject({ ...newProject, github_url: e.target.value })} />
                    <Button onClick={addProject} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Project</Button>
                  </div>

                  <div className="space-y-2">
                    {projects.map((proj) => (
                      <Card key={proj.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{proj.title}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => deleteProject(proj.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">{proj.description}</p>
                          {proj.technologies && (
                            <div className="flex flex-wrap gap-1">
                              {proj.technologies.map((tech: string, i: number) => (
                                <Badge key={i} variant="outline">{tech}</Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Certifications Tab */}
              <TabsContent value="certs">
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Input placeholder="Certification Title" value={newCert.title} onChange={(e) => setNewCert({ ...newCert, title: e.target.value })} />
                    <Input placeholder="Issuer" value={newCert.issuer} onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })} />
                    <Input type="date" placeholder="Issue Date" value={newCert.issue_date} onChange={(e) => setNewCert({ ...newCert, issue_date: e.target.value })} />
                    <Button onClick={addCertification} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Certification</Button>
                  </div>

                  <div className="space-y-2">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{cert.title}</div>
                          <div className="text-sm text-muted-foreground">{cert.issuer}</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteCertification(cert.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Activities Tab */}
              <TabsContent value="activities">
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Input placeholder="Activity Title" value={newActivity.title} onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })} />
                    <Textarea placeholder="Description" value={newActivity.description} onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })} />
                    <Input placeholder="Category (e.g., Sports, Cultural)" value={newActivity.category} onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })} />
                    <Button onClick={addActivity} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Activity</Button>
                  </div>

                  <div className="space-y-2">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-sm text-muted-foreground">{activity.description}</div>
                          {activity.category && <Badge variant="outline" className="mt-1">{activity.category}</Badge>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteActivity(activity.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Resume Tab */}
              <TabsContent value="resume">
                <div className="space-y-6 mt-6">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Upload Your Resume</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      PDF, DOC, or DOCX (Max 5MB)
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      disabled={loading}
                      className="max-w-xs mx-auto"
                    />
                  </div>

                  {student?.resume_url && (
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <p className="text-sm font-medium mb-2">Current Resume</p>
                      <a
                        href={student.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View Resume
                      </a>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
