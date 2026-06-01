import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfileImagesSection({ formData, onFieldChange }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Images</h3>

      <div className="space-y-2">
        <Label htmlFor="profile_image_url">Profile Image URL</Label>
        <Input
          id="profile_image_url"
          value={formData.profile_image_url}
          onChange={(e) => onFieldChange("profile_image_url", e.target.value)}
          placeholder="https://..."
          className="font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover_image_url">Cover Image URL</Label>
        <Input
          id="cover_image_url"
          value={formData.cover_image_url}
          onChange={(e) => onFieldChange("cover_image_url", e.target.value)}
          placeholder="https://..."
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}