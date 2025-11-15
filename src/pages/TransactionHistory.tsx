import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Download, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";
import type { User } from "@supabase/supabase-js";

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  recipient: string | null;
  status: string;
  created_at: string;
}

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadTransactions(session.user.id);
    };
    checkUser();
  }, [navigate]);

  const loadTransactions = async (userId: string) => {
    try {
      const { data: accounts } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", userId);

      if (!accounts || accounts.length === 0) {
        setLoading(false);
        return;
      }

      const accountIds = accounts.map((acc) => acc.id);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .in("account_id", accountIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  const downloadReceipt = () => {
    if (!selectedTransaction) return;
    
    const receiptContent = `
HERITAGE BANK
Transaction Receipt
-------------------
Reference: ${selectedTransaction.id.substring(0, 8).toUpperCase()}
Date: ${format(new Date(selectedTransaction.created_at), 'PPpp')}
Type: ${selectedTransaction.transaction_type.toUpperCase()}
Amount: $${selectedTransaction.amount.toFixed(2)}
${selectedTransaction.recipient ? `Recipient: ${selectedTransaction.recipient}` : ''}
Description: ${selectedTransaction.description || 'N/A'}
Status: ${selectedTransaction.status.toUpperCase()}
-------------------
Thank you for banking with us.
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${selectedTransaction.id.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-4xl font-bold text-foreground mb-8">Transaction History</h1>

          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading transactions...</p>
            </Card>
          ) : transactions.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No transactions found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handleTransactionClick(transaction)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.transaction_type === 'debit' || transaction.transaction_type === 'transfer'
                          ? 'bg-destructive/10'
                          : 'bg-green-500/10'
                      }`}>
                        {transaction.transaction_type === 'debit' || transaction.transaction_type === 'transfer' ? (
                          <ArrowUpCircle className="w-5 h-5 text-destructive" />
                        ) : (
                          <ArrowDownCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {transaction.description || transaction.transaction_type.toUpperCase()}
                        </p>
                        {transaction.recipient && (
                          <p className="text-sm text-muted-foreground">To: {transaction.recipient}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.created_at), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.transaction_type === 'debit' || transaction.transaction_type === 'transfer'
                          ? 'text-destructive'
                          : 'text-green-500'
                      }`}>
                        {transaction.transaction_type === 'debit' || transaction.transaction_type === 'transfer' ? '-' : '+'}
                        ${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{transaction.status}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Receipt</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="text-center py-4 border-b">
                <h3 className="text-xl font-bold">Heritage Bank</h3>
                <p className="text-sm text-muted-foreground">Transaction Receipt</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-mono">{selectedTransaction.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{format(new Date(selectedTransaction.created_at), 'PPp')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{selectedTransaction.transaction_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className={`font-bold ${
                    selectedTransaction.transaction_type === 'debit' || selectedTransaction.transaction_type === 'transfer'
                      ? 'text-destructive'
                      : 'text-green-500'
                  }`}>
                    {selectedTransaction.transaction_type === 'debit' || selectedTransaction.transaction_type === 'transfer' ? '-' : '+'}
                    ${selectedTransaction.amount.toFixed(2)}
                  </span>
                </div>
                {selectedTransaction.recipient && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient:</span>
                    <span>{selectedTransaction.recipient}</span>
                  </div>
                )}
                {selectedTransaction.description && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span>{selectedTransaction.description}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="capitalize">{selectedTransaction.status}</span>
                </div>
              </div>

              <div className="pt-4 border-t text-center text-sm text-muted-foreground">
                Thank you for banking with Heritage Bank
              </div>

              <Button onClick={downloadReceipt} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionHistory;
