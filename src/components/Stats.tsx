export const Stats = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Banking Excellence by the Numbers</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our commitment to financial excellence is reflected in our growth, customer satisfaction, and the trust placed in us by millions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard number="2.5M+" label="Trusted Customers" subtitle="Banking with confidence" />
          <StatCard number="$145B" label="Assets Under Management" subtitle="Growing your wealth" />
          <StatCard number="4.8%" label="Average Savings APY" subtitle="Competitive returns" />
          <StatCard number="135+" label="Years of Excellence" subtitle="Banking heritage since 1885" />
        </div>
      </div>
    </section>
  );
};

const StatCard = ({ number, label, subtitle }: { number: string; label: string; subtitle: string }) => {
  return (
    <div className="text-center p-8 bg-card rounded-lg border border-border hover:border-accent transition-all hover:scale-105">
      <div className="text-5xl font-bold text-accent mb-3">{number}</div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{label}</h3>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
};
