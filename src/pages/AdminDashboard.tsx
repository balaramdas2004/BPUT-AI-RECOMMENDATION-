import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SupportChat from '@/components/SupportChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Briefcase, Building2, GraduationCap, TrendingUp, Plus, Loader2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SkillGapAnalytics } from '@/components/SkillGapAnalytics';
import { ReportBuilder } from '@/components/ReportBuilder';
import { BulkDataImport } from '@/components/BulkDataImport';
import { EmployerVerificationWorkflow } from '@/components/EmployerVerificationWorkflow';

interface SystemStats {
  totalStudents: number;
  totalEmployers: number;
  totalJobs: number;
  totalApplications: number;
  verifiedEmployers: number;
  activeJobs: number;
}

interface Employer {
  id: string;
  company_name: string;
  verification_status: string;
  created_at: string;
  profiles: { full_name: string; email: string };
}

interface Student {
  id: string;
  registration_no: string;
  branch: string;
  cgpa: number;
  created_at: string;
  profiles: { full_name: string; email: string };
}

interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface CareerDomain {
  id: string;
  name: string;
  category: string;
  description: string;
  growth_rate: string;
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalStudents: 0,
    totalEmployers: 0,
    totalJobs: 0,
    totalApplications: 0,
    verifiedEmployers: 0,
    activeJobs: 0,
  });
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [careerDomains, setCareerDomains] = useState<CareerDomain[]>([]);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'technical',
    description: '',
  });

  const [newDomain, setNewDomain] = useState({
    name: '',
    category: 'technology',
    description: '',
    growth_rate: '',
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (studentsError) throw studentsError;
      
      // Fetch employers
      const { data: employersData, error: employersError } = await supabase
        .from('employers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (employersError) throw employersError;
      
      // Fetch profiles for students and employers
      const studentUserIds = studentsData?.map(s => s.user_id) || [];
      const employerUserIds = employersData?.map(e => e.user_id) || [];
      
      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentUserIds);
      
      const { data: employerProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', employerUserIds);
      
      const studentProfilesMap = new Map(studentProfiles?.map(p => [p.id, p]) || []);
      const employerProfilesMap = new Map(employerProfiles?.map(p => [p.id, p]) || []);
      
      const mergedStudents = studentsData?.map(s => ({
        ...s,
        profiles: studentProfilesMap.get(s.user_id) || { full_name: 'N/A', email: 'N/A' }
      })) || [];
      
      const mergedEmployers = employersData?.map(e => ({
        ...e,
        profiles: employerProfilesMap.get(e.user_id) || { full_name: 'N/A', email: 'N/A' }
      })) || [];
      
      setStudents(mergedStudents as any);
      setEmployers(mergedEmployers as any);

      // Fetch jobs
      const { data: jobsData } = await supabase
        .from('job_postings')
        .select('id, status');

      // Fetch applications
      const { data: applicationsData } = await supabase
        .from('applications')
        .select('id');

      // Fetch skills
      const { data: skillsData } = await supabase
        .from('skills')
        .select('*')
        .order('category', { ascending: true });

      if (skillsData) setSkills(skillsData);

      // Fetch career domains
      const { data: domainsData } = await supabase
        .from('career_domains')
        .select('*')
        .order('category', { ascending: true });

      if (domainsData) setCareerDomains(domainsData);

      // Calculate stats
      setStats({
        totalStudents: studentsData?.length || 0,
        totalEmployers: employersData?.length || 0,
        totalJobs: jobsData?.length || 0,
        totalApplications: applicationsData?.length || 0,
        verifiedEmployers: employersData?.filter(e => e.verification_status === 'verified').length || 0,
        activeJobs: jobsData?.filter(j => j.status === 'active').length || 0,
      });
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

  const handleVerifyEmployer = async (employerId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('employers')
        .update({ 
          verification_status: status,
          verified_at: status === 'verified' ? new Date().toISOString() : null
        })
        .eq('id', employerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Employer ${status} successfully`,
      });

      fetchAdminData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddSkill = async () => {
    setIsAddingSkill(true);
    try {
      const { error } = await supabase
        .from('skills')
        .insert({
          name: newSkill.name,
          category: newSkill.category,
          description: newSkill.description,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Skill added successfully',
      });

      setNewSkill({ name: '', category: 'technical', description: '' });
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAddingSkill(false);
    }
  };

  const handleAddDomain = async () => {
    setIsAddingDomain(true);
    try {
      const { error } = await supabase
        .from('career_domains')
        .insert({
          name: newDomain.name,
          category: newDomain.category,
          description: newDomain.description,
          growth_rate: newDomain.growth_rate,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Career domain added successfully',
      });

      setNewDomain({ name: '', category: 'technology', description: '', growth_rate: '' });
      fetchAdminData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAddingDomain(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          </div>
          <div className="flex gap-4">
            <ThemeToggle />
            <Button variant="default" onClick={() => window.location.href = '/analytics'}>
              Analytics
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedEmployers}</div>
            </CardContent>
          </Card>
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
        </div>

        <Tabs defaultValue="employers" className="space-y-6">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max min-w-full lg:grid lg:grid-cols-8 gap-1">
              <TabsTrigger value="verification" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Verification</span>
              </TabsTrigger>
              <TabsTrigger value="employers" className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Employers</span>
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Students</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Skills</span>
              </TabsTrigger>
              <TabsTrigger value="domains" className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Domains</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="verification">
            <EmployerVerificationWorkflow />
          </TabsContent>

          <TabsContent value="employers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employer Management</CardTitle>
                <CardDescription>Verify and manage employer accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employers.map((employer) => (
                      <TableRow key={employer.id}>
                        <TableCell className="font-medium">{employer.company_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{employer.profiles.full_name}</div>
                            <div className="text-muted-foreground">{employer.profiles.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            employer.verification_status === 'verified' ? 'default' :
                            employer.verification_status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {employer.verification_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(employer.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {employer.verification_status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleVerifyEmployer(employer.id, 'verified')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleVerifyEmployer(employer.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>View and manage student accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Registration No</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>CGPA</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.profiles.full_name}</TableCell>
                        <TableCell>{student.registration_no || 'N/A'}</TableCell>
                        <TableCell>{student.branch || 'N/A'}</TableCell>
                        <TableCell>{student.cgpa || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{student.profiles.email}</TableCell>
                        <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Skills Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Skill
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Skill</DialogTitle>
                    <DialogDescription>Create a new skill in the system</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Skill Name</Label>
                      <Input
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                        placeholder="e.g., React.js"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={newSkill.category} onValueChange={(v) => setNewSkill({ ...newSkill, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="soft-skill">Soft Skill</SelectItem>
                          <SelectItem value="domain">Domain</SelectItem>
                          <SelectItem value="tool">Tool</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newSkill.description}
                        onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                        placeholder="Brief description of the skill"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleAddSkill} disabled={isAddingSkill} className="w-full">
                      {isAddingSkill && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Skill
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skills.map((skill) => (
                      <TableRow key={skill.id}>
                        <TableCell className="font-medium">{skill.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{skill.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {skill.description || 'No description'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Career Domains</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Domain
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Career Domain</DialogTitle>
                    <DialogDescription>Create a new career domain</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Domain Name</Label>
                      <Input
                        value={newDomain.name}
                        onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                        placeholder="e.g., Full Stack Development"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={newDomain.category} onValueChange={(v) => setNewDomain({ ...newDomain, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="data">Data Science</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Growth Rate</Label>
                      <Input
                        value={newDomain.growth_rate}
                        onChange={(e) => setNewDomain({ ...newDomain, growth_rate: e.target.value })}
                        placeholder="e.g., 15% annually"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newDomain.description}
                        onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })}
                        placeholder="Brief description of the career domain"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleAddDomain} disabled={isAddingDomain} className="w-full">
                      {isAddingDomain && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Domain
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Growth Rate</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {careerDomains.map((domain) => (
                      <TableRow key={domain.id}>
                        <TableCell className="font-medium">{domain.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{domain.category}</Badge>
                        </TableCell>
                        <TableCell>{domain.growth_rate || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {domain.description || 'No description'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <SkillGapAnalytics />
          </TabsContent>

          <TabsContent value="reports">
            <ReportBuilder />
          </TabsContent>

          <TabsContent value="import">
            <BulkDataImport />
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Support Chat */}
      <SupportChat userType="admin" />
    </div>
  );
}
