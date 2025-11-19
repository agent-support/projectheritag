import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ManageUsers } from "@/components/admin/ManageUsers";
import { EditBalances } from "@/components/admin/EditBalances";
import { CryptoFunding } from "@/components/admin/CryptoFunding";
import { WalletAddressUpdate } from "@/components/admin/WalletAddressUpdate";
import { PendingTransfers } from "@/components/admin/PendingTransfers";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { CryptoTransferFees } from "@/components/admin/CryptoTransferFees";
import { useToast } from "@/hooks/use-toast";

type AdminSection = "dashboard" | "users" | "balances" | "crypto" | "wallets" | "transfers" | "settings" | "crypto-fees";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<AdminSection>("dashboard");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roles) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Admin access check error:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar currentSection={currentSection} onSectionChange={setCurrentSection} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {currentSection === "dashboard" && <AdminDashboard />}
          {currentSection === "users" && <ManageUsers />}
          {currentSection === "balances" && <EditBalances />}
          {currentSection === "crypto" && <CryptoFunding />}
          {currentSection === "wallets" && <WalletAddressUpdate />}
          {currentSection === "transfers" && <PendingTransfers />}
          {currentSection === "crypto-fees" && <CryptoTransferFees />}
          {currentSection === "settings" && <AdminSettings />}
        </div>
      </main>
    </div>
  );
};

export default Admin;
