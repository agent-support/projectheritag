import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Wallet, TrendingUp, DollarSign, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { UserDetailsDialog } from "@/components/UserDetailsDialog";

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
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAccounts: 0,
    totalBalance: 0,
    totalCryptoValue: 0
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

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

      // Check if user has admin role
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
    // Load all users
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (profilesData) {
      setUsers(profilesData);
    }

    // Load all accounts
    const { data: accountsData } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (accountsData) {
      setAccounts(accountsData);
      const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      setStats(prev => ({ ...prev, totalAccounts: accountsData.length, totalBalance }));
    }

    // Load all crypto wallets
    const { data: walletsData } = await supabase
      .from("crypto_wallets")
      .select("*");
    
    if (walletsData) {
      setCryptoWallets(walletsData);
    }

    // Load all crypto transactions
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

    if (profilesData) {
      setStats(prev => ({ ...prev, totalUsers: profilesData.length }));
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

  const handleViewUserDetails = (userId: string) => {
    setSelectedUserId(userId);
    setUserDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground">Manage users and monitor system activity</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-accent" />
                <span className="text-2xl font-bold text-foreground">{stats.totalUsers}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-5 h-5 text-accent" />
                <span className="text-2xl font-bold text-foreground">{stats.totalAccounts}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-accent" />
                <span className="text-2xl font-bold text-foreground">
                  ${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Total Bank Balance</p>
            </Card>

            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                <span className="text-2xl font-bold text-foreground">
                  ${stats.totalCryptoValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Total Crypto Value</p>
            </Card>
          </div>

          {/* Admin Tabs */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="crypto">Crypto Wallets</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">All Users</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Email</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Phone</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Country</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Joined</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 text-foreground">{user.full_name || 'N/A'}</td>
                          <td className="py-3 px-4 text-foreground">{user.email}</td>
                          <td className="py-3 px-4 text-foreground">{user.phone || 'N/A'}</td>
                          <td className="py-3 px-4 text-foreground">{user.country || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${
                              user.status === 'active' 
                                ? 'bg-green-500/20 text-green-500' 
                                : 'bg-yellow-500/20 text-yellow-500'
                            }`}>
                              {user.status === 'active' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {user.status || 'inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {user.created_at ? format(new Date(user.created_at), 'PP') : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewUserDetails(user.id)}
                              >
                                View Details
                              </Button>
                              {user.status !== 'active' && (
                                <Button 
                                  size="sm"
                                  onClick={() => handleActivateUser(user.id)}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  Activate
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No users found</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Accounts Tab */}
            <TabsContent value="accounts">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">All Bank Accounts</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Account Number</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Type</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Balance</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Currency</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account) => (
                        <tr key={account.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 text-foreground font-mono">{account.account_number}</td>
                          <td className="py-3 px-4 text-foreground capitalize">{account.account_type.replace('_', ' ')}</td>
                          <td className="py-3 px-4 text-foreground font-bold">
                            ${(account.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-foreground">{account.currency}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              account.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                            }`}>
                              {account.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {account.created_at ? format(new Date(account.created_at), 'PP') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {accounts.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No accounts found</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Crypto Wallets Tab */}
            <TabsContent value="crypto">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">All Crypto Wallets</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Coin</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Balance</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Wallet Address</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cryptoWallets.map((wallet) => (
                        <tr key={wallet.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 text-foreground font-semibold">{wallet.coin_symbol}</td>
                          <td className="py-3 px-4 text-foreground">{(wallet.balance || 0).toFixed(8)}</td>
                          <td className="py-3 px-4 text-foreground font-mono text-xs truncate max-w-xs">
                            {wallet.wallet_address}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {wallet.created_at ? format(new Date(wallet.created_at), 'PP') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {cryptoWallets.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No crypto wallets found</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card className="p-6 bg-card border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">Recent Crypto Transactions</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Type</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Coin</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Amount</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">USD Value</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Reference</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 text-foreground capitalize">{tx.transaction_type.replace('_', ' ')}</td>
                          <td className="py-3 px-4 text-foreground font-semibold">{tx.coin_symbol}</td>
                          <td className="py-3 px-4 text-foreground">{tx.amount.toFixed(8)}</td>
                          <td className="py-3 px-4 text-foreground">${tx.usd_value.toFixed(2)}</td>
                          <td className="py-3 px-4 text-foreground font-mono text-xs">{tx.reference_number}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              tx.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                              tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {tx.created_at ? format(new Date(tx.created_at), 'PP p') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No transactions found</p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
      
      {selectedUserId && (
        <UserDetailsDialog
          open={userDetailsOpen}
          onOpenChange={setUserDetailsOpen}
          userId={selectedUserId}
          onUpdate={loadAdminData}
        />
      )}
    </div>
  );
};

export default Admin;
