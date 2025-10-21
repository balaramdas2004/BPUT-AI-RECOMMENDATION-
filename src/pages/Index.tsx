import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Analytics from "@/components/Analytics";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import Avatar3D from "@/components/Avatar3D";
import SupportChat from "@/components/SupportChat";

const Index = () => {
  const navigate = useNavigate();
  const [showAvatar, setShowAvatar] = useState(true);

  const handleBagThrow = () => {
    setShowAvatar(false);
    // Navigate to auth page after animation
    setTimeout(() => {
      navigate('/auth');
    }, 500);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        
        {showAvatar && (
          <section className="py-20 px-4 bg-gradient-to-br from-background via-primary/5 to-background">
            <div className="container mx-auto max-w-4xl">
              <div className="text-center mb-8 animate-fade-in">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Meet Your Career Guide
                </h2>
                <p className="text-muted-foreground text-lg">
                  Click the avatar to start your journey
                </p>
              </div>
              <Avatar3D onBagThrow={handleBagThrow} />
            </div>
          </section>
        )}

        <Features />
        <HowItWorks />
        <Analytics />
        <CTA />
      </main>
      <Footer />
      <SupportChat userType="guest" />
    </div>
  );
};

export default Index;
