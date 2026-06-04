import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, Film, Shield, Users, TrendingUp, Star, ChevronRight, Crown } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import FileUploadField from "@/components/application/FileUploadField";
import MultiPhotoUpload from "@/components/application/MultiPhotoUpload";


// Real FLESHLAB performer thumbnails / video assets used as visual proof
const PROOF_IMAGES = [
  "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/mj1.jpg",
  "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/DialogMaxX_BI-Alex---Wanking-in-the-School-Locker-Room.jpg",
  "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/DialogMaxX_Cute-Raven---hunky-Asian-twink-lying-touching-and-cumming.jpg",
  "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/DialogMaxX_Cute-Raven---hunky-asian-touches-and-shoots-in-shower.jpg",
  "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a761ba968_generated_image.png",
  "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/adcb70e7a_generated_image.png",
];

const TIMELINE_STEPS = [
  { num: "01", label: "Apply",               desc: "Submit your application with contact details and experience." },
  { num: "02", label: "Verification",         desc: "Identity verification and 18+ age confirmation required." },
  { num: "03", label: "Compatibility Review", desc: "Studio reviews your profile and production fit." },
  { num: "04", label: "Production Planning",  desc: "Scene planning, boundaries and consent documentation." },
  { num: "05", label: "Filming",              desc: "Professional studio production with full safety protocols." },
  { num: "06", label: "Publishing & Promotion", desc: "Content published on FLESHLAB and promoted across platforms." },
  { num: "07", label: "Brand Growth",         desc: "Ongoing performer profile visibility, PPV and fanclub access." },
];

export default function BecomePerformer() {
  const navigate = useNavigate();
  // Stable session ID for this application — used to group R2 uploads
  // Stable session ID for grouping R2 uploads under one application folder
  const sessionId = useMemo(() => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, []);
  const [formData, setFormData] = useState({
    stage_name: "", legal_name: "", age_confirmed: false,
    country: "", city: "", email: "", phone: "",
    interests: [], experience: "", social_links: "",
    consent_confirmed: false, privacy_accepted: false,
  });
  const [mediaKeys, setMediaKeys] = useState({
    profile_photo_r2_keys: [],
    intro_video_r2_key: null,
    hardcore_video_r2_key: null,
    id_document_r2_key: null,
  });

  const { data: allPerformers = [] } = useQuery({
    queryKey: ['performers-bp'],
    queryFn: () => base44.entities.Performer.list(),
  });

  const filipinoPerformers = allPerformers.filter(p => {
    const nat = (p.nationality || "").toUpperCase();
    const name = (p.display_name || "").toLowerCase();
    return (nat.includes("PH") || nat.includes("PHILIPPINES") || nat.includes("FILIPINO")) &&
           !name.includes("josh") && !name.includes("emjey") && p.profile_image_url;
  }).slice(0, 8);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        applicant_name: data.stage_name,
        legal_name: data.legal_name,
        email: data.email,
        phone: data.phone,
        nationality: data.country,
        city: data.city,
        experience: data.experience,
        social_links: data.social_links,
        interests: data.interests,
        package_interest: data.interests[0] || "not_sure",
        // Media keys from R2 uploads
        ...mediaKeys,
      };
      const response = await base44.functions.invoke("submitPerformerApplication", payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Application submitted! We'll contact you within 48 hours.");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit application");
    },
  });

  const mediaComplete = mediaKeys.profile_photo_r2_keys.length >= 5
    && mediaKeys.intro_video_r2_key
    && mediaKeys.hardcore_video_r2_key
    && mediaKeys.id_document_r2_key;

  const canSubmit = () =>
    formData.stage_name && formData.legal_name && formData.age_confirmed &&
    formData.country && formData.email && formData.consent_confirmed && formData.privacy_accepted
    && mediaComplete;

  return (
    <>
      <SEOMeta
        title="Become a FLESHLAB Performer | Apply Now"
        description="Apply to become a verified 18+ adult performer with FLESHLAB Studios. Professional studio production, performer branding, fanclub visibility and PPV monetization."
        canonical="/become-performer"
        ogImage="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png"
        jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", "name": "Become a FLESHLAB Studios Performer" }}
      />

      <div className="min-h-screen bg-[#080808] text-white">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png)",
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/85 to-[#080808]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />

          <div className="relative max-w-[1280px] mx-auto px-6 py-24 w-full">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-600/30 rounded-full px-4 py-1.5 mb-8">
                <Film className="w-4 h-4 text-rose-400" />
                <span className="text-rose-300 text-sm font-semibold tracking-widest uppercase">Performer Application</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black leading-[1.0] tracking-tight mb-6">
                READY TO BECOME<br />
                A <span className="text-rose-500">FLESHLAB</span><br />
                PERFORMER?
              </h1>

              <p className="text-lg text-white/65 leading-relaxed mb-8 max-w-xl">
                You have seen how FLESHLAB works. Now it is your turn. Apply to become part of an adult content platform built around verified performers, homemade productions, performer branding and long-term visibility.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-5 rounded-xl h-auto shadow-xl shadow-rose-600/35 text-base"
                >
                  Apply as Performer
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-white/20 text-white hover:bg-white/8 font-semibold px-8 py-5 rounded-xl h-auto text-base"
                >
                  See How It Works
                </Button>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/35 text-sm">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Verified 18+ only</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Performer consent required</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Studio approval</span>
                <span className="flex items-center gap-1.5"><Film className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Professional production workflow</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROOF — real performer image wall ─────────────────────────── */}
        {filipinoPerformers.length > 0 && (
          <section className="py-4 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-4">
              {[...filipinoPerformers, ...filipinoPerformers].map((p, i) => (
                <div key={i} className="relative shrink-0 w-32 h-44 rounded-xl overflow-hidden border border-white/8">
                  <img src={p.profile_image_url} alt={p.display_name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-2 left-2 right-2 text-white text-xs font-bold truncate">{p.display_name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── YOU KNOW HOW THE BUSINESS WORKS ──────────────────────────── */}
        <section className="py-20 px-6 border-t border-white/6">
          <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                YOU KNOW HOW THE <span className="text-rose-500">BUSINESS WORKS NOW</span>
              </h2>
              <div className="space-y-5 text-white/60 text-lg leading-relaxed">
                <p>FLESHLAB is not just a website with random videos. It is a platform built around real performers, homemade productions, fanclub access, PPV scenes, performer profiles and long-term content visibility.</p>
                <p className="text-white font-semibold">Fans pay for access.<br />Performers build a public identity.<br />Content becomes part of a growing studio catalogue.</p>
              </div>
            </div>

            {/* proof grid */}
            <div className="grid grid-cols-3 gap-2">
              {PROOF_IMAGES.map((src, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/6">
                  <img src={src} alt="FLESHLAB production" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT FLESHLAB DOES FOR YOU ───────────────────────────────── */}
        <section className="py-20 px-6 bg-gradient-to-b from-[#0d0d0d] to-[#080808]">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-center mb-4">
              WHAT FLESHLAB CAN <span className="text-rose-500">DO FOR YOU</span>
            </h2>
            <p className="text-white/45 text-center mb-12 max-w-xl mx-auto text-lg">
              We do not just film you. We build your performer identity.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
              {[
                { icon: Users,       label: "Performer profile creation",       desc: "A verified public profile that builds your audience over time." },
                { icon: Film,        label: "Professional content planning",     desc: "Scene planning, location, style and boundary documentation." },
                { icon: Shield,      label: "Studio production workflow",        desc: "Full safety protocols, contracts, releases and compliance." },
                { icon: Star,        label: "Scene and boundary planning",       desc: "Your limits, your style, your energy — respected and documented." },
                { icon: TrendingUp,  label: "Marketing assets",                 desc: "Thumbnails, promos and social content from every production." },
                { icon: Crown,       label: "Fanclub visibility",               desc: "Your own fanclub space where fans can subscribe for more." },
                { icon: Film,        label: "PPV monetization",                 desc: "Scenes available as pay-per-view in the FLESHLAB catalogue." },
                { icon: Star,        label: "Long-term performer positioning",  desc: "An ongoing public identity that grows with each release." },
              ].map(({ icon: Icon, label, desc }, i) => (
                <div key={i} className="bg-[#111] border border-white/8 rounded-2xl p-6">
                  <div className="w-9 h-9 rounded-lg bg-rose-600/15 flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="font-bold text-white text-sm mb-1.5">{label}</div>
                  <div className="text-white/45 text-xs leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── IDENTITY STATEMENT ───────────────────────────────────────── */}
        <section className="py-20 px-6 border-y border-white/6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              WE DO NOT JUST FILM YOU.<br />
              <span className="text-rose-500">WE BUILD YOUR PERFORMER IDENTITY.</span>
            </h2>
            <p className="text-xl text-white/55 leading-relaxed">
              A performer is more than a body on camera. Your look, your energy, your style, your limits, your confidence and your audience all matter.
            </p>
          </div>
        </section>

        {/* ── HOW IT WORKS — timeline ──────────────────────────────────── */}
        <section id="how-it-works" className="py-20 px-6 bg-[#0d0d0d]">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-center mb-14">
              HOW IT <span className="text-rose-500">WORKS</span>
            </h2>

            <div className="max-w-3xl mx-auto space-y-4">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-rose-600/15 border border-rose-600/25 flex items-center justify-center">
                    <span className="text-rose-400 font-black text-sm">{step.num}</span>
                  </div>
                  <div className="pt-2.5">
                    <div className="font-bold text-white text-base mb-1">{step.label}</div>
                    <div className="text-white/50 text-sm">{step.desc}</div>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className="hidden" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHO CAN APPLY ────────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-14">
            <div>
              <h2 className="text-4xl font-black mb-8">
                WHO CAN <span className="text-rose-500">APPLY?</span>
              </h2>
              <ul className="space-y-4">
                {[
                  "18 years or older",
                  "Comfortable with adult content production",
                  "Able to provide valid identity verification",
                  "Able to give clear and informed consent",
                  "Open to professional production rules and workflows",
                  "Reliable, communicative and serious about adult work",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-600/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-rose-400" />
                    </div>
                    <span className="text-white/70 text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#111] border border-white/8 rounded-2xl p-8">
              <h2 className="text-3xl font-black mb-4">
                HOW PERFORMERS <span className="text-rose-500">MAY EARN</span>
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-6">
                Approved performers may earn through professional adult productions, content participation, PPV scenes, fanclub visibility, promotional campaigns and long-term studio collaboration.
              </p>
              <ul className="space-y-3">
                {[
                  "Professional adult productions",
                  "PPV scene catalogue revenue",
                  "Fanclub membership visibility",
                  "Promotional campaigns",
                  "Long-term studio collaboration",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/65 text-sm">
                    <ChevronRight className="w-4 h-4 text-rose-500/60 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── APPLICATION FORM ─────────────────────────────────────────── */}
        <section id="application-form" className="py-20 px-6 bg-gradient-to-b from-[#0d0d0d] to-[#080808] border-t border-white/6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                APPLY AS <span className="text-rose-500">PERFORMER</span>
              </h2>
              <p className="text-white/50 text-lg">
                Applications reviewed within 48 hours. All information is kept confidential.
              </p>
            </div>

            <div className="bg-[#111] border border-white/8 rounded-2xl p-8 md:p-10">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white/70">Stage Name (Public)</Label>
                    <Input value={formData.stage_name} onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })} placeholder="Your performer name" className="bg-white/5 border-white/15 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Legal Name (Private)</Label>
                    <Input value={formData.legal_name} onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })} placeholder="For contract purposes" className="bg-white/5 border-white/15 text-white" />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-rose-600/8 border border-rose-600/20 rounded-xl px-4 py-3">
                  <Checkbox checked={formData.age_confirmed} onCheckedChange={(v) => setFormData({ ...formData, age_confirmed: v })} />
                  <span className="text-white/70 text-sm">I confirm I am 18 years or older</span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white/70">Country</Label>
                    <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Where you're based" className="bg-white/5 border-white/15 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">City</Label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Your city" className="bg-white/5 border-white/15 text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70">Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="your@email.com" className="bg-white/5 border-white/15 text-white" />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70">Phone or Messaging App</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone, Telegram, or WhatsApp" className="bg-white/5 border-white/15 text-white" />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70">What interests you?</Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { value: "studio_scenes", label: "Studio productions" },
                      { value: "live_cam",      label: "Live cam shows" },
                      { value: "fanclub",       label: "Fanclub content" },
                      { value: "all",           label: "All of the above" },
                      { value: "not_sure",      label: "Not sure yet" },
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className={`p-4 rounded-xl border cursor-pointer transition-colors ${formData.interests.includes(opt.value) ? "border-rose-600/60 bg-rose-600/10" : "border-white/10 hover:border-white/25 bg-white/3"}`}
                        onClick={() => {
                          setFormData({ ...formData, interests: formData.interests.includes(opt.value) ? formData.interests.filter(i => i !== opt.value) : [...formData.interests, opt.value] });
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={formData.interests.includes(opt.value)} readOnly />
                          <span className="text-sm font-medium text-white/80">{opt.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70">Any Experience?</Label>
                  <Textarea value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} placeholder="Beginners welcome. Pros preferred. Just be honest." className="min-h-[100px] bg-white/5 border-white/15 text-white" />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70">Social Links (Optional)</Label>
                  <Textarea value={formData.social_links} onChange={(e) => setFormData({ ...formData, social_links: e.target.value })} placeholder="Twitter, Instagram, OnlyFans, etc. Or leave blank." className="min-h-[60px] bg-white/5 border-white/15 text-white" />
                </div>

                {/* ── MEDIA & ID UPLOADS ─────────────────────────────── */}
                <div className="space-y-5 pt-6 border-t border-white/8">
                  <div>
                    <h3 className="text-white font-bold text-base mb-1">Required Media & Documents</h3>
                    <p className="text-white/45 text-xs leading-relaxed">
                      All files are uploaded securely to private storage. Only FLESHLAB admin can access them.
                      Your application cannot be submitted until all required files are uploaded.
                    </p>
                  </div>

                  {/* 5 photos */}
                  <MultiPhotoUpload
                    sessionId={sessionId}
                    required
                    onKeysChanged={(keys) => setMediaKeys(prev => ({ ...prev, profile_photo_r2_keys: keys }))}
                  />

                  {/* Body video */}
                  <FileUploadField
                    label="Body / Intro Video"
                    hint="A video showing your body, physique and presence. Required."
                    fileType="intro_video"
                    sessionId={sessionId}
                    accept="video/mp4,video/quicktime,video/webm"
                    required
                    onUploaded={(key) => setMediaKeys(prev => ({ ...prev, intro_video_r2_key: key }))}
                    onCleared={() => setMediaKeys(prev => ({ ...prev, intro_video_r2_key: null }))}
                  />

                  {/* Hardcore video */}
                  <FileUploadField
                    label="Hardcore / Action Video"
                    hint="A video showing explicit action, e.g. masturbation. Required."
                    fileType="hardcore_video"
                    sessionId={sessionId}
                    accept="video/mp4,video/quicktime,video/webm"
                    required
                    onUploaded={(key) => setMediaKeys(prev => ({ ...prev, hardcore_video_r2_key: key }))}
                    onCleared={() => setMediaKeys(prev => ({ ...prev, hardcore_video_r2_key: null }))}
                  />

                  {/* Government ID */}
                  <FileUploadField
                    label="Government ID Document"
                    hint="Passport, national ID card or driver's license. Required for age verification. Strictly private — admin access only."
                    fileType="id_document"
                    sessionId={sessionId}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    required
                    onUploaded={(key) => setMediaKeys(prev => ({ ...prev, id_document_r2_key: key }))}
                    onCleared={() => setMediaKeys(prev => ({ ...prev, id_document_r2_key: null }))}
                  />

                  {!mediaComplete && (
                    <div className="flex items-start gap-2 bg-amber-600/10 border border-amber-600/25 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-amber-300 text-xs leading-relaxed">
                        Please upload all required files before submitting:
                        {mediaKeys.profile_photo_r2_keys.length < 5 && ` ${5 - mediaKeys.profile_photo_r2_keys.length} more photo(s),`}
                        {!mediaKeys.intro_video_r2_key && " body video,"}
                        {!mediaKeys.hardcore_video_r2_key && " hardcore video,"}
                        {!mediaKeys.id_document_r2_key && " ID document"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/8">
                  <div className="flex items-start gap-3">
                    <Checkbox id="consent" checked={formData.consent_confirmed} onCheckedChange={(v) => setFormData({ ...formData, consent_confirmed: v })} />
                    <Label htmlFor="consent" className="font-normal text-sm text-white/65">
                      I confirm this information is accurate and consent to FLESHLAB contacting me regarding this application.
                    </Label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox id="privacy" checked={formData.privacy_accepted} onCheckedChange={(v) => setFormData({ ...formData, privacy_accepted: v })} />
                    <Label htmlFor="privacy" className="font-normal text-sm text-white/65">
                      I accept the <Link to="/privacy" className="text-rose-400 hover:underline">Privacy Policy</Link>.
                    </Label>
                  </div>
                </div>

                {submitMutation.isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submitMutation.error.message}</AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold py-5 rounded-xl text-base h-auto shadow-xl shadow-rose-600/30"
                  disabled={!canSubmit() || submitMutation.isPending}
                  onClick={() => submitMutation.mutate(formData)}
                >
                  {submitMutation.isPending ? "Submitting..." : "Apply as Performer"}
                </Button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}