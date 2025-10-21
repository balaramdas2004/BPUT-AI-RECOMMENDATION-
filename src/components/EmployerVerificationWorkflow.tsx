import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PendingEmployer {
  id: string;
  company_name: string;
  verification_status: string;
  industry: string;
  website: string;
  created_at: string;
  profiles: { full_name: string; email: string };
}

export function EmployerVerificationWorkflow() {
  const [employers, setEmployers] = useState<PendingEmployer[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingEmployers();
  }, []);

  const fetchPendingEmployers = async () => {
    try {
      const { data, error } = await supabase
        .from('employers')
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .in('verification_status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployers(data as any || []);
    } catch (error: any) {
      console.error('Error fetching employers:', error);
      toast({
        title: "Failed to Load",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateVerificationStatus = async (employerId: string, status: string) => {
    setLoading(true);
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
        title: status === 'verified' ? "Employer Verified" : "Employer Rejected",
        description: `Verification status updated successfully.`
      });

      fetchPendingEmployers();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'secondary',
      verified: 'default',
      rejected: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Employer Verification Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        {employers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employers.map((employer) => (
                <TableRow key={employer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(employer.verification_status)}
                      {employer.company_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{employer.profiles?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{employer.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{employer.industry || 'N/A'}</TableCell>
                  <TableCell>
                    {employer.website ? (
                      <a
                        href={employer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(employer.verification_status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {employer.verification_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateVerificationStatus(employer.id, 'verified')}
                            disabled={loading}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateVerificationStatus(employer.id, 'rejected')}
                            disabled={loading}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {employer.verification_status === 'rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateVerificationStatus(employer.id, 'pending')}
                          disabled={loading}
                        >
                          Review Again
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No employers pending verification
          </div>
        )}
      </CardContent>
    </Card>
  );
}