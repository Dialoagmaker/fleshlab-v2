import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SeoSection({ formData, onFieldChange }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">SEO</h3>

      <div className="space-y-2">
        <Label htmlFor="meta_title">Meta Title</Label>
        <Input
          id="meta_title"
          value={formData.meta_title}
          onChange={(e) => onFieldChange("meta_title", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meta_description">Meta Description</Label>
        <Textarea
          id="meta_description"
          value={formData.meta_description}
          onChange={(e) => onFieldChange("meta_description", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}