import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Services as ServicesSection } from "@/components/Services";

const Services = () => {
  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6 text-foreground">Our Services</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive banking solutions designed to meet your financial goals at every stage of life
            </p>
          </div>
        </section>
        <ServicesSection />
      </div>
      <Footer />
    </div>
  );
};

export default Services;
