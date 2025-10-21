import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Briefcase, Linkedin, Building2, GraduationCap, Star, Rocket } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";

interface JobPortal {
  name: string;
  url: string;
  description: string;
  icon: LucideIcon;
  color: string;
  searchUrl: string;
}

const jobPortals: JobPortal[] = [
  {
    name: "LinkedIn Jobs",
    url: "https://www.linkedin.com/jobs/",
    description: "Professional network with millions of job listings",
    icon: Linkedin,
    color: "text-blue-600",
    searchUrl: "https://www.linkedin.com/jobs/search/?keywords="
  },
  {
    name: "Indeed India",
    url: "https://www.indeed.co.in/",
    description: "India's leading job search platform",
    icon: Briefcase,
    color: "text-red-600",
    searchUrl: "https://www.indeed.co.in/jobs?q="
  },
  {
    name: "Naukri.com",
    url: "https://www.naukri.com/",
    description: "India's #1 job portal for freshers and experienced",
    icon: Building2,
    color: "text-purple-600",
    searchUrl: "https://www.naukri.com/jobs-in-india?k="
  },
  {
    name: "Internshala",
    url: "https://internshala.com/",
    description: "Best platform for internships and fresher jobs",
    icon: GraduationCap,
    color: "text-green-600",
    searchUrl: "https://internshala.com/internships/keywords-"
  },
  {
    name: "Glassdoor",
    url: "https://www.glassdoor.co.in/",
    description: "Company reviews and salary insights",
    icon: Star,
    color: "text-yellow-600",
    searchUrl: "https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword="
  },
  {
    name: "AngelList",
    url: "https://angel.co/",
    description: "Startup jobs and tech opportunities",
    icon: Rocket,
    color: "text-gray-600",
    searchUrl: "https://angel.co/jobs?q="
  }
];

interface JobPortalIntegrationProps {
  skills?: string[];
  defaultSearch?: string;
}

export function JobPortalIntegration({ skills = [], defaultSearch = "software engineer" }: JobPortalIntegrationProps) {
  const { t } = useTranslation();
  
  const searchQuery = skills.length > 0 ? skills.join(" OR ") : defaultSearch;

  const openPortalWithSearch = (portal: JobPortal) => {
    const encodedQuery = encodeURIComponent(searchQuery);
    window.open(`${portal.searchUrl}${encodedQuery}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">External Job Portals</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        Explore opportunities across India's top job platforms. Click any portal to search for jobs matching your skills.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobPortals.map((portal) => {
          const IconComponent = portal.icon;
          return (
            <Card key={portal.name} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`w-8 h-8 ${portal.color}`} />
                    <CardTitle className="text-lg">{portal.name}</CardTitle>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardDescription className="text-sm">
                  {portal.description}
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full" 
                onClick={() => openPortalWithSearch(portal)}
              >
                Search Jobs
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => window.open(portal.url, '_blank', 'noopener,noreferrer')}
              >
                Visit Portal
              </Button>
            </CardContent>
          </Card>
        );
        })}
      </div>

      {skills.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Searching for: {searchQuery}</CardTitle>
            <CardDescription>
              Based on your profile skills. Update your skills in your profile to get better matches.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}