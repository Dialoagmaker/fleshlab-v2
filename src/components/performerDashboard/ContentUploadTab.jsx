import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle2, AlertCircle, Loader2, FileVideo, FileImage } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ContentUploadTab({ performerId, performerToken }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    content_type: "raw_video",
    description: "",
    file: null,
    confirmed: false
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.file) {
      setError("Please select a file");
      return;
    }
    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }
    if (!formData.confirmed) {
      setError("Please confirm the content declaration");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get upload URL
      const res = await base44.functions.invoke("createPerformerSubmissionUploadUrl", {
        performer_id: performerId,
        performer_token: performerToken,
        title: formData.title,
        content_type: formData.content_type,
        description: formData.description,
        file_name: formData.file.name,
        file_size_bytes: formData.file.size,
        mime_type: formData.file.type
      });

      if (res.data.error) throw new Error(res.data.error);

      const { upload_url, submission_id } = res.data;

      // Upload to R2
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUploadProgress((e.loaded / e.total) * 100);
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload failed"));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", formData.file.type);
        xhr.send(formData.file);
      });

      // Mark as uploaded
      await base44.functions.invoke("performerDashboardService", {
        action: "update_submission_uploaded",
        performer_id: performerId,
        performer_token: performerToken,
        submission_id
      });

      setUploadSuccess({ submission_id, title: formData.title });
      setFormData({ title: "", content_type: "raw_video", description: "", file: null, confirmed: false });
      toast.success("Upload successful! Awaiting studio review.");

    } catch (err) {
      setError(err.message);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-6 h-6" />
              Upload Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4 text-sm">
              <p><strong>Title:</strong> {uploadSuccess.title}</p>
              <p className="mt-2"><strong>ID:</strong> {uploadSuccess.submission_id}</p>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Studio team will review within 2-5 business days. Track status in "My Submissions".
              </AlertDescription>
            </Alert>
            <Button onClick={() => setUploadSuccess(null)}>Upload Another</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Content for Review
          </CardTitle>
          <CardDescription>Submit raw footage or photos for studio consideration</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Solo Scene Raw"
                  disabled={uploading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Content Type *</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, content_type: v }))}
                  disabled={uploading}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_video">Raw Video</SelectItem>
                    <SelectItem value="photos">Photos</SelectItem>
                    <SelectItem value="behind_the_scenes">Behind the Scenes</SelectItem>
                    <SelectItem value="fanclub_preview">Fanclub Preview</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Notes for Studio</Label>
              <Textarea
                id="desc"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Context, special requests..."
                className="min-h-[80px]"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept="video/mp4,video/quicktime,video/x-m4v,image/jpeg,image/png,image/webp"
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">MP4, MOV, M4V, JPG, PNG, WEBP (max 2GB)</p>
            </div>

            {uploading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="confirm"
                checked={formData.confirmed}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, confirmed: checked }))}
                disabled={uploading}
              />
              <label htmlFor="confirm" className="text-xs text-muted-foreground leading-relaxed">
                I confirm all content features verified 18+ participants and I have the right to submit this to FLESHLAB.
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={uploading || !formData.file}>
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Upload for Review</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}