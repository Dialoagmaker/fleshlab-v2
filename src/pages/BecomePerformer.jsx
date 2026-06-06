import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Check, Film, Shield, Users, TrendingUp, Star, ChevronRight, Crown, Lock, FileText } from "lucide-react";
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
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
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
        ...mediaKeys,
      };
      const response = await base44.functions.invoke("submitPerformerApplication", payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      const applicantName =
        variables.legal_name?.trim() ||
        variables.stage_name?.trim() ||
        "there";
      setSubmittedName(applicantName);
      setSubmitted(true);
    },
    onError: () => {
      // error displayed inline via submitMutation.isError
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

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────
  if (submitted) {
    const whatsappText = `Hi, this is ${submittedName} and I want to confirm my Fleshlab performer application.`;
    const whatsappUrl = `https://wa.me/886958679186?text=${encodeURIComponent(whatsappText)}`;

    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full text-center space-y-6">
          {/* Check icon */}
          <div className="w-16 h-16 rounded-full bg-rose-600/15 border border-rose-600/30 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-rose-400" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black">Application received.</h1>

          <p className="text-white/60 text-base leading-relaxed">
            Your application has been submitted and will be reviewed by our team within <strong className="text-white">48 business hours</strong>.
          </p>

          {/* What happens next */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-left space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-white/35 mb-3">What happens next</div>
            {[
              "We review your profile and uploaded media",
              "If approved, we contact you with next steps",
              "You receive a contract for review and signature",
              "After signing, you receive performer dashboard access",
              "Your public profile goes live after approval and publishing consent",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-600/20 border border-rose-600/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-rose-400 text-[10px] font-black">{i + 1}</span>
                </div>
                <span className="text-white/60 text-sm">{step}</span>
              </div>
            ))}
          </div>

          {/* WhatsApp optional block */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-left space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-white/35">Want to speed up your review?</div>
            <p className="text-white/60 text-sm leading-relaxed">
              Message us on WhatsApp to confirm your application. This helps us identify your submission faster.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.122 1.524 5.855L.057 23.428a.75.75 0 0 0 .914.914l5.573-1.467A11.948 11.948 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.67-.497-5.207-1.368l-.372-.215-3.862 1.016 1.016-3.724-.234-.383A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Message us on WhatsApp
            </a>
            <p className="text-white/30 text-xs leading-relaxed">
              This does not replace the formal application review. All applicants must still complete age verification, identity verification, and compliance checks before any production work can be approved. FLESHLAB may reject applications at its discretion.
            </p>
          </div>

          <Link to="/" className="inline-block text-white/40 hover:text-white/70 text-sm transition-colors">
            ← Back to FLESHLAB
          </Link>
        </div>
      </div>
    );
  }

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
                GET PRODUCED.<br />
                GET PROMOTED.<br />
                <span className="text-rose-500">GET PAID.</span>
              </h1>

              <p className="text-lg text-white/65 leading-relaxed mb-8 max-w-xl">
                Become a verified FLESHLAB performer. Professional studio workflow, contracts, revenue sharing and promotion across platforms.
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
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Contracts included</span>
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Private data handling</span>
                <span className="flex items-center gap-1.5"><Film className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Studio production workflow</span>
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
                { icon: Users,       label: "Your verified public performer profile", desc: "A verified performer page that builds your audience over time." },
                { icon: Film,        label: "Scene planning with your boundaries",     desc: "We plan every scene around your stated limits, style and energy." },
                { icon: Shield,      label: "Full safety workflow",                    desc: "Safety protocols, releases and compliance handled on every production." },
                { icon: Star,        label: "Documented consent and boundaries",       desc: "Your limits are formally documented before any filming begins." },
                { icon: TrendingUp,  label: "Promo kit: thumbnails, clips, posts",    desc: "Marketing assets created from every production for your channels." },
                { icon: Crown,       label: "Your own fanclub — fans subscribe",       desc: "Your personal fanclub space with subscriber access and updates." },
                { icon: Film,        label: "Earn from PPV scene unlocks",             desc: "Your scenes earn from every pay-per-view unlock in the catalogue." },
                { icon: Star,        label: "A performer brand that grows over time",  desc: "An ongoing public identity that gets more valuable with every release." },
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
                HOW PERFORMERS <span className="text-rose-500">EARN</span>
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-5">
                Revenue is split based on your performer model. Here is how it works in practice:
              </p>
              <div className="space-y-4 mb-5">
                <div className="bg-rose-600/8 border border-rose-600/20 rounded-xl p-4">
                  <div className="text-xs font-black uppercase tracking-widest text-rose-400/70 mb-1">Managed Performer (40%)</div>
                  <p className="text-white/65 text-sm leading-relaxed">
                    If your content earns $500 gross in a month, <strong className="text-white">you receive $200</strong>. FLESHLAB receives $300 for production, infrastructure, marketing and distribution.
                  </p>
                </div>
                <div className="bg-purple-600/8 border border-purple-600/20 rounded-xl p-4">
                  <div className="text-xs font-black uppercase tracking-widest text-purple-400/70 mb-1">Network Performer (70%)</div>
                  <p className="text-white/65 text-sm leading-relaxed">
                    If your content earns $500 gross in a month, <strong className="text-white">you receive $350</strong>. FLESHLAB receives $150 for platform and distribution services.
                  </p>
                </div>
              </div>
              <p className="text-white/30 text-xs leading-relaxed">
                Actual earnings depend on content volume, viewer demand, publishing frequency and platform performance.
              </p>
            </div>
          </div>
        </section>

        {/* ── TWO PERFORMER MODELS ─────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 px-6 bg-gradient-to-b from-[#0f0606] to-[#080808] border-t border-white/6">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black mb-3">
                TWO WAYS TO WORK WITH <span className="text-rose-500">FLESHLAB</span>
              </h2>
              <p className="text-white/45 text-base max-w-xl mx-auto">
                Choose the model that fits where you are. You can discuss the right choice during your application review.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Managed */}
              <div className="relative bg-gradient-to-br from-[#1c0808] to-[#0d0505] border-2 border-rose-600/45 rounded-2xl p-8 flex flex-col">
                <div className="absolute -top-3.5 left-6">
                  <span className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    New Performers
                  </span>
                </div>
                <div className="mb-5 mt-2">
                  <div className="text-xs font-black uppercase tracking-widest text-rose-400/60 mb-1">Managed Performer</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-rose-500">40%</span>
                    <span className="text-white/40 text-sm">performer share</span>
                  </div>
                  <div className="text-white/25 text-xs mt-0.5">60% studio share</div>
                </div>
                <p className="text-white/35 text-xs font-bold uppercase tracking-widest mb-2">Best for</p>
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  New performers, first-time adult workers, performers starting from scratch without existing content or audience.
                </p>
                <p className="text-white/35 text-xs font-bold uppercase tracking-widest mb-2">What FLESHLAB provides</p>
                <p className="text-white/60 text-sm leading-relaxed">
                  Production planning, filming, compliance, profile setup, marketing, platform distribution and ongoing management. You bring your look, energy and consent.
                </p>
              </div>

              {/* Network */}
              <div className="relative bg-gradient-to-br from-[#12101c] to-[#0d0d0d] border-2 border-purple-600/40 rounded-2xl p-8 flex flex-col">
                <div className="absolute -top-3.5 left-6">
                  <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Established Creators
                  </span>
                </div>
                <div className="mb-5 mt-2">
                  <div className="text-xs font-black uppercase tracking-widest text-purple-400/60 mb-1">Network Performer</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-purple-400">70%</span>
                    <span className="text-white/40 text-sm">performer share</span>
                  </div>
                  <div className="text-white/25 text-xs mt-0.5">30% studio share</div>
                </div>
                <p className="text-white/35 text-xs font-bold uppercase tracking-widest mb-2">Best for</p>
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  Creators with existing content, an audience, fanbase or platform experience on OnlyFans, Chaturbate, or similar.
                </p>
                <p className="text-white/35 text-xs font-bold uppercase tracking-widest mb-2">What FLESHLAB provides</p>
                <p className="text-white/60 text-sm leading-relaxed">
                  Platform infrastructure, distribution network, SEO, fanclub tools and audience growth. You bring your existing content and audience.
                </p>
              </div>
            </div>

            <p className="text-center text-white/20 text-xs mt-8 max-w-2xl mx-auto">
              The revenue model is reviewed and agreed during application review. Splits apply to gross platform revenue. Not sure which fits you? Select Managed — it can be discussed during review.
            </p>
          </div>
        </section>

        {/* ── TRUST & SAFETY ───────────────────────────────────────────── */}
        <section className="py-20 px-6 border-t border-white/6">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black mb-3">
                YOUR APPLICATION <span className="text-rose-500">IS PRIVATE</span>
              </h2>
              <p className="text-white/45 text-base max-w-xl mx-auto">
                We take your privacy, consent and safety seriously. Here is what you should know before applying.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[
                {
                  icon: Lock,
                  title: "ID documents are private",
                  desc: "All uploaded ID documents are stored in encrypted private storage. Only FLESHLAB compliance staff can access them. They are never made public.",
                },
                {
                  icon: Shield,
                  title: "Media stays private until approved",
                  desc: "Uploaded photos and videos are for application review only. Nothing is published without your explicit consent and approval.",
                },
                {
                  icon: FileText,
                  title: "Contracts are professional and reviewable",
                  desc: "Contracts are legal documents you can read before signing. You have the right to ask questions and to refuse to sign.",
                },
                {
                  icon: Check,
                  title: "Consent and boundaries are documented",
                  desc: "Before any production, your limits and consent are formally recorded. You can withdraw at any time before filming begins.",
                },
                {
                  icon: Shield,
                  title: "No escort, dating or private meetings",
                  desc: "FLESHLAB is a professional adult production platform. We do not provide escort, dating or private meeting services. Applications involving these expectations are rejected.",
                },
                {
                  icon: Star,
                  title: "Compliance explained during onboarding",
                  desc: "Medical testing and compliance requirements are explained clearly during the onboarding stage — not sprung on you unexpectedly.",
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={i} className="bg-[#111] border border-white/8 rounded-2xl p-6">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600/10 flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="font-bold text-white text-sm mb-1.5">{title}</div>
                  <div className="text-white/45 text-xs leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto mt-8 bg-emerald-600/6 border border-emerald-600/20 rounded-2xl px-6 py-4 text-center">
              <p className="text-emerald-400/70 text-sm font-semibold">Verified 18+ only</p>
              <p className="text-white/30 text-xs mt-1">All applicants must provide valid identity verification confirming they are 18 years or older before any production work is approved.</p>
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
                    <AlertDescription>
                      Something went wrong while submitting your application. Please check your details and try again.
                    </AlertDescription>
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