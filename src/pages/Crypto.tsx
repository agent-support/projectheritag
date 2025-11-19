import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle, History, Download } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { format } from "date-fns";

const CRYPTO_COINS = [
  { symbol: "BTC", name: "Bitcoin", id: "bitcoin", address: "bc1qhwutfxhl9062uxjswwgc7dr4zv8fwkekm4u42s" },
  { symbol: "ETH", name: "Ethereum", id: "ethereum", address: "0xc254e04bf79df093e821ba9e8e8f366e01b36d66" },
  { symbol: "USDT", name: "Tether (BNB)", id: "tether", address: "0xc254e04bf79df093e821ba9e8e8f366e01b36d66" },
  { symbol: "USDT_ERC20", name: "Tether (ERC20)", id: "tether", address: "0xc254e04bf79df093e821ba9e8e8f366e01b36d66" },
  { symbol: "USDT_TRC20", name: "Tether (TRC20)", id: "tether", address: "TVvsMrne5bPZE2rdAUCbDAfQCYvSZcdpYz" },
  { symbol: "SOL", name: "Solana", id: "solana", address: "HqZDakA7ELoKJ4vJH1NUXBC2B4qRra4JauDWvvmK4xqn" },
  { symbol: "XRP", name: "Ripple", id: "ripple", address: "r4KpqYeisKn15n1Kr6dfYNPHj83WVBKCTZ" },
  { symbol: "BNB", name: "BNB", id: "binancecoin", address: "0xc254e04bf79df093e821ba9e8e8f366e01b36d66" },
  { symbol: "PI", name: "Pi Network", id: "pi-network", address: "GAVBCFVO4BES4TI35D6Q6M6KDVUZVL2B5FHJNN3AZ76E5NI27VEBZCWJ" }
];

const Crypto = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [selectedCoin, setSelectedCoin] = useState(CRYPTO_COINS[0]);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [cryptoWallets, setCryptoWallets] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [convertAmount, setConvertAmount] = useState("");
  const [convertingToBank, setConvertingToBank] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const [showAcDialog, setShowAcDialog] = useState(false);
  const [acCode, setAcCode] = useState("");
  const [transferFee, setTransferFee] = useState(0);
  const [pendingSendData, setPendingSendData] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadCryptoWallets(session.user.id);
      await loadTransactions(session.user.id);
    };
    checkUser();
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (cryptoWallets.length > 0 && Object.keys(prices).length > 0) {
      calculateTotalBalance();
    }
  }, [cryptoWallets, prices]);

  // Real-time subscription for crypto wallet and transaction updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('crypto-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crypto_wallets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadCryptoWallets(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crypto_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadTransactions(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadCryptoWallets = async (userId: string) => {
    const { data, error } = await supabase
      .from("crypto_wallets")
      .select("*")
      .eq("user_id", userId);
    
    if (data) {
      setCryptoWallets(data);
    }
  };

  const loadTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from("crypto_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (data) {
      setTransactions(data);
    }
  };

  const generateReferenceNumber = () => {
    return `CRY${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  };

  const createTransaction = async (type: string, coin: string, amount: number, usdValue: number, recipientAddress?: string) => {
    const refNumber = generateReferenceNumber();
    const { data, error } = await supabase
      .from("crypto_transactions")
      .insert({
        user_id: user!.id,
        transaction_type: type,
        coin_symbol: coin,
        amount,
        usd_value: usdValue,
        recipient_address: recipientAddress,
        reference_number: refNumber,
        status: 'completed'
      })
      .select()
      .single();

    if (data) {
      await loadTransactions(user!.id);
      return data;
    }
    return null;
  };

  const calculateTotalBalance = () => {
    let total = 0;
    cryptoWallets.forEach(wallet => {
      const coin = CRYPTO_COINS.find(c => c.symbol === wallet.coin_symbol);
      if (coin && prices[coin.id]) {
        total += (wallet.balance || 0) * prices[coin.id].usd;
      }
    });
    setTotalBalance(total);
  };

  const fetchPrices = async () => {
    try {
      const ids = [...new Set(CRYPTO_COINS.map(c => c.id))].join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();
      setPrices(data);
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  const handleConvert = async () => {
    if (!user || !convertAmount || parseFloat(convertAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to convert",
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(convertAmount);

    if (convertingToBank) {
      const wallet = cryptoWallets.find(w => w.coin_symbol === selectedCoin.symbol);
      if (!wallet || wallet.balance < amountNum) {
        toast({
          title: "Insufficient Funds",
          description: `You don't have enough ${selectedCoin.symbol}. Available: ${wallet?.balance || 0} ${selectedCoin.symbol}`,
          variant: "destructive"
        });
        return;
      }

      const coin = CRYPTO_COINS.find(c => c.symbol === selectedCoin.symbol);
      const usdValue = amountNum * (prices[coin!.id]?.usd || 0);

      const { error: walletError } = await supabase
        .from("crypto_wallets")
        .update({ balance: wallet.balance - amountNum })
        .eq("id", wallet.id);

      if (walletError) {
        toast({
          title: "Conversion Failed",
          description: "Failed to update crypto balance",
          variant: "destructive"
        });
        return;
      }

      const { data: accounts } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      if (accounts && accounts.length > 0) {
        const { error: accountError } = await supabase
          .from("accounts")
          .update({ balance: (accounts[0].balance || 0) + usdValue })
          .eq("id", accounts[0].id);

        if (accountError) {
          toast({
            title: "Conversion Failed",
            description: "Failed to update bank balance",
            variant: "destructive"
          });
          return;
        }

        // Create a transaction record for the bank account
        await supabase.from("transactions").insert({
          account_id: accounts[0].id,
          transaction_type: "credit",
          amount: usdValue,
          description: `Converted ${amountNum} ${selectedCoin.symbol} to USD`,
          status: "completed",
        });
      }

      const receipt = await createTransaction('convert_to_bank', selectedCoin.symbol, amountNum, usdValue);
      if (receipt) {
        setCurrentReceipt(receipt);
        setShowReceipt(true);
      }
    } else {
      const { data: accounts } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      if (!accounts || accounts.length === 0 || (accounts[0].balance || 0) < amountNum) {
        toast({
          title: "Insufficient Funds",
          description: `You don't have enough USD in your bank account. Available: $${accounts?.[0]?.balance || 0}`,
          variant: "destructive"
        });
        return;
      }

      const coin = CRYPTO_COINS.find(c => c.symbol === selectedCoin.symbol);
      const cryptoAmount = amountNum / (prices[coin!.id]?.usd || 1);

      const { error: accountError } = await supabase
        .from("accounts")
        .update({ balance: (accounts[0].balance || 0) - amountNum })
        .eq("id", accounts[0].id);

      if (accountError) {
        toast({
          title: "Conversion Failed",
          description: "Failed to update bank balance",
          variant: "destructive"
        });
        return;
      }

      const wallet = cryptoWallets.find(w => w.coin_symbol === selectedCoin.symbol);
      if (wallet) {
        const { error: walletError } = await supabase
          .from("crypto_wallets")
          .update({ balance: (wallet.balance || 0) + cryptoAmount })
          .eq("id", wallet.id);

        if (walletError) {
          toast({
            title: "Conversion Failed",
            description: "Failed to update crypto balance",
            variant: "destructive"
          });
          return;
        }
      } else {
        const { error: createError } = await supabase
          .from("crypto_wallets")
          .insert({
            user_id: user.id,
            coin_symbol: selectedCoin.symbol,
            wallet_address: selectedCoin.address,
            balance: cryptoAmount
          });

        if (createError) {
          toast({
            title: "Conversion Failed",
            description: "Failed to create crypto wallet",
            variant: "destructive"
          });
          return;
        }
      }

      const receipt = await createTransaction('convert_to_crypto', selectedCoin.symbol, cryptoAmount, amountNum);
      if (receipt) {
        setCurrentReceipt(receipt);
        setShowReceipt(true);
      }
    }

    setConvertAmount("");
    await loadCryptoWallets(user.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    if (!walletAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a recipient wallet address",
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(amount);
    const wallet = cryptoWallets.find(w => w.coin_symbol === selectedCoin.symbol);
    
    if (!wallet || wallet.balance < amountNum) {
      toast({
        title: "Insufficient Funds",
        description: `You don't have enough ${selectedCoin.symbol}. Available: ${wallet?.balance || 0} ${selectedCoin.symbol}`,
        variant: "destructive"
      });
      return;
    }

    // Get user's transfer fee
    const { data: feeData } = await supabase
      .from("crypto_transfer_fees")
      .select("btc_fee")
      .eq("user_id", user.id)
      .single();

    const fee = feeData?.btc_fee || 0.0001;
    setTransferFee(fee);
    setPendingSendData({ amountNum, wallet, walletAddress });
    setShowFeeDialog(true);
  };

  const handleConfirmFee = async () => {
    setShowFeeDialog(false);
    setShowAcDialog(true);
  };

  const handleVerifyAcCode = async () => {
    if (acCode !== "101010") {
      toast({
        title: "Invalid Code",
        description: "Invalid authorization code. Please reach out to customer support.",
        variant: "destructive"
      });
      return;
    }

    const { amountNum, wallet, walletAddress } = pendingSendData;
    const coin = CRYPTO_COINS.find(c => c.symbol === selectedCoin.symbol);
    const usdValue = amountNum * (prices[coin!.id]?.usd || 0);

    // Check BTC balance for fee
    const btcWallet = cryptoWallets.find(w => w.coin_symbol === "BTC");
    if (!btcWallet || btcWallet.balance < transferFee) {
      toast({
        title: "Insufficient BTC",
        description: `You need ${transferFee} BTC for the transfer fee. Available: ${btcWallet?.balance || 0} BTC`,
        variant: "destructive"
      });
      setShowAcDialog(false);
      setAcCode("");
      return;
    }

    // Deduct BTC fee
    await supabase
      .from("crypto_wallets")
      .update({ balance: btcWallet.balance - transferFee })
      .eq("id", btcWallet.id);

    // Deduct crypto amount
    const { error: walletError } = await supabase
      .from("crypto_wallets")
      .update({ balance: wallet.balance - amountNum })
      .eq("id", wallet.id);

    if (walletError) {
      toast({
        title: "Transaction Failed",
        description: "Failed to send crypto",
        variant: "destructive"
      });
      setShowAcDialog(false);
      setAcCode("");
      return;
    }

    const receipt = await createTransaction('send', selectedCoin.symbol, amountNum, usdValue, walletAddress);
    
    if (receipt) {
      setCurrentReceipt({ ...receipt, fee: transferFee });
      setShowReceipt(true);
    }

    setAmount("");
    setWalletAddress("");
    setShowAcDialog(false);
    setAcCode("");
    setPendingSendData(null);
    await loadCryptoWallets(user.id);

    toast({
      title: "Success",
      description: `Transfer successful! Fee: ${transferFee} BTC`,
    });
  };

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">Crypto Service</h1>
            </div>
            <Card className="p-8 bg-card border-border">
              <p className="text-sm text-muted-foreground mb-2 text-center">Total Crypto Balance</p>
              <p className="text-4xl font-bold text-foreground text-center">${totalBalance.toFixed(2)}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {CRYPTO_COINS.map((coin) => {
              const price = prices[coin.id];
              const change = price?.usd_24h_change || 0;
              const wallet = cryptoWallets.find(w => w.coin_symbol === coin.symbol);
              const balance = wallet?.balance || 0;
              const balanceUSD = balance * (price?.usd || 0);
              
              return (
                <Card key={coin.symbol} className="p-6 bg-card border-border hover:border-accent transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{coin.name}</h3>
                      <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                    </div>
                    <div className={`flex items-center gap-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span className="text-sm font-medium">{Math.abs(change).toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold text-foreground">${price?.usd?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance:</span>
                      <span className="font-semibold text-foreground">{balance.toFixed(8)} {coin.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">USD Value:</span>
                      <span className="font-semibold text-accent">${balanceUSD.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Tabs defaultValue="convert" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
              <TabsTrigger value="convert">Convert</TabsTrigger>
              <TabsTrigger value="send">Send</TabsTrigger>
              <TabsTrigger value="receive">Receive</TabsTrigger>
            </TabsList>

            <TabsContent value="convert">
              <Card className="p-6 bg-card border-border">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Button
                      variant={convertingToBank ? "default" : "outline"}
                      onClick={() => setConvertingToBank(true)}
                      className="flex-1"
                    >
                      Crypto → Bank
                    </Button>
                    <Button
                      variant={!convertingToBank ? "default" : "outline"}
                      onClick={() => setConvertingToBank(false)}
                      className="flex-1"
                    >
                      Bank → Crypto
                    </Button>
                  </div>
                  
                  <div>
                    <Label>Select Cryptocurrency</Label>
                    <select 
                      className="w-full p-2 rounded-md bg-background border border-border text-foreground"
                      onChange={(e) => setSelectedCoin(CRYPTO_COINS.find(c => c.symbol === e.target.value) || CRYPTO_COINS[0])}
                      value={selectedCoin.symbol}
                    >
                      {CRYPTO_COINS.map(coin => (
                        <option key={coin.symbol} value={coin.symbol}>{coin.name} ({coin.symbol})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>{convertingToBank ? `Amount (${selectedCoin.symbol})` : 'Amount (USD)'}</Label>
                    <Input 
                      type="number"
                      step="0.00000001"
                      placeholder={convertingToBank ? `Enter ${selectedCoin.symbol} amount` : "Enter USD amount"}
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(e.target.value)}
                    />
                  </div>

                  {convertAmount && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">You will receive:</p>
                      {convertingToBank ? (
                        <p className="text-lg font-bold text-foreground">
                          ${(parseFloat(convertAmount) * (prices[CRYPTO_COINS.find(c => c.symbol === selectedCoin.symbol)!.id]?.usd || 0)).toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-lg font-bold text-foreground">
                          {(parseFloat(convertAmount) / (prices[CRYPTO_COINS.find(c => c.symbol === selectedCoin.symbol)!.id]?.usd || 1)).toFixed(8)} {selectedCoin.symbol}
                        </p>
                      )}
                    </div>
                  )}

                  <Button onClick={handleConvert} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Convert Now
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="send">
              <Card className="p-6 bg-card border-border">
                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <Label>Select Cryptocurrency</Label>
                    <select 
                      className="w-full p-2 rounded-md bg-background border border-border text-foreground"
                      onChange={(e) => setSelectedCoin(CRYPTO_COINS.find(c => c.symbol === e.target.value) || CRYPTO_COINS[0])}
                    >
                      {CRYPTO_COINS.map(coin => (
                        <option key={coin.symbol} value={coin.symbol}>{coin.name} ({coin.symbol})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Amount ({selectedCoin.symbol})</Label>
                    <Input 
                      type="number"
                      step="0.00000001"
                      placeholder={`Enter ${selectedCoin.symbol} amount`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required 
                    />
                    {amount && prices[CRYPTO_COINS.find(c => c.symbol === selectedCoin.symbol)!.id] && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ≈ ${(parseFloat(amount) * prices[CRYPTO_COINS.find(c => c.symbol === selectedCoin.symbol)!.id].usd).toFixed(2)} USD
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Recipient Wallet Address</Label>
                    <Input 
                      type="text"
                      placeholder="Enter wallet address"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full">Send {selectedCoin.symbol}</Button>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="receive">
              <Card className="p-6 bg-card border-border">
                <div className="space-y-4">
                  <div>
                    <Label>Select Cryptocurrency</Label>
                    <select 
                      className="w-full p-2 rounded-md bg-background border border-border text-foreground"
                      onChange={(e) => setSelectedCoin(CRYPTO_COINS.find(c => c.symbol === e.target.value) || CRYPTO_COINS[0])}
                    >
                      {CRYPTO_COINS.map(coin => (
                        <option key={coin.symbol} value={coin.symbol}>{coin.name} ({coin.symbol})</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Use this address to receive {selectedCoin.name} deposits.
                  </p>
                  <div className="space-y-2">
                    <Label>Deposit Address</Label>
                    <div className="p-4 bg-muted rounded-lg border border-border">
                      <p className="text-sm font-mono break-all text-foreground">{selectedCoin.address}</p>
                    </div>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCoin.address);
                        toast({ 
                          title: "Copied!", 
                          description: "Address copied to clipboard" 
                        });
                      }} 
                      variant="outline" 
                      className="w-full"
                    >
                      Copy Address
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Transaction History */}
          <Card className="mt-8 p-6 bg-card border-border">
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-accent" />
              <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
            </div>
            
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 bg-muted rounded-lg border border-border hover:border-accent transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-foreground capitalize">
                          {tx.transaction_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tx.created_at), 'PPpp')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          {tx.amount.toFixed(8)} {tx.coin_symbol}
                        </p>
                        <p className="text-sm text-accent">
                          ${tx.usd_value.toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground font-mono">
                        Ref: {tx.reference_number}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tx.status === 'completed' ? 'bg-green-500/20 text-green-500' : 
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                    {tx.recipient_address && (
                      <p className="text-xs text-muted-foreground mt-2 font-mono break-all">
                        To: {tx.recipient_address}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>


      {/* Fee Dialog */}
      <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Transfer Fee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-6 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Transaction Fee</p>
              <p className="text-3xl font-bold text-foreground">{transferFee} BTC</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              This fee will be charged from your BTC balance
            </p>
            <Button onClick={handleConfirmFee} className="w-full">Continue</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AC Code Dialog */}
      <Dialog open={showAcDialog} onOpenChange={setShowAcDialog}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Authorization Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please input the AC authorization code. If you don't have one, reach out to customer support.
            </p>
            <div>
              <Label>6-digit AC Code</Label>
              <Input 
                type="text" 
                maxLength={6}
                value={acCode}
                onChange={(e) => setAcCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter AC code"
              />
            </div>
            <Button onClick={handleVerifyAcCode} className="w-full">Verify & Send</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Transaction Receipt
            </DialogTitle>
          </DialogHeader>
          
          {currentReceipt && (
            <div className="space-y-4">
              <div className="text-center py-6 border-y border-border">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-500 mb-2">Success!</h3>
                <p className="text-muted-foreground capitalize">
                  {currentReceipt.transaction_type.replace('_', ' ')} Completed
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-foreground">
                    {currentReceipt.amount.toFixed(8)} {currentReceipt.coin_symbol}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">USD Value:</span>
                  <span className="font-bold text-accent">
                    ${currentReceipt.usd_value.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono text-sm text-foreground">
                    {currentReceipt.reference_number}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span className="text-foreground">
                    {format(new Date(currentReceipt.created_at), 'PPpp')}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                    {currentReceipt.status}
                  </span>
                </div>

                {currentReceipt.recipient_address && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Recipient:</span>
                    <span className="font-mono text-xs text-foreground break-all max-w-[200px] text-right">
                      {currentReceipt.recipient_address}
                    </span>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => setShowReceipt(false)} 
                className="w-full mt-4"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Crypto;