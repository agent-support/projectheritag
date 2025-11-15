import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ArrowUpRight, ArrowDownRight, CreditCard, TrendingUp, FileText, Smartphone, DollarSign, ArrowLeft, Save, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Account {
  id: string;
  account_type: string;
  account_number: string;
  balance: number;
  currency: string;
  status: string;
}

const AdminUserView = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<any[]>([]);
  const [cryptoTransactions, setCryptoTransactions] = useState<any[]>([]);
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>({});
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountBalances, setAccountBalances] = useState<{[key: string]: string}>({});
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editedTransactions, setEditedTransactions] = useState<{[key: string]: any}>({});
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editedWallets, setEditedWallets] = useState<{[key: string]: any}>({});
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [addingCrypto, setAddingCrypto] = useState(false);
  const [cryptoForm, setCryptoForm] = useState({ coinSymbol: 'BTC', amount: '' });

  useEffect(() => {
    checkAdminAndLoadData();
  }, [userId]);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (!roles) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive"
        });
        navigate("/admin");
        return;
      }

      await loadUserData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/admin");
    }
  };

  const loadUserData = async () => {
    if (!userId) return;

    setLoading(true);

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (profileData) {
      setProfile(profileData);
      setEditedProfile(profileData);
    }

    // Load accounts
    const { data: accountsData } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId);
    
    if (accountsData) {
      setAccounts(accountsData);
      const balances: {[key: string]: string} = {};
      accountsData.forEach(acc => {
        balances[acc.id] = acc.balance?.toString() || "0";
      });
      setAccountBalances(balances);
    }

    // Load transactions
    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("*")
      .in("account_id", accountsData?.map(a => a.id) || [])
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (transactionsData) setTransactions(transactionsData);

    // Load pending transfers
    const { data: transfersData } = await supabase
      .from("transfers")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (transfersData) setPendingTransfers(transfersData);

    // Load crypto wallets
    const { data: walletsData } = await supabase
      .from("crypto_wallets")
      .select("*")
      .eq("user_id", userId);
    
    if (walletsData) setCryptoWallets(walletsData);

    // Load crypto transactions
    const { data: cryptoTxData } = await supabase
      .from("crypto_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (cryptoTxData) setCryptoTransactions(cryptoTxData);

    setLoading(false);
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editedProfile.full_name,
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          email: editedProfile.email,
          phone: editedProfile.phone,
          country: editedProfile.country,
          address: editedProfile.address,
          date_of_birth: editedProfile.date_of_birth,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setProfile(editedProfile);
      setEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleBlockAccount = async (accountId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const { error } = await supabase
      .from("accounts")
      .update({ status: newStatus })
      .eq("id", accountId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: `Account ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`
    });

    await loadUserData();
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransactionId(transaction.id);
    setEditedTransactions({
      ...editedTransactions,
      [transaction.id]: { ...transaction }
    });
  };

  const handleSaveTransaction = async (transactionId: string) => {
    const edited = editedTransactions[transactionId];
    const { error } = await supabase
      .from("transactions")
      .update({
        amount: Number(edited.amount),
        description: edited.description,
        created_at: edited.created_at
      })
      .eq("id", transactionId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Transaction updated successfully"
    });

    setEditingTransactionId(null);
    await loadUserData();
  };

  const handleApproveTransfer = async (transferId: string) => {
    const { error } = await supabase
      .from("transfers")
      .update({ status: "completed" })
      .eq("id", transferId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Transfer approved successfully"
    });

    await loadUserData();
  };

  const handleRejectTransfer = async (transferId: string, amount: number) => {
    // Reject transfer and refund balance
    const { error: transferError } = await supabase
      .from("transfers")
      .update({ status: "rejected" })
      .eq("id", transferId);

    if (transferError) {
      toast({
        title: "Error",
        description: transferError.message,
        variant: "destructive"
      });
      return;
    }

    // Refund the amount to the first account
    if (accounts.length > 0) {
      await handleAdjustBalance(accounts[0].id, amount);
    }

    toast({
      title: "Success",
      description: "Transfer rejected and amount refunded"
    });

    await loadUserData();
  };

  const handleEditWallet = (wallet: any) => {
    setEditingWalletId(wallet.id);
    setEditedWallets({
      ...editedWallets,
      [wallet.id]: { ...wallet }
    });
  };

  const handleSaveWallet = async (walletId: string) => {
    const edited = editedWallets[walletId];
    const { error } = await supabase
      .from("crypto_wallets")
      .update({
        wallet_address: edited.wallet_address,
        balance: Number(edited.balance)
      })
      .eq("id", walletId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Wallet updated successfully"
    });

    setEditingWalletId(null);
    await loadUserData();
  };

  const handleAddCrypto = async () => {
    if (!cryptoForm.amount || Number(cryptoForm.amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    // Find or create wallet
    let wallet = cryptoWallets.find(w => w.coin_symbol === cryptoForm.coinSymbol);
    
    if (!wallet) {
      // Create new wallet
      const { data: newWallet, error: walletError } = await supabase
        .from("crypto_wallets")
        .insert({
          user_id: userId,
          coin_symbol: cryptoForm.coinSymbol,
          wallet_address: `${cryptoForm.coinSymbol}-${Date.now()}`,
          balance: Number(cryptoForm.amount)
        })
        .select()
        .single();

      if (walletError) {
        toast({
          title: "Error",
          description: walletError.message,
          variant: "destructive"
        });
        return;
      }
      wallet = newWallet;
    } else {
      // Update existing wallet
      const { error: updateError } = await supabase
        .from("crypto_wallets")
        .update({
          balance: Number(wallet.balance) + Number(cryptoForm.amount)
        })
        .eq("id", wallet.id);

      if (updateError) {
        toast({
          title: "Error",
          description: updateError.message,
          variant: "destructive"
        });
        return;
      }
    }

    // Create transaction record
    const { error: txError } = await supabase
      .from("crypto_transactions")
      .insert({
        user_id: userId!,
        coin_symbol: cryptoForm.coinSymbol,
        amount: Number(cryptoForm.amount),
        usd_value: Number(cryptoForm.amount) * 50000, // Placeholder
        transaction_type: 'deposit',
        status: 'completed',
        reference_number: `ADMIN-${Date.now()}`
      });

    if (txError) {
      toast({
        title: "Error",
        description: txError.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: `${cryptoForm.amount} ${cryptoForm.coinSymbol} added successfully`
    });

    setAddingCrypto(false);
    setCryptoForm({ coinSymbol: 'BTC', amount: '' });
    await loadUserData();
  };

  const handleAdjustBalance = async (accountId: string, adjustment: number) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const newBalance = Number(account.balance) + adjustment;

    const { error } = await supabase
      .from("accounts")
      .update({ balance: newBalance })
      .eq("id", accountId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: `Balance ${adjustment > 0 ? 'added' : 'deducted'} successfully`
    });

    await loadUserData();
  };

  const handleSaveAccountBalance = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ balance: parseFloat(accountBalances[accountId]) })
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account balance updated successfully",
      });

      setEditingAccountId(null);
      await loadUserData();
    } catch (error) {
      console.error("Error updating account:", error);
      toast({
        title: "Error",
        description: "Failed to update account balance",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-foreground">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <Button onClick={() => navigate("/admin")} variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Panel
              </Button>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Admin View: {profile?.full_name || "User"}
              </h1>
              <p className="text-muted-foreground">{profile?.email}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                profile?.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {profile?.status || 'inactive'}
              </span>
            </div>
          </div>

          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingTransfers.length})</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
            </TabsList>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Bank Accounts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(account => (
                  <Card key={account.id} className="p-6 bg-gradient-to-br from-card to-accent/5 border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex gap-2">
                        {editingAccountId === account.id ? (
                          <Button size="sm" onClick={() => handleSaveAccountBalance(account.id)}>
                            <Save className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setEditingAccountId(account.id)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1 capitalize">
                      {account.account_type.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 font-mono">
                      {account.account_number}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground">{account.currency}</span>
                      {editingAccountId === account.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={accountBalances[account.id] || "0"}
                          onChange={(e) => setAccountBalances({...accountBalances, [account.id]: e.target.value})}
                          className="text-2xl font-bold max-w-[200px]"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-foreground">
                          {parseFloat(account.balance?.toString() || '0').toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          account.status === 'blocked' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'
                        }`}>
                          {account.status}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant={account.status === 'blocked' ? 'default' : 'destructive'}
                          onClick={() => handleBlockAccount(account.id, account.status)}
                          className="flex-1"
                        >
                          {account.status === 'blocked' ? 'Unblock' : 'Block'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAdjustBalance(account.id, 100)}
                          className="flex-1"
                        >
                          +$100
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAdjustBalance(account.id, -100)}
                          className="flex-1"
                        >
                          -$100
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {accounts.length === 0 && (
                <Card className="p-8 bg-card border-border text-center">
                  <p className="text-muted-foreground">No accounts found</p>
                </Card>
              )}
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Account Balance Cards */}
              {accounts.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Account Balances</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {accounts.map(account => (
                      <Card key={account.id} className="p-6 bg-gradient-to-br from-card to-accent/5 border-border hover:border-accent transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-accent/10 rounded-lg">
                            <DollarSign className="w-6 h-6 text-accent" />
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            account.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}>
                            {account.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1 capitalize">
                          {account.account_type.replace('_', ' ')}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 font-mono">
                          {account.account_number}
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm text-muted-foreground">{account.currency}</span>
                          <span className="text-3xl font-bold text-foreground">
                            {parseFloat(account.balance?.toString() || '0').toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Recent Transactions</h2>
                <Card className="p-6 bg-card border-border">
                  {transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${
                              tx.transaction_type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'
                            }`}>
                              {tx.transaction_type === 'deposit' ? (
                                <ArrowDownRight className="w-5 h-5 text-green-500" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground capitalize">
                                {tx.transaction_type.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {tx.description || tx.recipient || 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.created_at), 'PPp')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              tx.transaction_type === 'deposit' ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {tx.transaction_type === 'deposit' ? '+' : '-'}${tx.amount?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="p-6 bg-card border-border">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Personal Information</h2>
                  {!editingProfile ? (
                    <Button onClick={() => setEditingProfile(true)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button onClick={() => {
                        setEditingProfile(false);
                        setEditedProfile(profile);
                      }} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    {editingProfile ? (
                      <Input 
                        value={editedProfile.full_name || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, full_name: e.target.value})}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-2">{profile?.full_name || "N/A"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    {editingProfile ? (
                      <Input 
                        value={editedProfile.email || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-2">{profile?.email || "N/A"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    {editingProfile ? (
                      <Input 
                        value={editedProfile.phone || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-2">{profile?.phone || "N/A"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Country</Label>
                    {editingProfile ? (
                      <Input 
                        value={editedProfile.country || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, country: e.target.value})}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-2">{profile?.country || "N/A"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    {editingProfile ? (
                      <Input 
                        value={editedProfile.address || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, address: e.target.value})}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-2">{profile?.address || "N/A"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    {editingProfile ? (
                      <Input 
                        type="date"
                        value={editedProfile.date_of_birth || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, date_of_birth: e.target.value})}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-2">
                        {profile?.date_of_birth ? format(new Date(profile.date_of_birth), 'PP') : "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Account Created</Label>
                    <p className="text-foreground font-medium mt-2">
                      {profile?.created_at ? format(new Date(profile.created_at), 'PPp') : "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Account Status</Label>
                    <p className="text-foreground font-medium mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        profile?.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {profile?.status || 'inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Crypto Tab */}
            <TabsContent value="crypto" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Crypto Wallets</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {cryptoWallets.map((wallet) => (
                    <Card key={wallet.id} className="p-6 bg-card border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-accent/10 rounded-lg">
                          <Wallet className="w-6 h-6 text-accent" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{wallet.coin_symbol}</h3>
                      <p className="text-sm text-muted-foreground font-mono mb-4 truncate">
                        {wallet.wallet_address}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {wallet.balance?.toFixed(8)} {wallet.coin_symbol}
                      </p>
                    </Card>
                  ))}
                </div>

                {cryptoWallets.length === 0 && (
                  <Card className="p-8 bg-card border-border text-center">
                    <p className="text-muted-foreground">No crypto wallets found</p>
                  </Card>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Recent Crypto Transactions</h2>
                <Card className="p-6 bg-card border-border">
                  {cryptoTransactions.length > 0 ? (
                    <div className="space-y-4">
                      {cryptoTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                          <div>
                            <p className="font-semibold text-foreground">
                              {tx.coin_symbol} - {tx.transaction_type}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.created_at), 'PPp')}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              Ref: {tx.reference_number}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              {tx.amount?.toFixed(8)} {tx.coin_symbol}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ${tx.usd_value?.toFixed(2)} USD
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No crypto transactions yet</p>
                  )}
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminUserView;
