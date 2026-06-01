import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const RECORD_TYPES = [
  { value: "id", label: "ID Document" },
  { value: "medical_test", label: "Medical Test" },
  { value: "std_test", label: "STI/HIV Test" },
  { value: "background_check", label: "Background Check" },
  { value: "work_permit", label: "Work Permit" },
  { value: "other", label: "Other" },
];

const RECORD_STATUSES = [
  { value: "valid", label: "Valid" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

export default function AddComplianceRecordModal({ performerId, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    document_type: "id",
    document_url: "",
    issued_at: new Date().toISOString().split("T")[0],
    expires_at: "",
    status: "valid",
    issuing_authority: "",
    notes: "",
  });

  const createRecord = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke("complianceRecordService", {
        action: "create_record",
        performer_id: performerId,
        ...data,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complianceRecords", performerId] });
      toast.success("Compliance record created successfully");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to create record: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!formData.document_type) {
      toast.error("Document type is required");
      return;
    }
    createRecord.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Compliance Record</DialogTitle>
          <DialogDescription>
            Create a new compliance record for this performer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type</Label>
            <Select
              value={formData.document_type}
              onValueChange={(value) => setFormData({ ...formData, document_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECORD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_url">Document URL</Label>
            <Input
              id="document_url"
              placeholder="https://..."
              value={formData.document_url}
              onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              For now, enter a URL manually. File upload coming soon.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issued_at">Issue Date</Label>
            <Input
              id="issued_at"
              type="date"
              value={formData.issued_at}
              onChange={(e) => setFormData({ ...formData, issued_at: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at">Expiry Date</Label>
            <Input
              id="expires_at"
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECORD_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuing_authority">Issuing Authority</Label>
            <Input
              id="issuing_authority"
              placeholder="e.g., DMV, Medical Center"
              value={formData.issuing_authority}
              onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this record..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createRecord.isPending}>
            {createRecord.isPending ? "Creating..." : "Create Record"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}