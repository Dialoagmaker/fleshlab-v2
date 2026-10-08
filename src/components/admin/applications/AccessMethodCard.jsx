import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, UserCheck, KeyRound, AlertCircle } from "lucide-react";

export default function AccessMethodCard({ application, contractData, performer }) {
  // Determine access method
  const userLinked = !!application?.linked_user_id || !!performer?.user_id;
  const hasLegacyCredentials = !!performer?.performer_username;
  const contractSigned = contractData?.status === 'signed';
  const performerActive = performer?.status === 'active' || performer?.account_status === 'active';

  let accessMethod = 'None';
  let accessMethodIcon = null;
  let accessMethodColor = 'text-muted-foreground';
  let dashboardAccess = 'blocked';
  let dashboardMessage = 'Dashboard access blocked.';

  if (!contractSigned) {
    dashboardAccess = 'blocked';
    dashboardMessage = 'Dashboard access blocked until contract is signed.';
  } else if (!performerActive) {
    dashboardAccess = 'blocked';
    dashboardMessage = 'Dashboard access blocked - performer account not active.';
  } else if (userLinked) {
    accessMethod = 'Linked User Account';
    accessMethodIcon = UserCheck;
    accessMethodColor = 'text-green-600';
    dashboardAccess = 'ready';
    dashboardMessage = 'Dashboard access ready via linked user account.';
  } else if (hasLegacyCredentials) {
    accessMethod = 'Performer Login Credentials';
    accessMethodIcon = KeyRound;
    accessMethodColor = 'text-blue-600';
    dashboardAccess = 'ready';
    dashboardMessage = 'Dashboard access ready via performer login credentials.';
  } else {
    accessMethod = 'None';
    accessMethodIcon = AlertCircle;
    accessMethodColor = 'text-orange-500';
    dashboardAccess = 'blocked';
    dashboardMessage = 'Dashboard access blocked until user account is linked or login credentials are created.';
  }

  const IconComponent = accessMethodIcon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Access Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Access Method */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Access Method</p>
          <div className={`flex items-center gap-2 ${accessMethodColor}`}>
            {IconComponent && <IconComponent className="w-5 h-5" />}
            <span className="font-medium">{accessMethod}</span>
          </div>
        </div>

        {/* Dashboard Access */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Dashboard Access</p>
          <div className="flex items-center gap-2">
            {dashboardAccess === 'ready' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">Ready</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 font-medium">Blocked</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{dashboardMessage}</p>
        </div>

        {/* Details */}
        <div className="bg-secondary/50 rounded-lg p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contract Signed:</span>
            <span className={contractSigned ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
              {contractSigned ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">User Linked:</span>
            <span className={userLinked ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
              {userLinked ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Legacy Credentials:</span>
            <span className={hasLegacyCredentials ? "text-blue-600 font-medium" : "text-muted-foreground"}>
              {hasLegacyCredentials ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Performer Active:</span>
            <span className={performerActive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {performerActive ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}