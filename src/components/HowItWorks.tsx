import { Card } from "@/components/ui/card";
import { UserPlus, Brain, Target, Rocket } from "lucide-react";
import aiNetworkImage from "@/assets/ai-network.jpg";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create Your Profile",
    description: "Sign up and let our AI analyze your academic records, skills, certifications, and interests to build a comprehensive digital profile.",
  },
  {
    icon: Brain,
    number: "02",
    title: "AI Analysis & Matching",
    description: "Our machine learning algorithms process your profile against thousands of career paths and opportunities to find the best matches.",
  },
  {
    icon: Target,
    number: "03",
    title: "Get Recommendations",
    description: "Receive personalized career suggestions, skill enhancement courses, and internship opportunities tailored to your profile.",
  },
  {
    icon: Rocket,
    number: "04",
    title: "Launch Your Career",
    description: "Apply to matched opportunities, track your progress, and access continuous guidance as you build your professional journey.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to unlock your career potential with AI-powered guidance
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card 
                  key={index}
                  className="p-6 hover:shadow-lg transition-all duration-300 border-border/50 bg-card animate-fade-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="text-6xl font-bold text-primary/10 absolute -top-4 -left-2">
                          {step.number}
                        </div>
                        <div className="relative bg-gradient-hero p-3 rounded-xl">
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "600ms" }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={aiNetworkImage} 
                alt="AI Network Visualization" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-gradient-hero rounded-full blur-3xl opacity-20 animate-pulse-glow" />
            <div className="absolute -top-8 -left-8 w-64 h-64 bg-gradient-accent rounded-full blur-3xl opacity-20 animate-pulse-glow" style={{ animationDelay: "1s" }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
