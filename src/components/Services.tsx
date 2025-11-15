import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Services = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Premium Banking Services</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From everyday banking to complex financial planning, we provide comprehensive solutions tailored to your unique needs and goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ServiceCard 
            title="Personal Banking"
            description="Checking, savings, and premium account options with competitive rates and no hidden fees."
            features={[
              "Zero monthly fees",
              "Global ATM access",
              "Mobile check deposit",
              "24/7 customer support"
            ]}
          />
          <ServiceCard 
            title="Home Loans & Mortgages"
            description="Competitive mortgage rates and personalized home financing solutions for your dream home."
            features={[
              "Low interest rates",
              "Quick pre-approval",
              "First-time buyer programs",
              "Refinancing options"
            ]}
          />
          <ServiceCard 
            title="Investment Services"
            description="Comprehensive wealth management and investment advisory services to grow your portfolio."
            features={[
              "Portfolio management",
              "Retirement planning",
              "Risk assessment",
              "Market insights"
            ]}
          />
          <ServiceCard 
            title="Business Banking"
            description="Tailored banking solutions for businesses of all sizes, from startups to enterprises."
            features={[
              "Business accounts",
              "Commercial loans",
              "Payroll services",
              "Merchant solutions"
            ]}
          />
          <ServiceCard 
            title="Savings & CDs"
            description="High-yield savings accounts and certificates of deposit to maximize your returns."
            features={[
              "Competitive APY",
              "No minimum balance",
              "Flexible terms",
              "FDIC insured"
            ]}
          />
          <ServiceCard 
            title="Security & Insurance"
            description="Comprehensive insurance products and advanced security features to protect what matters."
            features={[
              "Identity protection",
              "Fraud monitoring",
              "Insurance coverage",
              "Secure transactions"
            ]}
          />
        </div>
      </div>
    </section>
  );
};

const ServiceCard = ({ title, description, features }: { title: string; description: string; features: string[] }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-8 hover:border-accent transition-all hover:scale-105">
      <h3 className="text-2xl font-semibold mb-4 text-foreground">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
        Learn More
      </Button>
    </div>
  );
};
