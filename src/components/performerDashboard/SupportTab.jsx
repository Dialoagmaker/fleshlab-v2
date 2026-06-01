import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare } from "lucide-react";

export default function SupportTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            For profile changes, document questions, payout inquiries, or production scheduling, 
            please contact your assigned manager.
          </p>
          
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-3" disabled>
              <Mail className="w-4 h-4" />
              Email Management
              <span className="text-xs text-muted-foreground ml-auto">Coming Soon</span>
            </Button>
            
            <Button variant="outline" className="w-full justify-start gap-3" disabled>
              <Phone className="w-4 h-4" />
              Schedule Call
              <span className="text-xs text-muted-foreground ml-auto">Coming Soon</span>
            </Button>
            
            <Button variant="outline" className="w-full justify-start gap-3" disabled>
              <MessageSquare className="w-4 h-4" />
              Send Message
              <span className="text-xs text-muted-foreground ml-auto">Coming Soon</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Studio Rules and FAQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium">Production Requirements</h4>
              <p className="text-xs text-muted-foreground">
                Recommended minimum 20 videos per month to maintain full performance eligibility. 
                Each video should be at least 20 minutes in length.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium">Compliance</h4>
              <p className="text-xs text-muted-foreground">
                Keep all compliance documents (KYC, medical tests, contracts) up to date. 
                Expired documents may result in payout holds.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium">Payout Schedule</h4>
              <p className="text-xs text-muted-foreground">
                Payouts are processed monthly and require approved KYC, active account status, 
                and no outstanding balances. Final approval is handled by management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}