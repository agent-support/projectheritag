import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Transfer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinVerify, setShowPinVerify] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [verifyPin, setVerifyPin] = useState("");
  const [transferData, setTransferData] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [formData, setFormData] = useState({
    recipientName: "",
    recipientAccount: "",
    recipientBank: "",
    recipientCountry: "",
    amount: "",
    transferType: "local" as "local" | "international"
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("transfer_pin")
        .eq("id", session.user.id)
        .single();
      
      setHasPin(!!profile?.transfer_pin);
    };
    checkUser();
  }, [navigate]);

  const handleSetupPin = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({ title: "Error", description: "PIN must be 4 digits", variant: "destructive" });
      return;
    }
    if (pin !== confirmPin) {
      toast({ title: "Error", description: "PINs don't match", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ transfer_pin: pin })
      .eq("id", user!.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setHasPin(true);
    setShowPinSetup(false);
    setPin("");
    setConfirmPin("");
    toast({ title: "Success", description: "Transfer PIN created successfully" });
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipientName || !formData.recipientAccount || !formData.amount) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setTransferData(formData);
    if (!hasPin) {
      setShowPinSetup(true);
    } else {
      setShowPinVerify(true);
    }
  };

  const handleVerifyPin = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("transfer_pin")
      .eq("id", user!.id)
      .single();

    if (profile?.transfer_pin !== verifyPin) {
      toast({ title: "Error", description: "Incorrect PIN", variant: "destructive" });
      return;
    }

    const referenceNumber = `HER${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const { error } = await supabase
      .from("transfers")
      .insert({
        user_id: user!.id,
        recipient_name: transferData.recipientName,
        recipient_account: transferData.recipientAccount,
        recipient_bank: transferData.recipientBank,
        recipient_country: transferData.recipientCountry,
        amount: parseFloat(transferData.amount),
        transfer_type: transferData.transferType,
        reference_number: referenceNumber
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setReceiptData({
      ...transferData,
      referenceNumber,
      date: new Date().toLocaleString()
    });
    setShowPinVerify(false);
    setVerifyPin("");
    setShowReceipt(true);
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

          <h1 className="text-4xl font-bold text-foreground mb-8">Transfer Money</h1>

          <Tabs defaultValue="local" onValueChange={(v) => setFormData({...formData, transferType: v as "local" | "international"})}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="local">Local Transfer</TabsTrigger>
              <TabsTrigger value="international">International Transfer</TabsTrigger>
            </TabsList>

            <TabsContent value="local">
              <Card className="p-6 bg-card border-border">
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div>
                    <Label>Recipient Name</Label>
                    <Input 
                      value={formData.recipientName}
                      onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input 
                      value={formData.recipientAccount}
                      onChange={(e) => setFormData({...formData, recipientAccount: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label>Bank Name</Label>
                    <Input 
                      value={formData.recipientBank}
                      onChange={(e) => setFormData({...formData, recipientBank: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Amount ($)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full">Continue</Button>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="international">
              <Card className="p-6 bg-card border-border">
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div>
                    <Label>Recipient Name</Label>
                    <Input 
                      value={formData.recipientName}
                      onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label>Account Number / IBAN</Label>
                    <Input 
                      value={formData.recipientAccount}
                      onChange={(e) => setFormData({...formData, recipientAccount: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label>Bank Name</Label>
                    <Input 
                      value={formData.recipientBank}
                      onChange={(e) => setFormData({...formData, recipientBank: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input 
                      value={formData.recipientCountry}
                      onChange={(e) => setFormData({...formData, recipientCountry: e.target.value})}
                      required 
                    />
                  </div>
                  <div>
                    <Label>Amount ($)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full">Continue</Button>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showPinSetup} onOpenChange={setShowPinSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Transfer PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Enter 4-digit PIN</Label>
              <Input 
                type="password" 
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div>
              <Label>Confirm PIN</Label>
              <Input 
                type="password" 
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <Button onClick={handleSetupPin} className="w-full">Create PIN</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPinVerify} onOpenChange={setShowPinVerify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Transfer PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>4-digit PIN</Label>
              <Input 
                type="password" 
                maxLength={4}
                value={verifyPin}
                onChange={(e) => setVerifyPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <Button onClick={handleVerifyPin} className="w-full">Verify & Transfer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Transfer Receipt</DialogTitle>
          </DialogHeader>
          <div className="relative p-6 bg-gradient-to-br from-background to-secondary/20 rounded-lg">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <span className="text-9xl font-bold">HERITAGE</span>
            </div>
            <div className="relative space-y-4">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-accent-foreground" />
                </div>
              </div>
              <h3 className="text-center text-xl font-semibold text-foreground mb-4">Transfer Successful</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-semibold">{receiptData?.referenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span className="font-semibold">{receiptData?.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient:</span>
                  <span className="font-semibold">{receiptData?.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account:</span>
                  <span className="font-semibold">{receiptData?.recipientAccount}</span>
                </div>
                {receiptData?.recipientBank && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank:</span>
                    <span className="font-semibold">{receiptData.recipientBank}</span>
                  </div>
                )}
                {receiptData?.recipientCountry && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country:</span>
                    <span className="font-semibold">{receiptData.recipientCountry}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg text-accent">${parseFloat(receiptData?.amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-semibold capitalize">{receiptData?.transferType}</span>
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => {
            setShowReceipt(false);
            navigate("/dashboard");
          }} className="w-full">Done</Button>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Transfer;