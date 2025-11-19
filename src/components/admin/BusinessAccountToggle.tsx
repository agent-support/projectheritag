import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface UserToggle {
  id: string;
  email: string;
  full_name: string;
  business_account_required: boolean;
}

export const BusinessAccountToggle = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, business_account_required")
        .order("full_name");

      if (error) throw error;

      setUsers(profiles || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (userId: string, newValue: boolean) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ business_account_required: newValue })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Business account requirement ${newValue ? 'enabled' : 'disabled'}`,
      });

      await loadUsers();
    } catch (error) {
      console.error("Error updating:", error);
      toast({
        title: "Error",
        description: "Failed to update setting",
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
        <h1 className="text-2xl font-bold">Business Account Upgrade</h1>
        <p className="text-sm text-muted-foreground">Require users to upgrade to business account</p>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="text-base">{user.full_name}</CardTitle>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor={`toggle-${user.id}`} className="text-sm">
                  Require Business Account Upgrade
                </Label>
                <Switch
                  id={`toggle-${user.id}`}
                  checked={user.business_account_required}
                  onCheckedChange={(checked) => handleToggle(user.id, checked)}
                  disabled={updating === user.id}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
