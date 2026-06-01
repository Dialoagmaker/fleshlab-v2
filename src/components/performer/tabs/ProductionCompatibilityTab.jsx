import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PRODUCTION_TYPES = [
  "solo", "duo", "group", "interview", "livecam", 
  "guest_production", "custom_scene", "fetish_theme", 
  "outdoor", "studio", "remote_recording"
];

const SCENE_STYLES = [
  "soft", "energetic", "dominant", "submissive", "playful",
  "romantic", "rougher_style_on_review", "fetish_focused",
  "cinematic", "amateur_style", "studio_style"
];

const AVAILABLE_ROLES = [
  "lead_performer", "supporting_performer", "solo_performer",
  "dominant_role", "submissive_role", "versatile_role",
  "host_role", "guest_role"
];

const CONDITIONAL_THEMES = [
  "bondage", "impact_play", "role_play", "age_play",
  "pet_play", "humiliation", "worship", "sensory_deprivation",
  "restraint", "power_exchange", "custom_fetish"
];

const PRIVACY_OPTIONS = [
  "face_visible", "face_blur_available", "stage_name_only",
  "no_real_name", "no_location_disclosure", "limited_social_crosspost",
  "no_social_crosspost", "studio_only_distribution"
];

const SAFETY_REQUIREMENTS = [
  "consent_form_required", "performer_final_approval_required",
  "studio_supervision_required", "health_safety_review_required",
  "guest_identity_verification_required", "no_unapproved_guests",
  "stop_signal_required", "boundaries_confirmed_before_shoot"
];

export default function ProductionCompatibilityTab({ performerId }) {
  const [formData, setFormData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["performer-compatibility", performerId],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerAdminService", {
        action: "get_performer",
        performer_id: performerId
      });
      return res.data;
    },
    enabled: !!performerId
  });

  useEffect(() => {
    if (data) {
      setFormData({
        production_profile_enabled: data.production_profile_enabled || false,
        available_production_types: data.available_production_types || [],
        preferred_scene_styles: data.preferred_scene_styles || [],
        available_roles: data.available_roles || [],
        conditional_themes: data.conditional_themes || [],
        not_available_boundaries: data.not_available_boundaries || [],
        privacy_options: data.privacy_options || [],
        safety_requirements: data.safety_requirements || [],
        production_notes_public: data.production_notes_public || "",
        production_notes_internal: data.production_notes_internal || "",
        compatibility_review_status: data.compatibility_review_status || "not_reviewed",
        compatibility_reviewed_at: data.compatibility_reviewed_at,
        compatibility_reviewed_by: data.compatibility_reviewed_by,
        last_consent_update_at: data.last_consent_update_at
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (updateData) => {
      const res = await base44.functions.invoke("performerAdminService", {
        action: "update_performer",
        performer_id: performerId,
        data: updateData
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performer-compatibility", performerId] });
      toast.success("Production compatibility profile saved");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    }
  });

  const handleToggle = (field, value) => {
    if (!formData) return;
    
    const currentArray = formData[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setFormData({ ...formData, [field]: newArray });
  };

  const handleFieldChange = (field, value) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const validateForApproval = () => {
    const errors = [];
    
    if (!formData.production_profile_enabled) {
      errors.push("Production profile must be enabled for approval");
    }
    
    if (!formData.available_production_types || formData.available_production_types.length === 0) {
      errors.push("At least one available production type is required for approval");
    }
    
    if (!formData.safety_requirements || formData.safety_requirements.length === 0) {
      errors.push("At least one safety requirement is required for approval");
    }
    
    return errors;
  };

  const handleSave = () => {
    if (!formData) return;

    let updateData = { ...formData };

    // Validate if trying to set approved status
    if (formData.compatibility_review_status === "approved") {
      const errors = validateForApproval();
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast.error("Cannot approve profile - validation failed");
        return;
      }
    }

    // Set review metadata if status is reviewed or approved
    if (["reviewed", "approved"].includes(formData.compatibility_review_status)) {
      updateData.compatibility_reviewed_at = new Date().toISOString();
      updateData.compatibility_reviewed_by = "current_admin"; // Will be replaced by actual user ID in backend
    }

    // Set consent update timestamp if boundaries changed
    if (formData.not_available_boundaries !== data.not_available_boundaries) {
      updateData.last_consent_update_at = new Date().toISOString();
    }

    setValidationErrors([]);
    updateMutation.mutate(updateData);
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusColors = {
    not_reviewed: "bg-muted text-muted-foreground",
    draft: "bg-secondary text-secondary-foreground",
    reviewed: "bg-primary/10 text-primary",
    approved: "bg-green-500/10 text-green-500",
    needs_update: "bg-yellow-500/10 text-yellow-500"
  };

  return (
    <div className="space-y-6">
      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle>Production Compatibility Profile Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="production_profile_enabled"
                checked={formData.production_profile_enabled}
                onCheckedChange={(checked) => handleFieldChange("production_profile_enabled", checked)}
              />
              <Label htmlFor="production_profile_enabled">Production Profile Enabled</Label>
            </div>
            <Badge className={statusColors[formData.compatibility_review_status]}>
              {formData.compatibility_review_status.replace(/_/g, " ").toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Reviewed At:</span>{" "}
              {formData.compatibility_reviewed_at ? new Date(formData.compatibility_reviewed_at).toLocaleDateString() : "Not reviewed"}
            </div>
            <div>
              <span className="text-muted-foreground">Reviewed By:</span>{" "}
              {formData.compatibility_reviewed_by || "Not reviewed"}
            </div>
            <div>
              <span className="text-muted-foreground">Last Consent Update:</span>{" "}
              {formData.last_consent_update_at ? new Date(formData.last_consent_update_at).toLocaleDateString() : "No updates"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="compatibility_review_status">Review Status:</Label>
            <select
              id="compatibility_review_status"
              value={formData.compatibility_review_status}
              onChange={(e) => handleFieldChange("compatibility_review_status", e.target.value)}
              className="border rounded px-3 py-1 text-sm bg-background"
            >
              <option value="not_reviewed">Not Reviewed</option>
              <option value="draft">Draft</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="needs_update">Needs Update</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Available Production Types */}
      <Card>
        <CardHeader>
          <CardTitle>Available Production Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PRODUCTION_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`prod_type_${type}`}
                  checked={formData.available_production_types.includes(type)}
                  onCheckedChange={() => handleToggle("available_production_types", type)}
                />
                <Label htmlFor={`prod_type_${type}`} className="text-sm capitalize">
                  {type.replace(/_/g, " ")}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preferred Scene Styles */}
      <Card>
        <CardHeader>
          <CardTitle>Preferred Scene Styles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SCENE_STYLES.map((style) => (
              <div key={style} className="flex items-center space-x-2">
                <Checkbox
                  id={`style_${style}`}
                  checked={formData.preferred_scene_styles.includes(style)}
                  onCheckedChange={() => handleToggle("preferred_scene_styles", style)}
                />
                <Label htmlFor={`style_${style}`} className="text-sm capitalize">
                  {style.replace(/_/g, " ")}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Available Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AVAILABLE_ROLES.map((role) => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  id={`role_${role}`}
                  checked={formData.available_roles.includes(role)}
                  onCheckedChange={() => handleToggle("available_roles", role)}
                />
                <Label htmlFor={`role_${role}`} className="text-sm capitalize">
                  {role.replace(/_/g, " ")}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conditional Themes */}
      <Card>
        <CardHeader>
          <CardTitle>Conditional / Review Required Themes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            These items are not guaranteed. They require studio review and explicit performer approval.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CONDITIONAL_THEMES.map((theme) => (
              <div key={theme} className="flex items-center space-x-2">
                <Checkbox
                  id={`theme_${theme}`}
                  checked={formData.conditional_themes.includes(theme)}
                  onCheckedChange={() => handleToggle("conditional_themes", theme)}
                />
                <Label htmlFor={`theme_${theme}`} className="text-sm capitalize">
                  {theme.replace(/_/g, " ")}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Not Available / Boundaries */}
      <Card>
        <CardHeader>
          <CardTitle>Not Available / Boundaries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            These are hard boundaries and must block future compatibility matches.
          </p>
          <div className="space-y-2">
            <Label>Add Boundary:</Label>
            <input
              type="text"
              placeholder="Type a boundary and press Enter"
              className="border rounded px-3 py-2 text-sm w-full bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  handleToggle("not_available_boundaries", e.target.value.trim());
                  e.target.value = "";
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.not_available_boundaries.map((boundary, idx) => (
              <Badge key={idx} variant="destructive" className="cursor-pointer" onClick={() => handleToggle("not_available_boundaries", boundary)}>
                {boundary} ×
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Options */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PRIVACY_OPTIONS.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`privacy_${option}`}
                  checked={formData.privacy_options.includes(option)}
                  onCheckedChange={() => handleToggle("privacy_options", option)}
                />
                <Label htmlFor={`privacy_${option}`} className="text-sm capitalize">
                  {option.replace(/_/g, " ")}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safety Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SAFETY_REQUIREMENTS.map((req) => (
              <div key={req} className="flex items-center space-x-2">
                <Checkbox
                  id={`safety_${req}`}
                  checked={formData.safety_requirements.includes(req)}
                  onCheckedChange={() => handleToggle("safety_requirements", req)}
                />
                <Label htmlFor={`safety_${req}`} className="text-sm capitalize">
                  {req.replace(/_/g, " ")}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Production Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="production_notes_public">Production Notes (Public)</Label>
            <textarea
              id="production_notes_public"
              value={formData.production_notes_public}
              onChange={(e) => handleFieldChange("production_notes_public", e.target.value)}
              className="w-full min-h-[100px] border rounded px-3 py-2 text-sm bg-background"
              placeholder="Admin-approved notes that may be shown in performer-facing or production-facing contexts"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="production_notes_internal">Production Notes (Internal - Admin Only)</Label>
            <textarea
              id="production_notes_internal"
              value={formData.production_notes_internal}
              onChange={(e) => handleFieldChange("production_notes_internal", e.target.value)}
              className="w-full min-h-[100px] border rounded px-3 py-2 text-sm bg-background"
              placeholder="Admin-only internal notes - never exposed to performers or public"
            />
            <p className="text-xs text-muted-foreground text-destructive">
              ⚠️ These notes are admin-only and will never be shown to performers
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={updateMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Production Compatibility Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}