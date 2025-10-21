import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, Circle } from 'lucide-react';

interface Application {
  id: string;
  status: string;
  applied_at: string;
  match_score: number | null;
  job_postings: {
    title: string;
    employers: {
      company_name: string;
    };
  };
}

interface StatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  notes: string | null;
}

export function ApplicationTracker({ studentId }: { studentId?: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusHistory, setStatusHistory] = useState<Record<string, StatusHistory[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) fetchApplications();
  }, [studentId]);

  const fetchApplications = async () => {
    try {
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          *,
          job_postings(
            title,
            employers(company_name)
          )
        `)
        .eq('student_id', studentId)
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;
      setApplications(appsData || []);

      // Fetch status history for all applications
      if (appsData && appsData.length > 0) {
        const { data: historyData, error: historyError } = await supabase
          .from('application_status_history')
          .select('*')
          .in('application_id', appsData.map(app => app.id))
          .order('changed_at', { ascending: false });

        if (historyError) throw historyError;

        // Group history by application_id
        const historyMap: Record<string, StatusHistory[]> = {};
        historyData?.forEach(history => {
          if (!historyMap[history.application_id]) {
            historyMap[history.application_id] = [];
          }
          historyMap[history.application_id].push(history);
        });
        setStatusHistory(historyMap);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'interview':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'interview':
      case 'shortlisted':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading applications...</div>;
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center">No applications yet. Start applying to jobs!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <Card key={app.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{app.job_postings.title}</CardTitle>
                <CardDescription>{app.job_postings.employers.company_name}</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                {app.match_score && (
                  <Badge variant="secondary">Match: {app.match_score}%</Badge>
                )}
                <Badge variant={getStatusColor(app.status) as any}>
                  {app.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Applied on {new Date(app.applied_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>

              {statusHistory[app.id] && statusHistory[app.id].length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Application Timeline</h4>
                  <div className="space-y-2">
                    {statusHistory[app.id].map((history, index) => (
                      <div key={history.id} className="flex items-start gap-3 text-sm">
                        <div className="mt-0.5">
                          {getStatusIcon(history.new_status)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {history.old_status ? (
                              <>Status changed from <span className="capitalize">{history.old_status}</span> to </>
                            ) : (
                              <>Application </>
                            )}
                            <span className="capitalize">{history.new_status}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(history.changed_at).toLocaleString('en-IN')}
                          </p>
                          {history.notes && (
                            <p className="text-xs mt-1 text-muted-foreground italic">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
