import bankBuilding from "@/assets/heritage-bank-building.jpg";
import peopleInBank from "@/assets/people-in-bank.jpg";
import mobileBankingUsers from "@/assets/mobile-banking-users.jpg";

export const Heritage = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Experience Heritage Banking</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover why millions trust Heritage Bank for their financial journey. From our impressive branches to innovative digital solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <HeritageCard 
            image={bankBuilding}
            title="Our Heritage Legacy"
            description="Heritage Bank stands as a symbol of trust and excellence, serving communities with premium banking services for generations."
          />
          <HeritageCard 
            image={peopleInBank}
            title="Personal Service Excellence"
            description="Experience personalized banking with our dedicated staff, ensuring every transaction is handled with care and professionalism."
          />
          <HeritageCard 
            image={mobileBankingUsers}
            title="Digital Banking Innovation"
            description="Access your Heritage Bank account anywhere, anytime with our cutting-edge mobile app designed for modern banking needs."
          />
        </div>
      </div>
    </section>
  );
};

const HeritageCard = ({ image, title, description }: { image: string; title: string; description: string }) => {
  return (
    <div className="group overflow-hidden rounded-lg border border-border hover:border-accent transition-all">
      <div className="aspect-video overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="p-6 bg-card">
        <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
