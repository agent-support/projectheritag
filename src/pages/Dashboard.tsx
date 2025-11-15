import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ArrowUpRight, ArrowDownRight, CreditCard, TrendingUp, FileText, Smartphone, Shield, Clock, DollarSign } from "lucide-react";
import type { User } from "@supabase/supabase-js";
interface Account {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
  currency: string;
  status: string;
}
const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [profileName, setProfileName] = useState<string>("");
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [cvv] = useState(() => Math.floor(100 + Math.random() * 900).toString());
  const [isActive, setIsActive] = useState(true);
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Check user status
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, first_name, last_name, status")
        .eq("id", session.user.id)
        .single();
      
      if (profile) {
        // If user is inactive, show message
        if (profile.status === 'inactive') {
          setLoading(false);
          return;
        }
        
        setProfileName(profile.full_name || `${profile.first_name} ${profile.last_name}` || "User");
      }

      // Load accounts
      await loadAccounts(session.user.id);
      
      setLoading(false);
    };
    checkUser();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadAccounts(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Real-time subscription for account updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('account-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'accounts',
      filter: `user_id=eq.${user.id}`
    }, () => {
      loadAccounts(user.id);
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  const loadAccounts = async (userId: string) => {
    const {
      data,
      error
    } = await supabase.from("accounts").select("*").eq("user_id", userId);
    if (data) {
      setAccounts(data as Account[]);
    }
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  
  if (loading) {
    return <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>;
  }

  // Check if user account is inactive
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        setIsActive(true);
        return;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();
      
      setIsActive(profile?.status === 'active');
    };
    checkStatus();
  }, [user]);

  if (!isActive) {
    return (
      <div className="min-h-screen bg-primary">
        <Navbar />
        <div className="pt-24 pb-12 flex items-center justify-center min-h-[80vh]">
          <Card className="max-w-md mx-4 p-8 bg-card border-border text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Account Not Activated</h2>
            <p className="text-muted-foreground mb-6">
              Your account is not yet activated. Please try and reach the support team so your account will be activated.
            </p>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  return <div className="min-h-screen bg-primary">
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

          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Account Balance Cards */}
              {accounts.length > 0 && <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Account Balances</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {accounts.map(account => <Card key={account.id} className="p-6 bg-gradient-to-br from-card to-accent/5 border-border hover:border-accent transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-accent/10 rounded-lg">
                            <DollarSign className="w-6 h-6 text-accent" />
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${account.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {account.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1 capitalize">
                          {account.account_type.replace('_', ' ')}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 font-mono">
                          {account.account_number}
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm text-muted-foreground">{account.currency}</span>
                          <span className="text-3xl font-bold text-foreground">
                            {parseFloat(account.balance?.toString() || '0').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                          </span>
                        </div>
                      </Card>)}
                  </div>
                </div>}

              {accounts.length === 0}

              {/* Quick Actions */}
              <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <QuickActionCard icon={<ArrowUpRight className="w-6 h-6" />} title="Transfer Money" description="Send money locally or internationally" onClick={() => navigate("/transfer")} />
                <QuickActionCard icon={<Smartphone className="w-6 h-6" />} title="Mobile Deposit" description="View deposit information" onClick={() => navigate("/mobile-deposit")} />
                <QuickActionCard icon={<Wallet className="w-6 h-6" />} title="My Profile" description="Manage your personal information" onClick={() => navigate("/profile")} />
                <QuickActionCard icon={<TrendingUp className="w-6 h-6" />} title="Crypto Service" description="Buy, sell, and trade crypto" onClick={() => navigate("/crypto")} />
                <QuickActionCard icon={<CreditCard className="w-6 h-6" />} title="ATM Card" description="View your Visa card" onClick={() => navigate("/atm-card")} />
                <QuickActionCard icon={<TrendingUp className="w-6 h-6" />} title="Portfolio" description="View investment portfolio" onClick={() => navigate("/dashboard/portfolio")} />
                <QuickActionCard icon={<Wallet className="w-6 h-6" />} title="Accounts" description="Manage your accounts" onClick={() => navigate("/dashboard")} />
                <QuickActionCard icon={<FileText className="w-6 h-6" />} title="Services" description="View all banking services" onClick={() => navigate("/dashboard")} />
              </div>

              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-bold text-foreground mb-4">Recent Activity</h2>
                <p className="text-muted-foreground">No recent transactions</p>
              </Card>
            </TabsContent>

            <TabsContent value="accounts" className="space-y-6">
              {/* Account Balance Card */}
              <Card className="p-8 bg-card border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-medium text-muted-foreground">Account Balance</h2>
                </div>
                <div className="mb-6">
                  <div className="text-5xl font-bold text-foreground mb-2">
                    ${accounts.reduce((sum, acc) => sum + parseFloat(acc.balance?.toString() || '0'), 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                </div>
              </Card>

              {/* Quick Action Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-card border-border hover:border-accent transition-all cursor-pointer" onClick={() => navigate("/transfer")}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <ArrowUpRight className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Withdraw Money</h3>
                      <p className="text-sm text-muted-foreground">Transfer funds locally or internationally</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card border-border hover:border-accent transition-all cursor-pointer" onClick={() => navigate("/mobile-deposit")}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <ArrowDownRight className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Receive Money</h3>
                      <p className="text-sm text-muted-foreground">View account details for incoming transfers</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card border-border hover:border-accent transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Clock className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Transaction History</h3>
                      <p className="text-sm text-muted-foreground">View all your transactions</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card border-border hover:border-accent transition-all cursor-pointer" onClick={() => navigate("/profile")}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <FileText className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Settings</h3>
                      <p className="text-sm text-muted-foreground">Manage your account preferences</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* ATM Card with Flip Animation */}
              <div className="max-w-md mx-auto">
                <div 
                  className="relative w-full cursor-pointer"
                  style={{ 
                    perspective: '1000px',
                    aspectRatio: '1.586',
                  }}
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                >
                  <div 
                    className="relative w-full h-full transition-transform duration-700"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* Front of Card */}
                    <Card 
                      className="absolute inset-0 overflow-hidden p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 border-0 shadow-xl"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      {/* Card Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-24 translate-x-24"></div>
                        <div className="absolute bottom-0 left-0 w-36 h-36 bg-white rounded-full translate-y-18 -translate-x-18"></div>
                      </div>
                      
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        {/* Top Section - Chip and Contactless */}
                        <div className="flex justify-between items-start">
                          <div className="w-10 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md relative">
                            <div className="absolute inset-1 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-sm"></div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="flex gap-0.5">
                              <div className="w-3 h-3 border-2 border-white/60 rounded-full"></div>
                              <div className="w-3 h-3 border-2 border-white/60 rounded-full -ml-1.5"></div>
                            </div>
                            <span className="text-[10px] text-white/80 font-medium">Contactless</span>
                          </div>
                        </div>

                        {/* Card Number */}
                        <div className="font-mono text-lg sm:text-xl text-white tracking-[0.2em] font-medium">
                          {accounts[0]?.account_number ? 
                            `${accounts[0].account_number.slice(0, 4)} ${accounts[0].account_number.slice(4, 8)} ${accounts[0].account_number.slice(8, 12)} ${accounts[0].account_number.slice(12, 16)}` 
                            : "4532 7849 6231 0958"}
                        </div>

                        {/* Bottom Section - Name, Expiry, Visa */}
                        <div className="flex justify-between items-end">
                          <div className="flex gap-4 sm:gap-6">
                            <div>
                              <div className="text-[10px] text-white/60 mb-0.5 uppercase tracking-wider">Card Holder</div>
                              <div className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wide">
                                {profileName || "Heritage Customer"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-white/60 mb-0.5 uppercase tracking-wider">Expires</div>
                              <div className="text-xs sm:text-sm font-semibold text-white">12/28</div>
                            </div>
                          </div>
                          
                          {/* Visa Logo */}
                          <div className="text-white">
                            <svg viewBox="0 0 48 16" className="h-6 w-auto" fill="currentColor">
                              <path d="M19.5 0L16.5 16h-3.2l3-16h3.2zm13.6 10.4c0-2.7-4.5-2.8-4.5-4 0-.4.5-1 1.4-1 .8 0 1.8.2 2.6.5l.5-2.4c-.9-.3-2-.6-3.4-.6-3.6 0-6.1 1.9-6.1 4.6 0 2 1.8 3.1 3.2 3.8 1.4.7 1.9 1.1 1.9 1.8 0 1-.8 1.4-2 1.4-1.7 0-2.6-.4-3.3-.7l-.6 2.7c.8.4 2.2.7 3.7.7 3.8 0 6.3-1.9 6.3-4.8zm9.4 5.6h2.8L42.5 0h-2.6c-.6 0-1.1.3-1.3.9L33.2 16h3.8l.8-2.1h4.6l.5 2.1zM39.6 11l1.9-5.2L42.3 11h-2.7zM10.5 0L7 10.9 6.7 9.3c-.6-1.9-2.4-4-4.4-5L5.5 16h3.8l5.7-16h-4.5z"/>
                            </svg>
                          </div>
                        </div>

                        {/* Click to flip hint */}
                        <div className="absolute bottom-2 right-2 text-[10px] text-white/40">
                          Click to flip
                        </div>
                      </div>
                    </Card>

                    {/* Back of Card */}
                    <Card 
                      className="absolute inset-0 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 border-0 shadow-xl"
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <div className="h-full flex flex-col">
                        {/* Magnetic Stripe */}
                        <div className="w-full h-12 bg-gray-900 mt-6"></div>
                        
                        {/* Signature and CVV Area */}
                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            {/* Signature Strip */}
                            <div className="bg-white/90 h-10 rounded flex items-center justify-end px-3 mb-4">
                              <div className="text-right">
                                <div className="text-[10px] text-gray-600 uppercase tracking-wider">CVV</div>
                                <div className="font-mono text-sm font-bold text-gray-900">
                                  {cvv}
                                </div>
                              </div>
                            </div>

                            {/* Card Info */}
                            <div className="text-[10px] text-white/70 space-y-1">
                              <p>This card is property of Heritage Bank</p>
                              <p>If found, please return to any Heritage Bank branch</p>
                              <p className="mt-3">For customer service: 1-800-HERITAGE</p>
                            </div>
                          </div>

                          {/* Visa Logo and Hologram */}
                          <div className="flex justify-between items-end">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/30 flex items-center justify-center">
                              <div className="text-[8px] text-white/60 text-center">HOLOGRAM</div>
                            </div>
                            <div className="text-white">
                              <svg viewBox="0 0 48 16" className="h-5 w-auto" fill="currentColor">
                                <path d="M19.5 0L16.5 16h-3.2l3-16h3.2zm13.6 10.4c0-2.7-4.5-2.8-4.5-4 0-.4.5-1 1.4-1 .8 0 1.8.2 2.6.5l.5-2.4c-.9-.3-2-.6-3.4-.6-3.6 0-6.1 1.9-6.1 4.6 0 2 1.8 3.1 3.2 3.8 1.4.7 1.9 1.1 1.9 1.8 0 1-.8 1.4-2 1.4-1.7 0-2.6-.4-3.3-.7l-.6 2.7c.8.4 2.2.7 3.7.7 3.8 0 6.3-1.9 6.3-4.8zm9.4 5.6h2.8L42.5 0h-2.6c-.6 0-1.1.3-1.3.9L33.2 16h3.8l.8-2.1h4.6l.5 2.1zM39.6 11l1.9-5.2L42.3 11h-2.7zM10.5 0L7 10.9 6.7 9.3c-.6-1.9-2.4-4-4.4-5L5.5 16h3.8l5.7-16h-4.5z"/>
                              </svg>
                            </div>
                          </div>

                          {/* Click to flip hint */}
                          <div className="absolute bottom-2 right-2 text-[10px] text-white/40">
                            Click to flip
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Account Secured */}
              <Card className="p-6 bg-card border-border">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Shield className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Account Secured</h3>
                    <p className="text-sm text-muted-foreground">
                      Your account is protected with advanced security and encrypted transactions.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>


            <TabsContent value="services" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ServiceCard icon={<Shield className="w-8 h-8 text-accent" />} title="Advanced Security" description="Advanced encryption and multi-factor authentication protect your data" />
                <ServiceCard icon={<Clock className="w-8 h-8 text-accent" />} title="24/7 Access" description="Access your accounts anytime, anywhere from any device" />
                <ServiceCard icon={<FileText className="w-8 h-8 text-accent" />} title="Digital Statements" description="View and download all your statements and documents" />
                <ServiceCard icon={<Smartphone className="w-8 h-8 text-accent" />} title="Mobile Banking" description="Full-featured mobile app for banking on the go" />
                <ServiceCard icon={<Wallet className="w-8 h-8 text-accent" />} title="Digital Wallet" description="Secure digital wallet for quick and easy payments" />
                <ServiceCard icon={<TrendingUp className="w-8 h-8 text-accent" />} title="Investment Tools" description="Track and manage your investment portfolio" />
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
    </div>;
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
  return <Card className="p-6 bg-card border-border hover:border-accent transition-all cursor-pointer" onClick={onClick}>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-accent/10 rounded-lg text-accent">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>;
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
  return <div className="text-center p-4 bg-secondary/50 rounded-lg">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-bold ${className}`}>{value}</div>
    </div>;
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
  return <Card className="p-6 bg-card border-border">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>;
};
export default Dashboard;