import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16 px-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-foreground">Contact & Support</h1>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                We're here to help you with all your banking needs
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <Card className="p-6 md:p-8 bg-card border-border">
                <h2 className="text-xl md:text-2xl font-bold mb-6 text-foreground">Send us a message</h2>
                <form className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input id="contact-name" type="text" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input id="contact-email" type="email" placeholder="your@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">Subject</Label>
                    <Input id="contact-subject" type="text" placeholder="How can we help?" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <Textarea id="contact-message" placeholder="Your message" rows={5} />
                  </div>
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Send Message
                  </Button>
                </form>
              </Card>

              <div className="space-y-6 md:space-y-8">
                <Card className="p-6 md:p-8 bg-card border-border">
                  <h2 className="text-xl md:text-2xl font-bold mb-6 text-foreground">Contact Information</h2>
                  <div className="space-y-6">
                    <ContactItem 
                      icon={<Phone className="w-6 h-6 text-accent" />}
                      title="Phone"
                      content="1-800-HERITAGE (437-4824)"
                      subtitle="24/7 Customer Support"
                    />
                    <ContactItem 
                      icon={<Mail className="w-6 h-6 text-accent" />}
                      title="Email"
                      content="support@heritagehelpteam.online"
                      subtitle="We'll respond within 24 hours"
                    />
                    <ContactItem 
                      icon={<MapPin className="w-6 h-6 text-accent" />}
                      title="Headquarters"
                      content="123 Banking Plaza, New York, NY 10004"
                      subtitle="Visit us Monday-Friday, 9AM-5PM"
                    />
                  </div>
                </Card>

                <Card className="p-6 md:p-8 bg-card border-border">
                  <h3 className="text-lg md:text-xl font-bold mb-4 text-foreground">Business Hours</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                    <p>Saturday: 9:00 AM - 1:00 PM</p>
                    <p>Sunday: Closed</p>
                    <p className="mt-4 text-accent font-semibold">24/7 Online Banking & Phone Support</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

const ContactItem = ({ icon, title, content, subtitle }: { 
  icon: React.ReactNode; 
  title: string; 
  content: string; 
  subtitle: string 
}) => {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h4 className="font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-foreground">{content}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
};

export default Contact;
