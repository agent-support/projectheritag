import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import bankBuilding from "@/assets/heritage-bank-building.jpg";

const About = () => {
  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24">
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 text-foreground">About Heritage Bank</h1>
              <p className="text-xl text-muted-foreground mb-12">
                135 years of banking excellence, trust, and innovation
              </p>
              
              <div className="aspect-video rounded-lg overflow-hidden mb-12">
                <img src={bankBuilding} alt="Heritage Bank Building" className="w-full h-full object-cover" />
              </div>

              <div className="text-left space-y-6">
                <p className="text-lg text-muted-foreground">
                  Founded in 1885, Heritage Bank has been a cornerstone of financial excellence for over a century. 
                  From our humble beginnings as a local savings institution to becoming a leading national bank, 
                  our commitment to our customers has never wavered.
                </p>
                
                <p className="text-lg text-muted-foreground">
                  We believe in combining the timeless values of trust, integrity, and personal service with 
                  cutting-edge technology to provide a banking experience that meets the needs of modern life while 
                  honoring the traditions that have made us successful.
                </p>

                <p className="text-lg text-muted-foreground">
                  Today, Heritage Bank serves over 2.5 million customers across the nation, managing $145 billion 
                  in assets while maintaining the personalized service and community focus that has defined us 
                  since day one.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-12 text-center text-foreground">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <ValueCard title="Trust" description="Building lasting relationships through transparency and reliability" />
              <ValueCard title="Innovation" description="Embracing technology to enhance your banking experience" />
              <ValueCard title="Excellence" description="Delivering premium service in everything we do" />
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

const ValueCard = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="text-center p-8 bg-card rounded-lg border border-border">
      <h3 className="text-2xl font-bold mb-4 text-accent">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default About;
