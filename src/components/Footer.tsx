import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-hero p-2 rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold bg-gradient-hero bg-clip-text text-transparent">
                BPUT CareerAI
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Empowering BPUT students with AI-driven career recommendations and internship matching.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Bhubaneswar, Odisha</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+91 (674) 230-4200</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@bputcareerai.edu.in</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">For Students</h3>
            <ul className="space-y-2">
              <li><a href="/student/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Dashboard</a></li>
              <li><a href="/student/jobs" className="text-sm text-muted-foreground hover:text-primary transition-colors">Job Board</a></li>
              <li><a href="/student/career-path" className="text-sm text-muted-foreground hover:text-primary transition-colors">Career Path</a></li>
              <li><a href="/student/ai-interview" className="text-sm text-muted-foreground hover:text-primary transition-colors">AI Interview</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">For Employers</h3>
            <ul className="space-y-2">
              <li><a href="/employer/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Employer Dashboard</a></li>
              <li><a href="/employer/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Post Jobs</a></li>
              <li><a href="/employer/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Find Candidates</a></li>
              <li><a href="/analytics" className="text-sm text-muted-foreground hover:text-primary transition-colors">Analytics</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">About BPUT</h3>
            <ul className="space-y-2">
              <li><a href="https://www.bput.ac.in" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">University Website</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Placement Cell</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Training & Development</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Career Guidance</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 BPUT CareerAI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="https://www.bput.ac.in/about-us" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              About BPUT
            </a>
            <a href="mailto:support@bputcareerai.edu.in" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Contact Us
            </a>
            <a href="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Sign In / Register
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
