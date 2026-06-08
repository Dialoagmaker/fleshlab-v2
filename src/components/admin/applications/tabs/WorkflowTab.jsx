import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function WorkflowTab({ application, handleStatusUpdate }) {
  const [isCreatingContract, setIsCreatingContract] = useState(false);
  const [isCreatingPerformer, setIsCreatingPerformer] = useState(false);
  const [isLinkingUser, setIsLinkingUser] = useState(false);
  const [contractAction, setContractAction] = useState(null);

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    media_pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    reviewing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    contacted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    more_info_requested: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
    contract_pending: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    contract_sent: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    contract_signed: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    performer_created: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    user_linked: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  };

  const canCreateContract = application.status === 'approved' && !application.contract_id;
  const canCreatePerformer = application.status === 'contract_signed' && !application.performer_id;
  const canLinkUser = application.status === 'performer_created' && !application.linked_user_id;
  const canActivate = application.status === 'user_linked' && application.performer_id && application.linked_user_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Workflow Status</h3>
          <p className="text-sm text-muted-foreground">Manage the application lifecycle</p>
        </div>
        <Badge className={statusColors[application.status] || "bg-gray-500/10 text-gray-500"}>
          {application.status}
        </Badge>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">1. Review Application</p>
                  <p className="text-sm text-muted-foreground">Check media and ID documents</p>
                </div>
              </div>
              {['reviewing', 'contacted', 'more_info_requested'].includes(application.status) && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">2. Approve Application</p>
                  <p className="text-sm text-muted-foreground">Mark as approved to proceed</p>
                </div>
              </div>
              {application.status === 'approved' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">3. Create Contract</p>
                  <p className="text-sm text-muted-foreground">Generate and send contract</p>
                </div>
              </div>
              {application.contract_id && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            {canCreateContract && (
              <Button className="mt-3" size="sm" onClick={() => handleStatusUpdate(application.id, 'contract_pending', { contract_status: 'pending', contract_generated_at: new Date().toISOString() })}>
                Create Contract
              </Button>
            )}
            {application.status === 'contract_pending' && (
              <Button className="mt-3" size="sm" onClick={() => handleStatusUpdate(application.id, 'contract_sent', { contract_status: 'sent', contract_sent_at: new Date().toISOString() })}>
                Mark as Sent
              </Button>
            )}
            {application.status === 'contract_sent' && (
              <Button className="mt-3" size="sm" onClick={() => handleStatusUpdate(application.id, 'contract_signed', { contract_status: 'signed', contract_signed_at: new Date().toISOString() })}>
                Mark as Signed
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">4. Create Performer Profile</p>
                  <p className="text-sm text-muted-foreground">Create performer record</p>
                </div>
              </div>
              {application.performer_id && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            {canCreatePerformer && (
              <Button className="mt-3" size="sm" onClick={() => handleStatusUpdate(application.id, 'performer_created', { performer_created_at: new Date().toISOString() })}>
                Create Performer
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">5. Link User Account</p>
                  <p className="text-sm text-muted-foreground">Connect to Base44 user</p>
                </div>
              </div>
              {application.linked_user_id && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            {canLinkUser && (
              <Button className="mt-3" size="sm" onClick={() => handleStatusUpdate(application.id, 'user_linked', { user_linked_at: new Date().toISOString() })}>
                Link User
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">6. Activate Performer</p>
                  <p className="text-sm text-muted-foreground">Grant dashboard access</p>
                </div>
              </div>
              {application.status === 'active' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            {canActivate && (
              <Button 
                className="mt-3" 
                size="sm"
                onClick={() => handleStatusUpdate(application.id, 'active', {
                  activated_at: new Date().toISOString()
                })}
              >
                Activate
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {application.status_history && application.status_history.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">Status History</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {application.status_history.map((entry, idx) => {
              try {
                const parsed = typeof entry === 'string' ? JSON.parse(entry) : entry;
                return (
                  <div key={idx} className="text-xs text-muted-foreground p-2 bg-secondary rounded">
                    <span className="font-mono">{new Date(parsed.timestamp).toLocaleString()}</span>: {parsed.action}
                  </div>
                );
              } catch {
                return null;
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}