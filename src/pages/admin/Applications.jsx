import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Users, CheckCircle, XCircle, Clock, Eye, MessageSquare, UserPlus,
  Search, Filter, Mail, Phone, FileText, Image as ImageIcon, Video,
  Download, AlertTriangle, ExternalLink, Send, RefreshCw, Lock, Copy, PhoneCall, Link as LinkIcon
} from "lucide-react";
import { format, formatDistanceToNow, differenceInYears } from "date-fns";

// ── Helpers ────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  pending:       "bg-yellow-600",
  media_pending: "bg-orange-600",
  reviewing:     "bg-blue-600",
  contacted:     "bg-purple-600",
  approved:      "bg-green-600",
  rejected:      "bg-red-600",
};
const STATUS_ICON = {
  pending:       <Clock className="w-3.5 h-3.5" />,
  media_pending: <AlertTriangle className="w-3.5 h-3.5" />,
  reviewing:     <MessageSquare className="w-3.5 h-3.5" />,
  contacted:     <Phone className="w-3.5 h-3.5" />,
  approved:      <CheckCircle className="w-3.5 h-3.5" />,
  rejected:      <XCircle className="w-3.5 h-3.5" />,
};

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function TimeAgo({ dateStr }) {
  if (!dateStr) return <span className="text-muted-foreground">N/A</span>;
  const d = new Date(dateStr);
  return (
    <span>
      <span className="text-foreground">{format(d, "MMM d, yyyy HH:mm")}</span>
      <span className="text-muted-foreground ml-1.5">— {formatDistanceToNow(d, { addSuffix: true })}</span>
    </span>
  );
}

function calcAge(dob) {
  if (!dob) return null;
  return differenceInYears(new Date(), new Date(dob));
}

// ── Signed media viewer ────────────────────────────────────────────────────
function SignedMediaItem({ r2Key, label, type = "image" }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("getApplicationFileSignedUrl", { r2_key: r2Key });
    if (res.data?.signed_url) {
      setUrl(res.data.signed_url);
    } else {
      setError("Could not load file");
    }
    setLoading(false);
  };

  if (!r2Key) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs py-2">
        <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
        <span>{label}: <span className="text-orange-400">Not uploaded</span></span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-muted-foreground" /> {label}
        </span>
        {!url && (
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-7 text-xs">
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
            {loading ? "Loading…" : "View"}
          </Button>
        )}
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Download className="w-3 h-3" /> Open
            </Button>
          </a>
        )}
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {url && type === "image" && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={label} className="w-full max-h-48 object-cover rounded-lg border border-border" />
        </a>
      )}
      {url && type === "video" && (
        <video src={url} controls className="w-full max-h-48 rounded-lg border border-border" />
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Applications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRequestFilesOpen, setIsRequestFilesOpen] = useState(false);
  const [uploadLink, setUploadLink] = useState(null);
  const [selectedMissingFiles, setSelectedMissingFiles] = useState([]);
  const [isCreatePerformerOpen, setIsCreatePerformerOpen] = useState(false);
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
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

  // Check contract readiness - returns array of missing fields
  const checkContractReadiness = (app) => {
    const missingFields = [];
    
    // Check performer profile linked
    const hasPerformer = app.admin_notes?.includes('Performer created:');
    if (!hasPerformer) missingFields.push('performer_profile');
    
    // Check required contract fields
    if (!app.legal_name) missingFields.push('legal_name');
    if (!app.date_of_birth) missingFields.push('date_of_birth');
    if (!app.address) missingFields.push('full_residential_address');
    if (!app.country) missingFields.push('country');
    if (!app.email) missingFields.push('email');
    
    return missingFields;
  };

  const handleStatusUpdate = (applicationId, newStatus, extra = {}) => {
    const updates = { status: newStatus, ...extra };
    if (newStatus === "reviewing") {
      updates.media_reviewed_at = new Date().toISOString();
    }
    updateMutation.mutate({ id: applicationId, data: updates });
    setSelectedApp(prev => prev ? { ...prev, ...updates } : prev);
  };

  const handleApprove = () => {
    if (!selectedApp) return;
    
    // Validate contract readiness BEFORE approval
    const hasPerformer = selectedApp.admin_notes?.includes('Performer created:');
    const hasLegalName = !!selectedApp.legal_name;
    const hasDOB = !!selectedApp.date_of_birth;
    const hasFullAddress = !!selectedApp.address;
    const hasCountry = !!selectedApp.country;
    const hasEmail = !!selectedApp.email;
    
    const missingFields = [];
    if (!hasPerformer) missingFields.push('Performer profile');
    if (!hasLegalName) missingFields.push('Legal name');
    if (!hasDOB) missingFields.push('Date of Birth');
    if (!hasFullAddress) missingFields.push('Full Residential Address');
    if (!hasCountry) missingFields.push('Country');
    if (!hasEmail) missingFields.push('Email');
    
    if (missingFields.length > 0) {
      // Do NOT approve - open contract data modal instead
      toast.error(`Cannot approve - missing contract data: ${missingFields.join(', ')}`);
      handleOpenEditContractData();
      return;
    }
    
    // All fields complete - proceed with approval
    handleStatusUpdate(selectedApp.id, "approved");
  };

  const handleSaveContractDataAndApprove = async (approveAfter = false) => {
    if (!selectedApp) return;
    
    const updates = {
      legal_name: contractFormData.legal_name,
      date_of_birth: contractFormData.date_of_birth,
      nationality: contractFormData.nationality,
      address: contractFormData.address,
      city: contractFormData.city,
      country: contractFormData.country,
      phone: contractFormData.phone,
    };
    
    try {
      await base44.entities.GuestProductionApplication.update(selectedApp.id, updates);
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      // Update local selectedApp
      setSelectedApp(prev => prev ? { ...prev, ...updates } : prev);
      toast.success("Contract data updated");
      setIsEditingContractData(false);
      
      // If approveAfter is true, also approve the application
      if (approveAfter) {
        handleStatusUpdate(selectedApp.id, "approved");
        toast.success("Application approved");
      }
    } catch (err) {
      toast.error(`Failed to save: ${err.message}`);
    }
  };

  const handleAddNote = () => {
    if (!selectedApp || !adminNotes.trim()) return;
    const existing = selectedApp.admin_notes || "";
    const ts = format(new Date(), "yyyy-MM-dd HH:mm");
    const updated = existing ? `${existing}\n\n[${ts}] ${adminNotes}` : `[${ts}] ${adminNotes}`;
    updateMutation.mutate({ id: selectedApp.id, data: { admin_notes: updated } });
    setSelectedApp(prev => ({ ...prev, admin_notes: updated }));
    setAdminNotes("");
  };

  const handleLogContact = () => {
    if (!selectedApp || !contactMsg.trim()) return;
    const existing = selectedApp.contact_log || "";
    const ts = format(new Date(), "yyyy-MM-dd HH:mm");
    const updated = existing ? `${existing}\n\n[${ts}] ${contactMsg}` : `[${ts}] ${contactMsg}`;
    updateMutation.mutate({ id: selectedApp.id, data: { contact_log: updated } });
    setSelectedApp(prev => ({ ...prev, contact_log: updated }));
    setContactMsg("");
    toast.success("Contact logged");
  };

  const generateUploadLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("createApplicationUploadToken", {
        application_id: selectedApp.id,
        expires_in_days: 7,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setUploadLink(data.upload_url);
      const ts = format(new Date(), "yyyy-MM-dd HH:mm");
      const logEntry = `[${ts}] Admin generated upload token link for missing files: ${selectedMissingFiles.join(", ")}`;
      const existing = selectedApp.contact_log || "";
      updateMutation.mutate({ 
        id: selectedApp.id, 
        data: { contact_log: existing ? `${existing}\n\n${logEntry}` : logEntry } 
      });
      toast.success("Upload link generated");
    },
    onError: (e) => toast.error(`Failed to generate link: ${e.message}`),
  });

  const handleRequestMissingFiles = () => {
    if (selectedMissingFiles.length === 0) {
      toast.error("Please select at least one missing file type");
      return;
    }
    generateUploadLinkMutation.mutate();
    setIsRequestFilesOpen(true);
  };

  const handleCreatePerformer = async () => {
    if (!selectedApp) return;
    const slug = `${selectedApp.applicant_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
    const performer = await base44.entities.Performer.create({
      display_name: selectedApp.applicant_name,
      slug,
      bio: selectedApp.experience || selectedApp.message || "",
      nationality: selectedApp.nationality,
      status: "pending", verified: false,
    });
    await base44.entities.GuestProductionApplication.update(selectedApp.id, {
      status: "approved",
      admin_notes: `${selectedApp.admin_notes || ""}\n\nPerformer created: ${performer.id}`,
    });
    toast.success("Performer profile created");
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    setIsCreatePerformerOpen(false);
    setIsDetailOpen(false);
    navigate(`/admin/performers/${performer.id}`);
  };

  const [selectedTemplateId, setSelectedTemplateId] = useState("6a21d0c9e52a37dd1042e42a"); // Default: Performer Management v3.0
  const [contractVariables, setContractVariables] = useState({});
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: () => base44.entities.ContractTemplate.filter({ status: 'active' }),
  });

  const handleCreateContract = async (templateId, variables) => {
    if (!selectedApp) return;
    
    // DEBUG: Show current application state
    console.log('[CONTRACT DEBUG] Application state:', {
      id: selectedApp.id,
      applicant_name: selectedApp.applicant_name,
      legal_name: selectedApp.legal_name,
      date_of_birth: selectedApp.date_of_birth,
      city: selectedApp.city,
      address: selectedApp.address,
      email: selectedApp.email,
      status: selectedApp.status,
      admin_notes: selectedApp.admin_notes?.substring(0, 100),
      has_performer: selectedApp.admin_notes?.includes('Performer created:'),
    });
    
    try {
      // Extract performer_id from admin notes if available
      let performer_id = null;
      if (selectedApp.admin_notes) {
        const performerMatch = selectedApp.admin_notes.match(/Performer created:\s*([a-zA-Z0-9]+)/);
        if (performerMatch && performerMatch[1]) {
          performer_id = performerMatch[1];
          console.log('[CONTRACT] Extracted performer_id from admin notes:', performer_id);
        }
      }

      console.log('[CONTRACT] Calling contractService with:', {
        action: 'create_from_application',
        application_id: selectedApp.id,
        template_id: templateId,
        performer_id,
        variables_keys: Object.keys(variables),
        variables_legal_name: variables.legal_name,
        variables_date_of_birth: variables.date_of_birth,
        variables_address: variables.address,
        variables_email: variables.email,
      });

      const res = await base44.functions.invoke("contractService", {
        action: "create_from_application",
        application_id: selectedApp.id,
        template_id: templateId,
        performer_id: performer_id || variables.performer_id,
        ...variables,
      });

      console.log('[CONTRACT] Response status:', res.data?.success ? 'SUCCESS' : 'ERROR', res.data);

      if (res.data?.success) {
        setContractData({
          id: res.data.contract_id,
          signing_url: res.data.signing_url,
          title: res.data.title,
        });
        setIsCreateContractOpen(true);
        toast.success("Contract created");
      } else if (res.data?.error) {
        // Backend returned an error (400) - show detailed message
        console.error('[CONTRACT] Backend validation failed:', res.data);
        const errorMsg = res.data.missing_fields 
          ? `Cannot create final contract. Missing: ${res.data.missing_fields.join(', ')}`
          : res.data.error;
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('[CONTRACT] Exception:', err);
      console.error('[CONTRACT] Error response:', err.response?.data);
      // Show detailed error message from backend
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create contract';
      const missingFields = err.response?.data?.missing_fields;
      if (missingFields && Array.isArray(missingFields)) {
        toast.error(`Cannot create final contract. Missing: ${missingFields.join(', ')}`);
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const handleOpenContractDialog = async () => {
    // Pre-fill variables from application
    const today = new Date().toISOString().split('T')[0];
    
    // Extract legal_name from message if not in dedicated field
    let legalName = selectedApp.legal_name;
    if (!legalName && selectedApp.message) {
      const legalNameMatch = selectedApp.message.match(/Legal Name:\s*([^\n]+)/i);
      if (legalNameMatch && legalNameMatch[1]) {
        legalName = legalNameMatch[1].trim();
      }
    }
    
    // Debug: Log current application state
    console.log('[CONTRACT DEBUG] Application state before create:', {
      application_id: selectedApp.id,
      applicant_name: selectedApp.applicant_name,
      status: selectedApp.status,
      legal_name: selectedApp.legal_name || 'MISSING',
      date_of_birth: selectedApp.date_of_birth || 'MISSING',
      address: selectedApp.address || 'MISSING',
      city: selectedApp.city || 'MISSING',
      nationality: selectedApp.nationality || 'MISSING',
      email: selectedApp.email || 'MISSING',
      admin_notes_has_performer: selectedApp.admin_notes?.includes('Performer created:') || false,
    });
    
    setContractVariables({
      signing_date: today,
      studio_email: 'legal@fleshlab.online',
      legal_name: legalName || selectedApp.applicant_name,
      stage_name: selectedApp.applicant_name,
      date_of_birth: selectedApp.date_of_birth || '',
      address: `${selectedApp.city || ''}, ${selectedApp.nationality || ''}`.trim(),
      email: selectedApp.email,
      phone_or_messenger: selectedApp.phone || selectedApp.whatsapp_number || '',
      id_number: '',
      contract_model: 'full_management',
    });
    setSelectedTemplateId("6a21d0c9e52a37dd1042e42a");
    setIsTemplateDialogOpen(true);
  };

  const handleOpenEditContractData = () => {
    // Pre-fill form with existing application data
    setContractFormData({
      legal_name: selectedApp.legal_name || '',
      stage_name: selectedApp.applicant_name || '',
      date_of_birth: selectedApp.date_of_birth || '',
      nationality: selectedApp.nationality || '',
      address: selectedApp.address || '',
      city: selectedApp.city || '',
      country: selectedApp.country || selectedApp.nationality || '',
      email: selectedApp.email || '',
      phone: selectedApp.phone || selectedApp.whatsapp_number || '',
    });
    setIsEditingContractData(true);
  };

  const handleSaveContractData = async () => {
    if (!selectedApp) return;
    
    const updates = {
      legal_name: contractFormData.legal_name,
      date_of_birth: contractFormData.date_of_birth,
      nationality: contractFormData.nationality,
      address: contractFormData.address,
      city: contractFormData.city,
      country: contractFormData.country,
      phone: contractFormData.phone,
    };
    
    try {
      await base44.entities.GuestProductionApplication.update(selectedApp.id, updates);
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      // Update local selectedApp
      setSelectedApp(prev => prev ? { ...prev, ...updates } : prev);
      toast.success("Contract data updated");
      setIsEditingContractData(false);
    } catch (err) {
      toast.error(`Failed to save: ${err.message}`);
    }
  };

  const handleSendForSignature = async () => {
    if (!contractData?.id) return;
    try {
      const res = await base44.functions.invoke("contractService", {
        action: "send_for_signature",
        contract_id: contractData.id,
      });

      if (res.data?.success) {
        toast.success("Contract sent for signature");
        setContractData({ ...contractData, signing_url: res.data.signing_url });
      }
    } catch (err) {
      toast.error(`Failed to send: ${err.message}`);
    }
  };

  const copySigningLink = () => {
    if (contractData?.signing_url) {
      copyToClipboard(contractData.signing_url);
      toast.success("Signing link copied");
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

  const handleMarkContacted = (method) => {
    if (!selectedApp) return;
    const ts = format(new Date(), "yyyy-MM-dd HH:mm");
    const logEntry = `[${ts}] Marked contacted via ${method}`;
    const existing = selectedApp.contact_log || "";
    const updatedLog = existing ? `${existing}\n\n${logEntry}` : logEntry;
    const updates = {
      status: ["approved","rejected"].includes(selectedApp.status) ? selectedApp.status : "contacted",
      contacted_at: new Date().toISOString(),
      last_contact_method: method,
      contact_log: updatedLog,
    };
    updateMutation.mutate({ id: selectedApp.id, data: updates });
    setSelectedApp(prev => ({ ...prev, ...updates }));
    toast.success(`Marked as contacted via ${method}`);
  };

  const TABS = ["info", "media", "id", "notes", "contact"];

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
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No applications found</td></tr>
              ) : filtered.map(app => (
                <tr key={app.id} className="border-b border-border hover:bg-secondary/40">
                  <td className="p-4">
                    <div className="font-medium text-foreground text-sm">{app.applicant_name}</div>
                    {app.nationality && <div className="text-xs text-muted-foreground">{app.nationality}</div>}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-foreground">{app.email}</div>
                    {app.phone && <div className="text-xs text-muted-foreground">{app.phone}</div>}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${(app.profile_photo_r2_keys?.length || 0) >= 5 ? 'border-emerald-600/40 text-emerald-400' : 'border-orange-600/40 text-orange-400'}`}>
                        <ImageIcon className="w-3 h-3 mr-1" />{app.profile_photo_r2_keys?.length || 0}/5
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${app.intro_video_r2_key ? 'border-emerald-600/40 text-emerald-400' : 'border-orange-600/40 text-orange-400'}`}>
                        <Video className="w-3 h-3 mr-1" />{app.intro_video_r2_key ? "Body ✓" : "Body ✗"}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${app.hardcore_video_r2_key ? 'border-emerald-600/40 text-emerald-400' : 'border-orange-600/40 text-orange-400'}`}>
                        <Video className="w-3 h-3 mr-1" />{app.hardcore_video_r2_key ? "HC ✓" : "HC ✗"}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${app.id_document_r2_key ? 'border-emerald-600/40 text-emerald-400' : 'border-red-600/40 text-red-400'}`}>
                        <FileText className="w-3 h-3 mr-1" />{app.id_document_r2_key ? "ID ✓" : "ID ✗"}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-4 text-xs">
                    <TimeAgo dateStr={app.submitted_at} />
                  </td>
                  <td className="p-4">
                    <Badge className={`${STATUS_COLOR[app.status] || "bg-gray-600"} text-white text-xs`}>
                      {STATUS_ICON[app.status]}
                      <span className="ml-1 capitalize">{app.status?.replace("_", " ")}</span>
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedApp(app); setAdminNotes(""); setContactMsg(""); setActiveTab("info"); setIsDetailOpen(true);
                    }}>
                      <Eye className="w-4 h-4" /> Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail Dialog ─────────────────────────────────────────────── */}
      {selectedApp && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                Application — {selectedApp.applicant_name}
                <Badge className={`${STATUS_COLOR[selectedApp.status] || "bg-gray-600"} text-white text-xs`}>
                  {selectedApp.status?.replace("_", " ")}
                </Badge>
              </DialogTitle>
              {selectedApp.submitted_at && (
                <p className="text-xs text-muted-foreground">
                  Submitted: {format(new Date(selectedApp.submitted_at), "PPpp")}
                  {selectedApp.media_reviewed_at && ` · Media reviewed: ${format(new Date(selectedApp.media_reviewed_at), "PPpp")}`}
                </p>
              )}
            </DialogHeader>

            {/* Tab nav */}
            <div className="flex gap-1 border-b border-border pb-0 mb-4">
              {["info", "media", "id", "notes", "contact"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-t capitalize transition-colors ${
                    activeTab === tab ? "bg-secondary text-foreground border border-b-secondary border-border" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {tab === "id" ? "ID Doc" : tab}
                </button>
              ))}
            </div>

            <div className="space-y-5">

              {/* ── INFO tab ─────────────────────────────────────────── */}
              {activeTab === "info" && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">Stage Name</Label><div className="text-foreground text-sm font-medium">{selectedApp.applicant_name}</div></div>
                    <div><Label className="text-xs text-muted-foreground">Legal Name (Private)</Label><div className="text-foreground text-sm">{selectedApp.legal_name || <span className="text-muted-foreground italic">Not provided</span>}</div></div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                      <div className="text-foreground text-sm">
                        {selectedApp.date_of_birth
                          ? <>{selectedApp.date_of_birth} <span className="text-muted-foreground">(Age: {calcAge(selectedApp.date_of_birth)})</span></>
                          : <span className="text-orange-400 italic">Not provided</span>}
                      </div>
                    </div>
                    <div><Label className="text-xs text-muted-foreground">Nationality</Label><div className="text-foreground text-sm">{selectedApp.nationality || "—"}</div></div>
                    <div><Label className="text-xs text-muted-foreground">City</Label><div className="text-foreground text-sm">{selectedApp.city || "—"}</div></div>
                    <div><Label className="text-xs text-muted-foreground">Email</Label><div className="text-foreground text-sm flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{selectedApp.email}</div></div>
                    <div><Label className="text-xs text-muted-foreground">Phone</Label><div className="text-foreground text-sm flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{selectedApp.phone || "—"}</div></div>
                    <div><Label className="text-xs text-muted-foreground">WhatsApp</Label><div className="text-foreground text-sm">{selectedApp.whatsapp_number || "—"}</div></div>
                    <div><Label className="text-xs text-muted-foreground">Preferred Contact</Label><div className="text-foreground text-sm capitalize">{selectedApp.preferred_contact_method || "—"}</div></div>
                  </div>
                  {/* WhatsApp tracking */}
                  {(selectedApp.whatsapp_prompt_shown_at || selectedApp.whatsapp_contact_clicked_at) && (
                    <div className="bg-emerald-600/8 border border-emerald-600/20 rounded-lg px-3 py-2 text-xs space-y-1">
                      {selectedApp.whatsapp_prompt_shown_at && <div className="text-muted-foreground">WA prompt shown: <span className="text-foreground">{format(new Date(selectedApp.whatsapp_prompt_shown_at), "MMM d HH:mm")}</span></div>}
                      {selectedApp.whatsapp_contact_clicked_at
                        ? <div className="text-emerald-400 font-semibold">✓ Applicant clicked WhatsApp: {format(new Date(selectedApp.whatsapp_contact_clicked_at), "MMM d HH:mm")}</div>
                        : <div className="text-orange-400">✗ Applicant has not clicked WhatsApp yet</div>}
                    </div>
                  )}
                  {selectedApp.interests?.length > 0 && (
                    <div><Label className="text-xs text-muted-foreground">Interests</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedApp.interests.map(i => <Badge key={i} variant="outline" className="text-xs">{i}</Badge>)}
                      </div>
                    </div>
                  )}
                  {selectedApp.experience && (
                    <div><Label className="text-xs text-muted-foreground">Experience</Label>
                      <div className="bg-secondary rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap mt-1">{selectedApp.experience}</div>
                    </div>
                  )}
                  {selectedApp.social_links && (
                    <div><Label className="text-xs text-muted-foreground">Social Links</Label>
                      <div className="bg-secondary rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap mt-1">{selectedApp.social_links}</div>
                    </div>
                  )}
                  {selectedApp.message && (
                    <div><Label className="text-xs text-muted-foreground">Message (Legacy)</Label>
                      <div className="bg-secondary rounded-lg p-3 text-xs text-foreground whitespace-pre-wrap mt-1 max-h-32 overflow-y-auto">{selectedApp.message}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── MEDIA tab ────────────────────────────────────────── */}
              {activeTab === "media" && (
                <div className="space-y-5">
                  <div className="bg-amber-600/8 border border-amber-600/20 rounded-lg px-4 py-3 text-xs text-amber-300 flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    All media files are stored in private R2 storage. Signed URLs expire in 15 minutes.
                  </div>

                  {/* Photos */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                      Profile Photos
                      <span className={`${(selectedApp.profile_photo_r2_keys?.length || 0) >= 5 ? "text-emerald-400" : "text-orange-400"}`}>
                        {selectedApp.profile_photo_r2_keys?.length || 0}/5
                      </span>
                    </Label>
                    {(selectedApp.profile_photo_r2_keys?.length || 0) === 0 ? (
                      <div className="text-orange-400 text-xs flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> No photos uploaded</div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {selectedApp.profile_photo_r2_keys.map((key, i) => (
                          <SignedMediaItem key={i} r2Key={key} label={`Photo ${i + 1}`} type="image" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 space-y-4">
                    <SignedMediaItem r2Key={selectedApp.intro_video_r2_key} label="Body / Intro Video" type="video" />
                    <SignedMediaItem r2Key={selectedApp.hardcore_video_r2_key} label="Hardcore / Action Video" type="video" />
                  </div>
                </div>
              )}

              {/* ── ID DOC tab ───────────────────────────────────────── */}
              {activeTab === "id" && (
                <div className="space-y-4">
                  <div className="bg-red-600/8 border border-red-600/20 rounded-lg px-4 py-3 text-xs text-red-300 flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ID documents are strictly confidential. Admins only. Signed URLs expire in 15 minutes.
                  </div>
                  {selectedApp.id_document_type && (
                    <div className="text-xs text-muted-foreground">Document type: <span className="text-foreground font-medium capitalize">{selectedApp.id_document_type?.replace("_", " ")}</span></div>
                  )}

                  {/* New 3-slot compliance */}
                  <SignedMediaItem r2Key={selectedApp.id_document_front_r2_key || selectedApp.id_document_r2_key} label="ID Front" type="image" />
                  <SignedMediaItem r2Key={selectedApp.id_document_back_r2_key} label={`ID Back${["national_id","driver_license"].includes(selectedApp.id_document_type) ? " (Required)" : " (Optional for passport)"}`} type="image" />
                  <SignedMediaItem r2Key={selectedApp.selfie_with_id_r2_key} label="Selfie with ID" type="image" />

                  {/* Legacy URL fallback */}
                  {selectedApp.id_document_url && !selectedApp.id_document_front_r2_key && !selectedApp.id_document_r2_key && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Legacy Uploaded Document</Label>
                      <img src={selectedApp.id_document_url} alt="Legacy ID" className="w-40 h-40 object-cover rounded border border-border mt-1" />
                    </div>
                  )}

                  {/* No ID at all */}
                  {!selectedApp.id_document_front_r2_key && !selectedApp.id_document_r2_key && !selectedApp.id_document_url && (
                    <div className="text-red-400 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> No ID document uploaded — applicant must be contacted.
                    </div>
                  )}

                  {/* Verify button — requires front + selfie at minimum */}
                  {(selectedApp.id_document_front_r2_key || selectedApp.id_document_r2_key) && selectedApp.selfie_with_id_r2_key && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(selectedApp.id, selectedApp.status, { compliance_upload_status: "verified" })}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Mark ID Verified
                      </Button>
                    </div>
                  )}
                  {(selectedApp.id_document_front_r2_key || selectedApp.id_document_r2_key) && !selectedApp.selfie_with_id_r2_key && (
                    <p className="text-orange-400 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Selfie with ID required before verifying.
                    </p>
                  )}
                </div>
              )}

              {/* ── NOTES tab ────────────────────────────────────────── */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Add Admin Note</Label>
                    <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Internal review note…" className="min-h-[80px]" />
                    <Button variant="outline" size="sm" onClick={handleAddNote} disabled={!adminNotes.trim()} className="mt-2">
                      <FileText className="w-3.5 h-3.5 mr-1" /> Save Note
                    </Button>
                  </div>
                  {selectedApp.admin_notes && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Previous Notes</Label>
                      <div className="bg-secondary rounded-lg p-3 text-xs text-foreground whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                        {selectedApp.admin_notes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── CONTACT tab ──────────────────────────────────────── */}
              {activeTab === "contact" && (
                <div className="space-y-4">
                  {/* Request Missing Files button */}
                  {selectedApp && (
                    <div className="mb-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-rose-600/40 text-rose-400 hover:bg-rose-600/10"
                        onClick={() => {
                          // Pre-select missing files
                          const missing = [];
                          if ((selectedApp.profile_photo_r2_keys?.length || 0) < 5) missing.push("photos");
                          if (!selectedApp.intro_video_r2_key) missing.push("body_video");
                          if (!selectedApp.hardcore_video_r2_key) missing.push("hardcore_video");
                          if (!selectedApp.id_document_front_r2_key && !selectedApp.id_document_r2_key) missing.push("id_front");
                          if (!selectedApp.id_document_back_r2_key) missing.push("id_back");
                          if (!selectedApp.selfie_with_id_r2_key) missing.push("selfie_with_id");
                          setSelectedMissingFiles(missing);
                          setIsRequestFilesOpen(true);
                        }}
                        disabled={generateUploadLinkMutation.isPending}
                      >
                        <LinkIcon className="w-3.5 h-3.5 mr-1.5" /> Request Missing Files
                      </Button>
                    </div>
                  )}

                  {/* Contact info + copy */}
                  <div className="bg-secondary rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">Email</span>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{selectedApp.email}</span>
                        <button onClick={() => { copyToClipboard(selectedApp.email); toast.success("Email copied"); }} className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                      </div>
                    </div>
                    {selectedApp.whatsapp_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">WhatsApp</span>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{selectedApp.whatsapp_number}</span>
                          <button onClick={() => { copyToClipboard(selectedApp.whatsapp_number); toast.success("WhatsApp copied"); }} className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                        </div>
                      </div>
                    )}
                    {selectedApp.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">Phone</span>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{selectedApp.phone}</span>
                          <button onClick={() => { copyToClipboard(selectedApp.phone); toast.success("Phone copied"); }} className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                        </div>
                      </div>
                    )}
                    {selectedApp.contacted_at && (
                      <div className="flex items-center justify-between pt-1 border-t border-border">
                        <span className="text-muted-foreground text-xs">Last contacted</span>
                        <span className="text-purple-400 text-xs">{format(new Date(selectedApp.contacted_at), "MMM d, yyyy HH:mm")} via {selectedApp.last_contact_method || "—"}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <a href={`mailto:${selectedApp.email}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleMarkContacted("email")}>
                        <Mail className="w-3.5 h-3.5 mr-1.5" /> Email
                      </Button>
                    </a>
                    {(selectedApp.whatsapp_number || selectedApp.phone) && (() => {
                      const num = (selectedApp.whatsapp_number || selectedApp.phone).replace(/[^0-9+]/g, "");
                      const msg = encodeURIComponent(`Hi ${selectedApp.applicant_name}, thank you for your FLESHLAB application. We would like to continue your review.`);
                      return (
                        <a href={`https://wa.me/${num}?text=${msg}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="w-full text-xs border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/10" onClick={() => handleMarkContacted("whatsapp")}>
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 mr-1.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            WhatsApp
                          </Button>
                        </a>
                      );
                    })()}
                    {(selectedApp.phone || selectedApp.whatsapp_number) && (
                      <a href={`tel:${selectedApp.phone || selectedApp.whatsapp_number}`}>
                        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleMarkContacted("phone")}>
                          <PhoneCall className="w-3.5 h-3.5 mr-1.5" /> Call
                        </Button>
                      </a>
                    )}
                    <Button variant="outline" size="sm" className="w-full text-xs border-purple-600/40 text-purple-400 hover:bg-purple-600/10" onClick={() => handleMarkContacted("manual")}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Mark Contacted
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Log Contact Attempt</Label>
                    <Textarea value={contactMsg} onChange={e => setContactMsg(e.target.value)} placeholder="e.g. Emailed 2026-06-04 — asked to upload missing videos. Awaiting reply." className="min-h-[80px]" />
                    <Button variant="outline" size="sm" onClick={handleLogContact} disabled={!contactMsg.trim()} className="mt-2">
                      <Send className="w-3.5 h-3.5 mr-1" /> Log Contact
                    </Button>
                  </div>
                  {selectedApp.contact_log && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Contact History</Label>
                      <div className="bg-secondary rounded-lg p-3 text-xs text-foreground whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                        {selectedApp.contact_log}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Status actions (always visible) ──────────────────── */}
              <div className="border-t border-border pt-4 space-y-3">
                <Label className="text-xs text-muted-foreground block">Update Status</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm"
                    onClick={() => handleStatusUpdate(selectedApp.id, "reviewing")}
                    disabled={selectedApp.status === "reviewing" || (!selectedApp.id_document_front_r2_key && !selectedApp.id_document_r2_key)}>
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Start Review
                  </Button>
                  <Button variant="outline" size="sm"
                    onClick={handleApprove}
                    disabled={selectedApp.status === "approved"}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Approve
                  </Button>
                  <Button variant="outline" size="sm"
                    onClick={() => handleStatusUpdate(selectedApp.id, "rejected")}
                    disabled={selectedApp.status === "rejected"}>
                    <XCircle className="w-3.5 h-3.5 mr-1 text-red-400" /> Reject
                  </Button>
                </div>
                {!selectedApp.id_document_front_r2_key && !selectedApp.id_document_r2_key && !["reviewing","approved","rejected"].includes(selectedApp.status) && (
                  <p className="text-orange-400 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> ID front required before moving to Review.
                  </p>
                )}
                {/* Contract creation */}
                <div className="border-t border-border pt-4 mt-4">
                  <Label className="text-xs text-muted-foreground block mb-2">Contract</Label>
                  
                  {/* DEBUG: Contract Readiness Panel */}
                  <div className="mb-3 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-xs space-y-2">
                    <div className="font-semibold text-blue-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Contract Readiness Debug
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className={selectedApp.status === 'approved' ? 'text-green-400' : 'text-orange-400'}>
                        Status: {selectedApp.status}
                      </div>
                      <div className={selectedApp.admin_notes?.includes('Performer created:') ? 'text-green-400' : 'text-orange-400'}>
                        Performer: {selectedApp.admin_notes?.includes('Performer created:') ? '✓ Linked' : '✗ Missing'}
                      </div>
                      <div className={selectedApp.legal_name ? 'text-green-400' : 'text-orange-400'}>
                        Legal Name: {selectedApp.legal_name || '✗ MISSING'}
                      </div>
                      <div className={selectedApp.date_of_birth ? 'text-green-400' : 'text-orange-400'}>
                        DOB: {selectedApp.date_of_birth || '✗ MISSING'}
                      </div>
                      <div className={selectedApp.address ? 'text-green-400' : 'text-orange-400'}>
                        Full Address: {selectedApp.address || '✗ MISSING'}
                      </div>
                      <div className={selectedApp.country ? 'text-green-400' : 'text-orange-400'}>
                        Country: {selectedApp.country || '✗ MISSING'}
                      </div>
                      <div className={selectedApp.email ? 'text-green-400' : 'text-orange-400'}>
                        Email: {selectedApp.email || '✗ MISSING'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Edit Contract Data Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenEditContractData}
                    className="w-full mb-3"
                  >
                    <FileText className="w-4 h-4 mr-2" /> Edit Contract Data
                  </Button>
                  
                  {contractData ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/10 text-green-500">Contract Created</Badge>
                        <span className="text-muted-foreground">ID: {contractData.id?.substr(0, 8)}...</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copySigningLink}>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSendForSignature}>
                          <Send className="w-3.5 h-3.5 mr-1" /> Send
                        </Button>
                        <a href={contractData.signing_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                          </Button>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Check missing fields */}
                      {(() => {
                        const hasPerformer = selectedApp.admin_notes?.includes('Performer created:');
                        
                        // ALL applications require these fields for final contract - no shortcuts
                        const missingFields = [
                          !hasPerformer && 'Performer profile (create first)',
                          !selectedApp.legal_name && 'Legal name',
                          !selectedApp.date_of_birth && 'Date of Birth',
                          !selectedApp.address && 'Full Residential Address',
                          !selectedApp.country && 'Country',
                          !selectedApp.email && 'Email',
                        ].filter(Boolean);
                        
                        const canCreate = missingFields.length === 0;
                        
                        return (
                          <>
                            {missingFields.length > 0 ? (
                              <div className="space-y-3">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs space-y-1">
                                  <div className="text-red-400 font-semibold flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Missing before final contract ({missingFields.length}):
                                  </div>
                                  <ul className="list-disc list-inside text-red-300 ml-1 space-y-0.5">
                                    {missingFields.map(field => (
                                      <li key={field}>{field}</li>
                                    ))}
                                  </ul>
                                  <p className="text-red-300 text-xs mt-2 pl-4">
                                    {selectedApp.status === 'approved' 
                                      ? "Approved, but contract data is incomplete. Click 'Complete Contract Data' to add the missing fields and enable contract generation."
                                      : "Click 'Complete Contract Data' to fill in missing information before approval."}
                                  </p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={handleOpenEditContractData} 
                                  className="w-full"
                                >
                                  <FileText className="w-4 h-4 mr-2" /> Complete Contract Data
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleOpenContractDialog} 
                                className="w-full"
                                disabled={false}
                              >
                                <FileText className="w-4 h-4 mr-2" /> Create Contract
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>

                {selectedApp.status === "approved" && !selectedApp.admin_notes?.includes('Performer created:') && (
                  <Button className="w-full mt-3" onClick={() => setIsCreatePerformerOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> Create Performer Profile
                  </Button>
                )}
                {selectedApp.admin_notes?.includes('Performer created:') && (() => {
                  // Check ALL required contract fields
                  const hasLegalName = !!selectedApp.legal_name;
                  const hasDOB = !!selectedApp.date_of_birth;
                  const hasFullAddress = !!selectedApp.address; // Require full address, not just city
                  const hasEmail = !!selectedApp.email;
                  const hasCountry = !!selectedApp.country;
                  
                  const missingContractFields = [];
                  if (!hasLegalName) missingContractFields.push('Legal name');
                  if (!hasDOB) missingContractFields.push('Date of Birth');
                  if (!hasFullAddress) missingContractFields.push('Full Residential Address');
                  if (!hasEmail) missingContractFields.push('Email');
                  if (!hasCountry) missingContractFields.push('Country');
                  
                  const isContractReady = missingContractFields.length === 0;
                  
                  return (
                    <div className="mt-3 space-y-2">
                      {isContractReady ? (
                        <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Ready for final contract</span>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-400 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
                          <span>
                            {selectedApp.status === 'approved' 
                              ? 'Approved, but contract data is incomplete. Click "Complete Contract Data" to add missing fields and enable contract generation.'
                              : 'Contract data incomplete — complete data before approval'}
                            ({missingContractFields.length} field(s) missing)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create performer confirm */}
      {selectedApp && (
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

      {/* Contract created dialog */}
      {selectedApp && (
        <Dialog open={isCreateContractOpen} onOpenChange={setIsCreateContractOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Contract Created
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Contract ID</p>
                  <p className="font-mono text-xs">{contractData?.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Applicant</p>
                  <p className="font-medium">{selectedApp.applicant_name}</p>
                </div>
                {contractData?.title && (
                  <div>
                    <p className="text-muted-foreground text-xs">Contract Type</p>
                    <p className="font-medium">{contractData.title}</p>
                  </div>
                )}
              </div>

            <div className="space-y-2">
              <Label className="text-xs">Signing Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={contractData?.signing_url || ""} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="sm" onClick={copySigningLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-400">
              <p className="font-semibold mb-1">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Copy the signing link above</li>
                <li>Send it to the applicant via email or WhatsApp</li>
                <li>Or click "Send for Signature" to record it as sent</li>
                <li>Applicant signs at their convenience</li>
                <li>Contract status updates automatically</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleSendForSignature}>
              <Send className="w-4 h-4 mr-2" /> Send for Signature
            </Button>
            <Button onClick={() => setIsCreateContractOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Request Missing Files dialog */}
      {selectedApp && (
        <Dialog open={isRequestFilesOpen} onOpenChange={setIsRequestFilesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-rose-500" />
              Request Missing Files
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {uploadLink ? (
              <>
                <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-lg p-4 space-y-3">
                  <p className="text-emerald-400 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Upload Link Generated
                  </p>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Secure Upload Link</Label>
                    <div className="flex gap-2">
                      <Input value={uploadLink} readOnly className="font-mono text-xs" />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          copyToClipboard(uploadLink);
                          toast.success("Link copied");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3 text-xs text-blue-400">
                    <p className="font-semibold mb-1">Next Steps:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Copy the link above</li>
                      <li>Send it to the applicant via email or WhatsApp</li>
                      <li>Applicant can upload/replace files without login</li>
                      <li>Link expires in 7 days</li>
                      <li>Application updates automatically after upload</li>
                    </ol>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRequestFilesOpen(false)}>Close</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Select which files the applicant needs to upload. A secure link will be generated that allows them to upload directly without logging in.
                </p>
                <div className="space-y-2">
                  <Label>Missing Files</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "photos", label: "Profile Photos (5)", disabled: (selectedApp?.profile_photo_r2_keys?.length || 0) >= 5 },
                      { value: "body_video", label: "Body Video", disabled: !!selectedApp?.intro_video_r2_key },
                      { value: "hardcore_video", label: "Hardcore Video", disabled: !!selectedApp?.hardcore_video_r2_key },
                      { value: "id_front", label: "ID Front", disabled: !!(selectedApp?.id_document_front_r2_key || selectedApp?.id_document_r2_key) },
                      { value: "id_back", label: "ID Back", disabled: !!selectedApp?.id_document_back_r2_key },
                      { value: "selfie_with_id", label: "Selfie with ID", disabled: !!selectedApp?.selfie_with_id_r2_key },
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          opt.disabled
                            ? "opacity-40 cursor-not-allowed border-border"
                            : selectedMissingFiles.includes(opt.value)
                            ? "border-rose-600/60 bg-rose-600/10"
                            : "border-white/10 hover:border-white/25"
                        }`}
                        onClick={() => {
                          if (!opt.disabled) {
                            setSelectedMissingFiles(prev => 
                              prev.includes(opt.value) 
                                ? prev.filter(f => f !== opt.value)
                                : [...prev, opt.value]
                            );
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={selectedMissingFiles.includes(opt.value)} 
                            readOnly 
                          />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRequestFilesOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleRequestMissingFiles} 
                    disabled={selectedMissingFiles.length === 0 || generateUploadLinkMutation.isPending}
                  >
                    {generateUploadLinkMutation.isPending ? "Generating..." : "Generate Link"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Edit Contract Data Dialog */}
      {selectedApp && (
        <Dialog open={isEditingContractData} onOpenChange={setIsEditingContractData}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Contract Data — {selectedApp.applicant_name}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Fill in all required fields for contract generation. Fields marked with * are required.
              </p>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Missing fields checklist */}
              {(() => {
                const missingFields = [];
                if (!contractFormData.legal_name) missingFields.push('Legal name');
                if (!contractFormData.date_of_birth) missingFields.push('Date of Birth');
                if (!contractFormData.address) missingFields.push('Full Residential Address');
                if (!contractFormData.country) missingFields.push('Country');
                if (!contractFormData.email) missingFields.push('Email');
                
                return missingFields.length > 0 ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs">
                    <div className="text-red-400 font-semibold mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Still missing ({missingFields.length}):
                    </div>
                    <ul className="list-disc list-inside text-red-300 space-y-0.5">
                      {missingFields.map(f => <li key={f}>{f}</li>)}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    All required fields complete!
                  </div>
                );
              })()}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Legal Name *</Label>
                  <Input
                    value={contractFormData.legal_name}
                    onChange={(e) => setContractFormData({...contractFormData, legal_name: e.target.value})}
                    placeholder="e.g. Gi-gi Ping"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Stage Name *</Label>
                  <Input
                    value={contractFormData.stage_name}
                    onChange={(e) => setContractFormData({...contractFormData, stage_name: e.target.value})}
                    placeholder="e.g. Little Fairy"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date of Birth *</Label>
                  <Input
                    type="date"
                    value={contractFormData.date_of_birth}
                    onChange={(e) => setContractFormData({...contractFormData, date_of_birth: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nationality</Label>
                  <Input
                    value={contractFormData.nationality}
                    onChange={(e) => setContractFormData({...contractFormData, nationality: e.target.value})}
                    placeholder="e.g. China"
                    className="text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Full Address *</Label>
                  <Input
                    value={contractFormData.address}
                    onChange={(e) => setContractFormData({...contractFormData, address: e.target.value})}
                    placeholder="Street address, apartment, etc."
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">City</Label>
                  <Input
                    value={contractFormData.city}
                    onChange={(e) => setContractFormData({...contractFormData, city: e.target.value})}
                    placeholder="e.g. Gigi City"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Country</Label>
                  <Input
                    value={contractFormData.country}
                    onChange={(e) => setContractFormData({...contractFormData, country: e.target.value})}
                    placeholder="e.g. China"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Email *</Label>
                  <Input
                    type="email"
                    value={contractFormData.email}
                    onChange={(e) => setContractFormData({...contractFormData, email: e.target.value})}
                    placeholder="Email address"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone / Messaging</Label>
                  <Input
                    value={contractFormData.phone}
                    onChange={(e) => setContractFormData({...contractFormData, phone: e.target.value})}
                    placeholder="Phone or WhatsApp number"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingContractData(false)}>Cancel</Button>
              <Button 
                onClick={() => handleSaveContractDataAndApprove(selectedApp.status !== 'approved')}
                disabled={!contractFormData.legal_name || !contractFormData.date_of_birth || !contractFormData.email || !contractFormData.address || !contractFormData.country}
              >
                <CheckCircle className="w-4 h-4 mr-2" /> 
                {selectedApp.status === 'approved' ? 'Save Contract Data' : 'Save & Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Template selection dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Contract from Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Template selection */}
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title} {t.version ? `v${t.version}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates.find(t => t.id === selectedTemplateId)?.description && (
                <p className="text-xs text-muted-foreground">
                  {templates.find(t => t.id === selectedTemplateId).description}
                </p>
              )}
            </div>

            {/* Variables editor */}
            <div className="space-y-3">
              <Label>Contract Variables</Label>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Legal Name *</Label>
                  <Input
                    value={contractVariables.legal_name || ''}
                    onChange={(e) => setContractVariables({...contractVariables, legal_name: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Stage Name *</Label>
                  <Input
                    value={contractVariables.stage_name || ''}
                    onChange={(e) => setContractVariables({...contractVariables, stage_name: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date of Birth</Label>
                  <Input
                    value={contractVariables.date_of_birth || ''}
                    onChange={(e) => setContractVariables({...contractVariables, date_of_birth: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Email *</Label>
                  <Input
                    type="email"
                    value={contractVariables.email || ''}
                    onChange={(e) => setContractVariables({...contractVariables, email: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Input
                    value={contractVariables.address || ''}
                    onChange={(e) => setContractVariables({...contractVariables, address: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone/Messenger</Label>
                  <Input
                    value={contractVariables.phone_or_messenger || ''}
                    onChange={(e) => setContractVariables({...contractVariables, phone_or_messenger: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">ID Number</Label>
                  <Input
                    value={contractVariables.id_number || ''}
                    onChange={(e) => setContractVariables({...contractVariables, id_number: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Contract Model</Label>
                  <Select
                    value={contractVariables.contract_model || 'full_management'}
                    onValueChange={(v) => setContractVariables({...contractVariables, contract_model: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_management">Full Management</SelectItem>
                      <SelectItem value="distribution_only">Distribution Only</SelectItem>
                      <SelectItem value="single_scene">Single Scene</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Signing Date</Label>
                  <Input
                    type="date"
                    value={contractVariables.signing_date || ''}
                    onChange={(e) => setContractVariables({...contractVariables, signing_date: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Studio Email</Label>
                  <Input
                    type="email"
                    value={contractVariables.studio_email || ''}
                    onChange={(e) => setContractVariables({...contractVariables, studio_email: e.target.value})}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Preview note */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-400">
              <p className="font-semibold mb-1">Preview:</p>
              <p>After creating the contract, you will be able to preview the rendered HTML and send the signing link to the applicant.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              handleCreateContract(selectedTemplateId, contractVariables);
              setIsTemplateDialogOpen(false);
            }}>
              <FileText className="w-4 h-4 mr-2" /> Create Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}