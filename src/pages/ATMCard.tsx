import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";

const ATMCard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  useEffect(() => {
    const loadCardInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name);
        const randomCard = `4532 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
        setCardNumber(randomCard);
      }
    };
    loadCardInfo();
  }, [navigate]);

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
              <CreditCard className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">My ATM Card</h1>
          </div>

          <div className="max-w-md mx-auto">
            <div className="relative w-full aspect-[1.586/1] bg-gradient-to-br from-accent via-primary to-accent/80 rounded-2xl shadow-2xl p-6 text-foreground">
              <div className="absolute top-6 left-6">
                <div className="w-12 h-8 bg-accent/30 rounded"></div>
              </div>
              
              <div className="absolute top-6 right-6 text-2xl font-bold">VISA</div>
              
              <div className="absolute bottom-20 left-6 right-6">
                <div className="text-xl font-mono tracking-wider mb-4">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>
              </div>
              
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div>
                  <div className="text-xs text-foreground/70 mb-1">CARDHOLDER</div>
                  <div className="font-semibold text-sm uppercase">{userName || "YOUR NAME"}</div>
                </div>
                <div>
                  <div className="text-xs text-foreground/70 mb-1">VALID THRU</div>
                  <div className="font-semibold text-sm">12/28</div>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <span className="text-8xl font-bold rotate-[-15deg]">HERITAGE</span>
              </div>
            </div>

            <Card className="p-6 bg-card border-border mt-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Card Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Card Type:</span>
                  <span className="font-semibold">Visa Debit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold text-green-500">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Limit:</span>
                  <span className="font-semibold">$5,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Limit:</span>
                  <span className="font-semibold">$50,000</span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button variant="outline">Block Card</Button>
              <Button>Request New Card</Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ATMCard;