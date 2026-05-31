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
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  MessageSquare, 
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Globe,
  Link as LinkIcon,
  FileText,
  Video,
  Image as ImageIcon
} from "lucide-react";
import { format } from "date-fns";

export default function Applications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreatePerformerOpen, setIsCreatePerformerOpen] = useState(false);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => base44.entities.GuestProductionApplication.list(),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.GuestProductionApplication.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success("Application updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStatusUpdate = (applicationId, newStatus) => {
    updateMutation.mutate({
      id: applicationId,
      data: { status: newStatus }
    });
    setIsDetailOpen(false);
  };

  const handleAddNotes = () => {
    if (!selectedApplication || !adminNotes.trim()) return;
    
    const currentNotes = selectedApplication.admin_notes || "";
    const timestamp = new Date().toISOString();
    const newNotes = `${currentNotes}\n\n[${timestamp}] ${adminNotes}`;
    
    updateMutation.mutate({
      id: selectedApplication.id,
      data: { admin_notes: newNotes }
    });
    setAdminNotes("");
    setIsDetailOpen(false);
  };

  const handleCreatePerformer = async () => {
    if (!selectedApplication) return;
    
    try {
      const slug = selectedApplication.applicant_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const performer = await base44.entities.Performer.create({
        display_name: selectedApplication.applicant_name,
        slug: `${slug}-${Date.now()}`,
        bio: selectedApplication.message || "",
        nationality: selectedApplication.nationality,
        profile_image_url: selectedApplication.id_document_url,
        status: "pending",
        verified: false,
        v1_id: null,
      });

      await base44.entities.GuestProductionApplication.update(selectedApplication.id, {
        status: "approved",
        admin_notes: `${selectedApplication.admin_notes || ""}\n\nPerformer created: ${performer.id}`,
      });

      toast.success("Performer created successfully");
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsCreatePerformerOpen(false);
      setIsDetailOpen(false);
      navigate(`/admin/performers/${performer.id}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredApplications = applications?.filter(app => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = searchQuery === "" || 
      app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-600";
      case "reviewing": return "bg-blue-600";
      case "approved": return "bg-green-600";
      case "rejected": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "reviewing": return <MessageSquare className="w-4 h-4" />;
      case "approved": return <CheckCircle className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter(a => a.status === "pending").length || 0,
    reviewing: applications?.filter(a => a.status === "reviewing").length || 0,
    approved: applications?.filter(a => a.status === "approved").length || 0,
    rejected: applications?.filter(a => a.status === "rejected").length || 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Performer Applications</h1>
          <p className="text-muted-foreground">Review and manage new performer applications</p>
        </div>
        <Button onClick={() => navigate("/admin")}>Back to Dashboard</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">New</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-500">{stats.reviewing}</div>
          <div className="text-sm text-muted-foreground">Reviewing</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
          <div className="text-sm text-muted-foreground">Approved</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
          <div className="text-sm text-muted-foreground">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Applicant</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Path</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Submitted</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading applications...
                  </td>
                </tr>
              ) : filteredApplications?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApplications?.map((app) => (
                  <tr key={app.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="p-4">
                      <div className="font-medium text-foreground">{app.applicant_name}</div>
                      {app.nationality && (
                        <div className="text-sm text-muted-foreground">{app.nationality}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-foreground">{app.email}</div>
                      {app.phone && (
                        <div className="text-sm text-muted-foreground">{app.phone}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{app.package_interest || "Not specified"}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {app.submitted_at ? format(new Date(app.submitted_at), "MMM d, yyyy") : "N/A"}
                    </td>
                    <td className="p-4">
                      <Badge className={`${getStatusColor(app.status)} text-white`}>
                        {getStatusIcon(app.status)}
                        <span className="ml-1 capitalize">{app.status}</span>
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(app);
                          setAdminNotes("");
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Dialog */}
      {selectedApplication && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details - {selectedApplication.applicant_name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Stage Name</Label>
                  <div className="text-foreground">{selectedApplication.applicant_name}</div>
                </div>
                <div>
                  <Label>Nationality</Label>
                  <div className="text-foreground">{selectedApplication.nationality || "Not specified"}</div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <Label>Contact Information</Label>
                <div className="flex items-center gap-2 text-foreground">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {selectedApplication.email}
                </div>
                {selectedApplication.phone && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {selectedApplication.phone}
                  </div>
                )}
              </div>

              {/* Message */}
              {selectedApplication.message && (
                <div className="space-y-2">
                  <Label>Message</Label>
                  <div className="bg-secondary rounded-lg p-4 text-foreground whitespace-pre-wrap">
                    {selectedApplication.message}
                  </div>
                </div>
              )}

              {/* Media */}
              {selectedApplication.id_document_url && (
                <div className="space-y-2">
                  <Label>Uploaded Photo</Label>
                  <img
                    src={selectedApplication.id_document_url}
                    alt="Profile"
                    className="w-32 h-32 object-cover rounded border border-border"
                  />
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add review notes..."
                  className="min-h-[100px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddNotes}
                  disabled={!adminNotes.trim()}
                >
                  Add Note
                </Button>
                {selectedApplication.admin_notes && (
                  <div className="bg-secondary rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedApplication.admin_notes}
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div className="space-y-2">
                <Label>Update Status</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedApplication.id, "reviewing")}
                    disabled={selectedApplication.status === "reviewing"}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Mark as Reviewing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedApplication.id, "approved")}
                    disabled={selectedApplication.status === "approved"}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedApplication.id, "rejected")}
                    disabled={selectedApplication.status === "rejected"}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>

              {/* Create Performer */}
              {selectedApplication.status === "approved" && (
                <div className="border-t border-border pt-4">
                  <Button
                    className="w-full"
                    onClick={() => setIsCreatePerformerOpen(true)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Performer Profile
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Performer Dialog */}
      <Dialog open={isCreatePerformerOpen} onOpenChange={setIsCreatePerformerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Performer Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will create a new performer profile with the following details:
            </p>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {selectedApplication?.applicant_name}</div>
              <div><strong>Nationality:</strong> {selectedApplication?.nationality || "Not specified"}</div>
              <div><strong>Status:</strong> Pending</div>
            </div>
            <p className="text-xs text-muted-foreground">
              You can edit all details after creation.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePerformerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePerformer}>
              <UserPlus className="w-4 h-4" />
              Create Performer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}