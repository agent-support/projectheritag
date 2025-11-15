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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { User } from "@supabase/supabase-js";

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
  const [balance] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };
    checkUser();
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({ 
      title: "Transaction Initiated", 
      description: `Sending ${amount} ${selectedCoin.symbol} to ${walletAddress}` 
    });
    setAmount("");
    setWalletAddress("");
  };

  const handleReceive = async () => {
    toast({ 
      title: "Deposit Address", 
      description: selectedCoin.address,
      duration: 10000
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

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">Crypto Service</h1>
            </div>
            <Card className="p-6 bg-card border-border">
              <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
              <p className="text-3xl font-bold text-foreground">${balance.toFixed(2)}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {CRYPTO_COINS.map((coin) => {
              const price = prices[coin.id];
              const change = price?.usd_24h_change || 0;
              return (
                <Card key={coin.symbol} className="p-6 bg-card border-border hover:border-accent transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{coin.symbol}</h3>
                      <p className="text-sm text-muted-foreground">{coin.name}</p>
                    </div>
                    {change !== 0 && (
                      <div className={`flex items-center gap-1 ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span className="text-sm font-semibold">{Math.abs(change).toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    ${price?.usd?.toLocaleString() || "Loading..."}
                  </div>
                </Card>
              );
            })}
          </div>

          <Tabs defaultValue="send" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="send">Send Crypto</TabsTrigger>
              <TabsTrigger value="receive">Receive Crypto</TabsTrigger>
              <TabsTrigger value="fund">Fund Wallet</TabsTrigger>
            </TabsList>

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
                    <Label>Amount</Label>
                    <Input 
                      type="number" 
                      step="0.00000001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Enter ${selectedCoin.symbol} amount`}
                      required 
                    />
                  </div>
                  <div>
                    <Label>Recipient Wallet Address</Label>
                    <Input 
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Enter wallet address"
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

            <TabsContent value="fund">
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
                  <div>
                    <Label>Amount to Fund</Label>
                    <Input 
                      type="number" 
                      step="0.00000001"
                      placeholder={`Enter ${selectedCoin.symbol} amount`}
                    />
                  </div>
                  <Button className="w-full">Fund Wallet</Button>
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

export default Crypto;