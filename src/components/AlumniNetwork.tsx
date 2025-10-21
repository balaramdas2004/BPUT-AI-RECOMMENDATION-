import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, Briefcase, GraduationCap, MessageCircle, Search } from 'lucide-react';

interface AlumniProfile {
  id: string;
  graduation_year: number;
  current_company: string;
  current_role: string;
  expertise_areas: string[];
  bio: string;
  profiles: { full_name: string };
}

export function AlumniNetwork({ studentId }: { studentId?: string }) {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [filteredAlumni, setFilteredAlumni] = useState<AlumniProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlumni();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = alumni.filter(alum =>
        alum.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alum.current_company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alum.current_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alum.expertise_areas?.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredAlumni(filtered);
    } else {
      setFilteredAlumni(alumni);
    }
  }, [searchQuery, alumni]);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alumni' as any)
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq('mentorship_available', true)
        .order('graduation_year', { ascending: false });

      if (error) throw error;
      setAlumni(data as any || []);
      setFilteredAlumni(data as any || []);
    } catch (error: any) {
      console.error('Error fetching alumni:', error);
      toast({
        title: "Failed to Load Alumni",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const requestMentorship = async (alumniId: string) => {
    if (!studentId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to request mentorship.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('mentorship_connections' as any)
        .insert({
          student_id: studentId,
          alumni_id: alumniId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "Your mentorship request has been sent successfully."
      });
    } catch (error: any) {
      console.error('Error requesting mentorship:', error);
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alumni Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Alumni Network
            </CardTitle>
            <CardDescription>
              Connect with successful alumni for mentorship and guidance
            </CardDescription>
          </div>
          <Badge variant="secondary">{filteredAlumni.length} Available</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, role, or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Alumni List */}
        <div className="space-y-4">
          {filteredAlumni.length > 0 ? (
            filteredAlumni.map((alum) => (
              <div key={alum.id} className="p-4 border rounded-lg hover:border-primary transition-colors">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {alum.profiles?.full_name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-semibold">{alum.profiles?.full_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        <span>{alum.current_role} at {alum.current_company}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="h-3 w-3" />
                        <span>Class of {alum.graduation_year}</span>
                      </div>
                    </div>

                    {alum.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {alum.bio}
                      </p>
                    )}

                    {alum.expertise_areas && alum.expertise_areas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {alum.expertise_areas.slice(0, 4).map((area, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                        {alum.expertise_areas.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{alum.expertise_areas.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Mentorship</DialogTitle>
                        <DialogDescription>
                          Send a mentorship request to {alum.profiles?.full_name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium mb-2">About {alum.profiles?.full_name?.split(' ')[0]}</h5>
                          <p className="text-sm text-muted-foreground">{alum.bio}</p>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Expertise</h5>
                          <div className="flex flex-wrap gap-2">
                            {alum.expertise_areas?.map((area, idx) => (
                              <Badge key={idx} variant="secondary">{area}</Badge>
                            ))}
                          </div>
                        </div>
                        <Button 
                          onClick={() => requestMentorship(alum.id)} 
                          className="w-full"
                        >
                          Send Request
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No alumni found matching your search' : 'No alumni available for mentorship'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}