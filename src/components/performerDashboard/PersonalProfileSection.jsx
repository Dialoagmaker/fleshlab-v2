import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, MapPin, Lock } from "lucide-react";

function isOver18(dob) {
  if (!dob) return true; // don't block if not set yet
  const d = new Date(dob);
  const now = new Date();
  const age = now.getFullYear() - d.getFullYear() -
    (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
  return age >= 18;
}

export default function PersonalProfileSection({ profile, performer, onProfileUpdated, performerId, performerToken }) {
  const [contactData, setContactData] = useState({
    phone: profile?.phone || "",
    preferred_language: profile?.preferred_language || "",
    timezone: profile?.timezone || "",
    bio: performer?.bio || "",
  });

  const [legalData, setLegalData] = useState({
    legal_first_name: profile?.legal_first_name || "",
    legal_last_name: profile?.legal_last_name || "",
    stage_name: performer?.display_name || "",
    date_of_birth: performer?.date_of_birth || "",
    nationality: performer?.nationality || "",
    address_line_1: profile?.address_line_1 || "",
    address_line_2: profile?.address_line_2 || "",
    city: profile?.city || "",
    region: profile?.region || "",
    postal_code: profile?.postal_code || "",
    country: profile?.country || "",
  });

  const [contactLoading, setContactLoading] = useState(false);
  const [legalLoading, setLegalLoading] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      const response = await base44.functions.invoke("updatePerformerContactInfo", contactData);
      if (response.data?.error) {
        toast.error(response.data.error);
      } else {
        toast.success("Contact information updated.");
        onProfileUpdated();
      }
    } catch {
      toast.error("Failed to update contact information.");
    } finally {
      setContactLoading(false);
    }
  };

  const handleLegalSubmit = async (e) => {
    e.preventDefault();
    if (legalData.date_of_birth && !isOver18(legalData.date_of_birth)) {
      toast.error("You must be at least 18 years old to work with FLESHLAB.");
      return;
    }
    setLegalLoading(true);
    try {
      const response = await base44.functions.invoke("performerIdVerificationService", {
        action: "save_legal_profile",
        performer_id: performerId,
        performer_token: performerToken,
        ...legalData,
      });
      if (response.data?.error) {
        toast.error(response.data.error);
      } else {
        toast.success("Legal profile saved.");
        onProfileUpdated();
      }
    } catch {
      toast.error("Failed to save legal profile.");
    } finally {
      setLegalLoading(false);
    }
  };

  const legalField = (id, label, key, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={legalData[key]}
        onChange={e => setLegalData({ ...legalData, [key]: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Contact / Display Info ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4" />
            Contact & Display Info
          </CardTitle>
          <CardDescription>Visible contact details and your public bio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone / Contact</Label>
                <Input
                  id="phone"
                  value={contactData.phone}
                  onChange={e => setContactData({ ...contactData, phone: e.target.value })}
                  placeholder="+63 917 123 4567"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preferred_language">Preferred Language</Label>
                <Input
                  id="preferred_language"
                  value={contactData.preferred_language}
                  onChange={e => setContactData({ ...contactData, preferred_language: e.target.value })}
                  placeholder="English"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={contactData.timezone}
                onChange={e => setContactData({ ...contactData, timezone: e.target.value })}
                placeholder="Asia/Manila"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={contactData.bio}
                onChange={e => setContactData({ ...contactData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
            <Button type="submit" disabled={contactLoading}>
              {contactLoading ? "Saving..." : "Save Contact Info"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Legal Profile ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="w-4 h-4" />
            Legal Profile
          </CardTitle>
          <CardDescription>
            Required for compliance. Your legal details and address are never shown publicly
            and are only accessible to the FLESHLAB compliance team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLegalSubmit} className="space-y-4">
            {/* Names */}
            <div className="grid gap-4 md:grid-cols-2">
              {legalField("legal_first_name", "Legal First Name", "legal_first_name", "text", "As on government ID")}
              {legalField("legal_last_name", "Legal Last Name", "legal_last_name", "text", "As on government ID")}
            </div>
            {legalField("stage_name", "Stage Name (Display Name)", "stage_name", "text", "Your performer name")}

            {/* DOB + Nationality */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={legalData.date_of_birth}
                  onChange={e => setLegalData({ ...legalData, date_of_birth: e.target.value })}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                />
                {legalData.date_of_birth && !isOver18(legalData.date_of_birth) && (
                  <p className="text-red-400 text-xs">You must be at least 18 years old to work with FLESHLAB.</p>
                )}
              </div>
              {legalField("nationality", "Nationality", "nationality", "text", "e.g. Filipino")}
            </div>

            {/* Address */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Residential Address</span>
              </div>
              <div className="space-y-3">
                {legalField("address_line_1", "Address Line 1", "address_line_1", "text", "Street, Building, Unit")}
                {legalField("address_line_2", "Address Line 2 (optional)", "address_line_2", "text", "Apartment, floor, etc.")}
                <div className="grid gap-3 md:grid-cols-3">
                  {legalField("city", "City", "city", "text", "City")}
                  {legalField("region", "State / Province", "region", "text", "Region")}
                  {legalField("postal_code", "Postal Code", "postal_code", "text", "ZIP / Postal")}
                </div>
                {legalField("country", "Country", "country", "text", "e.g. Philippines")}
              </div>
            </div>

            <Button type="submit" disabled={legalLoading || (legalData.date_of_birth && !isOver18(legalData.date_of_birth))}>
              {legalLoading ? "Saving..." : "Save Legal Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}