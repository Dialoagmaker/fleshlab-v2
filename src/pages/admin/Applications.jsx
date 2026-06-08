import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Search, Filter, Eye, Trash2, AlertTriangle, UserPlus, FileText, CheckCircle, Copy, Send, ExternalLink, MessageSquare, XCircle
} from "lucide-react";
import { format } from "date-fns";
import ApplicationTable from "@/components/admin/applications/ApplicationTable";
import ApplicationDetailDialog from "@/components/admin/applications/ApplicationDetailDialog";
import LinkUserDialog from "@/components/admin/applications/LinkUserDialog";


export default function Applications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreatePerformerOpen, setIsCreatePerformerOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isMoreInfoOpen, setIsMoreInfoOpen] = useState(false);
  const [moreInfoMessage, setMoreInfoMessage] = useState("");
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);
  const [contractData, setContractData] = useState(null);
  const [isEditingContractData, setIsEditingContractData] = useState(false);
  const [contractFormData, setContractFormData] = useState({
    legal_name: '',
    stage_name: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    city: '',
    country: '',
    email: '',
    phone: '',
  });
    const [isLinkUserOpen, setIsLinkUserOpen] = useState(false);


  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => base44.entities.GuestProductionApplication.list('-submitted_at', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GuestProductionApplication.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success("Application updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GuestProductionApplication.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setDeleteTarget(null);
      setDeleteConfirmText("");
      toast.success("Application deleted");
    },
    onError: () => toast.error("Could not delete application. Please try again."),
  });

  const handleStatusUpdate = (applicationId, newStatus, extra = {}) => {
    const updates = { status: newStatus, ...extra };
    const oldStatus = selectedApp?.status;

    const logEntry = {
      timestamp: new Date().toISOString(),
      action: `Status changed: ${oldStatus} -> ${newStatus}`,
      old_status: oldStatus,
      new_status: newStatus,
    };

    const existingHistory = selectedApp?.status_history || [];
    updates.status_history = [...existingHistory, JSON.stringify(logEntry)];

    if (newStatus === "reviewing" && oldStatus !== "reviewing") {
      updates.review_started_at = new Date().toISOString();
    } else if (newStatus === "approved") {
      updates.approved_at = new Date().toISOString();
    } else if (newStatus === "rejected") {
      updates.rejected_at = new Date().toISOString();
    }

    updateMutation.mutate({ id: applicationId, data: updates });
    setSelectedApp(prev => prev ? { ...prev, ...updates } : prev);
  };
  
    const handleRequestMoreInfo = (message) => {
    if (!selectedApp) return;
    handleStatusUpdate(selectedApp.id, 'more_info_requested', { more_info_request_message: message, more_info_requested_at: new Date().toISOString() });
    setIsMoreInfoOpen(false);
  };

  const handleReject = (reason) => {
    if (!selectedApp) return;
    handleStatusUpdate(selectedApp.id, 'rejected', { rejection_reason: reason, rejected_at: new Date().toISOString() });
    setIsRejectModalOpen(false);
  };

  const handleApprove = () => {
    if (!selectedApp) return;
    handleStatusUpdate(selectedApp.id, "approved");
  };

  const handleCreatePerformer = async () => {
    if (!selectedApp || selectedApp.performer_id) {
      toast.error("Performer already exists for this application.");
      return;
    }

    const slug = `${selectedApp.applicant_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
    
    try {
      const performer = await base44.entities.Performer.create({
        display_name: selectedApp.applicant_name,
        slug,
        bio: selectedApp.experience || selectedApp.message || "",
        nationality: selectedApp.nationality,
        status: "pending",
        verified: false,
        internal_notes: `Created from application: ${selectedApp.id}`,
        revenue_model: selectedApp.preferred_revenue_model === 'network_performer_70_studio_30' ? 'established_network' : 'studio_managed',
        revenue_split_pct: selectedApp.preferred_revenue_model === 'network_performer_70_studio_30' ? 70 : 40,
      });

      const updates = {
        performer_id: performer.id,
        performer_created_at: new Date().toISOString(),
        status: 'performer_created',
      };

      const logEntry = {
        timestamp: new Date().toISOString(),
        action: `Performer created: ${performer.id}`,
        performer_id: performer.id,
      };
      updates.status_history = [...(selectedApp.status_history || []), JSON.stringify(logEntry)];

      await base44.entities.GuestProductionApplication.update(selectedApp.id, updates);
      await queryClient.invalidateQueries({ queryKey: ['applications'] });

      toast.success("Performer profile created");
      setIsCreatePerformerOpen(false);
      setSelectedApp(prev => prev ? { ...prev, ...updates } : prev);
    } catch (err) {
      toast.error(`Failed to create performer: ${err.message}`);
    }
  };

    const handleLinkUser = async (userId) => {
    if (!selectedApp || !userId) return;
    try {
      if (selectedApp.performer_id) {
        await base44.entities.Performer.update(selectedApp.performer_id, { user_id: userId });
      }
      
      const updates = {
        linked_user_id: userId,
        user_linked_at: new Date().toISOString(),
        status: 'user_linked',
      };
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: `User linked: ${userId}`,
        user_id: userId,
      };
      updates.status_history = [...(selectedApp.status_history || []), JSON.stringify(logEntry)];
      
      await base44.entities.GuestProductionApplication.update(selectedApp.id, updates);
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSelectedApp(prev => prev ? { ...prev, ...updates } : prev);
      setIsLinkUserOpen(false);
      toast.success("User linked successfully");
    } catch (err) {
      toast.error(`Failed to link user: ${err.message}`);
    }
  };

  const filtered = applications.filter(app => {
    const matchStatus = statusFilter === "all" || app.status === statusFilter;
    const matchSearch = !searchQuery ||
      app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: applications.length,
    media_pending: applications.filter(a => a.status === "media_pending").length,
    pending: applications.filter(a => a.status === "pending").length,
    reviewing: applications.filter(a => a.status === "reviewing").length,
    contacted: applications.filter(a => a.status === "contacted").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Performer Applications</h1>
        <p className="text-muted-foreground text-sm">Review applications and uploaded media before progressing applicants.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Media Pending", value: stats.media_pending, color: "text-orange-400" },
          { label: "New", value: stats.pending, color: "text-yellow-400" },
          { label: "Reviewing", value: stats.reviewing, color: "text-blue-400" },
          { label: "Contacted", value: stats.contacted, color: "text-purple-400" },
          { label: "Approved", value: stats.approved, color: "text-green-400" },
          { label: "Rejected", value: stats.rejected, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-3">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="media_pending">Media Pending</SelectItem>
            <SelectItem value="pending">New</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="more_info_requested">More Info Requested</SelectItem>
            <SelectItem value="contract_pending">Contract Pending</SelectItem>
            <SelectItem value="contract_sent">Contract Sent</SelectItem>
            <SelectItem value="contract_signed">Contract Signed</SelectItem>
            <SelectItem value="performer_created">Performer Created</SelectItem>
            <SelectItem value="user_linked">User Linked</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Applicant</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Contact</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Media</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Submitted</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">Actions</th>
              </tr>
            </thead>
            <ApplicationTable
              applications={filtered}
              isLoading={isLoading}
              onReview={(app) => {
                setSelectedApp(app);
                setIsDetailOpen(true);
              }}
              onDelete={(app) => {
                setDeleteTarget(app);
                setDeleteConfirmText("");
              }}
            />
          </table>
        </div>
      </div>
      
      {selectedApp && (
        <ApplicationDetailDialog
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          selectedApp={selectedApp}
          updateMutation={updateMutation}
          handleStatusUpdate={handleStatusUpdate}
        />
      )}

      {isMoreInfoOpen && (
        <Dialog open={isMoreInfoOpen} onOpenChange={setIsMoreInfoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request More Information</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Message to applicant</Label>
              <Textarea value={moreInfoMessage} onChange={(e) => setMoreInfoMessage(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMoreInfoOpen(false)}>Cancel</Button>
              <Button onClick={() => handleRequestMoreInfo(moreInfoMessage)}>Send Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isRejectModalOpen && (
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Reason for rejection (internal)</Label>
              <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleReject(rejectionReason)}>Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedApp && isCreatePerformerOpen && (
        <Dialog open={isCreatePerformerOpen} onOpenChange={setIsCreatePerformerOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Performer Profile</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">Creates a pending Performer record from this application.</p>
              <div><strong>Stage Name:</strong> {selectedApp.applicant_name}</div>
              <div><strong>Nationality:</strong> {selectedApp.nationality || "—"}</div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatePerformerOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePerformer}><UserPlus className="w-4 h-4 mr-1" /> Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedApp && (
        <LinkUserDialog
          isOpen={isLinkUserOpen}
          onClose={() => setIsLinkUserOpen(false)}
          selectedApp={selectedApp}
          onLink={handleLinkUser}
        />
      )}

      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-5 h-5" /> Delete application?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {deleteTarget.status === "approved" ? (
                <div className="bg-red-600/10 border border-red-600/30 rounded-lg px-4 py-3 text-sm text-red-300">
                  <AlertTriangle className="w-4 h-4 inline mr-1.5 mb-0.5" />
                  <strong>This application is approved.</strong> Deleting it may remove review history and associated compliance data. Type <strong>DELETE</strong> to confirm.
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This will permanently remove this performer application from the admin list. Uploaded review media and ID documents stored in private R2 will remain in storage until cleaned up separately.
                </p>
              )}

              <div className="bg-secondary rounded-lg px-4 py-3 space-y-0.5">
                <div className="text-sm font-medium text-foreground">{deleteTarget.applicant_name}</div>
                <div className="text-xs text-muted-foreground">{deleteTarget.email}</div>
              </div>

              {deleteTarget.status === "approved" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Type DELETE to confirm</label>
                  <input
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:border-red-500"
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground/60">
                Note: Uploaded files in private R2 storage are not deleted by this action. File cleanup is a separate secure admin task.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={
                  deleteMutation.isPending ||
                  (deleteTarget.status === "approved" && deleteConfirmText !== "DELETE")
                }
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}