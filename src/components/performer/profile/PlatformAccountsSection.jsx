import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function PlatformAccountsSection({ formData, onFieldChange }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Platform Accounts</h3>
        <Badge variant="outline" className="text-xs">Audit-Logged</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Changes to platform accounts are audit-logged for compliance.
      </p>

      <div className="space-y-2">
        <Label htmlFor="onlyfans_url">OnlyFans URL</Label>
        <Input
          id="onlyfans_url"
          value={formData.onlyfans_url}
          onChange={(e) => onFieldChange("onlyfans_url", e.target.value)}
          placeholder="https://onlyfans.com/..."
          className="font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="twitter_url">Twitter/X URL</Label>
        <Input
          id="twitter_url"
          value={formData.twitter_url}
          onChange={(e) => onFieldChange("twitter_url", e.target.value)}
          placeholder="https://twitter.com/..."
          className="font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagram_url">Instagram URL</Label>
        <Input
          id="instagram_url"
          value={formData.instagram_url}
          onChange={(e) => onFieldChange("instagram_url", e.target.value)}
          placeholder="https://instagram.com/..."
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}