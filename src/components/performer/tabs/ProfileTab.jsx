import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ProfileTab({ performer }) {
  const queryClient = useQueryClient();
  
  // Track original values to detect changes
  const [originalValues] = useState({
    onlyfans_url: performer.onlyfans_url || "",
    twitter_url: performer.twitter_url || "",
    instagram_url: performer.instagram_url || "",
  });

  const [formData, setFormData] = useState({
    display_name: performer.display_name || "",
    slug: performer.slug || "",
    bio: performer.bio || "",
    nationality: performer.nationality || "",
    date_of_birth: performer.date_of_birth || "",
    status: performer.status || "active",
    verified: performer.verified || false,
    featured: performer.featured || false,
    profile_image_url: performer.profile_image_url || "",
    cover_image_url: performer.cover_image_url || "",
    meta_title: performer.meta_title || "",
    meta_description: performer.meta_description || "",
    onlyfans_url: performer.onlyfans_url || "",
    twitter_url: performer.twitter_url || "",
    instagram_url: performer.instagram_url || "",
    internal_notes: performer.internal_notes || "",
    production_preferences: performer.production_preferences || "",
    availability_notes: performer.availability_notes || "",
  });

  // Mutation for basic profile fields (non-audited)
  const updateBasicProfile = useMutation({
    mutationFn: async (data) => {
      const res = await base44.entities.Performer.update(performer.id, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
      toast.success("Profile saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Mutation for platform accounts (audited via performerAdminService)
  const updatePlatformAccounts = useMutation({
    mutationFn: async (platformData) => {
      const res = await base44.functions.invoke("performerAdminService", {
        action: "update_platform_accounts",
        performer_id: performer.id,
        ...platformData,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
      toast.success("Platform accounts updated (audit-logged)");
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleSave = () => {
    // Detect platform account changes
    const platformChanges = {};
    let hasPlatformChanges = false;

    if (formData.onlyfans_url !== originalValues.onlyfans_url) {
      platformChanges.onlyfans_url = formData.onlyfans_url;
      hasPlatformChanges = true;
    }
    if (formData.twitter_url !== originalValues.twitter_url) {
      platformChanges.twitter_url = formData.twitter_url;
      hasPlatformChanges = true;
    }
    if (formData.instagram_url !== originalValues.instagram_url) {
      platformChanges.instagram_url = formData.instagram_url;
      hasPlatformChanges = true;
    }

    // Separate basic fields from platform accounts
    const basicFields = {
      display_name: formData.display_name,
      slug: formData.slug,
      bio: formData.bio,
      nationality: formData.nationality,
      date_of_birth: formData.date_of_birth,
      status: formData.status,
      verified: formData.verified,
      featured: formData.featured,
      profile_image_url: formData.profile_image_url,
      cover_image_url: formData.cover_image_url,
      meta_title: formData.meta_title,
      meta_description: formData.meta_description,
      internal_notes: formData.internal_notes,
      production_preferences: formData.production_preferences,
      availability_notes: formData.availability_notes,
    };

    // Save based on what changed
    if (hasPlatformChanges && Object.values(basicFields).some((v, i) => v !== Object.values({
      display_name: performer.display_name || "",
      slug: performer.slug || "",
      bio: performer.bio || "",
      nationality: performer.nationality || "",
      date_of_birth: performer.date_of_birth || "",
      status: performer.status || "active",
      verified: performer.verified || false,
      featured: performer.featured || false,
      profile_image_url: performer.profile_image_url || "",
      cover_image_url: performer.cover_image_url || "",
      meta_title: performer.meta_title || "",
      meta_description: performer.meta_description || "",
      internal_notes: performer.internal_notes || "",
      production_preferences: performer.production_preferences || "",
      availability_notes: performer.availability_notes || "",
    })[i])) {
      // Both basic and platform changes - save platform first, then basic
      updatePlatformAccounts.mutate(platformChanges, {
        onSuccess: () => {
          updateBasicProfile.mutate(basicFields);
        },
      });
    } else if (hasPlatformChanges) {
      // Only platform changes
      updatePlatformAccounts.mutate(platformChanges);
    } else if (Object.values(basicFields).some((v, i) => v !== Object.values({
      display_name: performer.display_name || "",
      slug: performer.slug || "",
      bio: performer.bio || "",
      nationality: performer.nationality || "",
      date_of_birth: performer.date_of_birth || "",
      status: performer.status || "active",
      verified: performer.verified || false,
      featured: performer.featured || false,
      profile_image_url: performer.profile_image_url || "",
      cover_image_url: performer.cover_image_url || "",
      meta_title: performer.meta_title || "",
      meta_description: performer.meta_description || "",
      internal_notes: performer.internal_notes || "",
      production_preferences: performer.production_preferences || "",
      availability_notes: performer.availability_notes || "",
    })[i])) {
      // Only basic changes
      updateBasicProfile.mutate(basicFields);
    } else {
      toast.info("No changes detected");
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name *</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => handleFieldChange("display_name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleFieldChange("slug", e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={formData.nationality}
              onChange={(e) => handleFieldChange("nationality", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleFieldChange("date_of_birth", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleFieldChange("bio", e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.verified}
              onChange={(e) => handleFieldChange("verified", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">Verified</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => handleFieldChange("featured", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground">Featured</span>
          </label>

          <select
            value={formData.status}
            onChange={(e) => handleFieldChange("status", e.target.value)}
            className="text-sm border border-input bg-transparent px-3 py-1 rounded-md"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Images */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Images</h3>

        <div className="space-y-2">
          <Label htmlFor="profile_image_url">Profile Image URL</Label>
          <Input
            id="profile_image_url"
            value={formData.profile_image_url}
            onChange={(e) => handleFieldChange("profile_image_url", e.target.value)}
            placeholder="https://..."
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover_image_url">Cover Image URL</Label>
          <Input
            id="cover_image_url"
            value={formData.cover_image_url}
            onChange={(e) => handleFieldChange("cover_image_url", e.target.value)}
            placeholder="https://..."
            className="font-mono text-xs"
          />
        </div>
      </div>

      {/* Platform Accounts - AUDITED */}
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
            onChange={(e) => handleFieldChange("onlyfans_url", e.target.value)}
            placeholder="https://onlyfans.com/..."
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter_url">Twitter/X URL</Label>
          <Input
            id="twitter_url"
            value={formData.twitter_url}
            onChange={(e) => handleFieldChange("twitter_url", e.target.value)}
            placeholder="https://twitter.com/..."
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram_url">Instagram URL</Label>
          <Input
            id="instagram_url"
            value={formData.instagram_url}
            onChange={(e) => handleFieldChange("instagram_url", e.target.value)}
            placeholder="https://instagram.com/..."
            className="font-mono text-xs"
          />
        </div>
      </div>

      {/* SEO */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">SEO</h3>

        <div className="space-y-2">
          <Label htmlFor="meta_title">Meta Title</Label>
          <Input
            id="meta_title"
            value={formData.meta_title}
            onChange={(e) => handleFieldChange("meta_title", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_description">Meta Description</Label>
          <Textarea
            id="meta_description"
            value={formData.meta_description}
            onChange={(e) => handleFieldChange("meta_description", e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Internal Notes - Admin Only */}
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
          onChange={(e) => handleFieldChange("internal_notes", e.target.value)}
          rows={6}
          placeholder="Add internal admin notes about this performer..."
        />
      </div>

      {/* Additional Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Production Preferences</h3>
          <Textarea
            value={formData.production_preferences}
            onChange={(e) => handleFieldChange("production_preferences", e.target.value)}
            rows={4}
            placeholder="Notes about performer's production preferences..."
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Availability Notes</h3>
          <Textarea
            value={formData.availability_notes}
            onChange={(e) => handleFieldChange("availability_notes", e.target.value)}
            rows={4}
            placeholder="Notes about performer's availability..."
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3 pb-8">
        <Button
          onClick={handleSave}
          disabled={updateBasicProfile.isPending || updatePlatformAccounts.isPending}
          className="gap-2"
        >
          {(updateBasicProfile.isPending || updatePlatformAccounts.isPending) ? "Saving..." : "Save Profile"}
        </Button>
        {(updateBasicProfile.isPending || updatePlatformAccounts.isPending) && (
          <p className="text-xs text-muted-foreground">Saving changes...</p>
        )}
      </div>
    </div>
  );
}