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
  bank_transfer_fee: number;
  email: string;
  full_name: string;
}

export const BankTransferFees = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, bank_transfer_fee")
        .order("full_name");

      if (error) throw error;

      setUsers(profiles || []);
    } catch (error) {
      console.error("Error loading fees:", error);
      toast({
        title: "Error",
        description: "Failed to load bank transfer fees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFee = async (userId: string, newFee: number) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bank_transfer_fee: newFee })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bank transfer fee updated",
      });

      await loadUsers();
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
        <h1 className="text-2xl font-bold">Bank Transfer Fees</h1>
        <p className="text-sm text-muted-foreground">Manage bank transfer fees per user</p>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="text-base">{user.full_name}</CardTitle>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor={`fee-${user.id}`} className="text-xs">Transfer Fee ($)</Label>
                  <Input
                    id={`fee-${user.id}`}
                    type="number"
                    step="0.01"
                    defaultValue={user.bank_transfer_fee}
                    className="h-9"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById(`fee-${user.id}`) as HTMLInputElement;
                    handleUpdateFee(user.id, parseFloat(input.value));
                  }}
                  disabled={updating === user.id}
                >
                  {updating === user.id ? (
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
