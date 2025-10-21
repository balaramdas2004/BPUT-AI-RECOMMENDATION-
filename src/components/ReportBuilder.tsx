import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Loader2 } from 'lucide-react';

export function ReportBuilder() {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('');
  const [filters, setFilters] = useState({
    yearFrom: '2020',
    yearTo: new Date().getFullYear().toString(),
    dateFrom: '',
    dateTo: ''
  });
  const { toast } = useToast();

  const generateReport = async () => {
    if (!reportType) {
      toast({
        title: "Select Report Type",
        description: "Please select a report type to generate.",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-custom-report', {
        body: { reportType, filters }
      });

      if (error) throw error;

      // Convert to JSON and download
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "Your report has been downloaded successfully."
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate report.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Custom Report Generator
        </CardTitle>
        <CardDescription>
          Generate comprehensive analytics reports with custom filters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div>
          <Label htmlFor="reportType">Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger id="reportType" className="mt-2">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placement_overview">Placement Overview</SelectItem>
              <SelectItem value="skill_gap_analysis">Skill Gap Analysis</SelectItem>
              <SelectItem value="department_performance">Department Performance</SelectItem>
              <SelectItem value="employer_engagement">Employer Engagement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="yearFrom">Academic Year From</Label>
            <Input
              id="yearFrom"
              type="number"
              value={filters.yearFrom}
              onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="yearTo">Academic Year To</Label>
            <Input
              id="yearTo"
              type="number"
              value={filters.yearTo}
              onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
              className="mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dateFrom">Date From</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="dateTo">Date To</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="mt-2"
            />
          </div>
        </div>

        {/* Generate Button */}
        <Button onClick={generateReport} disabled={generating} className="w-full">
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate & Download Report
            </>
          )}
        </Button>

        {/* Report Description */}
        {reportType && (
          <div className="p-4 bg-muted rounded-lg text-sm">
            <h4 className="font-semibold mb-2">What's included:</h4>
            <ul className="space-y-1 text-muted-foreground">
              {reportType === 'placement_overview' && (
                <>
                  <li>• Total students and placement statistics</li>
                  <li>• Average and highest packages</li>
                  <li>• Department-wise breakdown</li>
                  <li>• Application trends over time</li>
                </>
              )}
              {reportType === 'skill_gap_analysis' && (
                <>
                  <li>• Top 10 skill gaps by demand</li>
                  <li>• Category-wise skill analysis</li>
                  <li>• Actionable recommendations</li>
                  <li>• Supply vs demand metrics</li>
                </>
              )}
              {reportType === 'department_performance' && (
                <>
                  <li>• Department-wise placement rates</li>
                  <li>• Average career readiness scores</li>
                  <li>• Student count by department</li>
                  <li>• Performance comparisons</li>
                </>
              )}
              {reportType === 'employer_engagement' && (
                <>
                  <li>• Total jobs posted by company</li>
                  <li>• Active job counts</li>
                  <li>• Application statistics</li>
                  <li>• Verification status</li>
                </>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}