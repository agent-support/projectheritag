import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Car, GraduationCap, Building } from "lucide-react";

const Loans = () => {
  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-6 text-foreground">Loans & Credit</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Flexible financing solutions with competitive rates to help you achieve your dreams
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <LoanCard 
                icon={<Home className="w-12 h-12 text-accent" />}
                title="Home Mortgages"
                description="Make your dream home a reality with our competitive mortgage rates and flexible terms."
                rate="3.75% APR"
                features={["Fixed & adjustable rates", "First-time buyer programs", "Refinancing options"]}
              />
              <LoanCard 
                icon={<Car className="w-12 h-12 text-accent" />}
                title="Auto Loans"
                description="Drive away in your new car with low-interest auto loans and quick approval."
                rate="4.25% APR"
                features={["New & used vehicles", "No prepayment penalty", "Flexible terms up to 72 months"]}
              />
              <LoanCard 
                icon={<GraduationCap className="w-12 h-12 text-accent" />}
                title="Student Loans"
                description="Invest in your education with competitive student loan rates and flexible repayment."
                rate="5.50% APR"
                features={["Undergraduate & graduate", "Deferment options", "No origination fees"]}
              />
              <LoanCard 
                icon={<Building className="w-12 h-12 text-accent" />}
                title="Business Loans"
                description="Grow your business with tailored commercial loans and lines of credit."
                rate="Starting at 6.25% APR"
                features={["Equipment financing", "Working capital", "Commercial real estate"]}
              />
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

const LoanCard = ({ icon, title, description, rate, features }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  rate: string;
  features: string[];
}) => {
  return (
    <Card className="p-8 bg-card border-border hover:border-accent transition-all">
      <div className="mb-6">{icon}</div>
      <h3 className="text-2xl font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <div className="text-2xl font-bold text-accent mb-6">{rate}</div>
      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="text-muted-foreground">• {feature}</li>
        ))}
      </ul>
      <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        Apply Now
      </Button>
    </Card>
  );
};

export default Loans;
