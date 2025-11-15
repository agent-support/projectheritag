import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const PendingTransfers = () => {
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadPendingTransfers();
  }, []);

  const loadPendingTransfers = async () => {
    const { data } = await supabase
      .from("transfers")
      .select(`
        *,
        profiles!transfers_user_id_fkey(full_name, email)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setTransfers(data || []);
  };

  const approveTransfer = async (transfer: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("transfers")
      .update({ 
        status: "completed",
        approved_by: user?.id 
      })
      .eq("id", transfer.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to approve transfer",
        variant: "destructive",
      });
      return;
    }

    // Log action
    if (user) {
      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action_type: "approve_transfer",
        target_user_id: transfer.user_id,
        details: { transfer_id: transfer.id, amount: transfer.amount },
      });
    }

    toast({
      title: "Success",
      description: "Transfer approved successfully",
    });

    loadPendingTransfers();
  };

  const openRejectDialog = (transfer: any) => {
    setSelectedTransfer(transfer);
    setShowRejectDialog(true);
  };

  const rejectTransfer = async () => {
    if (!selectedTransfer || !rejectionReason) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("transfers")
      .update({ 
        status: "failed",
        approved_by: user?.id,
        rejection_reason: rejectionReason
      })
      .eq("id", selectedTransfer.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject transfer",
        variant: "destructive",
      });
      return;
    }

    // Log action
    if (user) {
      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action_type: "reject_transfer",
        target_user_id: selectedTransfer.user_id,
        details: { 
          transfer_id: selectedTransfer.id, 
          amount: selectedTransfer.amount,
          reason: rejectionReason 
        },
      });
    }

    toast({
      title: "Success",
      description: "Transfer rejected successfully",
    });

    setShowRejectDialog(false);
    setRejectionReason("");
    setSelectedTransfer(null);
    loadPendingTransfers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Transfers</h1>
        <p className="text-muted-foreground">Review and approve/reject transfers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Transfers ({transfers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transfers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No pending transfers
              </p>
            ) : (
              transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-4 border border-border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {transfer.profiles?.full_name}
                        </h3>
                        <Badge>Pending</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transfer.profiles?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        ${Number(transfer.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transfer.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Recipient</p>
                      <p className="font-medium">{transfer.recipient_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account</p>
                      <p className="font-medium">{transfer.recipient_account}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bank</p>
                      <p className="font-medium">{transfer.recipient_bank || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{transfer.transfer_type}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => approveTransfer(transfer)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => openRejectDialog(transfer)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason</Label>
              <Input
                placeholder="Enter reason for rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={rejectTransfer}>
              Reject Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
