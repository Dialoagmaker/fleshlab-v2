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

const MINIMUM_PAYOUT_USD = 50;

export default function PayoutRequestsSection({ onPayoutCreated }) {
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [payoutRequestForm, setPayoutRequestForm] = useState({
    amount: "",
    currency: "usd",
    performer_note: "",
    confirm_details: false
  });
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const parsedAmount = parseFloat(payoutRequestForm.amount);
  const amountValid = !isNaN(parsedAmount) && parsedAmount >= MINIMUM_PAYOUT_USD;
  const amountTooLow = touched && payoutRequestForm.amount !== "" && (!amountValid);
  const canSubmit = amountValid && payoutRequestForm.confirm_details && !loading;

  const handleCreatePayoutRequest = async () => {
    setTouched(true);
    if (!canSubmit) return;
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
          <p className="text-sm text-muted-foreground">
            Payout requests can be submitted once your available balance reaches at least $50 USD.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="50"
                step="0.01"
                value={payoutRequestForm.amount}
                onChange={(e) => {
                  setTouched(true);
                  setPayoutRequestForm({ ...payoutRequestForm, amount: e.target.value });
                }}
                onBlur={() => setTouched(true)}
                placeholder="50.00"
                className={amountTooLow ? "border-destructive" : ""}
              />
              {amountTooLow ? (
                <p className="text-destructive text-xs">Minimum payout amount is $50 USD.</p>
              ) : (
                <p className="text-muted-foreground text-xs">Minimum payout: $50 USD</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value="usd" disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">USD only at this time</p>
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
            disabled={!canSubmit}
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

                  {request.performer_note && (
                    <p className="text-sm text-muted-foreground">Note: {request.performer_note}</p>
                  )}
                  {request.performer_visible_message && (
                    <div className="bg-muted/50 rounded p-2 text-sm">
                      <p className="font-medium">{request.status === 'rejected' ? 'Rejection Reason:' : 'Admin Message:'}</p>
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