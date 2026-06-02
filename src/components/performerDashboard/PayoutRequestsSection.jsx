import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function PayoutRequestsSection({ onPayoutCreated }) {
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [payoutRequestForm, setPayoutRequestForm] = useState({
    amount: "",
    currency: "usd",
    performer_note: "",
    confirm_details: false
  });
  const [loading, setLoading] = useState(false);

  const handleCreatePayoutRequest = async () => {
    setLoading(true);

    try {
      const response = await base44.functions.invoke("createPerformerPayoutRequest", payoutRequestForm);
      
      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        toast.success("Payout request submitted for review");
        setPayoutRequestForm({
          amount: "",
          currency: "usd",
          performer_note: "",
          confirm_details: false
        });
        onPayoutCreated();
      }
    } catch (error) {
      toast.error("Failed to submit payout request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending_review: "secondary",
      approved: "default",
      rejected: "destructive",
      paid: "default",
      cancelled: "outline"
    };

    const labels = {
      pending_review: "Pending Review",
      approved: "Approved",
      rejected: "Rejected",
      paid: "Paid",
      cancelled: "Cancelled"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
          <CardDescription>
            Submit a payout request for admin review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={payoutRequestForm.amount}
                onChange={(e) => setPayoutRequestForm({ ...payoutRequestForm, amount: e.target.value })}
                placeholder="100.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={payoutRequestForm.currency}
                onValueChange={(value) => setPayoutRequestForm({ ...payoutRequestForm, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-note">Note (Optional)</Label>
            <Textarea
              id="payout-note"
              value={payoutRequestForm.performer_note}
              onChange={(e) => setPayoutRequestForm({ ...payoutRequestForm, performer_note: e.target.value })}
              placeholder="Any special instructions..."
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="confirm-details"
              checked={payoutRequestForm.confirm_details}
              onChange={(e) => setPayoutRequestForm({ ...payoutRequestForm, confirm_details: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="confirm-details" className="text-sm">
              I confirm my payout details are correct and up to date
            </Label>
          </div>

          <Button 
            onClick={handleCreatePayoutRequest} 
            className="w-full sm:w-auto"
            disabled={!payoutRequestForm.amount || !payoutRequestForm.confirm_details || loading}
          >
            {loading ? "Submitting..." : "Request Payout"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>
            Your past payout requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payoutRequests.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payout requests yet</p>
          ) : (
            <div className="space-y-4">
              {payoutRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      <span className="font-semibold">
                        ${request.amount} {request.currency.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Method: {request.payout_method?.replace('_', ' ').toUpperCase()}</p>
                    {request.payout_snapshot_masked && (
                      <p>{request.payout_snapshot_masked}</p>
                    )}
                  </div>

                  {request.performer_visible_message && (
                    <div className="bg-muted/50 rounded p-2 text-sm">
                      <p className="font-medium">Admin Message:</p>
                      <p>{request.performer_visible_message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}