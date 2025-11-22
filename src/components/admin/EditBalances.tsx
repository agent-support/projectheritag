import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const EditBalances = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserAccounts(selectedUser);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");

    setUsers(data || []);
  };

  const loadUserAccounts = async (userId: string) => {
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId);

    setAccounts(data || []);
  };

  const [loading, setLoading] = useState(false);

  const updateBalance = async (operation: "add" | "subtract") => {
    if (!selectedUser || !amount) {
      toast({
        title: "Error",
        description: "Please select a user and enter an amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let accountId: string;
      let currentBalance = 0;
      let accountCurrency = "USD";
      let transactionId: string | undefined;

      // If no account exists, create one
      if (accounts.length === 0) {
        const { data: newAccount, error: createError } = await supabase
          .from("accounts")
          .insert({
            user_id: selectedUser,
            account_type: "checking",
            balance: operation === "add" ? Number(amount) : 0,
            currency: "USD",
            status: "active"
          })
          .select()
          .single();

        if (createError || !newAccount) throw new Error("Failed to create account");

        accountId = newAccount.id;
        currentBalance = 0;
        
        const newBalance = Number(amount);

        // Create transaction record
        const { data: txn } = await supabase.from("transactions").insert({
          account_id: newAccount.id,
          transaction_type: "credit",
          amount: Number(amount),
          description: `Admin added initial funds`,
          status: "completed",
        }).select().single();

        transactionId = txn?.id;

        // Log action
        await supabase.from("admin_logs").insert({
          admin_id: user.id,
          action_type: `balance_add`,
          target_user_id: selectedUser,
          details: { 
            account_id: newAccount.id, 
            amount: Number(amount), 
            previous_balance: 0,
            new_balance: newBalance
          },
        });

        // Send credit alert email
        try {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", selectedUser)
            .single();

          if (userProfile) {
            await supabase.functions.invoke("send-credit-alert", {
              body: {
                email: userProfile.email,
                name: userProfile.full_name,
                senderName: "Heritage Bank Admin",
                amount: Number(amount),
                currency: accountCurrency,
                currentBalance: newBalance,
                transactionId: transactionId || "N/A",
                timestamp: new Date().toISOString(),
              },
            });
          }
        } catch (emailError) {
          console.error("Error sending credit alert:", emailError);
        }

        toast({
          title: "Success",
          description: "Account created and funded successfully",
        });

        setAmount("");
        await loadUserAccounts(selectedUser);
        return;
      }

      // Use existing account or selected account
      const targetAccount = selectedAccount 
        ? accounts.find((a) => a.id === selectedAccount)
        : accounts[0];
        
      if (!targetAccount) throw new Error("No account found");

      currentBalance = Number(targetAccount.balance);
      accountCurrency = targetAccount.currency || "USD";
      const changeAmount = Number(amount);
      const newBalance = operation === "add" 
        ? currentBalance + changeAmount 
        : currentBalance - changeAmount;

      if (newBalance < 0) {
        toast({
          title: "Error",
          description: "Balance cannot be negative",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("accounts")
        .update({ balance: newBalance })
        .eq("id", targetAccount.id);

      if (error) throw error;

      // Create transaction record
      const { data: txn } = await supabase.from("transactions").insert({
        account_id: targetAccount.id,
        transaction_type: operation === "add" ? "credit" : "debit",
        amount: changeAmount,
        description: `Admin ${operation === "add" ? "added" : "deducted"} funds`,
        status: "completed",
      }).select().single();

      transactionId = txn?.id;

      // Log action
      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action_type: `balance_${operation}`,
        target_user_id: selectedUser,
        details: { 
          account_id: targetAccount.id, 
          amount: changeAmount, 
          previous_balance: currentBalance,
          new_balance: newBalance 
        },
      });

      // Send credit alert email if adding funds
      if (operation === "add") {
        try {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", selectedUser)
            .single();

          if (userProfile) {
            await supabase.functions.invoke("send-credit-alert", {
              body: {
                email: userProfile.email,
                name: userProfile.full_name,
                senderName: "Heritage Bank Admin",
                amount: changeAmount,
                currency: accountCurrency,
                currentBalance: newBalance,
                transactionId: transactionId || "N/A",
                timestamp: new Date().toISOString(),
              },
            });
          }
        } catch (emailError) {
          console.error("Error sending credit alert:", emailError);
        }
      }

      toast({
        title: "Success",
        description: `Balance ${operation === "add" ? "added" : "subtracted"} successfully`,
      });

      setAmount("");
      await loadUserAccounts(selectedUser);
    } catch (error) {
      console.error("Error updating balance:", error);
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Balances</h1>
        <p className="text-muted-foreground">Add or subtract user account balances</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Search User</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <>
              {accounts.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4 text-muted-foreground bg-muted/30 rounded-lg">
                    <p>This user has no bank accounts yet.</p>
                    <p className="text-sm mt-2">A new account will be created when you add funds.</p>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount to fund"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => updateBalance("add")}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {loading ? "Processing..." : "Create Account & Add Funds"}
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <Label>Account</Label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_type} - {account.account_number} (Balance: ${Number(account.balance).toFixed(2)})
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
                      step="0.01"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => updateBalance("add")}
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {loading ? "Processing..." : "Add Funds"}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateBalance("subtract")}
                      disabled={loading}
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      {loading ? "Processing..." : "Subtract Funds"}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
