import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface UserFee {
  id: string;
  user_id: string;
  btc_fee: number;
  email: string;
  full_name: string;
}

export const CryptoTransferFees = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadUsersWithFees();
  }, []);

  const loadUsersWithFees = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("full_name");

      if (profilesError) throw profilesError;

      const { data: fees, error: feesError } = await supabase
        .from("crypto_transfer_fees")
        .select("*");

      if (feesError && feesError.code !== "PGRST116") throw feesError;

      const usersWithFees = profiles?.map((profile) => {
        const userFee = fees?.find((f) => f.user_id === profile.id);
        return {
          id: userFee?.id || "",
          user_id: profile.id,
          btc_fee: userFee?.btc_fee || 0.0001,
          email: profile.email,
          full_name: profile.full_name,
        };
      }) || [];

      setUsers(usersWithFees);
    } catch (error) {
      console.error("Error loading fees:", error);
      toast({
        title: "Error",
        description: "Failed to load crypto fees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFee = async (userId: string, feeId: string, newFee: number) => {
    setUpdating(userId);
    try {
      if (feeId) {
        const { error } = await supabase
          .from("crypto_transfer_fees")
          .update({ btc_fee: newFee })
          .eq("id", feeId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("crypto_transfer_fees")
          .insert({ user_id: userId, btc_fee: newFee });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Transfer fee updated",
      });

      await loadUsersWithFees();
    } catch (error) {
      console.error("Error updating fee:", error);
      toast({
        title: "Error",
        description: "Failed to update fee",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Crypto Transfer Fees</h1>
        <p className="text-sm text-muted-foreground">Manage BTC fees per user</p>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.user_id}>
            <CardHeader>
              <CardTitle className="text-base">{user.full_name}</CardTitle>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor={`fee-${user.user_id}`} className="text-xs">BTC Fee</Label>
                  <Input
                    id={`fee-${user.user_id}`}
                    type="number"
                    step="0.00001"
                    defaultValue={user.btc_fee}
                    className="h-9"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    const input = document.getElementById(`fee-${user.user_id}`) as HTMLInputElement;
                    handleUpdateFee(user.user_id, user.id, parseFloat(input.value));
                  }}
                  disabled={updating === user.user_id}
                >
                  {updating === user.user_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
