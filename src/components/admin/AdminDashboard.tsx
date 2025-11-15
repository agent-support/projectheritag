import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle } from "lucide-react";

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTransfers: 0,
    completedToday: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get active users
      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get total deposits (credit transactions)
      const { data: deposits } = await supabase
        .from("transactions")
        .select("amount")
        .eq("transaction_type", "credit");

      const totalDeposits = deposits?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get total withdrawals (debit transactions)
      const { data: withdrawals } = await supabase
        .from("transactions")
        .select("amount")
        .eq("transaction_type", "debit");

      const totalWithdrawals = withdrawals?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get pending transfers
      const { count: pendingTransfers } = await supabase
        .from("transfers")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: completedToday } = await supabase
        .from("transfers")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("created_at", today.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalDeposits,
        totalWithdrawals,
        pendingTransfers: pendingTransfers || 0,
        completedToday: completedToday || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Total Deposits",
      value: `$${stats.totalDeposits.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      title: "Total Withdrawals",
      value: `$${stats.totalWithdrawals.toFixed(2)}`,
      icon: TrendingDown,
      color: "text-red-500",
    },
    {
      title: "Pending Transfers",
      value: stats.pendingTransfers,
      icon: Clock,
      color: "text-orange-500",
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      icon: CheckCircle,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your banking platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
