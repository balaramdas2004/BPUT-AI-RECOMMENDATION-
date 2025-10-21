import { Card } from "@/components/ui/card";
import { 
  Brain, 
  Target, 
  Users, 
  BarChart3, 
  Shield, 
  Zap,
  TrendingUp,
  Award
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Driven Student Profiling",
    description: "Automated digital profiles integrating academic, co-curricular, and extra-curricular data using NLP and Machine Learning.",
    color: "text-primary",
  },
  {
    icon: Target,
    title: "Career Recommendation Engine",
    description: "Smart AI engine mapping student attributes to career domains with personalized skill enhancement roadmaps.",
    color: "text-secondary",
  },
  {
    icon: Users,
    title: "Internship Matching System",
    description: "Dynamic AI-based matching algorithms connecting students with relevant internship and job opportunities.",
    color: "text-primary",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Comprehensive insights on skill gaps, placement trends, and industry forecasts for universities.",
    color: "text-secondary",
  },
  {
    icon: TrendingUp,
    title: "Career Readiness Score",
    description: "Periodic evaluation with personalized improvement plans to enhance employability readiness.",
    color: "text-primary",
  },
  {
    icon: Award,
    title: "Skill Gap Analysis",
    description: "Identify and bridge skill gaps with targeted course and certification recommendations.",
    color: "text-secondary",
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description: "Live job postings and instant notifications for matching opportunities.",
    color: "text-primary",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Strong data privacy protocols with multilingual support (English and Odia).",
    color: "text-secondary",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive AI-powered tools designed to transform career planning and placement for BPUT students
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border/50 animate-fade-up group cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
