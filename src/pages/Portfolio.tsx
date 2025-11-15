import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import type { User } from "@supabase/supabase-js";

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  total_value: number;
  gain_loss: number;
  gain_loss_percentage: number;
}

const Portfolio = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalGainLoss, setTotalGainLoss] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadPortfolio(session.user.id);
    };

    checkUser();
  }, [navigate]);

  const loadPortfolio = async (userId: string) => {
    try {
      const { data: portfolio } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (portfolio) {
        const { data: holdingsData } = await supabase
          .from("holdings")
          .select("*")
          .eq("portfolio_id", portfolio.id);

        if (holdingsData) {
          setHoldings(holdingsData);
          const total = holdingsData.reduce((sum, h) => sum + Number(h.total_value), 0);
          const gain = holdingsData.reduce((sum, h) => sum + Number(h.gain_loss), 0);
          setTotalValue(total);
          setTotalGainLoss(gain);
        }
      }
    } catch (error) {
      console.error("Error loading portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  const mockChartData = [
    { date: "Jan", value: 10000 },
    { date: "Feb", value: 12000 },
    { date: "Mar", value: 11500 },
    { date: "Apr", value: 13000 },
    { date: "May", value: 14500 },
    { date: "Jun", value: totalValue || 15000 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-foreground">Investment Portfolio</h1>
            <Button onClick={() => navigate("/dashboard/portfolio/add")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Holding
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-card border-border">
              <div className="text-sm text-muted-foreground mb-2">Total Portfolio Value</div>
              <div className="text-3xl font-bold text-foreground">
                ${totalValue.toFixed(2)}
              </div>
            </Card>
            <Card className="p-6 bg-card border-border">
              <div className="text-sm text-muted-foreground mb-2">Total Gain/Loss</div>
              <div className={`text-3xl font-bold flex items-center gap-2 ${
                totalGainLoss >= 0 ? "text-green-500" : "text-red-500"
              }`}>
                {totalGainLoss >= 0 ? <TrendingUp /> : <TrendingDown />}
                ${Math.abs(totalGainLoss).toFixed(2)}
              </div>
            </Card>
            <Card className="p-6 bg-card border-border">
              <div className="text-sm text-muted-foreground mb-2">Return %</div>
              <div className={`text-3xl font-bold ${
                totalGainLoss >= 0 ? "text-green-500" : "text-red-500"
              }`}>
                {totalValue > 0 ? ((totalGainLoss / (totalValue - totalGainLoss)) * 100).toFixed(2) : "0.00"}%
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-card border-border mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Portfolio Performance</h2>
            <div className="h-80">
              <ChartContainer
                config={{
                  value: {
                    label: "Portfolio Value",
                    color: "hsl(var(--accent))",
                  },
                }}
              >
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))" }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">Holdings</h2>
            {holdings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No holdings yet</p>
                <Button onClick={() => navigate("/dashboard/portfolio/add")}>
                  Add Your First Holding
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-foreground">Symbol</th>
                      <th className="text-left py-3 px-4 text-foreground">Name</th>
                      <th className="text-right py-3 px-4 text-foreground">Quantity</th>
                      <th className="text-right py-3 px-4 text-foreground">Purchase Price</th>
                      <th className="text-right py-3 px-4 text-foreground">Current Price</th>
                      <th className="text-right py-3 px-4 text-foreground">Total Value</th>
                      <th className="text-right py-3 px-4 text-foreground">Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <tr key={holding.id} className="border-b border-border">
                        <td className="py-3 px-4 font-semibold text-foreground">{holding.symbol}</td>
                        <td className="py-3 px-4 text-muted-foreground">{holding.name}</td>
                        <td className="py-3 px-4 text-right text-foreground">{holding.quantity}</td>
                        <td className="py-3 px-4 text-right text-foreground">${holding.purchase_price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-foreground">${holding.current_price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-foreground">${holding.total_value.toFixed(2)}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${
                          holding.gain_loss >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                          ${holding.gain_loss.toFixed(2)} ({holding.gain_loss_percentage.toFixed(2)}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-6 bg-card border-border mt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Market Insights</h2>
            <div className="space-y-4">
              <InsightCard
                title="Diversification Score"
                value="Good"
                description="Your portfolio is well-diversified across different sectors"
              />
              <InsightCard
                title="Risk Level"
                value="Moderate"
                description="Balanced mix of growth and stable investments"
              />
              <InsightCard
                title="Recommendation"
                value="Review quarterly"
                description="Consider rebalancing your portfolio every 3 months"
              />
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const InsightCard = ({ 
  title, 
  value, 
  description 
}: { 
  title: string; 
  value: string; 
  description: string;
}) => {
  return (
    <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="text-lg font-bold text-accent">{value}</div>
    </div>
  );
};

export default Portfolio;
