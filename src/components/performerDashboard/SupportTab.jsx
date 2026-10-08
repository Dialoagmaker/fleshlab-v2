import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { Mail, Phone, MessageSquare, Send, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
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

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-blue-500/10 text-blue-500" },
  in_review: { label: "In Review", color: "bg-yellow-500/10 text-yellow-500" },
  waiting_for_performer: { label: "Waiting for You", color: "bg-orange-500/10 text-orange-500" },
  resolved: { label: "Resolved", color: "bg-green-500/10 text-green-500" },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground" }
};

export default function SupportTab() {
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "general",
    subject: "",
    message: ""
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await base44.functions.invoke("performerSupportService", {
        action: "list_my_requests"
      });
      if (res.data.success) {
        setRequests(res.data.requests || []);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.subject || formData.subject.trim().length < 3) {
      newErrors.subject = "Subject must be at least 3 characters";
    } else if (formData.subject.length > 120) {
      newErrors.subject = "Subject must be less than 120 characters";
    }

    if (!formData.message || formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (formData.message.length > 4000) {
      newErrors.message = "Message must be less than 4000 characters";
    }

    if (!CATEGORIES.find(c => c.value === formData.category)) {
      newErrors.category = "Invalid category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      setSubmitting(true);
      const res = await base44.functions.invoke("performerSupportService", {
        action: "create_request",
        subject: formData.subject.trim(),
        category: formData.category,
        message: formData.message.trim()
      });

      if (res.data.success) {
        toast.success("Support request submitted successfully");
        setFormData({ category: "general", subject: "", message: "" });
        setShowForm(false);
        await loadRequests();
      } else {
        toast.error(res.data.error || "Failed to submit request");
      }
    } catch (error) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Contact Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Support</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              support@fleshlab.com
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Response within 24-48 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Safety / Privacy concerns
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mark as urgent for priority review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Updates</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track your requests below
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time status updates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Request Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Support Requests
            </CardTitle>
            <Button 
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? "outline" : "default"}
            >
              {showForm ? "Cancel" : "New Request"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="space-y-4 mb-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief summary of your issue"
                    maxLength={120}
                  />
                  {errors.subject && (
                    <p className="text-sm text-destructive">{errors.subject}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.subject.length}/120 characters
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  className="min-h-[150px]"
                  maxLength={4000}
                />
                {errors.message && (
                  <p className="text-sm text-destructive">{errors.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.message.length}/4000 characters
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({ category: "general", subject: "", message: "" });
                    setErrors({});
                    setShowForm(false);
                  }}
                >
                  Clear
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Requests List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading your requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No support requests yet</p>
              <p className="text-sm mt-1">
                Click "New Request" to submit a support ticket
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{request.subject}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {CATEGORIES.find(c => c.value === request.category)?.label || request.category}
                          </Badge>
                          <Badge className={STATUS_CONFIG[request.status]?.color}>
                            {STATUS_CONFIG[request.status]?.label || request.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Created: {new Date(request.created_at).toLocaleDateString()}</p>
                        {request.updated_at && (
                          <p>Updated: {new Date(request.updated_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                        {request.message}
                      </div>
                      
                      {request.performer_visible_response && (
                        <div className="border-t pt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Studio Response</span>
                          </div>
                          <div className="text-sm bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md p-3">
                            {request.performer_visible_response}
                          </div>
                        </div>
                      )}

                      {request.resolved_at && (
                        <div className="text-xs text-muted-foreground border-t pt-2">
                          Resolved: {new Date(request.resolved_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}