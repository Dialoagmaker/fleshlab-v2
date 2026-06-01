import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function InternalNotesSection({ formData, onFieldChange }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Internal Notes</h3>
          <Badge variant="outline" className="text-xs">Admin Only</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          These notes are only visible to admin users and will never appear on public pages.
        </p>
        <Textarea
          value={formData.internal_notes}
          onChange={(e) => onFieldChange("internal_notes", e.target.value)}
          rows={6}
          placeholder="Add internal admin notes about this performer..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Production Preferences</h3>
          <Textarea
            value={formData.production_preferences}
            onChange={(e) => onFieldChange("production_preferences", e.target.value)}
            rows={4}
            placeholder="Notes about performer's production preferences..."
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Availability Notes</h3>
          <Textarea
            value={formData.availability_notes}
            onChange={(e) => onFieldChange("availability_notes", e.target.value)}
            rows={4}
            placeholder="Notes about performer's availability..."
          />
        </div>
      </div>
    </div>
  );
}