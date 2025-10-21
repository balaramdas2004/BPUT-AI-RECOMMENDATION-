import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Video, User } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface Interview {
  id: string;
  scheduled_at: string;
  interview_type: string;
  round_number: number;
  duration_minutes: number;
  meeting_link: string | null;
  location: string | null;
  interviewer_name: string | null;
  status: string;
  applications: {
    job_postings: {
      title: string;
      employers: {
        company_name: string;
      };
    };
  };
}

export function StudentInterviews({ studentId }: { studentId?: string }) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) fetchInterviews();
  }, [studentId]);

  const fetchInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          applications!inner(
            student_id,
            job_postings(
              title,
              employers(company_name)
            )
          )
        `)
        .eq('applications.student_id', studentId)
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
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center">No interviews scheduled yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {interviews.map((interview) => (
        <Card key={interview.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {interview.applications.job_postings.title}
                </CardTitle>
                <CardDescription>
                  {interview.applications.job_postings.employers.company_name}
                </CardDescription>
              </div>
              <Badge
                variant={
                  interview.status === 'completed'
                    ? 'default'
                    : interview.status === 'cancelled'
                    ? 'destructive'
                    : 'outline'
                }
              >
                {interview.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">{interview.interview_type}</Badge>
                <Badge variant="outline">Round {interview.round_number}</Badge>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{new Date(interview.scheduled_at).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>
                  {new Date(interview.scheduled_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} ({interview.duration_minutes} minutes)
                </span>
              </div>

              {interview.meeting_link && (
                <div className="flex items-start gap-2 text-sm">
                  <Video className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <a
                    href={interview.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    Join Meeting
                  </a>
                </div>
              )}

              {interview.location && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{interview.location}</span>
                </div>
              )}

              {interview.interviewer_name && (
                <div className="flex items-start gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{interview.interviewer_name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
