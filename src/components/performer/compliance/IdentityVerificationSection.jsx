import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Plus,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  in_review: { label: "In Review", color: "bg-blue-500/20 text-blue-400", icon: Eye },
  approved: { label: "Approved", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  verified: { label: "Verified", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400", icon: XCircle },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400", icon: XCircle },
  needs_review: { label: "Needs Review", color: "bg-orange-500/20 text-orange-400", icon: AlertTriangle },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  expired: { label: "Expired", color: "bg-gray-500/20 text-gray-400", icon: Clock }
};

const PROVIDERS = [
  { value: "manual", label: "Manual Review" },
  { value: "veriff", label: "Veriff" },
  { value: "sumsub", label: "Sumsub" },
  { value: "onfido", label: "Onfido" },
  { value: "stripe_identity", label: "Stripe Identity" },
  { value: "persona", label: "Persona" },
  { value: "jumio", label: "Jumio" },
  { value: "idenfy", label: "IDenfy" }
];

export default function IdentityVerificationSection({ performer }) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const { data: sessionsData, isLoading, refetch } = useQuery({
    queryKey: ['identity-verification-sessions', performer.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("identityVerificationService", {
        action: 'get_sessions',
        performer_id: performer.id
      });
      return res.data;
    }
  });

  const sessions = Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : [];

  const createSession = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke("identityVerificationService", {
        action: 'create_session',
        performer_id: performer.id,
        provider: data.provider
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['identity-verification-sessions']);
      toast.success("Verification session created");
      setShowCreateModal(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create session");
    }
  });

  const updateStatus = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke("identityVerificationService", {
        action: 'update_status',
        performer_id: performer.id,
        session_id: data.session_id,
        verification_data: data.verification_data
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['identity-verification-sessions']);
      toast.success("Status updated");
      setSelectedSession(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Identity Verification</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Verification
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading verification sessions...
        </div>
      ) : sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => {
            const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={session.id}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color.split(' ')[1]}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {PROVIDERS.find(p => p.value === session.provider)?.label || session.provider}
                        </p>
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(session.created_at).toLocaleDateString()}
                        {session.completed_at && ` • Completed: ${new Date(session.completed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSession(session)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>

                {session.verification_result_summary && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Result Summary</p>
                    <p className="text-sm text-foreground">{session.verification_result_summary}</p>
                  </div>
                )}

                {session.performer_visible_message && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs text-primary mb-1">Performer Message</p>
                    <p className="text-sm text-foreground">{session.performer_visible_message}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No identity verification sessions yet. Create one to verify performer identity.
          </p>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createSession.mutate(data)}
          isLoading={createSession.isPending}
        />
      )}

      {/* Update Status Modal */}
      {selectedSession && (
        <UpdateStatusModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSubmit={(data) => updateStatus.mutate(data)}
          isLoading={updateStatus.isPending}
        />
      )}
    </div>
  );
}

function CreateSessionModal({ onClose, onSubmit, isLoading }) {
  const [provider, setProvider] = useState("manual");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ provider });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Create Identity Verification</DialogTitle>
        <DialogDescription>
          Select a verification provider for this performer.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Verification Provider</label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Manual review for internal verification. Third-party providers for automated KYC.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Session"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function UpdateStatusModal({ session, onClose, onSubmit, isLoading }) {
  const [status, setStatus] = useState(session.status);
  const [summary, setSummary] = useState(session.verification_result_summary || "");
  const [message, setMessage] = useState(session.performer_visible_message || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      session_id: session.id,
      verification_data: {
        status,
        verification_result_summary: summary,
        performer_visible_message: message
      }
    });
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Update Verification Status</DialogTitle>
        <DialogDescription>
          Provider: {PROVIDERS.find(p => p.value === session.provider)?.label || session.provider}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Created</p>
            <p className="text-sm text-foreground">
              {new Date(session.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Status</p>
            <Badge className={STATUS_CONFIG[session.status]?.color}>
              {STATUS_CONFIG[session.status]?.label}
            </Badge>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">New Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="needs_review">Needs Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Result Summary (Internal)</label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Enter verification result summary..."
            className="h-24"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Internal notes about the verification result.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Message to Performer (Optional)</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message visible to performer..."
            className="h-20"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This message will be visible to the performer.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}