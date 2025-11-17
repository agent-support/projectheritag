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
          <Button onClick={() => navigate("/dashboard")} variant="ghost" className="mb-4 text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-8">Transactions</h1>

          {loading ? (
            <Card className="p-4 sm:p-8 text-center">
              <p className="text-sm sm:text-base text-muted-foreground">Loading...</p>
            </Card>
          ) : transactions.length === 0 ? (
            <Card className="p-4 sm:p-8 text-center">
              <p className="text-sm sm:text-base text-muted-foreground">No transactions</p>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {transactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  className="p-3 sm:p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handleTransactionClick(transaction)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                        transaction.transaction_type === 'debit' || transaction.transaction_type === 'transfer'
                          ? 'bg-destructive/10'
                          : 'bg-green-500/10'
                      }`}>
                        {transaction.transaction_type === 'debit' || transaction.transaction_type === 'transfer' ? (
                          <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm sm:text-base truncate">
                          {transaction.description || transaction.transaction_type.toUpperCase()}
                        </p>
                        {transaction.recipient && (
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {transaction.recipient}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm sm:text-base ${
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Receipt</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center py-3 sm:py-4 border-b">
                <h3 className="text-lg sm:text-xl font-bold">Heritage Bank</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Transaction Receipt</p>
              </div>
              
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground text-xs sm:text-sm">Ref:</span>
                  <span className="font-mono text-xs sm:text-sm">{selectedTransaction.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground text-xs sm:text-sm">Date:</span>
                  <span className="text-xs sm:text-sm">{format(new Date(selectedTransaction.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground text-xs sm:text-sm">Type:</span>
                  <span className="capitalize text-xs sm:text-sm">{selectedTransaction.transaction_type}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground text-xs sm:text-sm">Amount:</span>
                  <span className={`font-bold text-sm sm:text-base ${
                    selectedTransaction.transaction_type === 'debit' || selectedTransaction.transaction_type === 'transfer'
                      ? 'text-destructive'
                      : 'text-green-500'
                  }`}>
                    {selectedTransaction.transaction_type === 'debit' || selectedTransaction.transaction_type === 'transfer' ? '-' : '+'}
                    ${selectedTransaction.amount.toFixed(2)}
                  </span>
                </div>
                {selectedTransaction.recipient && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground text-xs sm:text-sm">To:</span>
                    <span className="text-xs sm:text-sm text-right break-all">{selectedTransaction.recipient}</span>
                  </div>
                )}
                {selectedTransaction.description && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground text-xs sm:text-sm">Note:</span>
                    <span className="text-xs sm:text-sm text-right break-words">{selectedTransaction.description}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground text-xs sm:text-sm">Status:</span>
                  <span className="capitalize text-xs sm:text-sm">{selectedTransaction.status}</span>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t text-center text-xs sm:text-sm text-muted-foreground">
                Thank you for banking with us
              </div>

              <Button onClick={downloadReceipt} className="w-full text-sm" variant="outline" size="sm">
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionHistory;
