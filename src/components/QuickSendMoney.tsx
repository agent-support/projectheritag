import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

export const QuickSendMoney = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quickAmount, setQuickAmount] = useState("");

  const handleQuickSend = () => {
    if (!quickAmount || parseFloat(quickAmount) <= 0) {
      toast({ 
        title: "Invalid Amount", 
        description: "Please enter a valid amount",
        variant: "destructive" 
      });
      return;
    }
    navigate("/send-money");
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-accent/5 border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-accent/10 rounded-lg">
          <Send className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Quick Send</h3>
          <p className="text-sm text-muted-foreground">Send money to Heritage Bank users</p>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-sm">Amount ($)</Label>
          <Input 
            type="number" 
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={quickAmount}
            onChange={(e) => setQuickAmount(e.target.value)}
          />
        </div>
        <Button onClick={handleQuickSend} className="w-full">
          Send Money
        </Button>
      </div>
    </Card>
  );
};
