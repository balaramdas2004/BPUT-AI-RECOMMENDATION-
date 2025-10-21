import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Briefcase, GraduationCap } from "lucide-react";
import dashboardImage from "@/assets/dashboard-preview.jpg";

const Analytics = () => {
  return (
    <section id="analytics" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              University Dashboard
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              Data-Driven Insights for Better Decisions
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Comprehensive analytics dashboard providing placement officers and administrators 
              with real-time insights into student employability, skill gaps, and industry trends.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 bg-gradient-hero p-3 rounded-lg h-fit">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-foreground">
                    Placement Trend Analysis
                  </h3>
                  <p className="text-muted-foreground">
                    Track placement success rates by branch, district, and year with predictive forecasting
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 bg-gradient-accent p-3 rounded-lg h-fit">
                  <Users className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-foreground">
                    Skill Gap Identification
                  </h3>
                  <p className="text-muted-foreground">
                    Identify department-wide skill deficiencies and recommend targeted training programs
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 bg-gradient-hero p-3 rounded-lg h-fit">
                  <Briefcase className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-foreground">
                    Industry Demand Forecasting
                  </h3>
                  <p className="text-muted-foreground">
                    Stay ahead with AI-powered predictions of industry hiring trends and requirements
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 bg-gradient-accent p-3 rounded-lg h-fit">
                  <GraduationCap className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-foreground">
                    Student Readiness Metrics
                  </h3>
                  <p className="text-muted-foreground">
                    Monitor career readiness scores and track improvement over time
                  </p>
                </div>
              </div>
            </div>

            <Button variant="hero" size="lg">
              Explore Dashboard
            </Button>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "300ms" }}>
            <Card className="overflow-hidden shadow-2xl border-border/50 hover:shadow-glow transition-shadow duration-500">
              <img 
                src={dashboardImage} 
                alt="Analytics Dashboard Preview" 
                className="w-full h-auto"
              />
            </Card>
            <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-gradient-hero rounded-full blur-3xl opacity-20 animate-pulse-glow" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Analytics;
