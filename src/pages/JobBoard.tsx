import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, ArrowLeft, Search, MapPin, Building2, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { JobPortalIntegration } from '@/components/JobPortalIntegration';

export default function JobBoard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [studentSkills, setStudentSkills] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get student data
      const { data: studentData } = await supabase
        .from('students')
        .select('id, resume_url, skills')
        .eq('user_id', user.id)
        .single();

      setStudent(studentData);
      setStudentSkills(studentData?.skills || []);

      // Load active job postings
      const { data: jobsData } = await supabase
        .from('job_postings')
        .select(`
          *,
          employers (
            company_name,
            location,
            logo_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setJobs(jobsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!student || !selectedJob) return;
    
    setApplying(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_posting_id: selectedJob.id,
          student_id: student.id,
          cover_letter: coverLetter,
          resume_url: student.resume_url
        });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('You have already applied for this job');
        } else {
          throw error;
        }
      } else {
        toast.success('Application submitted successfully!');
        setSelectedJob(null);
        setCoverLetter('');
      }
    } catch (error: any) {
      console.error('Error applying:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.description.toLowerCase().includes(search.toLowerCase()) ||
    job.employers?.company_name.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate skill match score for each job
  const getMatchScore = (job: any) => {
    if (!studentSkills.length) return 0;
    
    const requiredSkills = job.skills_required || [];
    const matchedSkills = studentSkills.filter(skill => 
      requiredSkills.some((req: string) => 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return matchedSkills.length;
  };

  // Sort jobs by match score (highest first)
  const sortedJobs = [...filteredJobs].sort((a, b) => 
    getMatchScore(b) - getMatchScore(a)
  );

  const readyToApplyJobs = sortedJobs.filter(job => getMatchScore(job) >= 2);

  const getJobTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'internship': 'bg-blue-500',
      'full-time': 'bg-green-500',
      'part-time': 'bg-yellow-500',
      'contract': 'bg-purple-500'
    };
    return colors[type] || 'bg-gray-500';
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
              <Briefcase className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Job Board</h1>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="internal" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
            <TabsTrigger value="internal">Platform Jobs</TabsTrigger>
            <TabsTrigger value="external">Job Portals</TabsTrigger>
          </TabsList>

          <TabsContent value="internal" className="space-y-8">
            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search jobs by title, company, or keywords..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* Ready to Apply Section */}
        {readyToApplyJobs.length > 0 && (
          <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600">✓</span> Ready to Apply
              </CardTitle>
              <CardDescription>
                {readyToApplyJobs.length} job{readyToApplyJobs.length > 1 ? 's' : ''} matching your skills
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Job Listings */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Jobs Found</h3>
              <p className="text-muted-foreground">
                {search ? 'Try adjusting your search criteria' : 'Check back later for new opportunities'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {sortedJobs.map((job) => {
              const matchScore = getMatchScore(job);
              const isReadyToApply = matchScore >= 2;
              
              return (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {job.employers?.logo_url && (
                          <img
                            src={job.employers.logo_url}
                            alt={job.employers.company_name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <CardTitle className="text-xl">{job.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {job.employers?.company_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {isReadyToApply && (
                          <Badge className="bg-green-500">
                            ✓ Ready to Apply - {matchScore} skills match
                          </Badge>
                        )}
                        <Badge className={getJobTypeBadge(job.job_type)}>
                          {job.job_type}
                        </Badge>
                        {job.location && (
                          <Badge variant="outline">
                            <MapPin className="w-3 h-3 mr-1" />
                            {job.location}
                          </Badge>
                        )}
                        {job.location_type && (
                          <Badge variant="secondary">{job.location_type}</Badge>
                        )}
                        {job.salary_range && (
                          <Badge variant="outline">{job.salary_range}</Badge>
                        )}
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedJob(job)}>
                          Apply Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{job.title}</DialogTitle>
                          <DialogDescription>
                            {job.employers?.company_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Job Description</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {job.description}
                            </p>
                          </div>
                          
                          {job.skills_required && job.skills_required.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Required Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {job.skills_required.map((skill: string) => (
                                  <Badge key={skill} variant="secondary">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {job.qualifications && job.qualifications.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Qualifications</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {job.qualifications.map((qual: string, i: number) => (
                                  <li key={i}>{qual}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div>
                            <Label htmlFor="coverLetter">Cover Letter</Label>
                            <Textarea
                              id="coverLetter"
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                              placeholder="Tell us why you're a great fit for this role..."
                              rows={6}
                              className="mt-2"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={handleApply}
                              disabled={applying || !student?.resume_url}
                              className="flex-1"
                            >
                              {applying ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                'Submit Application'
                              )}
                            </Button>
                            {!student?.resume_url && (
                              <Button
                                variant="outline"
                                onClick={() => navigate('/student/profile')}
                              >
                                Upload Resume First
                              </Button>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {job.description}
                  </p>
                  {job.application_deadline && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Apply by: {new Date(job.application_deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
          </TabsContent>

          <TabsContent value="external" className="space-y-8">
            <JobPortalIntegration skills={studentSkills} defaultSearch="engineering fresher jobs india" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
