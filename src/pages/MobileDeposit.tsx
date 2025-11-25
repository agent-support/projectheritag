import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Smartphone, Copy, Check } from "lucide-react";

const MobileDeposit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadDepositInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .maybeSingle();

      let { data: account } = await supabase
        .from("accounts")
        .select("account_number")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      // If no account exists, create one
      if (!account) {
        const { data: newAccount } = await supabase
          .from("accounts")
          .insert({
            user_id: session.user.id,
            account_type: "savings",
            balance: 0.00,
            currency: "USD",
            status: "active"
          })
          .select("account_number")
          .single();
        
        account = newAccount;
      }

      if (profile) setUserName(profile.full_name);
      if (account) setAccountNumber(account.account_number);
    };
    loadDepositInfo();
  }, [navigate]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied!", description: "Account number copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Mobile Deposit</h1>
          </div>

          <Card className="p-8 bg-card border-border mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Deposit Information</h2>
            
            <div className="max-w-md mx-auto space-y-6">
              <div className="p-6 bg-accent/10 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Account Holder</div>
                <div className="text-xl font-bold text-foreground">{userName || "Loading..."}</div>
              </div>

              <div className="p-6 bg-accent/10 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Account Number</div>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-foreground font-mono">
                    {accountNumber || "Loading..."}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(accountNumber)}
                    disabled={!accountNumber}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-6 bg-accent/10 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Bank Name</div>
                <div className="text-xl font-bold text-foreground">Heritage Bank</div>
              </div>

              <div className="p-6 bg-accent/10 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Routing Number</div>
                <div className="text-xl font-bold text-foreground font-mono">021000021</div>
              </div>

              <div className="p-6 bg-accent/10 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Swift Code</div>
                <div className="text-xl font-bold text-foreground font-mono">HERITGUS</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">How to Deposit</h3>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>Share the account details above with the sender</li>
              <li>Ensure the sender uses the correct account number</li>
              <li>Deposits typically process within 1-3 business days</li>
              <li>You'll receive a notification once the deposit is confirmed</li>
              <li>Check your account balance after the processing period</li>
            </ol>
          </Card>

          <div className="mt-6 p-4 bg-accent/10 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              For mobile check deposits, please use the Heritage Bank mobile app
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MobileDeposit;