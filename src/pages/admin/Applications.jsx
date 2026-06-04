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
import { toast } from "sonner";
import {
  Users, CheckCircle, XCircle, Clock, Eye, MessageSquare, UserPlus,
  Search, Filter, Mail, Phone, FileText, Image as ImageIcon, Video,
  Download, AlertTriangle, ExternalLink, Send, RefreshCw, Lock
} from "lucide-react";
import { format } from "date-fns";

// ── Status helpers ─────────────────────────────────────────────────────────
const STATUS_COLOR = {
  pending:       "bg-yellow-600",
  media_pending: "bg-orange-600",
  reviewing:     "bg-blue-600",
  approved:      "bg-green-600",
  rejected:      "bg-red-600",
};
const STATUS_ICON = {
  pending:       <Clock className="w-3.5 h-3.5" />,
  media_pending: <AlertTriangle className="w-3.5 h-3.5" />,
  reviewing:     <MessageSquare className="w-3.5 h-3.5" />,
  approved:      <CheckCircle className="w-3.5 h-3.5" />,
  rejected:      <XCircle className="w-3.5 h-3.5" />,
};

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
  const [isCreatePerformerOpen, setIsCreatePerformerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

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

  const handleStatusUpdate = (applicationId, newStatus, extra = {}) => {
    const updates = { status: newStatus, ...extra };
    if (newStatus === "reviewing") {
      updates.media_reviewed_at = new Date().toISOString();
    }
    updateMutation.mutate({ id: applicationId, data: updates });
    setSelectedApp(prev => prev ? { ...prev, ...updates } : prev);
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
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  const TABS = ["info", "media", "id", "notes", "contact"];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Performer Applications</h1>
        <p className="text-muted-foreground text-sm">Review applications and uploaded media before progressing applicants.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Media Pending", value: stats.media_pending, color: "text-orange-400" },
          { label: "New", value: stats.pending, color: "text-yellow-400" },
          { label: "Reviewing", value: stats.reviewing, color: "text-blue-400" },
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
                  <td className="p-4 text-xs text-muted-foreground">
                    {app.submitted_at ? format(new Date(app.submitted_at), "MMM d, yyyy HH:mm") : "N/A"}
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
                    <div><Label className="text-xs text-muted-foreground">Nationality</Label><div className="text-foreground text-sm">{selectedApp.nationality || "—"}</div></div>
                    <div><Label className="text-xs text-muted-foreground">City</Label><div className="text-foreground text-sm">{selectedApp.city || "—"}</div></div>
                    <div><Label className="text-xs text-muted-foreground">Email</Label><div className="text-foreground text-sm flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{selectedApp.email}</div></div>
                    <div><Label className="text-xs text-muted-foreground">Phone</Label><div className="text-foreground text-sm flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{selectedApp.phone || "—"}</div></div>
                  </div>
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
                  <SignedMediaItem r2Key={selectedApp.id_document_r2_key} label="Government ID (Passport / ID Card / License)" type="image" />
                  {selectedApp.id_document_url && !selectedApp.id_document_r2_key && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Legacy Uploaded Document</Label>
                      <img src={selectedApp.id_document_url} alt="Legacy ID" className="w-40 h-40 object-cover rounded border border-border mt-1" />
                    </div>
                  )}
                  {!selectedApp.id_document_r2_key && !selectedApp.id_document_url && (
                    <div className="text-red-400 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> No ID document uploaded — applicant must be contacted.
                    </div>
                  )}
                  {selectedApp.id_document_r2_key && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(selectedApp.id, selectedApp.status, { compliance_upload_status: "verified" })}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Mark ID Verified
                      </Button>
                    </div>
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
                  <div className="grid grid-cols-2 gap-3">
                    <a href={`mailto:${selectedApp.email}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full text-sm">
                        <Mail className="w-4 h-4 mr-2" /> Email Applicant
                      </Button>
                    </a>
                    {selectedApp.phone && (
                      <a href={`tel:${selectedApp.phone}`}>
                        <Button variant="outline" className="w-full text-sm">
                          <Phone className="w-4 h-4 mr-2" /> Call / Message
                        </Button>
                      </a>
                    )}
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
                    disabled={selectedApp.status === "reviewing" || !selectedApp.id_document_r2_key}>
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Start Review
                  </Button>
                  <Button variant="outline" size="sm"
                    onClick={() => handleStatusUpdate(selectedApp.id, "approved")}
                    disabled={selectedApp.status === "approved"}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Approve
                  </Button>
                  <Button variant="outline" size="sm"
                    onClick={() => handleStatusUpdate(selectedApp.id, "rejected")}
                    disabled={selectedApp.status === "rejected"}>
                    <XCircle className="w-3.5 h-3.5 mr-1 text-red-400" /> Reject
                  </Button>
                </div>
                {!selectedApp.id_document_r2_key && selectedApp.status !== "reviewing" && (
                  <p className="text-orange-400 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> ID document required before moving to Review.
                  </p>
                )}
                {selectedApp.status === "approved" && (
                  <Button className="w-full" onClick={() => setIsCreatePerformerOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> Create Performer Profile
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create performer confirm */}
      <Dialog open={isCreatePerformerOpen} onOpenChange={setIsCreatePerformerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Performer Profile</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">Creates a pending Performer record from this application.</p>
            <div><strong>Stage Name:</strong> {selectedApp?.applicant_name}</div>
            <div><strong>Nationality:</strong> {selectedApp?.nationality || "—"}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePerformerOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePerformer}><UserPlus className="w-4 h-4 mr-1" /> Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}