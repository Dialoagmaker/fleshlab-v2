import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileVideo, FileImage, File, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MySubmissionsTab({ performerId, performerToken }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, [performerId, performerToken]);

  const loadSubmissions = async () => {
    try {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_content_submissions",
        performer_id: performerId,
        performer_token: performerToken
      });
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending_upload: { variant: "secondary", icon: Clock, label: "Pending Upload" },
      uploaded: { variant: "default", icon: CheckCircle2, label: "Uploaded" },
      failed: { variant: "destructive", icon: XCircle, label: "Failed" },
      pending_review: { variant: "default", icon: Clock, label: "Pending Review" },
      approved: { variant: "outline", className: "text-green-600 border-green-600", icon: CheckCircle2, label: "Approved" },
      rejected: { variant: "outline", className: "text-red-600 border-red-600", icon: XCircle, label: "Rejected" },
      needs_changes: { variant: "outline", className: "text-yellow-600 border-yellow-600", icon: AlertCircle, label: "Needs Changes" }
    };
    const cfg = config[status] || config.pending_review;
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant} className={`${cfg.className || ''} gap-1`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </Badge>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'raw_video': return <FileVideo className="w-4 h-4 text-primary" />;
      case 'photos': return <FileImage className="w-4 h-4 text-primary" />;
      default: return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  if (loading) return <div className="text-center py-12"><p className="text-muted-foreground">Loading submissions...</p></div>;

  if (submissions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader><CardTitle>My Submissions</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No submissions yet</p>
            <p className="text-sm mt-2">Upload content from the "Content Upload" tab</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader><CardTitle>My Submissions</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(s.content_type)}
                    <span className="text-sm capitalize">{s.content_type.replace(/_/g, ' ')}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{formatDate(s.created_date)}</TableCell>
                <TableCell>{getStatusBadge(s.review_status || s.upload_status)}</TableCell>
                <TableCell className="text-sm max-w-[300px] truncate">{s.performer_visible_message || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}