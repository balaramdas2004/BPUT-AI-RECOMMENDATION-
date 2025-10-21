import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, Target } from 'lucide-react';

interface CompanyRecommendationsProps {
  analysis: any;
}

export default function CompanyRecommendations({ analysis }: CompanyRecommendationsProps) {
  const getRecommendedCompanies = () => {
    const avgScore = (
      analysis.confidence_score +
      analysis.eye_contact_score +
      analysis.expression_score +
      analysis.body_language_score
    ) / 4;

    if (avgScore >= 80) {
      return {
        tier: 'Top Tier',
        tierColor: 'bg-purple-100 text-purple-800',
        companies: [
          { name: 'Google', match: 95, reason: 'Excellent communication and confidence', logo: '🔵' },
          { name: 'Microsoft', match: 92, reason: 'Strong technical presence', logo: '🟦' },
          { name: 'Amazon', match: 90, reason: 'Leadership principles alignment', logo: '🟠' },
          { name: 'Meta', match: 88, reason: 'Great cultural fit', logo: '🔷' },
          { name: 'Apple', match: 87, reason: 'Professional demeanor', logo: '🍎' },
        ]
      };
    } else if (avgScore >= 65) {
      return {
        tier: 'Mid-Senior Level',
        tierColor: 'bg-blue-100 text-blue-800',
        companies: [
          { name: 'IBM', match: 85, reason: 'Good technical skills', logo: '💼' },
          { name: 'Oracle', match: 82, reason: 'Professional approach', logo: '🔴' },
          { name: 'SAP', match: 80, reason: 'Strong fundamentals', logo: '🟦' },
          { name: 'Salesforce', match: 78, reason: 'Communication potential', logo: '☁️' },
          { name: 'Adobe', match: 75, reason: 'Creative problem solving', logo: '🎨' },
        ]
      };
    } else if (avgScore >= 50) {
      return {
        tier: 'Entry-Mid Level',
        tierColor: 'bg-green-100 text-green-800',
        companies: [
          { name: 'Infosys', match: 75, reason: 'Training programs available', logo: '🏢' },
          { name: 'Wipro', match: 72, reason: 'Good for skill development', logo: '🏭' },
          { name: 'TCS', match: 70, reason: 'Excellent mentorship', logo: '🏛️' },
          { name: 'Accenture', match: 68, reason: 'Career growth opportunities', logo: '💼' },
          { name: 'Capgemini', match: 65, reason: 'Supportive work environment', logo: '🌟' },
        ]
      };
    } else {
      return {
        tier: 'Entry Level / Startups',
        tierColor: 'bg-yellow-100 text-yellow-800',
        companies: [
          { name: 'Local Startups', match: 65, reason: 'Great learning environment', logo: '🚀' },
          { name: 'Tech Mahindra', match: 62, reason: 'Entry-level friendly', logo: '🏢' },
          { name: 'HCL', match: 60, reason: 'Training & development focus', logo: '🏭' },
          { name: 'Cognizant', match: 58, reason: 'Multiple growth paths', logo: '💻' },
          { name: 'Tech Consulting Firms', match: 55, reason: 'Skill building opportunities', logo: '📊' },
        ]
      };
    }
  };

  const recommendations = getRecommendedCompanies();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            🏆 Recommended Companies Based on Your Performance
          </CardTitle>
          <Badge className={recommendations.tierColor}>
            {recommendations.tier}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4">
            {recommendations.companies.map((company, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{company.logo}</div>
                  <div>
                    <h4 className="font-semibold text-lg">{company.name}</h4>
                    <p className="text-sm text-muted-foreground">{company.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Target className="w-3 h-3" />
                      Match Score
                    </div>
                    <div className="text-2xl font-bold text-primary">{company.match}%</div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Pro Tip:</strong> Focus on improving your weakest areas to unlock opportunities with higher-tier companies. 
              Complete the recommended courses and practice regularly to boost your scores!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
