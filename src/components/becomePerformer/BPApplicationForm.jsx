import { useState, useMemo, forwardRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { trackPhilippinesApplicationStart } from "@/lib/analytics";
import { base44 } from "@/api/base44Client";
import toast from "react-hot-toast";
import FileUploadField from "@/components/application/FileUploadField";
import MultiPhotoUpload from "@/components/application/MultiPhotoUpload";

const STEP_LABELS = ["Who are you?", "Show us something of you", "Are you real?"];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-black transition-colors ${
            i < current ? "bg-rose-600 border-rose-600 text-white"
            : i === current ? "bg-rose-600/20 border-rose-600 text-rose-400"
            : "bg-transparent border-white/20 text-white/25"
          }`}>
            {i < current ? "✓" : i + 1}
          </div>
          <span className={`text-xs font-semibold truncate hidden sm:block ${i === current ? "text-white" : "text-white/30"}`}>{label}</span>
          {i < STEP_LABELS.length - 1 && (
            <div className={`flex-1 h-px ${i < current ? "bg-rose-600/50" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function ChoiceButton({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors text-left ${
        selected ? "border-rose-600/60 bg-rose-600/12 text-rose-300" : "border-white/10 bg-white/3 text-white/55 hover:border-white/25 hover:text-white/75"
      }`}
    >
      {label}
    </button>
  );
}

const BPApplicationForm = forwardRef(function BPApplicationForm({ onSuccess, sourcePage, sourceCountry, utmSource, utmMarket, utmCampaign }, ref) {
  const sessionId = useMemo(() => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, []);
  const [step, setStep] = useState(0);

  // Part 1
  const [p1, setP1] = useState({
    first_name: "", last_name: "", email: "", whatsapp: "", other_contact: "",
    country: "", city: "", age_confirmed: false,
    sexual_identity: "", interests: "", role: "", preferred_model: "",
  });

  // Part 2
  const [p2, setP2] = useState({ why: "" });
  const [mediaKeys, setMediaKeys] = useState({
    profile_photo_r2_keys: [],
    intro_video_r2_key: null,
    hardcore_video_r2_key: null,
  });

  // Part 3
  const [p3, setP3] = useState({
    id_type: "",
    id_document_r2_key: null,
    id_back_r2_key: null,
    selfie_r2_key: null,
    consent1: false,
    consent2: false,
    consent3: false,
    consent4: false,
    consent5: false,
  });

    const submitMutation = useMutation({
    onMutate: () => {
      if (sourcePage === "gay-performer-recruitment-philippines") {
        trackPhilippinesApplicationStart({ utmSource, utmMarket, utmCampaign });
      }
    },
    mutationFn: async () => {
      const modelMap = {
        "managed_40": "standard_studio_60_performer_40",
        "network_70": "network_performer_70_studio_30",
        "not_sure": "undecided",
        "": "undecided",
      };

      // Combine id docs into one key for backward compat (use front doc as primary)
      const id_document_r2_key = p3.id_document_r2_key;

      const payload = {
        applicant_name: `${p1.first_name} ${p1.last_name}`.trim(),
        legal_name: `${p1.first_name} ${p1.last_name}`.trim(),
        email: p1.email,
        phone: p1.whatsapp || p1.other_contact || null,
        nationality: p1.country,
        city: p1.city,
        experience: p2.why || null,
        social_links: p1.other_contact || null,
        interests: p1.interests ? [p1.interests] : [],
        package_interest: p1.preferred_model || "not_sure",
        preferred_revenue_model: modelMap[p1.preferred_model] || "undecided",
        // Media
        profile_photo_r2_keys: mediaKeys.profile_photo_r2_keys,
        intro_video_r2_key: mediaKeys.intro_video_r2_key,
        hardcore_video_r2_key: mediaKeys.hardcore_video_r2_key,
        id_document_r2_key,
        message: [
          p1.sexual_identity ? `Sexual identity: ${p1.sexual_identity}` : "",
          p1.role ? `Role: ${p1.role}` : "",
          p3.id_type ? `ID type: ${p3.id_type}` : "",
          p3.selfie_r2_key ? `Selfie R2: ${p3.selfie_r2_key}` : "",
          p3.id_back_r2_key ? `ID back R2: ${p3.id_back_r2_key}` : "",
        ].filter(Boolean).join("\n") || null,
        // Source attribution
        source_page: sourcePage || null,
        source_country: sourceCountry || null,
        utm_source: utmSource || null,
        utm_market: utmMarket || null,
        utm_campaign: utmCampaign || null,
      };

      const response = await base44.functions.invoke("submitPerformerApplication", payload);
      return response.data;
    },
    onSuccess: (data) => {
      onSuccess({ first_name: p1.first_name, last_name: p1.last_name, email: p1.email });
    },
    onError: () => {},
  });

  // Validation per step
  const step0Valid = p1.first_name && p1.last_name && p1.email && p1.age_confirmed && p1.country;
  const step1Valid = mediaKeys.profile_photo_r2_keys.length >= 5 && mediaKeys.intro_video_r2_key && mediaKeys.hardcore_video_r2_key;
  const step2Valid = p3.id_document_r2_key && p3.selfie_r2_key && p3.consent1 && p3.consent2 && p3.consent3 && p3.consent4 && p3.consent5;

  return (
    <section id="application-form" ref={ref} className="py-24 px-6 bg-gradient-to-b from-[#0d0505] to-[#080808] border-t border-white/6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-black mb-3 text-white">
            APPLY AS <span className="text-rose-500">PERFORMER</span>
          </h2>
          <p className="text-white/40 text-base">Private application · Reviewed within 48 hours · All uploads are confidential</p>
        </div>

        <div className="bg-[#111] border border-white/8 rounded-2xl p-7 md:p-10">
          <StepIndicator current={step} />

          {/* ── STEP 0 — Who are you? ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs uppercase tracking-widest">First Name *</Label>
                  <Input value={p1.first_name} onChange={e => setP1({...p1, first_name: e.target.value})} placeholder="First name" className="bg-white/5 border-white/12 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs uppercase tracking-widest">Last Name *</Label>
                  <Input value={p1.last_name} onChange={e => setP1({...p1, last_name: e.target.value})} placeholder="Last name" className="bg-white/5 border-white/12 text-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-widest">Email *</Label>
                <Input type="email" value={p1.email} onChange={e => setP1({...p1, email: e.target.value})} placeholder="your@email.com" className="bg-white/5 border-white/12 text-white" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-widest">WhatsApp</Label>
                <Input value={p1.whatsapp} onChange={e => setP1({...p1, whatsapp: e.target.value})} placeholder="+1 234 567 890" className="bg-white/5 border-white/12 text-white" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-widest">Other contact</Label>
                <Input value={p1.other_contact} onChange={e => setP1({...p1, other_contact: e.target.value})} placeholder="Telegram, Instagram, Twitter, Line..." className="bg-white/5 border-white/12 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs uppercase tracking-widest">Country *</Label>
                  <Input value={p1.country} onChange={e => setP1({...p1, country: e.target.value})} placeholder="Where you are based" className="bg-white/5 border-white/12 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs uppercase tracking-widest">City</Label>
                  <Input value={p1.city} onChange={e => setP1({...p1, city: e.target.value})} placeholder="Your city" className="bg-white/5 border-white/12 text-white" />
                </div>
              </div>

              <div>
                <Label className="text-white/60 text-xs uppercase tracking-widest block mb-2">Sexual identity / orientation</Label>
                <div className="flex flex-wrap gap-2">
                  {["Gay", "Bisexual", "Straight", "Trans", "Other", "Prefer not to say"].map(v => (
                    <ChoiceButton key={v} label={v} selected={p1.sexual_identity === v} onClick={() => setP1({...p1, sexual_identity: v})} />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white/60 text-xs uppercase tracking-widest block mb-2">What are you interested in?</Label>
                <div className="flex flex-wrap gap-2">
                  {["Live Cam", "Productions", "Both"].map(v => (
                    <ChoiceButton key={v} label={v} selected={p1.interests === v} onClick={() => setP1({...p1, interests: v})} />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white/60 text-xs uppercase tracking-widest block mb-2">Role</Label>
                <div className="flex flex-wrap gap-2">
                  {["Top", "Bottom", "Vers", "Not sure yet", "Depends on production"].map(v => (
                    <ChoiceButton key={v} label={v} selected={p1.role === v} onClick={() => setP1({...p1, role: v})} />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white/60 text-xs uppercase tracking-widest block mb-2">Preferred performer model</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "managed_40", label: "Managed — 40%" },
                    { value: "network_70", label: "Network — 70%" },
                    { value: "not_sure", label: "Not sure yet" },
                  ].map(({ value, label }) => (
                    <ChoiceButton key={value} label={label} selected={p1.preferred_model === value} onClick={() => setP1({...p1, preferred_model: value})} />
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 bg-rose-600/8 border border-rose-600/20 rounded-xl px-4 py-3">
                <Checkbox checked={p1.age_confirmed} onCheckedChange={v => setP1({...p1, age_confirmed: v})} />
                <span className="text-white/65 text-sm">I confirm I am 18 years or older *</span>
              </div>
            </div>
          )}

          {/* ── STEP 1 — Show us something of you ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-[#0d0d0d] border border-white/6 rounded-xl px-5 py-4">
                <p className="text-white/45 text-sm leading-relaxed">
                  Your uploads are private review material. Nothing is published without approval, contract and consent.
                </p>
              </div>

              <MultiPhotoUpload
                sessionId={sessionId}
                required
                onKeysChanged={keys => setMediaKeys(prev => ({ ...prev, profile_photo_r2_keys: keys }))}
              />

              <FileUploadField
                label="Explicit video 1 — Body / Intro"
                hint="Show your body, physique, confidence and sexual energy. Does not need to be professionally produced."
                fileType="intro_video"
                sessionId={sessionId}
                accept="video/mp4,video/quicktime,video/webm"
                required
                onUploaded={key => setMediaKeys(prev => ({ ...prev, intro_video_r2_key: key }))}
                onCleared={() => setMediaKeys(prev => ({ ...prev, intro_video_r2_key: null }))}
              />

              <FileUploadField
                label="Explicit video 2 — Hardcore / Action"
                hint="Show explicit action — masturbation, sexual performance, etc. We want to see your confidence and sexual energy."
                fileType="hardcore_video"
                sessionId={sessionId}
                accept="video/mp4,video/quicktime,video/webm"
                required
                onUploaded={key => setMediaKeys(prev => ({ ...prev, hardcore_video_r2_key: key }))}
                onCleared={() => setMediaKeys(prev => ({ ...prev, hardcore_video_r2_key: null }))}
              />

              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-widest">Why are you the right performer for FLESHLAB?</Label>
                <Textarea
                  value={p2.why}
                  onChange={e => setP2({...p2, why: e.target.value})}
                  placeholder="Tell us why fans would want to see more of you. Describe your look, energy, personality, sexual style and what makes you stand out."
                  className="min-h-[120px] bg-white/5 border-white/12 text-white"
                />
              </div>

              {!step1Valid && (
                <div className="flex items-start gap-2 bg-amber-600/10 border border-amber-600/25 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-300 text-xs leading-relaxed">
                    Please upload all required files:
                    {mediaKeys.profile_photo_r2_keys.length < 5 && ` ${5 - mediaKeys.profile_photo_r2_keys.length} more photo(s),`}
                    {!mediaKeys.intro_video_r2_key && " body video,"}
                    {!mediaKeys.hardcore_video_r2_key && " hardcore video"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2 — Are you real? ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-[#0d0d0d] border border-white/6 rounded-xl px-5 py-4">
                <p className="text-white/45 text-sm leading-relaxed">
                  Your ID is used only for age verification, performer compliance and contract preparation. It will never be published on FLESHLAB. Only authorized compliance staff can access it.
                </p>
              </div>

              <div>
                <Label className="text-white/60 text-xs uppercase tracking-widest block mb-2">ID document type *</Label>
                <div className="flex flex-wrap gap-2">
                  {["National ID", "Driver License", "Passport", "Other official government ID"].map(v => (
                    <ChoiceButton key={v} label={v} selected={p3.id_type === v} onClick={() => setP3({...p3, id_type: v})} />
                  ))}
                </div>
                <p className="text-white/25 text-xs mt-2">Document must be valid and not expired. Face and ID number must be readable.</p>
              </div>

              <FileUploadField
                label="ID document — front *"
                hint="Clear photo of the front of your ID."
                fileType="id_document"
                sessionId={sessionId}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required
                onUploaded={key => setP3(prev => ({ ...prev, id_document_r2_key: key }))}
                onCleared={() => setP3(prev => ({ ...prev, id_document_r2_key: null }))}
              />

              <FileUploadField
                label="ID document — back (if applicable)"
                hint="Clear photo of the back of your ID, if it has one."
                fileType="id_document_back"
                sessionId={sessionId}
                accept="image/jpeg,image/png,image/webp"
                onUploaded={key => setP3(prev => ({ ...prev, id_back_r2_key: key }))}
                onCleared={() => setP3(prev => ({ ...prev, id_back_r2_key: null }))}
              />

              <FileUploadField
                label="Selfie holding your ID *"
                hint="Photo of you holding your ID next to your face. Both your face and the ID must be clearly visible."
                fileType="id_selfie"
                sessionId={sessionId}
                accept="image/jpeg,image/png,image/webp"
                required
                onUploaded={key => setP3(prev => ({ ...prev, selfie_r2_key: key }))}
                onCleared={() => setP3(prev => ({ ...prev, selfie_r2_key: null }))}
              />

              <div className="space-y-3 pt-4 border-t border-white/8">
                {[
                  { key: "consent1", label: "I confirm I am 18 years or older" },
                  { key: "consent2", label: "I confirm all uploaded content shows me" },
                  { key: "consent3", label: "I consent to FLESHLAB reviewing my application materials" },
                  { key: "consent4", label: "I understand nothing will be published without approval, contract and consent" },
                  { key: "consent5", label: "I understand FLESHLAB is not escort, dating or private meetings" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-start gap-3">
                    <Checkbox
                      checked={p3[key]}
                      onCheckedChange={v => setP3(prev => ({ ...prev, [key]: v }))}
                    />
                    <span className="text-white/60 text-sm">{label}</span>
                  </div>
                ))}
              </div>

              {submitMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Something went wrong submitting your application. Please try again.</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="border-white/15 text-white/60 hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {step < 2 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 ? !step0Valid : step === 1 ? !step1Valid : false}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                disabled={!step2Valid || submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-10 py-5 h-auto text-base shadow-xl shadow-rose-700/35"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});

export default BPApplicationForm;