import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { MessageSquare, Search, Filter, Eye, Save, X, AlertCircle, CheckCircle2, Clock, Mail } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "general", label: "General Inquiry" },
  { value: "profile", label: "Profile Issue" },
  { value: "videos", label: "Video Content" },
  { value: "compliance", label: "Compliance / Documents" },
  { value: "earnings_question", label: "Earnings Question" },
  { value: "fanclub", label: "Fanclub" },
  { value: "technical_issue", label: "Technical Issue" },
  { value: "safety_privacy", label: "Safety / Privacy" },
  { value: "other", label: "Other" }
];

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "waiting_for_performer", label: "Waiting for Performer" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" }
];

const PRIORITIES = [
  { value: "all", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-blue-500/10 text-blue-500" },
  in_review: { label: "In Review", color: "bg-yellow-500/10 text-yellow-500" },
  waiting_for_performer: { label: "Waiting", color: "bg-orange-500/10 text-orange-500" },
  resolved: { label: "Resolved", color: "bg-green-500/10 text-green-500" },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground" }
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", color: "bg-blue-500/10 text-blue-500" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-500" },
  urgent: { label: "Urgent", color: "bg-destructive/10 text-destructive" }
};

export default function PerformerSupport() {
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    priority: "all"
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editData, setEditData] = useState({
    status: "",
    priority: "",
    admin_note: "",
    performer_visible_response: ""
  });

  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-support-requests', filters],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerSupportService", {
        action: "admin_list_requests",
        ...filters
      });
      return res.data.requests || [];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke("performerSupportService", {
        action: "admin_update_request",
        ...data
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-requests'] });
      toast.success("Request updated successfully");
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update request");
    }
  });

  const handleOpenDialog = (request) => {
    setSelectedRequest(request);
    setEditData({
      status: request.status,
      priority: request.priority,
      admin_note: request.admin_note || "",
      performer_visible_response: request.performer_visible_response || ""
    });
  };

  const handleSave = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      request_id: selectedRequest.id,
      ...editData
    });
  };

  const filteredRequests = requests?.filter(req => {
    if (filters.status !== "all" && req.status !== filters.status) return false;
    if (filters.category !== "all" && req.category !== filters.category) return false;
    if (filters.priority !== "all" && req.priority !== filters.priority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performer Support Requests</h1>
          <p className="text-muted-foreground mt-1">Manage and respond to performer support tickets</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ status: "all", category: "all", priority: "all" })}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support Requests
            {requests && <Badge variant="outline" className="ml-2">{requests.length} total</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading support requests...</p>
            </div>
          ) : !filteredRequests || filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No support requests found</p>
              <p className="text-sm mt-1">
                Adjust filters or wait for new requests
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Performer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{request.performer_name || "Unknown"}</p>
                        {request.user_email && (
                          <p className="text-xs text-muted-foreground">{request.user_email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{request.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {CATEGORIES.find(c => c.value === request.category)?.label || request.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_CONFIG[request.status]?.color}>
                        {STATUS_CONFIG[request.status]?.label || request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_CONFIG[request.priority]?.color}>
                        {PRIORITY_CONFIG[request.priority]?.label || request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(request)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <MessageSquare className="h-5 w-5" />
                              Support Request Details
                            </DialogTitle>
                            <DialogDescription>
                              {request.subject}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedRequest && (
                            <div className="space-y-6">
                              {/* Request Info */}
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label className="text-muted-foreground">Performer</Label>
                                  <p className="font-medium">{selectedRequest.performer_name || "Unknown"}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">User Email</Label>
                                  <p className="font-medium">{selectedRequest.user_email || "N/A"}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Category</Label>
                                  <Badge variant="outline">
                                    {CATEGORIES.find(c => c.value === selectedRequest.category)?.label}
                                  </Badge>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Created</Label>
                                  <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
                                </div>
                              </div>

                              {/* Message */}
                              <div>
                                <Label className="text-muted-foreground">Performer Message</Label>
                                <div className="mt-2 p-4 bg-muted/50 rounded-md text-sm">
                                  {selectedRequest.message}
                                </div>
                              </div>

                              {/* Admin Response */}
                              {selectedRequest.performer_visible_response && (
                                <div>
                                  <Label className="text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Response to Performer
                                  </Label>
                                  <div className="mt-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md text-sm">
                                    {selectedRequest.performer_visible_response}
                                  </div>
                                </div>
                              )}

                              {/* Admin Note */}
                              {selectedRequest.admin_note && (
                                <Alert>
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Admin Note (Internal)</AlertTitle>
                                  <AlertDescription className="text-sm">
                                    {selectedRequest.admin_note}
                                  </AlertDescription>
                                </Alert>
                              )}

                              {/* Edit Form */}
                              <div className="border-t pt-4 space-y-4">
                                <h3 className="font-semibold">Update Request</h3>
                                
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Select
                                      value={editData.status}
                                      onValueChange={(value) => setEditData({ ...editData, status: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STATUSES.filter(s => s.value !== "all").map((s) => (
                                          <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="edit-priority">Priority</Label>
                                    <Select
                                      value={editData.priority}
                                      onValueChange={(value) => setEditData({ ...editData, priority: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {PRIORITIES.filter(p => p.value !== "all").map((p) => (
                                          <SelectItem key={p.value} value={p.value}>
                                            {p.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-admin-note">Admin Note (Internal)</Label>
                                  <Textarea
                                    id="edit-admin-note"
                                    value={editData.admin_note}
                                    onChange={(e) => setEditData({ ...editData, admin_note: e.target.value })}
                                    placeholder="Internal notes - not visible to performer"
                                    className="min-h-[80px]"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-response">Response to Performer</Label>
                                  <Textarea
                                    id="edit-response"
                                    value={editData.performer_visible_response}
                                    onChange={(e) => setEditData({ ...editData, performer_visible_response: e.target.value })}
                                    placeholder="This will be visible to the performer"
                                    className="min-h-[80px]"
                                  />
                                </div>
                              </div>

                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                                  {updateMutation.isPending ? (
                                    <>Saving...</>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save Changes
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}