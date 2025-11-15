import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CRYPTO_COINS = [
  { symbol: "BTC", name: "Bitcoin", price: 45000 },
  { symbol: "ETH", name: "Ethereum", price: 3000 },
  { symbol: "LTC", name: "Litecoin", price: 150 },
  { symbol: "USDT", name: "Tether", price: 1 },
  { symbol: "BNB", name: "Binance Coin", price: 350 },
];

export const CryptoFunding = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCoin, setSelectedCoin] = useState("");
  const [amount, setAmount] = useState("");
  const [wallets, setWallets] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserWallets(selectedUser);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");

    setUsers(data || []);
  };

  const loadUserWallets = async (userId: string) => {
    const { data } = await supabase
      .from("crypto_wallets")
      .select("*")
      .eq("user_id", userId);

    setWallets(data || []);
  };

  const updateCryptoBalance = async (operation: "add" | "subtract") => {
    if (!selectedUser || !selectedCoin || !amount) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    const changeAmount = Number(amount);
    const wallet = wallets.find((w) => w.coin_symbol === selectedCoin);
    const coin = CRYPTO_COINS.find((c) => c.symbol === selectedCoin);

    if (wallet) {
      // Update existing wallet
      const currentBalance = Number(wallet.balance);
      const newBalance = operation === "add" 
        ? currentBalance + changeAmount 
        : currentBalance - changeAmount;

      if (newBalance < 0) {
        toast({
          title: "Error",
          description: "Balance cannot be negative",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("crypto_wallets")
        .update({ balance: newBalance })
        .eq("id", wallet.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update wallet",
          variant: "destructive",
        });
        return;
      }
    } else if (operation === "add") {
      // Create new wallet
      const { error } = await supabase
        .from("crypto_wallets")
        .insert({
          user_id: selectedUser,
          coin_symbol: selectedCoin,
          wallet_address: `${selectedCoin}-${Date.now()}`,
          balance: changeAmount,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create wallet",
          variant: "destructive",
        });
        return;
      }
    } else {
      toast({
        title: "Error",
        description: "User doesn't have this wallet",
        variant: "destructive",
      });
      return;
    }

    // Create transaction
    await supabase.from("crypto_transactions").insert({
      user_id: selectedUser,
      transaction_type: operation === "add" ? "deposit" : "withdrawal",
      coin_symbol: selectedCoin,
      amount: changeAmount,
      usd_value: changeAmount * (coin?.price || 0),
      reference_number: `ADM-${Date.now()}`,
      status: "completed",
    });

    // Log action
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action_type: `crypto_${operation}`,
        target_user_id: selectedUser,
        details: { coin: selectedCoin, amount: changeAmount },
      });
    }

    toast({
      title: "Success",
      description: `Crypto balance ${operation === "add" ? "added" : "subtracted"} successfully`,
    });

    setAmount("");
    loadUserWallets(selectedUser);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Crypto Funding</h1>
        <p className="text-muted-foreground">Manage user crypto balances</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fund Crypto Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Cryptocurrency</Label>
            <Select value={selectedCoin} onValueChange={setSelectedCoin}>
              <SelectTrigger>
                <SelectValue placeholder="Select a coin" />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_COINS.map((coin) => (
                  <SelectItem key={coin.symbol} value={coin.symbol}>
                    {coin.name} ({coin.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.00000001"
            />
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => updateCryptoBalance("add")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Crypto
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => updateCryptoBalance("subtract")}
            >
              <Minus className="h-4 w-4 mr-2" />
              Subtract Crypto
            </Button>
          </div>

          {selectedUser && wallets.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold mb-2">Current Wallets</h3>
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <div key={wallet.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span>{wallet.coin_symbol}</span>
                    <span className="font-semibold">{Number(wallet.balance).toFixed(8)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
