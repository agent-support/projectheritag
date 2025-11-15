import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { TrendingUp, PiggyBank, LineChart, Shield } from "lucide-react";

const Investments = () => {
  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-6 text-foreground">Investment Services</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Build and protect your wealth with our comprehensive investment and wealth management solutions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <StatCard number="$145B" label="Assets Under Management" />
              <StatCard number="4.8%" label="Average Portfolio Return" />
              <StatCard number="500K+" label="Satisfied Investors" />
              <StatCard number="25+" label="Investment Options" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <InvestmentCard 
                icon={<TrendingUp className="w-12 h-12 text-accent" />}
                title="Portfolio Management"
                description="Personalized investment strategies tailored to your financial goals and risk tolerance."
              />
              <InvestmentCard 
                icon={<PiggyBank className="w-12 h-12 text-accent" />}
                title="Retirement Planning"
                description="Secure your future with comprehensive retirement planning and 401(k) management."
              />
              <InvestmentCard 
                icon={<LineChart className="w-12 h-12 text-accent" />}
                title="Wealth Advisory"
                description="Expert guidance on wealth accumulation, preservation, and transfer strategies."
              />
              <InvestmentCard 
                icon={<Shield className="w-12 h-12 text-accent" />}
                title="Risk Management"
                description="Protect your investments with sophisticated risk assessment and mitigation strategies."
              />
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

const StatCard = ({ number, label }: { number: string; label: string }) => {
  return (
    <div className="text-center p-6 bg-card rounded-lg border border-border">
      <div className="text-4xl font-bold text-accent mb-2">{number}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
};

const InvestmentCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => {
  return (
    <Card className="p-8 bg-card border-border hover:border-accent transition-all">
      <div className="mb-6">{icon}</div>
      <h3 className="text-2xl font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
};

export default Investments;
