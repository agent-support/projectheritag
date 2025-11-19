import { Shield, Users, DollarSign, Bitcoin, Wallet, ArrowLeftRight, Settings, LogOut, PercentCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type AdminSection = "dashboard" | "users" | "balances" | "crypto" | "wallets" | "transfers" | "settings" | "crypto-fees";

interface AdminSidebarProps {
  currentSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

export const AdminSidebar = ({ currentSection, onSectionChange }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate("/auth");
  };

  const menuItems = [
    { id: "dashboard" as AdminSection, label: "Dashboard", icon: Shield },
    { id: "users" as AdminSection, label: "Manage Users", icon: Users },
    { id: "balances" as AdminSection, label: "Edit Balances", icon: DollarSign },
    { id: "crypto" as AdminSection, label: "Crypto Funding", icon: Bitcoin },
    { id: "wallets" as AdminSection, label: "Wallet Addresses", icon: Wallet },
    { id: "transfers" as AdminSection, label: "Pending Transfers", icon: ArrowLeftRight },
    { id: "crypto-fees" as AdminSection, label: "Crypto Fees", icon: PercentCircle },
    { id: "settings" as AdminSection, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Management Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentSection === item.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
};
