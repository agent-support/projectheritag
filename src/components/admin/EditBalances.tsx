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

  const updateBalance = async (operation: "add" | "subtract") => {
    if (!selectedUser || !amount) {
      toast({
        title: "Error",
        description: "Please select a user and enter an amount",
        variant: "destructive",
      });
      return;
    }

    // If no account exists, create one
    if (accounts.length === 0) {
      const accountNumber = `ACC${Date.now()}`;
      const { data: newAccount, error: createError } = await supabase
        .from("accounts")
        .insert({
          user_id: selectedUser,
          account_type: "checking",
          account_number: accountNumber,
          balance: operation === "add" ? Number(amount) : 0,
          currency: "USD",
          status: "active"
        })
        .select()
        .single();

      if (createError || !newAccount) {
        toast({
          title: "Error",
          description: "Failed to create account",
          variant: "destructive",
        });
        return;
      }

      // Create transaction record
      await supabase.from("transactions").insert({
        account_id: newAccount.id,
        transaction_type: "credit",
        amount: Number(amount),
        description: `Admin added initial funds`,
        status: "completed",
      });

      // Log action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("admin_logs").insert({
          admin_id: user.id,
          action_type: `balance_add`,
          target_user_id: selectedUser,
          details: { 
            account_id: newAccount.id, 
            amount: Number(amount), 
            previous_balance: 0,
            new_balance: Number(amount)
          },
        });
      }

      toast({
        title: "Success",
        description: "Account created and funded successfully",
      });

      setAmount("");
      loadUserAccounts(selectedUser);
      return;
    }

    // Use existing account or selected account
    const targetAccount = selectedAccount 
      ? accounts.find((a) => a.id === selectedAccount)
      : accounts[0];
      
    if (!targetAccount) return;

    const currentBalance = Number(targetAccount.balance);
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
      return;
    }

    const { error } = await supabase
      .from("accounts")
      .update({ balance: newBalance })
      .eq("id", targetAccount.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive",
      });
      return;
    }

    // Create transaction record
    await supabase.from("transactions").insert({
      account_id: targetAccount.id,
      transaction_type: operation === "add" ? "credit" : "debit",
      amount: changeAmount,
      description: `Admin ${operation === "add" ? "added" : "deducted"} funds`,
      status: "completed",
    });

    // Log action
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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
    }

    toast({
      title: "Success",
      description: `Balance ${operation === "add" ? "added" : "subtracted"} successfully`,
    });

    setAmount("");
    loadUserAccounts(selectedUser);
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
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Account & Add Funds
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
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Funds
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateBalance("subtract")}
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Subtract Funds
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
