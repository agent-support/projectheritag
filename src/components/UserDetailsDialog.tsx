import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Wallet, CreditCard, ArrowRight, User, Calendar } from "lucide-react";

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onUpdate: () => void;
}

export const UserDetailsDialog = ({ open, onOpenChange, userId, onUpdate }: UserDetailsDialogProps) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cryptoTransactions, setCryptoTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>({});

  const loadUserData = async () => {
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
    
    if (accountsData) setAccounts(accountsData);

    // Load crypto wallets
    const { data: walletsData } = await supabase
      .from("crypto_wallets")
      .select("*")
      .eq("user_id", userId);
    
    if (walletsData) setCryptoWallets(walletsData);

    // Load transactions
    const { data: transactionsData } = await supabase
      .from("transactions")
      .select("*")
      .in("account_id", accountsData?.map(a => a.id) || [])
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (transactionsData) setTransactions(transactionsData);

    // Load crypto transactions
    const { data: cryptoTxData } = await supabase
      .from("crypto_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    
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

      setEditMode(false);
      setProfile(editedProfile);
      onUpdate();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAccount = async (accountId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ [field]: value })
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account updated successfully",
      });

      loadUserData();
      onUpdate();
    } catch (error) {
      console.error("Error updating account:", error);
      toast({
        title: "Error",
        description: "Failed to update account",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (newOpen && !open) {
        loadUserData();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-accent" />
            User Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card className="p-6 bg-card border-border">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                  </div>
                  {!editMode ? (
                    <Button onClick={() => setEditMode(true)} size="sm">Edit</Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} size="sm">Save</Button>
                      <Button onClick={() => {
                        setEditMode(false);
                        setEditedProfile(profile);
                      }} variant="outline" size="sm">Cancel</Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    {editMode ? (
                      <Input 
                        value={editedProfile.full_name || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, full_name: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-1">{profile?.full_name || "N/A"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    {editMode ? (
                      <Input 
                        value={editedProfile.email || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-1">{profile?.email || "N/A"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    {editMode ? (
                      <Input 
                        value={editedProfile.phone || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-1">{profile?.phone || "N/A"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Country</Label>
                    {editMode ? (
                      <Input 
                        value={editedProfile.country || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, country: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-1">{profile?.country || "N/A"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    {editMode ? (
                      <Input 
                        value={editedProfile.address || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, address: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-1">{profile?.address || "N/A"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    {editMode ? (
                      <Input 
                        type="date"
                        value={editedProfile.date_of_birth || ""} 
                        onChange={(e) => setEditedProfile({...editedProfile, date_of_birth: e.target.value})}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground font-medium mt-1">
                        {profile?.date_of_birth ? format(new Date(profile.date_of_birth), 'PP') : "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Account Created</Label>
                    <p className="text-foreground font-medium mt-1">
                      {profile?.created_at ? format(new Date(profile.created_at), 'PPp') : "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="text-foreground font-medium mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        profile?.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {profile?.status || 'inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Accounts Tab */}
            <TabsContent value="accounts">
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Bank Accounts</h3>
                </div>
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <Card key={account.id} className="p-4 bg-muted/50 border-border">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">Account Number</Label>
                          <p className="text-foreground font-mono">{account.account_number}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Type</Label>
                          <p className="text-foreground capitalize">{account.account_type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Balance</Label>
                          <Input 
                            type="number"
                            defaultValue={account.balance}
                            onBlur={(e) => handleUpdateAccount(account.id, 'balance', parseFloat(e.target.value))}
                            className="mt-1 font-bold"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  {accounts.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No accounts found</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Crypto Tab */}
            <TabsContent value="crypto">
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Crypto Wallets</h3>
                </div>
                <div className="space-y-3">
                  {cryptoWallets.map((wallet) => (
                    <div key={wallet.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border">
                      <div>
                        <p className="text-foreground font-semibold">{wallet.coin_symbol}</p>
                        <p className="text-muted-foreground text-xs font-mono">{wallet.wallet_address?.substring(0, 20)}...</p>
                      </div>
                      <p className="text-foreground font-bold">{wallet.balance?.toFixed(8)}</p>
                    </div>
                  ))}
                  {cryptoWallets.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No crypto wallets found</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRight className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Bank Transactions</h4>
                  <div className="space-y-2">
                    {transactions.slice(0, 10).map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center p-2 bg-muted/30 rounded border border-border">
                        <div>
                          <p className="text-foreground font-medium capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                          <p className="text-muted-foreground text-xs">{format(new Date(tx.created_at), 'PPp')}</p>
                        </div>
                        <p className="text-foreground font-bold">${tx.amount?.toFixed(2)}</p>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-center text-muted-foreground py-2 text-sm">No transactions</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Crypto Transactions</h4>
                  <div className="space-y-2">
                    {cryptoTransactions.slice(0, 10).map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center p-2 bg-muted/30 rounded border border-border">
                        <div>
                          <p className="text-foreground font-medium">{tx.coin_symbol} - {tx.transaction_type}</p>
                          <p className="text-muted-foreground text-xs">{format(new Date(tx.created_at), 'PPp')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-foreground font-bold">{tx.amount?.toFixed(8)} {tx.coin_symbol}</p>
                          <p className="text-muted-foreground text-xs">${tx.usd_value?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    {cryptoTransactions.length === 0 && (
                      <p className="text-center text-muted-foreground py-2 text-sm">No crypto transactions</p>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
