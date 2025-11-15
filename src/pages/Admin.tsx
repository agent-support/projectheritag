import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Wallet, DollarSign, ArrowLeft, CheckCircle, XCircle, Eye, Lock, Unlock, Activity } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAccounts: 0,
    totalBalance: 0,
    totalCryptoValue: 0,
    activeUsers: 0,
    blockedUsers: 0,
    pendingTransfers: 0
  });

  useEffect(() => {
    checkAdminAccess();
  }, [navigate]);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (error || !roles) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin panel",
          variant: "destructive"
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadAdminData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false});
    
    if (profilesData) {
      setUsers(profilesData);
      const activeUsers = profilesData.filter(p => p.status === 'active').length;
      const blockedUsers = profilesData.filter(p => p.status === 'blocked').length;
      setStats(prev => ({ 
        ...prev, 
        totalUsers: profilesData.length,
        activeUsers,
        blockedUsers
      }));
    }

    const { data: accountsData } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (accountsData) {
      setAccounts(accountsData);
      const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      setStats(prev => ({ ...prev, totalAccounts: accountsData.length, totalBalance }));
    }

    const { data: walletsData } = await supabase
      .from("crypto_wallets")
      .select("*");
    
    if (walletsData) {
      setCryptoWallets(walletsData);
    }

    const { data: transactionsData } = await supabase
      .from("crypto_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (transactionsData) {
      setTransactions(transactionsData);
      const totalCryptoValue = transactionsData.reduce((sum, tx) => sum + (tx.usd_value || 0), 0);
      setStats(prev => ({ ...prev, totalCryptoValue }));
    }

    const { data: pendingData } = await supabase
      .from("transfers")
      .select("*, profiles!inner(full_name, email)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (pendingData) {
      setPendingTransfers(pendingData);
      setStats(prev => ({ ...prev, pendingTransfers: pendingData.length }));
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('activate_user_account', { _user_id: userId });
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "User account activated successfully",
      });

      await loadAdminData();
    } catch (error) {
      console.error("Error activating user:", error);
      toast({
        title: "Error",
        description: "Failed to activate user account",
        variant: "destructive",
      });
    }
  };

  const handleApproveTransfer = async (transferId: string) => {
    try {
      const { error } = await supabase
        .from("transfers")
        .update({ status: "completed" })
        .eq("id", transferId);

      if (error) throw error;

      toast({
        title: "Transfer Approved",
        description: "The transfer has been approved and completed"
      });

      await loadAdminData();
    } catch (error) {
      console.error("Error approving transfer:", error);
      toast({
        title: "Error",
        description: "Failed to approve transfer",
        variant: "destructive"
      });
    }
  };

  const handleRejectTransfer = async (transferId: string, userId: string, amount: number) => {
    try {
      const { error: transferError } = await supabase
        .from("transfers")
        .update({ status: "rejected" })
        .eq("id", transferId);

      if (transferError) throw transferError;

      const { data: userAccount } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (userAccount) {
        await supabase
          .from("accounts")
          .update({ balance: userAccount.balance + amount })
          .eq("id", userAccount.id);
      }

      toast({
        title: "Transfer Rejected",
        description: "The transfer has been rejected and amount refunded"
      });

      await loadAdminData();
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      toast({
        title: "Error",
        description: "Failed to reject transfer",
        variant: "destructive"
      });
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground text-lg">Comprehensive management dashboard</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 border-l-4 border-l-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Users</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Unlock className="w-3 h-3 mr-1" />
                      {stats.activeUsers} Active
                    </Badge>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <Lock className="w-3 h-3 mr-1" />
                      {stats.blockedUsers} Blocked
                    </Badge>
                  </div>
                </div>
                <Users className="w-12 h-12 text-primary opacity-20" />
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Accounts</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalAccounts}</p>
                  <p className="text-xs text-muted-foreground mt-2">Active banking accounts</p>
                </div>
                <Wallet className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
                  <p className="text-3xl font-bold mt-2">${stats.totalBalance.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">Combined accounts</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </Card>
            
            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Pending Transfers</p>
                  <p className="text-3xl font-bold mt-2">{stats.pendingTransfers}</p>
                  <p className="text-xs text-muted-foreground mt-2">Awaiting approval</p>
                </div>
                <Activity className="w-12 h-12 text-orange-500 opacity-20" />
              </div>
            </Card>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-12">
              <TabsTrigger value="users" className="text-base">Users</TabsTrigger>
              <TabsTrigger value="pending" className="text-base">
                Pending Transfers 
                {stats.pendingTransfers > 0 && (
                  <Badge className="ml-2 bg-orange-500">{stats.pendingTransfers}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="crypto" className="text-base">Crypto</TabsTrigger>
              <TabsTrigger value="transactions" className="text-base">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  All Users
                </h2>
                <div className="space-y-3">
                  {users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-5 border rounded-lg hover:shadow-md transition-all bg-card">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-bold text-lg">{user.full_name || "No Name"}</p>
                            <Badge variant={user.status === 'active' ? 'default' : user.status === 'blocked' ? 'destructive' : 'secondary'}>
                              {user.status === 'active' && <Unlock className="w-3 h-3 mr-1" />}
                              {user.status === 'blocked' && <Lock className="w-3 h-3 mr-1" />}
                              {user.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined: {format(new Date(user.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => navigate(`/admin/user/${user.id}`)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Button>
                          {user.status === 'inactive' && (
                            <Button
                              size="sm"
                              onClick={() => handleActivateUser(user.id)}
                              className="gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6" />
                  Pending Transfer Approvals
                </h2>
                <div className="space-y-3">
                  {pendingTransfers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">No pending transfers</p>
                      <p className="text-sm">All transfers have been processed</p>
                    </div>
                  ) : (
                    pendingTransfers.map((transfer) => (
                      <div key={transfer.id} className="p-5 border rounded-lg bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-bold text-lg">{transfer.profiles?.full_name}</p>
                              <Badge className="bg-orange-500">{transfer.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{transfer.profiles?.email}</p>
                          </div>
                          <p className="text-2xl font-bold text-orange-600">${transfer.amount.toLocaleString()}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Recipient</p>
                            <p className="font-semibold">{transfer.recipient_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Account</p>
                            <p className="font-semibold">{transfer.recipient_account}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-semibold capitalize">{transfer.transfer_type}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-semibold">{format(new Date(transfer.created_at), "MMM dd, yyyy HH:mm")}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectTransfer(transfer.id, transfer.user_id, transfer.amount)}
                            className="gap-2 border-red-500 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject & Refund
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveTransfer(transfer.id)}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve Transfer
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="crypto" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Crypto Wallets Overview</h2>
                <div className="space-y-3">
                  {cryptoWallets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No crypto wallets found
                    </div>
                  ) : (
                    cryptoWallets.map((wallet) => (
                      <div key={wallet.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-semibold">{wallet.coin_symbol}</p>
                          <p className="text-sm text-muted-foreground">{wallet.wallet_address}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{wallet.balance} {wallet.coin_symbol}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Recent Crypto Transactions</h2>
                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </div>
                  ) : (
                    transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">{tx.transaction_type.toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">{tx.coin_symbol} - {format(new Date(tx.created_at), "MMM dd, yyyy HH:mm")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{tx.amount} {tx.coin_symbol}</p>
                          <p className="text-sm text-muted-foreground">${tx.usd_value.toLocaleString()}</p>
                        </div>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="ml-4">
                          {tx.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
