import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, Link as LinkIcon, UserX } from "lucide-react";
import BasicInfoSection from "../profile/BasicInfoSection";
import ProfileImagesSection from "../profile/ProfileImagesSection";
import PlatformAccountsSection from "../profile/PlatformAccountsSection";
import SeoSection from "../profile/SeoSection";
import InternalNotesSection from "../profile/InternalNotesSection";
import LinkUserModal from "../profile/LinkUserModal";

export default function ProfileTab({ performer }) {
  const queryClient = useQueryClient();
  const [showLinkModal, setShowLinkModal] = useState(false);
  
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

    const originalBasicFields = {
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
    };

    const hasBasicChanges = Object.values(basicFields).some((v, i) => v !== Object.values(originalBasicFields)[i]);

    // Save based on what changed
    if (hasPlatformChanges && hasBasicChanges) {
      // Both basic and platform changes - save platform first, then basic
      updatePlatformAccounts.mutate(platformChanges, {
        onSuccess: () => {
          updateBasicProfile.mutate(basicFields);
        },
      });
    } else if (hasPlatformChanges) {
      // Only platform changes
      updatePlatformAccounts.mutate(platformChanges);
    } else if (hasBasicChanges) {
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
      {/* User Linking Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Linked User Account</h3>
              <p className="text-xs text-muted-foreground">
                {performer.user_id 
                  ? "This performer is linked to a user account for dashboard access"
                  : "No user linked - performer cannot access dashboard"}
              </p>
            </div>
          </div>
          <Button
            variant={performer.user_id ? "outline" : "default"}
            size="sm"
            onClick={() => setShowLinkModal(true)}
            className="gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            {performer.user_id ? "Change / Unlink" : "Link User"}
          </Button>
        </div>
        
        {performer.user_id && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs font-mono text-foreground">User ID: {performer.user_id}</p>
          </div>
        )}
        
        {!performer.user_id && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-xs text-yellow-200">
              ⚠️ This performer profile is not linked to any user account. 
              Link a user to enable dashboard access.
            </p>
          </div>
        )}
      </div>

      <BasicInfoSection formData={formData} onFieldChange={handleFieldChange} />
      <ProfileImagesSection formData={formData} onFieldChange={handleFieldChange} />
      <PlatformAccountsSection formData={formData} onFieldChange={handleFieldChange} />
      <SeoSection formData={formData} onFieldChange={handleFieldChange} />
      <InternalNotesSection formData={formData} onFieldChange={handleFieldChange} />

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

      {/* Link User Modal */}
      {showLinkModal && (
        <LinkUserModal
          performerId={performer.id}
          currentUserId={performer.user_id}
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["performer", performer.id] });
          }}
        />
      )}
    </div>
  );
}