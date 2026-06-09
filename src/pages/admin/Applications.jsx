import React, { useState, useEffect } from "react";
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
    queryFn: () => base44.entities.GuestProductionApplication.filter({ request_type: "performer_application" }, '-submitted_at', 200),
  });

  // Listen for custom events from dialog to open modals
  useEffect(() => {
    const handleOpenMoreInfo = () => setIsMoreInfoOpen(true);
    const handleOpenReject = () => setIsRejectModalOpen(true);
    const handleSyncContract = (event) => {
      if (event.detail) {
        setSelectedApp(event.detail);
        handleSyncContractStatus();
      }
    };
    
    window.addEventListener('open-more-info-modal', handleOpenMoreInfo);
    window.addEventListener('open-reject-modal', handleOpenReject);
    window.addEventListener('sync-contract-status', handleSyncContract);
    
    return () => {
      window.removeEventListener('open-more-info-modal', handleOpenMoreInfo);
      window.removeEventListener('open-reject-modal', handleOpenReject);
      window.removeEventListener('sync-contract-status', handleSyncContract);
    };
  }, []);

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

  const validateApproval = (app) => {
    const missing = [];
    
    // Check required uploads
    const photoCount = (app.profile_photo_r2_keys || []).length;
    const hasIntroVideo = !!app.intro_video_r2_key;
    const hasHardcoreVideo = !!app.hardcore_video_r2_key;
    const hasIdFront = !!(app.id_document_front_r2_key || app.id_document_r2_key);
    const hasSelfie = !!app.selfie_with_id_r2_key;
    
    if (photoCount < 5) missing.push(`${5 - photoCount} photo${5 - photoCount > 1 ? 's' : ''}`);
    if (!hasIntroVideo) missing.push('intro video');
    if (!hasHardcoreVideo) missing.push('hardcore video');
    if (!hasIdFront) missing.push('ID document');
    if (!hasSelfie) missing.push('selfie with ID');
    
    // Check business fields
    const revenueModel = app.preferred_revenue_model;
    if (!revenueModel || revenueModel === 'undecided') {
      missing.push('revenue model selection');
    }
    
    // Check work type
    const workType = app.work_type;
    if (!workType || !['solo', 'pair', 'both'].includes(workType)) {
      missing.push('work type (solo/pair/both)');
    }
    
    // Check legal fields
    if (!app.legal_name || !app.legal_name.trim()) {
      missing.push('legal name');
    }
    if (!app.email || !app.email.trim()) {
      missing.push('email');
    }
    
    return missing;
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    
    // Validate before approval
    const missing = validateApproval(selectedApp);
    
    if (missing.length > 0) {
      toast.error(`Cannot approve yet. Missing: ${missing.join(', ')}`);
      return;
    }
    
    // Auto-create performer, profile private, and compliance records
    try {
      // Check if performer already exists
      if (selectedApp.performer_id) {
        toast.error("Performer already exists for this application.");
        return;
      }
      
      // Create Performer
      const slug = `${selectedApp.applicant_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
      const revenueModel = selectedApp.preferred_revenue_model;
      const isNetwork = revenueModel === 'network_performer_70_studio_30';
      
      const performer = await base44.entities.Performer.create({
        display_name: selectedApp.applicant_name,
        slug,
        bio: selectedApp.experience || selectedApp.message || "",
        nationality: selectedApp.nationality,
        status: "pending_contract",
        verified: false,
        internal_notes: `Created from application: ${selectedApp.id}`,
        revenue_model: isNetwork ? 'established_network' : 'studio_managed',
        revenue_split_pct: isNetwork ? 70 : 40,
      });
      
      // Create or update PerformerProfilePrivate
      const legalNameParts = (selectedApp.legal_name || selectedApp.applicant_name).trim().split(' ');
      const legalFirstName = legalNameParts[0] || '';
      const legalLastName = legalNameParts.slice(1).join(' ') || '';
      
      // Check if profile already exists
      const existingProfiles = await base44.entities.PerformerProfilePrivate.filter({ performer_id: performer.id });
      
      if (existingProfiles && existingProfiles.length > 0) {
        // Update existing profile
        await base44.entities.PerformerProfilePrivate.update(existingProfiles[0].id, {
          legal_first_name: legalFirstName,
          legal_last_name: legalLastName,
          city: selectedApp.city || '',
          country: selectedApp.nationality || '',
          phone: selectedApp.phone || '',
          updated_at: new Date().toISOString(),
        });
      } else {
        // Create new profile
        await base44.entities.PerformerProfilePrivate.create({
          performer_id: performer.id,
          legal_first_name: legalFirstName,
          legal_last_name: legalLastName,
          city: selectedApp.city || '',
          country: selectedApp.nationality || '',
          phone: selectedApp.phone || '',
          payout_method: 'pending',
          payout_status: 'not_set',
        });
      }
      
      // Create or update ComplianceRecords for ID and Selfie
      const idDocKey = selectedApp.id_document_front_r2_key || selectedApp.id_document_r2_key;
      
      // Check for existing compliance records
      const existingRecords = await base44.entities.ComplianceRecord.filter({ performer_id: performer.id });
      const existingIdRecord = existingRecords?.find(r => r.document_type === 'id');
      const existingSelfieRecord = existingRecords?.find(r => r.document_type === 'other' && r.notes?.includes('Selfie'));
      
      if (idDocKey) {
        if (existingIdRecord) {
          // Update existing ID record
          await base44.entities.ComplianceRecord.update(existingIdRecord.id, {
            document_url: idDocKey,
            verification_status: 'pending_review',
            notes: `Updated from application: ${selectedApp.id}`,
            updated_date: new Date().toISOString(),
          });
        } else {
          // Create new ID record
          await base44.entities.ComplianceRecord.create({
            performer_id: performer.id,
            document_type: 'id',
            document_url: idDocKey,
            verification_method: 'manual',
            verification_status: 'pending_review',
            notes: `Imported from application: ${selectedApp.id}`,
          });
        }
      }
      
      if (selectedApp.selfie_with_id_r2_key) {
        if (existingSelfieRecord) {
          // Update existing selfie record
          await base44.entities.ComplianceRecord.update(existingSelfieRecord.id, {
            document_url: selectedApp.selfie_with_id_r2_key,
            verification_status: 'pending_review',
            notes: `Updated from application: ${selectedApp.id}`,
            updated_date: new Date().toISOString(),
          });
        } else {
          // Create new selfie record
          await base44.entities.ComplianceRecord.create({
            performer_id: performer.id,
            document_type: 'other',
            document_url: selectedApp.selfie_with_id_r2_key,
            verification_method: 'manual',
            verification_status: 'pending_review',
            notes: `Selfie with ID from application: ${selectedApp.id}`,
          });
        }
      }
      
      // Update application with performer link and approval
      const updates = {
        performer_id: performer.id,
        performer_created_at: new Date().toISOString(),
        status: 'performer_created',
        approved_at: new Date().toISOString(),
      };
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: `Application approved - Performer created: ${performer.id}`,
        performer_id: performer.id,
        old_status: selectedApp.status,
        new_status: 'performer_created',
      };
      updates.status_history = [...(selectedApp.status_history || []), JSON.stringify(logEntry)];
      
      await base44.entities.GuestProductionApplication.update(selectedApp.id, updates);
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      
      toast.success(`Application approved! Performer "${selectedApp.applicant_name}" created with ${isNetwork ? '70/30' : '60/40'} revenue split.`);
      setIsDetailOpen(false);
      setSelectedApp(null);
      
    } catch (err) {
      console.error('Approval error:', err);
      toast.error(`Failed to approve application: ${err.message}`);
    }
  };

  const handleCreateContract = async () => {
    if (!selectedApp) return;
    
    try {
      // Call contractService backend function
      const response = await base44.functions.invoke('contractService', {
        action: 'create_from_application',
        application_id: selectedApp.id,
      });
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      // Update application with contract info
      const updates = {
        contract_id: response.contract_id,
        contract_status: 'draft',
        status: 'contract_pending',
        contract_generated_at: new Date().toISOString(),
      };
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: `Contract generated: ${response.contract_id}`,
        contract_id: response.contract_id,
        signing_url: response.signing_url,
      };
      updates.status_history = [...(selectedApp.status_history || []), JSON.stringify(logEntry)];
      
      await base44.entities.GuestProductionApplication.update(selectedApp.id, updates);
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      
      toast.success(`Contract draft generated for "${selectedApp.applicant_name}"`);
      setSelectedApp(prev => prev ? { ...prev, ...updates } : prev);
      
    } catch (err) {
      console.error('Contract generation error:', err);
      toast.error(`Failed to generate contract: ${err.message}`);
    }
  };

  const handleContractSent = () => {
    if (!selectedApp) return;
    handleStatusUpdate(selectedApp.id, 'contract_sent', {
      contract_status: 'sent',
      contract_sent_at: new Date().toISOString(),
    });
  };

  const handleContractSigned = () => {
    if (!selectedApp) return;
    handleStatusUpdate(selectedApp.id, 'contract_signed', {
      contract_status: 'signed',
      contract_signed_at: new Date().toISOString(),
    });
  };

  const handleSyncContractStatus = async () => {
    if (!selectedApp || !selectedApp.contract_id) return;
    
    try {
      // Fetch contract to check status
      const contract = await base44.entities.Contract.get(selectedApp.contract_id);
      
      if (!contract) {
        toast.error('Contract not found');
        return;
      }
      
      if (contract.status !== 'signed') {
        toast.error(`Cannot sync. Contract status is '${contract.status}', not 'signed'.`);
        return;
      }
      
      // Check if already synced
      const alreadySynced = selectedApp.contract_status === 'signed' && 
                           (selectedApp.status === 'contract_signed' || selectedApp.status === 'performer_active');
      
      if (alreadySynced) {
        toast.info('Application already synced with signed contract');
        return;
      }
      
      // Sync application
      const timestamp = new Date().toISOString();
      const updates = {
        contract_status: 'signed',
        status: 'contract_signed',
        contract_signed_at: timestamp,
      };
      
      const logEntry = {
        timestamp,
        action: 'Contract status synced by admin',
        contract_id: contract.id,
        contract_status: contract.status,
      };
      updates.status_history = [...(selectedApp.status_history || []), JSON.stringify(logEntry)];
      
      await base44.entities.GuestProductionApplication.update(selectedApp.id, updates);
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      
      // Activate performer if exists
      if (selectedApp.performer_id) {
        const performer = await base44.entities.Performer.get(selectedApp.performer_id);
        if (performer && performer.status === 'pending_contract') {
          await base44.entities.Performer.update(selectedApp.performer_id, {
            status: 'active',
            signed_contract_at: timestamp
          });
        }
      }
      
      // Audit log
      await base44.functions.invoke('contractService', {
        action: 'create_audit_log',
        contract_id: contract.id,
        action_type: 'admin_sync_signed_status',
        notes: `Admin synced contract status for application ${selectedApp.id}`
      }).catch(() => {}); // Ignore if action doesn't exist
      
      toast.success('Contract status synced successfully');
      setSelectedApp(prev => prev ? { ...prev, ...updates } : prev);
      
    } catch (err) {
      console.error('Sync error:', err);
      toast.error(`Failed to sync contract status: ${err.message}`);
    }
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

  // Verify all applications are performer applications (safety check)
  const nonPerformerApps = applications.filter(a => a.request_type !== "performer_application");
  if (nonPerformerApps.length > 0 && import.meta.env.MODE === "development") {
    console.warn("[Admin Applications] WARNING: Found", nonPerformerApps.length, "non-performer applications in the list. Check request_type filter.");
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Performer Applications</h1>
        <p className="text-muted-foreground text-sm">Review performer applications and uploaded media before progressing applicants. Fan Production requests are managed separately.</p>
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
            <SelectItem value="pending">New</SelectItem>
            <SelectItem value="media_pending">Media Pending</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="more_info_requested">More Info Requested</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="contract_pending">Contract Pending</SelectItem>
            <SelectItem value="contract_sent">Contract Sent</SelectItem>
            <SelectItem value="contract_signed">Contract Signed</SelectItem>
            <SelectItem value="performer_created">Performer Created</SelectItem>
            <SelectItem value="user_linked">User Linked</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            {/* Legacy statuses for backward compatibility */}
            <SelectItem value="submitted">Submitted (Legacy)</SelectItem>
            <SelectItem value="new">New (Legacy)</SelectItem>
            <SelectItem value="pending_review">Pending Review (Legacy)</SelectItem>
            <SelectItem value="awaiting_review">Awaiting Review (Legacy)</SelectItem>
            <SelectItem value="media_uploaded">Media Uploaded (Legacy)</SelectItem>
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