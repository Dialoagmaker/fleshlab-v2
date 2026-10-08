import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, DollarSign, CheckCircle2, XCircle, Clock, BanknoteIcon } from "lucide-react";
import { toast } from "sonner";

export default function PayoutRequests() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending_review");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionDialog, setActionDialog] = useState(null); // 'approve', 'reject', 'paid'
  const [adminMessage, setAdminMessage] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const { data: payoutRequests, isLoading } = useQuery({
    queryKey: ['payout-requests', activeTab],
    queryFn: async () => {
      const filter = activeTab === "all" ? {} : { status: activeTab };
      const res = await base44.functions.invoke("getPayoutRequests", filter);
      return res.data.payout_requests || [];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke("approvePayoutRequest", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
      setActionDialog(null);
      setSelectedRequest(null);
      toast.success("Payout request approved");
    },
    onError: () => toast.error("Failed to approve payout request")
  });

  const rejectMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke("rejectPayoutRequest", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
      setActionDialog(null);
      setSelectedRequest(null);
      toast.success("Payout request rejected");
    },
    onError: () => toast.error("Failed to reject payout request")
  });

  const paidMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.functions.invoke("markPayoutRequestPaid", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
      setActionDialog(null);
      setSelectedRequest(null);
      toast.success("Payout marked as paid");
    },
    onError: () => toast.error("Failed to mark as paid")
  });

  const handleAction = () => {
    if (!selectedRequest) return;

    const payload = {
      payout_request_id: selectedRequest.id,
      performer_visible_message: adminMessage || undefined,
      admin_notes: adminNote || undefined
    };

    if (actionDialog === 'approve') {
      approveMutation.mutate(payload);
    } else if (actionDialog === 'reject') {
      rejectMutation.mutate(payload);
    } else if (actionDialog === 'paid') {
      paidMutation.mutate(payload);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending_review: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      approved: "bg-green-500/10 text-green-500 border-green-500/20",
      rejected: "bg-red-500/10 text-red-500 border-red-500/20",
      paid: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20"
    };

    const icons = {
      pending_review: Clock,
      approved: CheckCircle2,
      rejected: XCircle,
      paid: CheckCircle2,
      cancelled: XCircle
    };

    const Icon = icons[status];
    return (
      <Badge className={variants[status] || variants.pending_review}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payout Requests</h1>
        <p className="text-muted-foreground">Review and manage performer payout requests</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending_review">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : payoutRequests && payoutRequests.length > 0 ? (
          payoutRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        ${request.amount} {request.currency?.toUpperCase()}
                      </CardTitle>
                      <CardDescription>
                        {request.performer_name} • {new Date(request.requested_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Payout Details</h4>
                    <p className="text-sm text-muted-foreground">
                      Method: {request.payout_method?.replace('_', ' ').toUpperCase()}
                    </p>
                    {request.payout_snapshot_masked && (
                      <p className="text-sm text-muted-foreground">
                        {request.payout_snapshot_masked}
                      </p>
                    )}
                  </div>
                  
                  {request.performer_note && (
                    <div>
                      <h4 className="font-semibold mb-2">Performer Note</h4>
                      <p className="text-sm text-muted-foreground">{request.performer_note}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  {request.status === 'pending_review' && (
                    <>
                      <Button variant="default" size="sm" onClick={() => { setSelectedRequest(request); setActionDialog('approve'); }}>
                        Approve
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { setSelectedRequest(request); setActionDialog('reject'); }}>
                        Reject
                      </Button>
                    </>
                  )}
                  {request.status === 'approved' && (
                    <Button variant="outline" size="sm" onClick={() => { setSelectedRequest(request); setActionDialog('paid'); }}>
                      Mark as Paid
                    </Button>
                  )}
                  {(request.paid_at) && (
                    <span className="text-xs text-muted-foreground self-center">
                      Paid: {new Date(request.paid_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No pending payout requests
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === 'approve' && 'Approve Payout Request'}
              {actionDialog === 'reject' && 'Reject Payout Request'}
              {actionDialog === 'paid' && 'Mark as Paid'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <span>
                  Amount: ${selectedRequest.amount} {selectedRequest.currency?.toUpperCase()} for {selectedRequest.performer_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-message">Performer Visible Message</Label>
              <Textarea
                id="admin-message"
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="Message to performer..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-note">Internal Admin Note (Optional)</Label>
              <Textarea
                id="admin-note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Internal notes..."
                rows={2}
              />
            </div>

            {actionDialog === 'reject' && (
              <Alert>
                <AlertDescription>
                  The performer will see your rejection message. Be clear and professional.
                </AlertDescription>
              </Alert>
            )}

            {actionDialog === 'paid' && (
              <Alert>
                <AlertDescription>
                  Mark this payout as paid only after you have processed the payment externally.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                actionDialog === 'approve' ? approveMutation.isPending :
                actionDialog === 'reject' ? rejectMutation.isPending :
                paidMutation.isPending
              }
            >
              {actionDialog === 'approve' ? 'Approve' : actionDialog === 'reject' ? 'Reject' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}