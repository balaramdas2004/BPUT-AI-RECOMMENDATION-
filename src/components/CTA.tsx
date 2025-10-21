import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const benefits = [
  "Personalized AI-driven career recommendations",
  "Direct access to top internship opportunities",
  "Real-time skill gap analysis and training suggestions",
  "24/7 AI-powered career guidance",
  "Comprehensive employability tracking",
];

const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 lg:px-8">
        <Card className="max-w-5xl mx-auto p-8 md:p-12 bg-gradient-card border-border/50 shadow-xl animate-fade-up">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Ready to Transform Your Career?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of BPUT students already using AI to discover their ideal career paths
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="space-y-4">
              {benefits.slice(0, 3).map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 animate-fade-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {benefits.slice(3).map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 animate-fade-up" style={{ animationDelay: `${(index + 3) * 100}ms` }}>
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="hero" 
              size="xl" 
              className="group"
              onClick={() => navigate('/auth')}
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              onClick={() => navigate('/auth')}
            >
              Get Started
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            No credit card required • Free for BPUT students • Get started in minutes
          </p>
        </Card>
      </div>
    </section>
  );
};

export default CTA;
