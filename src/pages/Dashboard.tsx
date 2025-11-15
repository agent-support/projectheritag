import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  TrendingUp,
  FileText,
  Smartphone,
  Shield,
  Clock
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <QuickActionCard
                  icon={<ArrowUpRight className="w-6 h-6" />}
                  title="Transfer Money"
                  description="Send money locally or internationally"
                  onClick={() => navigate("/transfer")}
                />
                <QuickActionCard
                  icon={<Smartphone className="w-6 h-6" />}
                  title="Mobile Deposit"
                  description="View deposit information"
                  onClick={() => navigate("/mobile-deposit")}
                />
                <QuickActionCard
                  icon={<Wallet className="w-6 h-6" />}
                  title="My Profile"
                  description="Manage your personal information"
                  onClick={() => navigate("/profile")}
                />
                <QuickActionCard
                  icon={<TrendingUp className="w-6 h-6" />}
                  title="Crypto Service"
                  description="Buy, sell, and trade crypto"
                  onClick={() => navigate("/crypto")}
                />
                <QuickActionCard
                  icon={<CreditCard className="w-6 h-6" />}
                  title="ATM Card"
                  description="View your Visa card"
                  onClick={() => navigate("/atm-card")}
                />
                <QuickActionCard
                  icon={<TrendingUp className="w-6 h-6" />}
                  title="Portfolio"
                  description="View investment portfolio"
                  onClick={() => navigate("/dashboard/portfolio")}
                />
                <QuickActionCard
                  icon={<Wallet className="w-6 h-6" />}
                  title="Accounts"
                  description="Manage your accounts"
                  onClick={() => navigate("/dashboard")}
                />
                <QuickActionCard
                  icon={<FileText className="w-6 h-6" />}
                  title="Services"
                  description="View all banking services"
                  onClick={() => navigate("/dashboard")}
                />
              </div>

              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-bold text-foreground mb-4">Recent Activity</h2>
                <p className="text-muted-foreground">No recent transactions</p>
              </Card>
            </TabsContent>

            <TabsContent value="accounts" className="space-y-6">
              <Card className="p-6 bg-card border-border">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">My Accounts</h2>
                  <Button onClick={() => navigate("/dashboard/accounts/new")}>Add Account</Button>
                </div>
                <p className="text-muted-foreground">No accounts yet. Create your first account to get started.</p>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-6">
              <Card className="p-6 bg-card border-border">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Investment Portfolio</h2>
                  <Button onClick={() => navigate("/dashboard/portfolio")}>View Details</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <StatCard label="Total Value" value="$0.00" />
                  <StatCard label="Total Gain/Loss" value="$0.00" className="text-muted-foreground" />
                  <StatCard label="Return %" value="0.00%" className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Start investing to track your portfolio performance.</p>
              </Card>
            </TabsContent>

            <TabsContent value="bills" className="space-y-6">
              <Card className="p-6 bg-card border-border">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Bill Payments</h2>
                  <Button onClick={() => navigate("/dashboard/bills/new")}>Add Bill</Button>
                </div>
                <p className="text-muted-foreground">No bills to display. Add your first bill to get started.</p>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ServiceCard
                  icon={<Shield className="w-8 h-8 text-accent" />}
                  title="Advanced Security"
                  description="Advanced encryption and multi-factor authentication protect your data"
                />
                <ServiceCard
                  icon={<Clock className="w-8 h-8 text-accent" />}
                  title="24/7 Access"
                  description="Access your accounts anytime, anywhere from any device"
                />
                <ServiceCard
                  icon={<FileText className="w-8 h-8 text-accent" />}
                  title="Digital Statements"
                  description="View and download all your statements and documents"
                />
                <ServiceCard
                  icon={<Smartphone className="w-8 h-8 text-accent" />}
                  title="Mobile Banking"
                  description="Full-featured mobile app for banking on the go"
                />
                <ServiceCard
                  icon={<Wallet className="w-8 h-8 text-accent" />}
                  title="Digital Wallet"
                  description="Secure digital wallet for quick and easy payments"
                />
                <ServiceCard
                  icon={<TrendingUp className="w-8 h-8 text-accent" />}
                  title="Investment Tools"
                  description="Track and manage your investment portfolio"
                />
              </div>

              <Card className="p-6 bg-card border-border">
                <h3 className="text-xl font-bold text-foreground mb-4">Benefits of Online Banking</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <ArrowUpRight className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <strong className="text-foreground">Convenience:</strong>
                      <p className="text-muted-foreground">24/7 access to your accounts from anywhere in the world</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <strong className="text-foreground">Time-Saving:</strong>
                      <p className="text-muted-foreground">No need to visit physical branches for most transactions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CreditCard className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <strong className="text-foreground">Cost-Effective:</strong>
                      <p className="text-muted-foreground">Lower fees compared to traditional banking methods</p>
                    </div>
                  </li>
                </ul>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const QuickActionCard = ({ 
  icon, 
  title, 
  description, 
  onClick 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  onClick: () => void;
}) => {
  return (
    <Card 
      className="p-6 bg-card border-border hover:border-accent transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-accent/10 rounded-lg text-accent">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
};

const StatCard = ({ 
  label, 
  value, 
  className = "" 
}: { 
  label: string; 
  value: string; 
  className?: string;
}) => {
  return (
    <div className="text-center p-4 bg-secondary/50 rounded-lg">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-bold ${className}`}>{value}</div>
    </div>
  );
};

const ServiceCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
};

export default Dashboard;
