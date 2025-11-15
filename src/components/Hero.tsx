import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp, Globe, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-primary">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10" />
      
      <div className="absolute top-20 left-20 w-20 h-20 bg-accent/10 rounded-full animate-pulse" />
      <div className="absolute bottom-40 right-32 w-16 h-16 bg-accent/10 rounded-full animate-pulse delay-300" />
      <div className="absolute top-1/2 right-20 w-12 h-12 bg-accent/10 rounded-full animate-pulse delay-700" />

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Heritage <span className="text-accent">Bank</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            Banking Excellence Since 1885
          </p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 mt-12">
            Your Financial Future <span className="text-accent">Starts Here</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Experience premium banking with cutting-edge technology, personalized service, and the trust of generations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 group">
              <Link to="/auth?mode=signup">
                Open an Account
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-muted-foreground text-foreground hover:bg-secondary">
              <Link to="/auth">
                VIEW ACCOUNT
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-accent" />}
              title="Bank-Grade Security"
              description="Advanced encryption and fraud protection"
            />
            <FeatureCard 
              icon={<TrendingUp className="w-8 h-8 text-accent" />}
              title="Investment Growth"
              description="Portfolio management and wealth building"
            />
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-accent" />}
              title="Global Banking"
              description="International transfers and currency exchange"
            />
            <FeatureCard 
              icon={<Smartphone className="w-8 h-8 text-accent" />}
              title="24/7 Digital Access"
              description="Mobile banking and instant notifications"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:bg-card transition-all hover:scale-105 hover:shadow-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};
