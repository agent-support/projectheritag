import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Send } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const InternalTransfer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [formData, setFormData] = useState({
    recipientIdentifier: "", // username or account number
    amount: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };
    checkUser();
  }, [navigate]);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipientIdentifier || !formData.amount) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    const transferAmount = parseFloat(formData.amount);
    if (transferAmount <= 0) {
      toast({ title: "Error", description: "Amount must be greater than 0", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Get sender's account
      const { data: senderAccounts } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("balance", { ascending: false })
        .limit(1);

      if (!senderAccounts || senderAccounts.length === 0) {
        toast({ title: "Error", description: "No active account found", variant: "destructive" });
        setLoading(false);
        return;
      }

      const senderAccount = senderAccounts[0];
      const senderBalance = parseFloat(senderAccount.balance?.toString() || '0');

      // Check if sender has sufficient balance
      if (senderBalance < transferAmount) {
        toast({ 
          title: "Insufficient Funds", 
          description: `You need $${transferAmount.toFixed(2)} but only have $${senderBalance.toFixed(2)}`,
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      // Find recipient by username or account number
      const { data: recipientProfile } = await supabase
        .from("profiles")
        .select("id, email, full_name, username")
        .or(`username.eq.${formData.recipientIdentifier}`)
        .maybeSingle();

      let recipientUserId = recipientProfile?.id;

      // If not found by username, try by account number
      if (!recipientUserId) {
        const { data: recipientAccount } = await supabase
          .from("accounts")
          .select("user_id")
          .eq("account_number", formData.recipientIdentifier)
          .maybeSingle();

        recipientUserId = recipientAccount?.user_id;
      }

      if (!recipientUserId) {
        toast({ 
          title: "Recipient Not Found", 
          description: "User with this username or account number does not exist",
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      // Check if trying to send to self
      if (recipientUserId === user!.id) {
        toast({ 
          title: "Invalid Transfer", 
          description: "You cannot send money to yourself",
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      // Get recipient's account
      const { data: recipientAccounts } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", recipientUserId)
        .eq("status", "active")
        .limit(1);

      if (!recipientAccounts || recipientAccounts.length === 0) {
        toast({ title: "Error", description: "Recipient has no active account", variant: "destructive" });
        setLoading(false);
        return;
      }

      const recipientAccount = recipientAccounts[0];
      const recipientBalance = parseFloat(recipientAccount.balance?.toString() || '0');

      // Get recipient's full profile for email
      const { data: fullRecipientProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", recipientUserId)
        .single();

      // Get sender's profile for email
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user!.id)
        .single();

      // Generate transaction ID
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const timestamp = new Date().toISOString();

      // Update sender's balance (deduct)
      const newSenderBalance = senderBalance - transferAmount;
      await supabase
        .from("accounts")
        .update({ balance: newSenderBalance })
        .eq("id", senderAccount.id);

      // Update recipient's balance (add)
      const newRecipientBalance = recipientBalance + transferAmount;
      await supabase
        .from("accounts")
        .update({ balance: newRecipientBalance })
        .eq("id", recipientAccount.id);

      // Create transaction record for sender (debit)
      await supabase
        .from("transactions")
        .insert({
          account_id: senderAccount.id,
          amount: transferAmount,
          transaction_type: "debit",
          description: `Transfer to ${fullRecipientProfile?.full_name || 'User'}`,
          recipient: fullRecipientProfile?.full_name || 'User',
          status: "completed"
        });

      // Create transaction record for recipient (credit)
      await supabase
        .from("transactions")
        .insert({
          account_id: recipientAccount.id,
          amount: transferAmount,
          transaction_type: "credit",
          description: `Transfer from ${senderProfile?.full_name || 'User'}`,
          recipient: senderProfile?.full_name || 'User',
          status: "completed"
        });

      // Send debit alert to sender
      try {
        await supabase.functions.invoke("send-debit-alert", {
          body: {
            email: senderProfile?.email,
            name: senderProfile?.full_name,
            recipientName: fullRecipientProfile?.full_name,
            amount: transferAmount,
            currency: senderAccount.currency || "USD",
            currentBalance: newSenderBalance,
            transactionId: transactionId,
            timestamp: timestamp,
          },
        });
      } catch (emailError) {
        console.error("Error sending debit alert:", emailError);
      }

      // Send credit alert to recipient
      try {
        await supabase.functions.invoke("send-credit-alert", {
          body: {
            email: fullRecipientProfile?.email,
            name: fullRecipientProfile?.full_name,
            senderName: senderProfile?.full_name,
            amount: transferAmount,
            currency: recipientAccount.currency || "USD",
            currentBalance: newRecipientBalance,
            transactionId: transactionId,
            timestamp: timestamp,
          },
        });
      } catch (emailError) {
        console.error("Error sending credit alert:", emailError);
      }

      setReceiptData({
        recipientName: fullRecipientProfile?.full_name,
        amount: transferAmount,
        transactionId: transactionId,
        date: new Date(timestamp).toLocaleString(),
        newBalance: newSenderBalance,
        currency: senderAccount.currency || "USD"
      });

      setShowReceipt(true);
      setFormData({ recipientIdentifier: "", amount: "" });
      
      toast({ 
        title: "Transfer Successful", 
        description: `$${transferAmount.toFixed(2)} sent successfully` 
      });
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast({ 
        title: "Transfer Failed", 
        description: error.message || "An error occurred during transfer",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Send Money</h1>
            <p className="text-muted-foreground">Transfer funds to another Heritage Bank user</p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleTransferSubmit} className="space-y-6">
              <div>
                <Label>Recipient (Username or Account Number)</Label>
                <Input 
                  placeholder="Enter username or account number"
                  value={formData.recipientIdentifier}
                  onChange={(e) => setFormData({...formData, recipientIdentifier: e.target.value})}
                  required 
                />
                <p className="text-sm text-muted-foreground mt-1">
                  You can send to any Heritage Bank user using their username or account number
                </p>
              </div>

              <div>
                <Label>Amount ($)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required 
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : "Send Money"}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Transfer Receipt</DialogTitle>
          </DialogHeader>
          <div className="p-6 bg-gradient-to-br from-background to-secondary/20 rounded-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-center text-xl font-semibold text-foreground mb-6">
              Transfer Successful
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient:</span>
                <span className="font-semibold">{receiptData?.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold text-lg">${receiptData?.amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono text-xs">{receiptData?.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-semibold">{receiptData?.date}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-muted-foreground">New Balance:</span>
                <span className="font-bold text-lg">${receiptData?.newBalance?.toFixed(2)}</span>
              </div>
            </div>
            <Button onClick={() => {
              setShowReceipt(false);
              navigate("/transactions");
            }} className="w-full mt-6">
              View Transaction History
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternalTransfer;
