import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { checkGuestProductionCompatibility, formatCompatibilitySummary } from "./guestProductionCompatibilityUtils";

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

export default function GuestProductionCompatibilityCheck({ performer }) {
  const [request, setRequest] = useState({
    requested_production_types: [],
    requested_scene_styles: [],
    requested_roles: [],
    requested_themes: [],
    requested_privacy_options: [],
    provided_safety_requirements: [],
    guest_notes: ""
  });

  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleToggle = (field, value) => {
    const current = request[field] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setRequest({ ...request, [field]: updated });
  };

  const handleCheck = () => {
    const compatibilityResult = checkGuestProductionCompatibility(performer, request);
    setResult(compatibilityResult);
  };

  const handleCopy = () => {
    if (!result) return;
    const summary = formatCompatibilitySummary(result, performer.display_name);
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      toast.success("Summary copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Failed to copy");
    });
  };

  const handleClear = () => {
    setRequest({
      requested_production_types: [],
      requested_scene_styles: [],
      requested_roles: [],
      requested_themes: [],
      requested_privacy_options: [],
      provided_safety_requirements: [],
      guest_notes: ""
    });
    setResult(null);
  };

  if (!performer) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Guest Production Compatibility Check</h2>
        <Button variant="outline" size="sm" onClick={handleClear}>Clear</Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Internal Planning Tool</AlertTitle>
        <AlertDescription>
          This compatibility check is for studio planning only. It does not constitute approval,
          booking confirmation, or guaranteed availability. All productions require performer approval,
          updated consent, contract review, and studio safety review.
        </AlertDescription>
      </Alert>

      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Hypothetical Guest Production Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Production Types */}
          <div className="space-y-3">
            <Label>Requested Production Types</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PRODUCTION_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`req_prod_${type}`}
                    checked={request.requested_production_types.includes(type)}
                    onCheckedChange={() => handleToggle("requested_production_types", type)}
                  />
                  <Label htmlFor={`req_prod_${type}`} className="text-sm capitalize">
                    {type.replace(/_/g, " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Scene Styles */}
          <div className="space-y-3">
            <Label>Requested Scene Styles</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SCENE_STYLES.map((style) => (
                <div key={style} className="flex items-center space-x-2">
                  <Checkbox
                    id={`req_style_${style}`}
                    checked={request.requested_scene_styles.includes(style)}
                    onCheckedChange={() => handleToggle("requested_scene_styles", style)}
                  />
                  <Label htmlFor={`req_style_${style}`} className="text-sm capitalize">
                    {style.replace(/_/g, " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-3">
            <Label>Requested Roles</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AVAILABLE_ROLES.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={`req_role_${role}`}
                    checked={request.requested_roles.includes(role)}
                    onCheckedChange={() => handleToggle("requested_roles", role)}
                  />
                  <Label htmlFor={`req_role_${role}`} className="text-sm capitalize">
                    {role.replace(/_/g, " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Themes */}
          <div className="space-y-3">
            <Label>Requested Themes (Optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CONDITIONAL_THEMES.map((theme) => (
                <div key={theme} className="flex items-center space-x-2">
                  <Checkbox
                    id={`req_theme_${theme}`}
                    checked={request.requested_themes.includes(theme)}
                    onCheckedChange={() => handleToggle("requested_themes", theme)}
                  />
                  <Label htmlFor={`req_theme_${theme}`} className="text-sm capitalize">
                    {theme.replace(/_/g, " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Options */}
          <div className="space-y-3">
            <Label>Requested Privacy Options</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PRIVACY_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`req_privacy_${option}`}
                    checked={request.requested_privacy_options.includes(option)}
                    onCheckedChange={() => handleToggle("requested_privacy_options", option)}
                  />
                  <Label htmlFor={`req_privacy_${option}`} className="text-sm capitalize">
                    {option.replace(/_/g, " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Requirements */}
          <div className="space-y-3">
            <Label>Provided Safety Requirements</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SAFETY_REQUIREMENTS.map((req) => (
                <div key={req} className="flex items-center space-x-2">
                  <Checkbox
                    id={`req_safety_${req}`}
                    checked={request.provided_safety_requirements.includes(req)}
                    onCheckedChange={() => handleToggle("provided_safety_requirements", req)}
                  />
                  <Label htmlFor={`req_safety_${req}`} className="text-sm capitalize">
                    {req.replace(/_/g, " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Guest Notes */}
          <div className="space-y-2">
            <Label htmlFor="guest_notes">Internal Admin Notes</Label>
            <Textarea
              id="guest_notes"
              value={request.guest_notes}
              onChange={(e) => setRequest({ ...request, guest_notes: e.target.value })}
              placeholder="Notes about this hypothetical request..."
              className="min-h-[80px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button onClick={handleCheck}>Check Compatibility</Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Compatibility Result</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!result}>
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy Summary"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Recommendation */}
            <div className="flex items-center gap-3">
              <Badge className={result.display.statusColor}>
                {result.display.statusLabel}
              </Badge>
            </div>

            {/* Info Messages */}
            {result.info && result.info.length > 0 && (
              <div className="space-y-2">
                {result.info.map((msg, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground">• {msg}</p>
                ))}
              </div>
            )}

            {/* Hard Blockers */}
            {result.hard_blockers && result.hard_blockers.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-destructive">Hard Blockers</h4>
                {result.hard_blockers.map((item, idx) => (
                  <p key={idx} className="text-sm text-destructive">❌ {item.message}</p>
                ))}
              </div>
            )}

            {/* Missing Safety */}
            {result.missing_safety_requirements && result.missing_safety_requirements.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-destructive">Missing Safety Requirements</h4>
                {result.missing_safety_requirements.map((item, idx) => (
                  <p key={idx} className="text-sm text-destructive">❌ {item.message}</p>
                ))}
              </div>
            )}

            {/* Review Required */}
            {result.review_required && result.review_required.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-yellow-500">Items Requiring Review</h4>
                {result.review_required.map((item, idx) => (
                  <p key={idx} className="text-sm text-yellow-500">⚠️ {item.message}</p>
                ))}
              </div>
            )}

            {/* Matches */}
            {Object.values(result.matches).some(arr => arr.length > 0) && (
              <div className="space-y-3">
                <h4 className="font-semibold text-green-500">Matched Items</h4>
                {result.matches.production_types.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Production Types: </span>
                    <span className="text-sm">{result.matches.production_types.map(t => t.replace(/_/g, ' ')).join(', ')}</span>
                  </div>
                )}
                {result.matches.scene_styles.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Scene Styles: </span>
                    <span className="text-sm">{result.matches.scene_styles.map(s => s.replace(/_/g, ' ')).join(', ')}</span>
                  </div>
                )}
                {result.matches.roles.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Roles: </span>
                    <span className="text-sm">{result.matches.roles.map(r => r.replace(/_/g, ' ')).join(', ')}</span>
                  </div>
                )}
                {result.matches.privacy_options.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Privacy Options: </span>
                    <span className="text-sm">{result.matches.privacy_options.map(p => p.replace(/_/g, ' ')).join(', ')}</span>
                  </div>
                )}
                {result.matches.safety_requirements.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Safety Requirements: </span>
                    <span className="text-sm">{result.matches.safety_requirements.map(s => s.replace(/_/g, ' ')).join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <Alert variant="outline" className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This compatibility check is an internal planning aid only. It does not replace performer approval,
                updated consent confirmation, contract review, or studio safety review.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}