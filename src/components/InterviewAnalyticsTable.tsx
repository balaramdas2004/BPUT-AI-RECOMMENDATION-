import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface AnalyticsTableProps {
  analysis: any;
  grammarAnalysis: any;
}

export default function InterviewAnalyticsTable({ analysis, grammarAnalysis }: AnalyticsTableProps) {
  const getStatusIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (score >= 60) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatus = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { text: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  const metrics = [
    {
      category: 'Visual Communication',
      items: [
        { name: 'Eye Contact', score: analysis.eye_contact_score, issue: analysis.eye_contact_score < 60 ? 'Low eye contact detected' : null },
        { name: 'Facial Expression', score: analysis.expression_score, issue: analysis.expression_score < 60 ? 'Limited facial expressions' : null },
        { name: 'Body Language', score: analysis.body_language_score, issue: analysis.body_language_score < 60 ? 'Posture needs improvement' : null },
      ]
    },
    {
      category: 'Confidence & Engagement',
      items: [
        { name: 'Overall Confidence', score: analysis.confidence_score, issue: analysis.confidence_score < 60 ? 'Shows signs of nervousness' : null },
        { name: 'Engagement Level', score: analysis.engagement_score, issue: analysis.engagement_score < 60 ? 'Low engagement detected' : null },
        { name: 'Professional Demeanor', score: analysis.professionalism_score, issue: analysis.professionalism_score < 60 ? 'Professional presentation needs work' : null },
      ]
    }
  ];

  if (grammarAnalysis) {
    metrics.push({
      category: 'Communication & Grammar',
      items: [
        { name: 'Grammar Accuracy', score: grammarAnalysis.grammar_score, issue: grammarAnalysis.errors?.length > 0 ? `${grammarAnalysis.errors.length} grammar errors` : null },
        { name: 'Fluency', score: grammarAnalysis.fluency_score, issue: grammarAnalysis.fluency_score < 60 ? 'Speech fluency needs improvement' : null },
        { name: 'Vocabulary', score: grammarAnalysis.vocabulary_score, issue: grammarAnalysis.vocabulary_score < 60 ? 'Limited vocabulary usage' : null },
      ]
    });
  }

  // Collect all issues
  const allIssues = metrics.flatMap(m => 
    m.items.filter(item => item.issue).map(item => ({
      category: m.category,
      problem: item.issue,
      severity: item.score < 50 ? 'High' : item.score < 70 ? 'Medium' : 'Low'
    }))
  );

  return (
    <div className="space-y-6">
      {/* Performance Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Detailed Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {metrics.map((category, idx) => (
              <div key={idx}>
                <h3 className="font-semibold text-lg mb-3">{category.category}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Assessment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.items.map((item, itemIdx) => {
                      const status = getStatus(item.score);
                      return (
                        <TableRow key={itemIdx}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {getStatusIcon(item.score)}
                              <span className="font-semibold">{item.score}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={status.color}>{status.text}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.issue || 'Performing well'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Problems & Issues Table */}
      {allIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Identified Issues & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead className="text-center">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allIssues.map((issue, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{issue.category}</TableCell>
                    <TableCell>{issue.problem}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        issue.severity === 'High' ? 'bg-red-100 text-red-800' :
                        issue.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {issue.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Grammar Errors Details */}
      {grammarAnalysis?.errors && grammarAnalysis.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>✍️ Grammar & Communication Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Suggestion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grammarAnalysis.errors.map((error: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant="outline">{error.type}</Badge>
                    </TableCell>
                    <TableCell>{error.text}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {error.suggestion}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
