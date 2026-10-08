import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, ChevronLeft, Shield, Lock, AlertTriangle, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import SEOMeta from "@/components/SEOMeta";
import { trackFanProductionRequestStart, trackFanProductionRequestSubmit, trackPackageSelect } from "@/lib/analytics";

// ─── STEPS CONFIG ────────────────────────────────────────────────────────────

const STEPS = [
  "Your Details",
  "Preferred Performer",
  "Location",
  "Package",
  "Preferences",
  "Role / Dynamic",
  "Privacy",
  "Release",
  "Notes",
  "Review & Submit",
];

const PACKAGES = [
  {
    id: "short_799",
    label: "Short Fan Production",
    price: "$799",
    scene: "30 min filmed scene",
    window: "Production window up to 2 hours",
    popular: false,
  },
  {
    id: "full_1499",
    label: "Full Fan Production",
    price: "$1,499",
    scene: "60 min filmed scene",
    window: "Production window up to 3 hours",
    popular: true,
  },
  {
    id: "premium_2499",
    label: "Premium Fan Production",
    price: "$2,499",
    scene: "90 min filmed scene",
    window: "Production window up to 4.5 hours",
    popular: false,
  },
  {
    id: "custom_quote",
    label: "Custom / Multi-scene",
    price: "Quote on request",
    scene: "Flexible scope",
    window: "Discuss with studio",
    popular: false,
  },
];

const PREFERENCES = [
  "Oral", "Anal", "Kissing", "Handjob", "Wanking / Masturbation",
  "BDSM / Fetish elements", "Soft / Teasing", "Explicit production", "Other / on request",
];

const ROLES = ["Top", "Bottom", "Vers", "Not sure", "Depends on performer / production"];
const DOMINANCE = ["Dominant", "Submissive", "Switch", "No preference"];

const PRIVACY_OPTIONS = [
  "Show my face",
  "Mask / discreet look",
  "Blur my face",
  "No-face edit",
  "Private / limited delivery on request",
];

const RELEASE_OPTIONS = [
  "Studio release allowed",
  "Public version with privacy protection",
  "Private / limited delivery request",
  "Not sure / discuss with studio",
];

const COUNTRIES = ["Philippines 🇵🇭", "Taiwan 🇹🇼", "Madagascar 🇲🇬"];

// ─── STEPPER ─────────────────────────────────────────────────────────────────

function Stepper({ current, total }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-rose-400 text-xs font-bold uppercase tracking-widest">
          Step {current + 1} of {total}
        </span>
        <span className="text-white/30 text-xs">{STEPS[current]}</span>
      </div>
      <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-600 to-rose-500 rounded-full transition-all duration-500"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── CHIP TOGGLE ─────────────────────────────────────────────────────────────

function ChipGroup({ options, selected, onToggle, single = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = single ? selected === opt : selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              active
                ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30"
                : "bg-white/5 border-white/10 text-white/60 hover:border-rose-600/40 hover:text-white/80"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── FIELD COMPONENTS ────────────────────────────────────────────────────────

function Field({ label, required, children, hint }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-white/80 mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-white/30 text-xs mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/12 rounded-lg px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-rose-500/60 focus:bg-white/8 transition-all";

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function FanProductionRequest() {
  const { isAuthenticated, user, isLoadingAuth, authChecked } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    // Step 1
    applicant_name: "",
    email: "",
    phone: "",
    nationality: "",
    confirmed_18_plus: false,
    // Step 2
    preferred_performer: "",
    alternate_performer: "",
    open_to_studio_suggestions: false,
    // Step 3
    production_country: "",
    requested_city: "",
    is_local_fan: false,
    expected_travel_date: "",
    // Step 4
    production_package: "",
    // Step 5
    production_preferences: [],
    // Step 6
    role_dynamic: "",
    dominance_preference: "",
    // Step 7
    privacy_option: "",
    // Step 8
    release_preference: "",
    // Step 9
    message: "",
    // Step 10 confirmations
    confirmed_not_private_date: false,
    confirmed_performer_approval: false,
    confirmed_preferences_not_guaranteed: false,
    confirmed_travel_costs: false,
    confirmed_contact_consent: false,
  });

  // Pre-fill email/name from logged-in user if available
  useEffect(() => {
    if (user?.email && !form.email) {
      setForm((f) => ({ ...f, email: user.email, applicant_name: f.applicant_name || user.full_name || "" }));
    }
  }, [user]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleChip = (key, val) => {
    setForm((f) => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.applicant_name.trim()) e.applicant_name = "Required";
      if (!form.email.trim()) e.email = "Required";
      if (!form.phone.trim()) e.phone = "Required";
      if (!form.nationality.trim()) e.nationality = "Required";
      if (!form.confirmed_18_plus) e.confirmed_18_plus = "You must confirm you are 18+";
    }
    if (step === 1) {
      if (!form.preferred_performer.trim() && !form.open_to_studio_suggestions)
        e.preferred_performer = "Enter a preferred performer or check 'open to studio suggestions'";
    }
    if (step === 2) {
      if (!form.production_country) e.production_country = "Required";
    }
    if (step === 3) {
      if (!form.production_package) e.production_package = "Please select a package";
    }
    if (step === 6) {
      if (!form.privacy_option) e.privacy_option = "Please select a privacy option";
    }
    if (step === 7) {
      if (!form.release_preference) e.release_preference = "Please select a release preference";
    }
    if (step === 9) {
      if (!form.confirmed_not_private_date) e.confirmed_not_private_date = "Required";
      if (!form.confirmed_performer_approval) e.confirmed_performer_approval = "Required";
      if (!form.confirmed_preferences_not_guaranteed) e.confirmed_preferences_not_guaranteed = "Required";
      if (!form.confirmed_travel_costs) e.confirmed_travel_costs = "Required";
      if (!form.confirmed_contact_consent) e.confirmed_contact_consent = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    
    // Track step progression (e.g., package select on step 3)
    if (step === 3 && form.production_package) {
      trackPackageSelect({
        package_type: form.production_package,
        package_price: PACKAGES.find(p => p.id === form.production_package)?.price || null,
        source_page: 'fan-productions-request',
        cta_location: 'package_selection',
      });
    }
    
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    
    // Track fan production request submit (Phase 2)
    trackFanProductionRequestSubmit({
      package_type: form.production_package,
      package_price: PACKAGES.find(p => p.id === form.production_package)?.price || null,
      source_page: 'fan-productions-request',
      cta_location: 'form_submit',
    });
    
    await base44.entities.GuestProductionApplication.create({
      ...form,
      request_type: "fan_production",
      applicant_user_id: user?.id || "",
      status: "pending",
      submitted_at: new Date().toISOString(),
      interests: form.production_preferences,
      package_interest: form.production_package,
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  const isGuest = !isAuthenticated;

  if (submitted) {
    // Guest flow: request saved, now prompt them to create account
    if (isGuest) {
      return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
          <SEOMeta title="Request Submitted | FLESHLAB Fan Productions" noIndex={true} />
          <div className="max-w-lg w-full text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black text-white mb-3">Fan Production Request Submitted</h1>
            <p className="text-white/60 mb-2 leading-relaxed">
              Your request has been received. We have saved it to your email address.
            </p>
            <p className="text-white/35 text-sm mb-6 leading-relaxed">
              Create a FLESHLAB account to track the review status in your client dashboard. Use the same email address: <span className="text-white/60 font-semibold">{form.email}</span>
            </p>
            <div className="bg-[#111] border border-white/8 rounded-xl p-4 mb-7 text-left text-sm text-white/40 leading-relaxed">
              <span className="text-white/60 font-semibold block mb-1">Next step:</span>
              FLESHLAB will review your request, check performer compatibility and contact you via <span className="text-white/60">{form.phone || form.email}</span> with the next steps.
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => navigate(`/register?next=${encodeURIComponent("/client/dashboard")}`)}
                className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-3 rounded-xl h-auto"
              >
                Create Account &amp; Track Request
              </Button>
              <Button
                onClick={() => navigate(`/login?next=${encodeURIComponent("/client/dashboard")}`)}
                variant="outline"
                className="w-full sm:w-auto border-white/15 text-white/70 hover:bg-white/8 px-6 py-3 rounded-xl h-auto text-sm"
              >
                Already have an account? Log in
              </Button>
            </div>
            <div className="mt-5">
              <a href="https://wa.me/message/FLESHLAB" target="_blank" rel="noopener noreferrer" className="text-white/30 text-xs underline-offset-2 hover:text-white/50 underline">
                Contact Management on WhatsApp
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Logged-in flow: redirect CTA to dashboard
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
        <SEOMeta title="Request Submitted | FLESHLAB Fan Productions" noIndex={true} />
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Fan Production Request Submitted</h1>
          <p className="text-white/55 mb-2 leading-relaxed">
            Your request has been received and linked to your FLESHLAB account. Our team will review it and contact you within 48–72 hours.
          </p>
          <p className="text-white/25 text-xs mb-8">You can track the review status in your client dashboard.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => navigate("/client/dashboard")}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-8 py-3 rounded-xl h-auto"
            >
              Go to Client Dashboard
            </Button>
            <a href="https://wa.me/message/FLESHLAB" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-white/15 text-white/70 hover:bg-white/8 px-6 py-3 rounded-xl h-auto text-sm">
                Contact Management on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title="Build Your Fan Production Request | FLESHLAB Fan Productions"
        description="Submit your Fan Production request to FLESHLAB Studios. Tell us your preferred performer, location, production package, privacy preferences and more."
        canonical="/fan-productions/request"
        noIndex={true}
      />

      <div className="min-h-screen bg-[#080808] text-white">
        {/* Header */}
        <div className="border-b border-white/6 bg-[#0a0a0a]">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-600/30 flex items-center justify-center">
                <Film className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-rose-400 text-xs font-bold uppercase tracking-widest">FLESHLAB Fan Productions</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Build Your Fan Production Request</h1>
            <p className="text-white/40 text-sm mt-1 leading-relaxed">
              Tell us your preferred performer, location, production length, privacy choice and production preferences.
              FLESHLAB will review your request and contact you with the next steps.
            </p>
          </div>
        </div>

        {/* Wizard body */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Stepper current={step} total={STEPS.length} />

          {/* ── STEP 1 — Your Details ── */}
          {step === 0 && (
            <div>
              <StepTitle>Your Details</StepTitle>
              <Field label="Full Name" required>
                <input className={inputCls} placeholder="Your name" value={form.applicant_name}
                  onChange={(e) => set("applicant_name", e.target.value)} />
                {errors.applicant_name && <Err>{errors.applicant_name}</Err>}
              </Field>
              <Field label="Email" required>
                <input type="email" className={inputCls} placeholder="your@email.com" value={form.email}
                  onChange={(e) => set("email", e.target.value)} />
                {errors.email && <Err>{errors.email}</Err>}
              </Field>
              <Field label="WhatsApp / Telegram / Contact" required hint="Include country code for WhatsApp e.g. +44 7700...">
                <input className={inputCls} placeholder="+1 555 000 0000 or @telegramhandle" value={form.phone}
                  onChange={(e) => set("phone", e.target.value)} />
                {errors.phone && <Err>{errors.phone}</Err>}
              </Field>
              <Field label="Country of Residence" required>
                <input className={inputCls} placeholder="e.g. United Kingdom" value={form.nationality}
                  onChange={(e) => set("nationality", e.target.value)} />
                {errors.nationality && <Err>{errors.nationality}</Err>}
              </Field>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.confirmed_18_plus}
                  onChange={(e) => set("confirmed_18_plus", e.target.checked)}
                  className="mt-0.5 accent-rose-500 w-4 h-4 shrink-0" />
                <span className="text-sm text-white/70">
                  I confirm I am <strong className="text-white">18 years or older</strong> and legally permitted to participate in adult productions. <span className="text-rose-400">*</span>
                </span>
              </label>
              {errors.confirmed_18_plus && <Err>{errors.confirmed_18_plus}</Err>}
            </div>
          )}

          {/* ── STEP 2 — Preferred Performer ── */}
          {step === 1 && (
            <div>
              <StepTitle>Preferred Performer</StepTitle>
              <InfoBox>Performer availability and approval are required before any production can proceed.</InfoBox>
              <Field label="Preferred Performer" hint="Enter performer name or stage name as shown on the site">
                <input className={inputCls} placeholder="e.g. Jam, Alex, Raven..." value={form.preferred_performer}
                  onChange={(e) => set("preferred_performer", e.target.value)} />
                {errors.preferred_performer && <Err>{errors.preferred_performer}</Err>}
              </Field>
              <Field label="Second Choice Performer (Optional)">
                <input className={inputCls} placeholder="Optional alternate preference" value={form.alternate_performer}
                  onChange={(e) => set("alternate_performer", e.target.value)} />
              </Field>
              <label className="flex items-start gap-3 cursor-pointer mt-4">
                <input type="checkbox" checked={form.open_to_studio_suggestions}
                  onChange={(e) => set("open_to_studio_suggestions", e.target.checked)}
                  className="mt-0.5 accent-rose-500 w-4 h-4 shrink-0" />
                <span className="text-sm text-white/70">
                  I am open to studio suggestions for compatible performers
                </span>
              </label>
            </div>
          )}

          {/* ── STEP 3 — Location ── */}
          {step === 2 && (
            <div>
              <StepTitle>Production Location</StepTitle>
              <InfoBox>
                Fan Productions are arranged inside the country where the selected performer is based. Final location
                depends on availability, hotel/location setup, travel and studio approval.
              </InfoBox>
              <Field label="Production Country" required>
                <ChipGroup
                  options={COUNTRIES}
                  selected={form.production_country}
                  onToggle={(v) => set("production_country", v)}
                  single
                />
                {errors.production_country && <Err>{errors.production_country}</Err>}
              </Field>
              <Field label="Requested City (Optional)" hint="Leave blank if unsure — studio will advise">
                <input className={inputCls} placeholder="e.g. Manila, Taipei, Antananarivo" value={form.requested_city}
                  onChange={(e) => set("requested_city", e.target.value)} />
              </Field>
              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input type="checkbox" checked={form.is_local_fan}
                  onChange={(e) => set("is_local_fan", e.target.checked)}
                  className="mt-0.5 accent-rose-500 w-4 h-4 shrink-0" />
                <span className="text-sm text-white/70">
                  I am already based in the performer's country (local fan — no international travel needed)
                </span>
              </label>
              <Field label="Expected Travel Date / Range (Optional)" hint="Approximate range is fine, e.g. 'October 2026'">
                <input className={inputCls} placeholder="e.g. August 2026 or flexible" value={form.expected_travel_date}
                  onChange={(e) => set("expected_travel_date", e.target.value)} />
              </Field>
            </div>
          )}

          {/* ── STEP 4 — Package ── */}
          {step === 3 && (
            <div>
              <StepTitle>Production Package</StepTitle>
              <div className="space-y-3">
                {PACKAGES.map((pkg) => {
                  const active = form.production_package === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => set("production_package", pkg.id)}
                      className={`w-full text-left rounded-xl border p-5 transition-all relative ${
                        active
                          ? "border-rose-500 bg-rose-600/10 shadow-lg shadow-rose-600/15"
                          : "border-white/10 bg-white/3 hover:border-white/20"
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Most Popular
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-4 pr-20">
                        <div>
                          <div className="font-bold text-white text-base">{pkg.label}</div>
                          <div className="text-white/45 text-sm mt-0.5">{pkg.scene}</div>
                          <div className="text-white/30 text-xs mt-0.5">{pkg.window}</div>
                        </div>
                        <div className={`text-xl font-black shrink-0 ${active ? "text-rose-400" : "text-white/60"}`}>
                          {pkg.price}
                        </div>
                      </div>
                      {active && (
                        <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {errors.production_package && <Err>{errors.production_package}</Err>}
            </div>
          )}

          {/* ── STEP 5 — Preferences ── */}
          {step === 4 && (
            <div>
              <StepTitle>Production Preferences</StepTitle>
              <WarnBox>
                Preferences are not guaranteed services. Final scope depends on performer consent, compatibility,
                boundaries, safety and FLESHLAB approval.
              </WarnBox>
              <Field label="Select all that apply (optional)">
                <ChipGroup
                  options={PREFERENCES}
                  selected={form.production_preferences}
                  onToggle={(v) => toggleChip("production_preferences", v)}
                />
              </Field>
            </div>
          )}

          {/* ── STEP 6 — Role / Dynamic ── */}
          {step === 5 && (
            <div>
              <StepTitle>Your Role / Dynamic</StepTitle>
              <Field label="Preferred Role">
                <ChipGroup
                  options={ROLES}
                  selected={form.role_dynamic}
                  onToggle={(v) => set("role_dynamic", v)}
                  single
                />
              </Field>
              <Field label="Dominance Preference (Optional)">
                <ChipGroup
                  options={DOMINANCE}
                  selected={form.dominance_preference}
                  onToggle={(v) => set("dominance_preference", v)}
                  single
                />
              </Field>
            </div>
          )}

          {/* ── STEP 7 — Privacy ── */}
          {step === 6 && (
            <div>
              <StepTitle>Privacy / Face Visibility</StepTitle>
              <InfoBox>
                FLESHLAB still verifies your real identity internally for 18+ compliance, contracts and safety.
                Privacy options affect the final production/edit, not the required verification process.
              </InfoBox>
              <Field label="Select your preference" required>
                <ChipGroup
                  options={PRIVACY_OPTIONS}
                  selected={form.privacy_option}
                  onToggle={(v) => set("privacy_option", v)}
                  single
                />
                {errors.privacy_option && <Err>{errors.privacy_option}</Err>}
              </Field>
            </div>
          )}

          {/* ── STEP 8 — Release ── */}
          {step === 7 && (
            <div>
              <StepTitle>Release / Delivery Preference</StepTitle>
              <InfoBox>Release model may affect the final quote.</InfoBox>
              <Field label="Select your preference" required>
                <ChipGroup
                  options={RELEASE_OPTIONS}
                  selected={form.release_preference}
                  onToggle={(v) => set("release_preference", v)}
                  single
                />
                {errors.release_preference && <Err>{errors.release_preference}</Err>}
              </Field>
            </div>
          )}

          {/* ── STEP 9 — Notes ── */}
          {step === 8 && (
            <div>
              <StepTitle>Notes / Fantasy Brief</StepTitle>
              <p className="text-white/45 text-sm mb-4">
                Tell us what kind of Fan Production you want to be part of.
              </p>
              <Field label="Your Brief (Optional)">
                <textarea
                  className={`${inputCls} min-h-[160px] resize-none leading-relaxed`}
                  placeholder="Describe your preferred performer, scene idea, limits, boundaries, privacy expectations and anything important for studio review."
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* ── STEP 10 — Review & Submit ── */}
          {step === 9 && (
            <div>
              <StepTitle>Review & Submit</StepTitle>

              {/* Summary */}
              <div className="bg-[#111] border border-white/8 rounded-xl p-5 mb-6 space-y-2.5 text-sm">
                <SummaryRow label="Name" value={form.applicant_name} />
                <SummaryRow label="Email" value={form.email} />
                <SummaryRow label="Contact" value={form.phone} />
                <SummaryRow label="Country of Residence" value={form.nationality} />
                <SummaryRow label="Preferred Performer" value={form.preferred_performer || "Open to studio suggestions"} />
                {form.alternate_performer && <SummaryRow label="Alternate Performer" value={form.alternate_performer} />}
                <SummaryRow label="Production Country" value={form.production_country} />
                {form.requested_city && <SummaryRow label="Requested City" value={form.requested_city} />}
                <SummaryRow label="Package" value={PACKAGES.find((p) => p.id === form.production_package)?.label || "—"} />
                {form.production_preferences.length > 0 && (
                  <SummaryRow label="Preferences" value={form.production_preferences.join(", ")} />
                )}
                {form.role_dynamic && <SummaryRow label="Role / Dynamic" value={form.role_dynamic} />}
                <SummaryRow label="Privacy" value={form.privacy_option || "—"} />
                <SummaryRow label="Release" value={form.release_preference || "—"} />
              </div>

              {/* Confirmations */}
              <div className="space-y-3 mb-6">
                {[
                  { key: "confirmed_not_private_date", label: "I understand this is a planned adult production, not a private date" },
                  { key: "confirmed_performer_approval", label: "I understand performer approval is required before any production" },
                  { key: "confirmed_preferences_not_guaranteed", label: "I understand production preferences are not guaranteed services" },
                  { key: "confirmed_travel_costs", label: "I understand my personal travel costs are not included in the production fee" },
                  { key: "confirmed_contact_consent", label: "I consent to FLESHLAB contacting me about this request" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => set(key, e.target.checked)}
                      className="mt-0.5 accent-rose-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-sm text-white/70">{label} <span className="text-rose-400">*</span></span>
                  </label>
                ))}
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="bg-rose-900/20 border border-rose-600/30 rounded-lg px-4 py-3 mb-4">
                  <p className="text-rose-300 text-sm">Please confirm all required fields above before submitting.</p>
                </div>
              )}

              <div className="bg-amber-600/8 border border-amber-600/20 rounded-xl p-4 text-amber-200/60 text-xs leading-relaxed">
                <Shield className="w-4 h-4 inline mr-1.5 text-amber-400 align-text-bottom" />
                Fan Production is a professional studio program for verified 18+ participants. This is not a dating,
                hookup or escort service. All productions are studio-controlled with full consent documentation and safety protocols.
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/6">
            {step > 0 ? (
              <Button
                variant="outline"
                onClick={back}
                className="border-white/15 text-white/70 hover:bg-white/8 hover:text-white gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <Button
                onClick={next}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-3 rounded-xl h-auto gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={submitting}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-3 rounded-xl h-auto"
              >
                {submitting ? "Submitting…" : "Submit Fan Production Request"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────

function StepTitle({ children }) {
  return <h2 className="text-xl font-black text-white mb-5">{children}</h2>;
}

function Err({ children }) {
  return <p className="text-rose-400 text-xs mt-1.5">{children}</p>;
}

function InfoBox({ children }) {
  return (
    <div className="bg-white/4 border border-white/10 rounded-xl p-4 mb-5 text-white/50 text-sm leading-relaxed">
      {children}
    </div>
  );
}

function WarnBox({ children }) {
  return (
    <div className="bg-amber-600/8 border border-amber-600/20 rounded-xl p-4 mb-5 flex gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <p className="text-amber-200/70 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-white/35 shrink-0 w-36">{label}</span>
      <span className="text-white/80 break-words">{value || "—"}</span>
    </div>
  );
}