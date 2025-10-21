import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ChatWidget from '@/components/ChatWidget';
import SupportChat from '@/components/SupportChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, TrendingUp, Plus, Loader2, Search } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { EmployerOnboarding } from '@/components/EmployerOnboarding';

interface Employer {
  id: string;
  company_name: string;
  verification_status: string;
}

interface JobPosting {
  id: string;
  title: string;
  status: string;
  location: string;
  job_type: string;
  created_at: string;
  applications: { count: number }[];
}

interface Application {
  id: string;
  status: string;
  match_score: number;
  applied_at: string;
  students: {
    id: string;
    registration_no: string;
    cgpa: number;
    branch: string;
    profiles: {
      full_name: string;
      email: string;
    };
  };
  job_postings: {
    title: string;
  };
}

export default function EmployerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isMatchingCandidates, setIsMatchingCandidates] = useState(false);
  const [selectedJobForMatching, setSelectedJobForMatching] = useState<string | null>(null);
  const [isSchedulingInterview, setIsSchedulingInterview] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [applicationFilter, setApplicationFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('jobs');
  const [interviewData, setInterviewData] = useState({
    scheduled_at: '',
    interview_type: 'technical',
    meeting_link: '',
    location: '',
    duration_minutes: 60,
    interviewer_name: '',
    round_number: 1,
  });

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    job_type: 'full-time',
    location: '',
    location_type: 'on-site',
    experience_required: 'entry',
    salary_range: '',
    skills_required: '',
    qualifications: '',
    responsibilities: '',
  });

  useEffect(() => {
    fetchEmployerData();
  }, [user]);

  const fetchEmployerData = async () => {
    if (!user) return;

    try {
      const { data: employerData, error: employerError } = await supabase
        .from('employers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (employerError) throw employerError;
      setEmployer(employerData);

      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select('*, applications(count)')
        .eq('employer_id', employerData.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          students(
            id,
            registration_no,
            cgpa,
            branch,
            user_id
          ),
          job_postings(title)
        `)
        .in('job_posting_id', jobsData?.map(j => j.id) || [])
        .order('applied_at', { ascending: false });
      
      // Fetch profiles separately and merge
      const studentUserIds = applicationsData?.map(app => (app.students as any)?.user_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentUserIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      if (applicationsError) throw applicationsError;
      
      // Merge profiles with applications
      const mergedApplications = applicationsData?.map(app => ({
        ...app,
        students: {
          ...(app.students as any),
          profiles: profilesMap.get((app.students as any)?.user_id) || { full_name: 'N/A', email: 'N/A' }
        }
      })) || [];
      
      setApplications(mergedApplications as any);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!employer) return;
    setIsCreatingJob(true);

    try {
      const { error } = await supabase.from('job_postings').insert({
        employer_id: employer.id,
        title: newJob.title,
        description: newJob.description,
        job_type: newJob.job_type,
        location: newJob.location,
        location_type: newJob.location_type,
        experience_required: newJob.experience_required,
        salary_range: newJob.salary_range,
        skills_required: newJob.skills_required.split(',').map(s => s.trim()),
        qualifications: newJob.qualifications.split(',').map(s => s.trim()),
        responsibilities: newJob.responsibilities.split(',').map(s => s.trim()),
        status: 'active',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Job posting created successfully',
      });

      setNewJob({
        title: '',
        description: '',
        job_type: 'full-time',
        location: '',
        location_type: 'on-site',
        experience_required: 'entry',
        salary_range: '',
        skills_required: '',
        qualifications: '',
        responsibilities: '',
      });

      fetchEmployerData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleMatchCandidates = async (jobId: string) => {
    setIsMatchingCandidates(true);
    setSelectedJobForMatching(jobId);

    try {
      const { error } = await supabase.functions.invoke('match-candidates', {
        body: { jobPostingId: jobId }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'AI candidate matching completed! Check the Candidates tab.',
      });

      fetchEmployerData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsMatchingCandidates(false);
      setSelectedJobForMatching(null);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Application status updated',
      });

      fetchEmployerData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedApplication) return;
    setIsSchedulingInterview(true);

    try {
      const { error } = await supabase.from('interviews').insert({
        application_id: selectedApplication,
        scheduled_at: interviewData.scheduled_at,
        interview_type: interviewData.interview_type,
        meeting_link: interviewData.meeting_link,
        location: interviewData.location,
        duration_minutes: interviewData.duration_minutes,
        interviewer_name: interviewData.interviewer_name,
        round_number: interviewData.round_number,
        status: 'scheduled',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Interview scheduled successfully',
      });

      setSelectedApplication(null);
      setInterviewData({
        scheduled_at: '',
        interview_type: 'technical',
        meeting_link: '',
        location: '',
        duration_minutes: 60,
        interviewer_name: '',
        round_number: 1,
      });

      fetchEmployerData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSchedulingInterview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if profile needs completion
  if (!employer || !employer.company_name || employer.company_name === 'My Company') {
    return <EmployerOnboarding userId={user!.id} onComplete={fetchEmployerData} />;
  }

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'active').length,
    totalApplications: applications.length,
    pendingApplications: applications.filter(a => a.status === 'submitted').length,
  };

  const filteredApplications = applicationFilter === 'all' 
    ? applications 
    : applications.filter(a => a.status === applicationFilter);

  const handlePendingClick = () => {
    setApplicationFilter('submitted');
    setActiveTab('applications');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">{employer.company_name}</h1>
          <div className="flex gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button variant="default" onClick={() => navigate('/analytics')}>
              Analytics
            </Button>
            <Badge variant={employer.verification_status === 'verified' ? 'default' : 'secondary'}>
              {employer.verification_status}
            </Badge>
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={handlePendingClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApplications}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="jobs">Job Postings</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Job Postings</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Post New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Job Posting</DialogTitle>
                    <DialogDescription>Fill in the details for your job posting</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Job Title</Label>
                      <Input
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                        placeholder="e.g., Senior Software Engineer"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newJob.description}
                        onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                        placeholder="Job description..."
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Job Type</Label>
                        <Select value={newJob.job_type} onValueChange={(v) => setNewJob({ ...newJob, job_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-time">Full-time</SelectItem>
                            <SelectItem value="part-time">Part-time</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Location Type</Label>
                        <Select value={newJob.location_type} onValueChange={(v) => setNewJob({ ...newJob, location_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on-site">On-site</SelectItem>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={newJob.location}
                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                        placeholder="e.g., Bangalore, India"
                      />
                    </div>
                    <div>
                      <Label>Salary Range</Label>
                      <Input
                        value={newJob.salary_range}
                        onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                        placeholder="e.g., ₹8-12 LPA"
                      />
                    </div>
                    <div>
                      <Label>Required Skills (comma-separated)</Label>
                      <Input
                        value={newJob.skills_required}
                        onChange={(e) => setNewJob({ ...newJob, skills_required: e.target.value })}
                        placeholder="e.g., React, Node.js, MongoDB"
                      />
                    </div>
                    <div>
                      <Label>Qualifications (comma-separated)</Label>
                      <Input
                        value={newJob.qualifications}
                        onChange={(e) => setNewJob({ ...newJob, qualifications: e.target.value })}
                        placeholder="e.g., B.Tech in CS, 2+ years experience"
                      />
                    </div>
                    <div>
                      <Label>Responsibilities (comma-separated)</Label>
                      <Textarea
                        value={newJob.responsibilities}
                        onChange={(e) => setNewJob({ ...newJob, responsibilities: e.target.value })}
                        placeholder="e.g., Design and develop features, Code reviews"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleCreateJob} disabled={isCreatingJob} className="w-full">
                      {isCreatingJob && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Job Posting
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription>
                          {job.location} • {job.job_type} • Posted {new Date(job.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                        <Badge variant="outline">
                          {job.applications[0]?.count || 0} applications
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleMatchCandidates(job.id)}
                      disabled={isMatchingCandidates && selectedJobForMatching === job.id}
                      size="sm"
                    >
                      {isMatchingCandidates && selectedJobForMatching === job.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Matching...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          AI Match Candidates
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Applications</h2>
              <div className="flex gap-2">
                <Button
                  variant={applicationFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setApplicationFilter('all')}
                >
                  All ({applications.length})
                </Button>
                <Button
                  variant={applicationFilter === 'submitted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setApplicationFilter('submitted')}
                >
                  Pending ({applications.filter(a => a.status === 'submitted').length})
                </Button>
                <Button
                  variant={applicationFilter === 'reviewed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setApplicationFilter('reviewed')}
                >
                  Reviewed ({applications.filter(a => a.status === 'reviewed').length})
                </Button>
                <Button
                  variant={applicationFilter === 'shortlisted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setApplicationFilter('shortlisted')}
                >
                  Shortlisted ({applications.filter(a => a.status === 'shortlisted').length})
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              {filteredApplications.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No applications found for this filter.
                  </CardContent>
                </Card>
              ) : (
                filteredApplications.map((app) => (
                <Card key={app.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {app.students.profiles.full_name}
                        </CardTitle>
                        <CardDescription>
                          {app.students.branch} • CGPA: {app.students.cgpa}
                        </CardDescription>
                        <p className="text-sm text-muted-foreground mt-1">
                          Applied for: {app.job_postings.title}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {app.match_score && (
                          <Badge variant="secondary">
                            Match: {app.match_score}%
                          </Badge>
                        )}
                        <Badge variant={
                          app.status === 'accepted' ? 'default' :
                          app.status === 'rejected' ? 'destructive' : 'outline'
                        }>
                          {app.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                   <CardContent>
                    <div className="flex gap-2">
                      <Select
                        value={app.status}
                        onValueChange={(v) => handleUpdateApplicationStatus(app.id, v)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" onClick={() => setSelectedApplication(app.id)}>
                            Schedule Interview
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Schedule Interview</DialogTitle>
                            <DialogDescription>
                              Schedule an interview for {app.students.profiles.full_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Date & Time</Label>
                              <Input
                                type="datetime-local"
                                value={interviewData.scheduled_at}
                                onChange={(e) => setInterviewData({ ...interviewData, scheduled_at: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Interview Type</Label>
                              <Select
                                value={interviewData.interview_type}
                                onValueChange={(v) => setInterviewData({ ...interviewData, interview_type: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="technical">Technical</SelectItem>
                                  <SelectItem value="hr">HR</SelectItem>
                                  <SelectItem value="managerial">Managerial</SelectItem>
                                  <SelectItem value="group">Group Discussion</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Round Number</Label>
                              <Input
                                type="number"
                                min="1"
                                value={interviewData.round_number}
                                onChange={(e) => setInterviewData({ ...interviewData, round_number: parseInt(e.target.value) })}
                              />
                            </div>
                            <div>
                              <Label>Meeting Link</Label>
                              <Input
                                placeholder="https://meet.google.com/..."
                                value={interviewData.meeting_link}
                                onChange={(e) => setInterviewData({ ...interviewData, meeting_link: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Location (if in-person)</Label>
                              <Input
                                placeholder="Office address"
                                value={interviewData.location}
                                onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={interviewData.duration_minutes}
                                onChange={(e) => setInterviewData({ ...interviewData, duration_minutes: parseInt(e.target.value) })}
                              />
                            </div>
                            <div>
                              <Label>Interviewer Name</Label>
                              <Input
                                value={interviewData.interviewer_name}
                                onChange={(e) => setInterviewData({ ...interviewData, interviewer_name: e.target.value })}
                              />
                            </div>
                            <Button onClick={handleScheduleInterview} disabled={isSchedulingInterview} className="w-full">
                              {isSchedulingInterview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Schedule Interview
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                 </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="interviews" className="space-y-4">
            <h2 className="text-2xl font-bold">Scheduled Interviews</h2>
            <InterviewsList employerId={employer?.id} />
          </TabsContent>
        </Tabs>
      </main>

      {/* AI Career Assistant Widget */}
      <ChatWidget contextType="employer" />
    </div>
  );
}

function InterviewsList({ employerId }: { employerId?: string }) {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employerId) fetchInterviews();
  }, [employerId]);

  const fetchInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          applications!inner(
            id,
            students(
              profiles(full_name, email)
            ),
            job_postings!inner(
              title,
              employer_id
            )
          )
        `)
        .eq('applications.job_postings.employer_id', employerId)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
  }

  if (interviews.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No interviews scheduled yet</p>;
  }

  return (
    <div className="grid gap-4">
      {interviews.map((interview) => (
        <Card key={interview.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {interview.applications.students.profiles.full_name}
                </CardTitle>
                <CardDescription>
                  {interview.applications.job_postings.title}
                </CardDescription>
              </div>
              <Badge variant={
                interview.status === 'completed' ? 'default' :
                interview.status === 'cancelled' ? 'destructive' : 'outline'
              }>
                {interview.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Type:</strong> {interview.interview_type}</p>
              <p><strong>Round:</strong> {interview.round_number}</p>
              <p><strong>Scheduled:</strong> {new Date(interview.scheduled_at).toLocaleString()}</p>
              <p><strong>Duration:</strong> {interview.duration_minutes} minutes</p>
              {interview.meeting_link && (
                <p><strong>Link:</strong> <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{interview.meeting_link}</a></p>
              )}
              {interview.location && <p><strong>Location:</strong> {interview.location}</p>}
              {interview.interviewer_name && <p><strong>Interviewer:</strong> {interview.interviewer_name}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Support Chat */}
      <SupportChat userType="employer" />
    </div>
  );
}
