import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const WalletAddressUpdate = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [newAddress, setNewAddress] = useState("");

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

  const [updating, setUpdating] = useState(false);

  const updateWalletAddress = async () => {
    if (!selectedWallet || !newAddress.trim()) {
      toast({
        title: "Error",
        description: "Please select a wallet and enter new address",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Call edge function with service_role to ensure update works
      const { data, error } = await supabase.functions.invoke('update-wallet-address', {
        body: {
          walletId: selectedWallet,
          newAddress: newAddress.trim(),
          adminId: user.id,
          targetUserId: selectedUser
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: "Wallet address updated successfully and reflected in user account",
      });

      setNewAddress("");
      setSelectedWallet("");
      await loadUserWallets(selectedUser);
    } catch (error) {
      console.error("Error updating wallet:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update wallet address",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet Address Update</h1>
        <p className="text-muted-foreground">Update user crypto wallet addresses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Wallet Address</CardTitle>
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

          {selectedUser && wallets.length > 0 && (
            <>
              <div>
                <Label>Wallet</Label>
                <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.coin_symbol} - {wallet.wallet_address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>New Wallet Address</Label>
                <Input
                  placeholder="Enter new wallet address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={updateWalletAddress}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Address"}
              </Button>
            </>
          )}

          {selectedUser && wallets.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              This user has no crypto wallets yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
