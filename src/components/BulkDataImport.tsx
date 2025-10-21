import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function BulkDataImport() {
  const [importType, setImportType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imports, setImports] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchImports();
  }, []);

  const fetchImports = async () => {
    const { data } = await supabase
      .from('bulk_data_imports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setImports(data);
  };

  const handleFileUpload = async () => {
    if (!file || !importType) {
      toast({
        title: "Missing Information",
        description: "Please select import type and choose a file.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileName = `imports/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get admin ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!adminData) throw new Error('Admin profile not found');

      // Create import record
      const { data: importRecord, error: insertError } = await supabase
        .from('bulk_data_imports')
        .insert({
          admin_id: adminData.id,
          import_type: importType,
          file_url: fileName,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger processing
      await supabase.functions.invoke('import-bulk-data', {
        body: { importId: importRecord.id }
      });

      toast({
        title: "Import Started",
        description: "Your data import is being processed."
      });

      setFile(null);
      setImportType('');
      fetchImports();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Loader2 className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Data Import
        </CardTitle>
        <CardDescription>
          Import large datasets from CSV files for BPUT integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="importType">Data Type</Label>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger id="importType" className="mt-2">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="students">Student Records</SelectItem>
                <SelectItem value="placements">Placement Statistics</SelectItem>
                <SelectItem value="companies">Company Database</SelectItem>
                <SelectItem value="skills">Skills Catalog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="csvFile">CSV File</Label>
            <div className="mt-2 flex items-center gap-4">
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {file && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {file.name}
                </Badge>
              )}
            </div>
          </div>

          <Button onClick={handleFileUpload} disabled={uploading || !file || !importType} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Process
              </>
            )}
          </Button>
        </div>

        {/* Recent Imports */}
        <div className="pt-6 border-t">
          <h4 className="font-semibold mb-4">Recent Imports</h4>
          <div className="space-y-3">
            {imports.length > 0 ? (
              imports.map((imp) => (
                <div key={imp.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(imp.status)}
                      <span className="font-medium capitalize">{imp.import_type}</span>
                      <Badge variant="outline">{imp.status}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(imp.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {imp.status === 'processing' && imp.total_records > 0 && (
                    <div className="mt-2">
                      <Progress 
                        value={(imp.processed_records / imp.total_records) * 100} 
                        className="h-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {imp.processed_records} / {imp.total_records} records
                      </p>
                    </div>
                  )}

                  {imp.status === 'completed' && (
                    <p className="text-sm text-green-600">
                      ✓ {imp.processed_records} records imported successfully
                    </p>
                  )}

                  {imp.status === 'failed' && (
                    <p className="text-sm text-red-600">
                      ✗ {imp.failed_records} records failed
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No imports yet
              </div>
            )}
          </div>
        </div>

        {/* Format Guide */}
        <div className="p-4 bg-muted rounded-lg text-xs">
          <h5 className="font-semibold mb-2">CSV Format Guidelines:</h5>
          <ul className="space-y-1 text-muted-foreground">
            <li><strong>Students:</strong> registration_no, department, branch, year_of_study, cgpa, skills</li>
            <li><strong>Placements:</strong> academic_year, department, branch, total_students, placed_students, average_package, highest_package</li>
            <li><strong>Companies:</strong> company_name, industry, location, website</li>
            <li><strong>Skills:</strong> skill_name, category, description</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}