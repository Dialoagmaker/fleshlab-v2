import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function PayoutMethodSection({ profile, onPayoutUpdated }) {
  const [payoutForm, setPayoutForm] = useState({
    payout_method: profile?.payout_method || "",
    payout_details: {}
  });
  const [loading, setLoading] = useState(false);

  const handleUpdatePayoutMethod = async () => {
    setLoading(true);

    try {
      const response = await base44.functions.invoke("updatePerformerPayoutMethod", payoutForm);
      
      if (response.data.error) {
        toast.error(response.data.error);
      } else {
        toast.success("Payout method submitted for verification");
        onPayoutUpdated();
      }
    } catch (error) {
      toast.error("Failed to update payout method");
    } finally {
      setLoading(false);
    }
  };

  const renderPayoutFields = () => {
    switch (payoutForm.payout_method) {
      case "paypal":
        return (
          <div className="space-y-2">
            <Label htmlFor="paypal-email">PayPal Email</Label>
            <Input
              id="paypal-email"
              type="email"
              onChange={(e) => setPayoutForm({ 
                ...payoutForm, 
                payout_details: { paypal_email: e.target.value }
              })}
              placeholder="your@email.com"
            />
          </div>
        );

      case "gcash":
        return (
          <div className="space-y-2">
            <Label htmlFor="gcash-mobile">GCash Mobile Number</Label>
            <Input
              id="gcash-mobile"
              type="tel"
              onChange={(e) => setPayoutForm({ 
                ...payoutForm, 
                payout_details: { mobile_number: e.target.value }
              })}
              placeholder="+63 9XX XXX XXXX"
            />
          </div>
        );

      case "paymaya":
        return (
          <div className="space-y-2">
            <Label htmlFor="paymaya-mobile">PayMaya Mobile Number</Label>
            <Input
              id="paymaya-mobile"
              type="tel"
              onChange={(e) => setPayoutForm({ 
                ...payoutForm, 
                payout_details: { mobile_number: e.target.value }
              })}
              placeholder="+63 9XX XXX XXXX"
            />
          </div>
        );

      case "bank_transfer":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input
                id="bank-name"
                onChange={(e) => setPayoutForm({ 
                  ...payoutForm, 
                  payout_details: { bank_name: e.target.value }
                })}
                placeholder="Bank of America"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-holder">Account Holder Name</Label>
              <Input
                id="account-holder"
                onChange={(e) => setPayoutForm({ 
                  ...payoutForm, 
                  payout_details: { account_holder_name: e.target.value }
                })}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                onChange={(e) => setPayoutForm({ 
                  ...payoutForm, 
                  payout_details: { account_number: e.target.value }
                })}
                placeholder="1234567890"
              />
            </div>
          </>
        );

      case "wise":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="wise-email">Wise Email</Label>
              <Input
                id="wise-email"
                type="email"
                onChange={(e) => setPayoutForm({ 
                  ...payoutForm, 
                  payout_details: { email: e.target.value }
                })}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wise-name">Account Holder Name</Label>
              <Input
                id="wise-name"
                onChange={(e) => setPayoutForm({ 
                  ...payoutForm, 
                  payout_details: { account_holder_name: e.target.value }
                })}
                placeholder="Your full name"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout Method</CardTitle>
        <CardDescription>
          Set up how you want to receive payouts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payout-method">Payout Method</Label>
          <Select
            value={payoutForm.payout_method}
            onValueChange={(value) => setPayoutForm({ ...payoutForm, payout_method: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="gcash">GCash</SelectItem>
              <SelectItem value="paymaya">PayMaya</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="wise">Wise</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {payoutForm.payout_method && (
          <div className="space-y-4">
            {renderPayoutFields()}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Payout method changes require admin verification. Your payout status will show as "Pending Verification" until approved.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleUpdatePayoutMethod} 
          className="w-full sm:w-auto"
          disabled={!payoutForm.payout_method}
        >
          {loading ? "Submitting..." : "Submit Payout Method"}
        </Button>
      </CardContent>
    </Card>
  );
}