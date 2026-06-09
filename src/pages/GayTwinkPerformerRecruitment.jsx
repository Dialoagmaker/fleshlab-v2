import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield,
  CheckCircle2,
  DollarSign,
  Camera,
  MessageCircle,
  ChevronRight,
  Lock,
  FileCheck,
  Users,
  Globe,
  TrendingUp,
  Star,
  Zap,
  Eye,
  Heart,
  Film,
  UserCheck,
  HelpCircle
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import SEOMeta from "@/components/SEOMeta";

const FAQS = [
  {
    q: "Do I need professional porn experience?",
    a: "No. New creators can apply. FLESHLAB reviews your look, comfort level, verification status and production fit. What matters most is that you are verified 18+ and comfortable on camera."
  },
  {
    q: "Do I have to be exclusive?",
    a: "Not always. The right model depends on whether you choose managed support or network/distribution support. Many creators keep existing platforms while working with FLESHLAB."
  },
  {
    q: "Can I keep my OnlyFans, Fansly or cam account?",
    a: "Yes, depending on your agreement. Many creators keep existing platforms while using FLESHLAB for distribution, fanclub and studio releases."
  },
  {
    q: "What is the difference between 60/40 and 70/30?",
    a: "The 60/40 model is for creators who want FLESHLAB to manage more of the setup, publishing and promotion. The 70/30 model is for creators who already have content, traffic or a fanbase and want distribution support."
  },
  {
    q: "Is ID verification required?",
    a: "Yes. All performers must be verified 18+ with valid government-issued ID and signed release documents before any production begins."
  },
  {
    q: "Do you arrange private meetings?",
    a: "No. FLESHLAB does not arrange private dates, escorting or off-platform meetings. This is adult-content production only, with full studio review, consent documentation and performer agreements."
  },
  {
    q: "Can I apply from outside Asia?",
    a: "Yes. FLESHLAB can review international creators depending on production fit, content type and agreement structure. We work with creators from Europe, North America, Australia and other regions."
  },
  {
    q: "How long does the review process take?",
    a: "Initial review usually takes a few days. If your application is shortlisted, we follow up directly to discuss production fit, agreement type and next steps."
  }
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Gay Twink Performer Recruitment | FLESHLAB Studios",
    "description": "Join FLESHLAB as a verified 18+ gay twink performer or content creator. Build studio content, fanclub income and distribution with clear revenue-share models.",
    "url": "https://fleshlab.online/gay-twink-performer-recruitment",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fleshlab.online/" },
        { "@type": "ListItem", "position": 2, "name": "Become a Performer", "item": "https://fleshlab.online/become-performer" },
        { "@type": "ListItem", "position": 3, "name": "Gay Twink Performer Recruitment", "item": "https://fleshlab.online/gay-twink-performer-recruitment" }
      ]
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": { "@type": "Answer", "text": faq.a }
    }))
  }
];

export default function GayTwinkPerformerRecruitment() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    trackEvent("twink_recruitment_page_view", { page: "gay-twink-performer-recruitment" });
  }, []);

  const handleApplyClick = () => {
    trackEvent("twink_recruitment_cta_click", { source: "twink_page", cta: "apply" });
    navigate("/become-performer");
  };

  const handleWhatsAppClick = () => {
    trackEvent("twink_recruitment_whatsapp_click", { source: "twink_page" });
    window.open("https://wa.me/886958679186?text=Hi%20FLESHLAB%2C%20I%20want%20to%20apply%20as%20a%20gay%20twink%20performer.", "_blank");
  };

  return (
    <>
      <SEOMeta
        title="Gay Twink Performer Recruitment | FLESHLAB Studios"
        description="Join FLESHLAB as a verified 18+ gay twink performer or content creator. Build studio content, fanclub income and distribution with clear revenue-share models."
        canonical="/gay-twink-performer-recruitment"
        ogImage="https://fleshlab.online/og-performer-recruitment.jpg"
        jsonLd={jsonLd}
      />

      <div style={{ background: '#050505' }}>

        {/* ── 1. HERO ────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden min-h-[680px] flex items-center py-24 px-5 sm:px-8">
          {/* Abstract gradient — no private asset */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                'radial-gradient(ellipse 80% 60% at 15% 40%, rgba(244,63,94,0.18) 0%, transparent 55%)',
                'radial-gradient(ellipse 60% 50% at 85% 70%, rgba(168,85,247,0.10) 0%, transparent 55%)',
                'linear-gradient(180deg, #050505 0%, #0d0509 50%, #080508 100%)'
              ].join(', ')
            }} />
          {/* Subtle studio light lines */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <div style={{ position: 'absolute', top: '22%', left: '-8%', width: '55%', height: '1px', background: 'linear-gradient(to right, transparent, rgba(244,63,94,0.7), transparent)', transform: 'rotate(-13deg)' }} />
            <div style={{ position: 'absolute', top: '55%', right: '-8%', width: '45%', height: '1px', background: 'linear-gradient(to left, transparent, rgba(168,85,247,0.55), transparent)', transform: 'rotate(9deg)' }} />
          </div>
          <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full opacity-5 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(244,63,94,1) 0%, transparent 70%)' }} />

          <div className="relative z-10 max-w-[1280px] mx-auto w-full">
            <div className="max-w-[640px]">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)', boxShadow: '0 0 14px rgba(244,63,94,0.15)' }}>
                <Camera className="w-3.5 h-3.5" />
                FLESHLAB Studios · Performer Recruitment
              </div>

              <h1 className="font-black text-white leading-[0.95] tracking-tight mb-6"
                style={{ fontSize: 'clamp(42px, 6vw, 72px)' }}>
                Gay Twink<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">
                  Performer Recruitment
                </span>
              </h1>

              <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-10 font-medium" style={{ maxWidth: '520px' }}>
                Join FLESHLAB as a verified 18+ gay twink creator. Build recorded content, fanclub income and long-term distribution with a studio that understands adult creator work.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button size="lg"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black px-9 h-[54px] text-base rounded-xl shadow-xl shadow-rose-900/40"
                  onClick={handleApplyClick}>
                  Apply as Performer
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button size="lg"
                  className="border border-white/30 text-white hover:bg-white/8 bg-transparent h-[54px] px-8 text-base font-bold rounded-xl"
                  onClick={handleWhatsAppClick}>
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Talk on WhatsApp
                </Button>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  { icon: <Shield className="w-3.5 h-3.5 text-rose-400" />, label: "Verified 18+ only" },
                  { icon: <DollarSign className="w-3.5 h-3.5 text-amber-400" />, label: "60/40 or 70/30 models" },
                  { icon: <TrendingUp className="w-3.5 h-3.5 text-rose-400" />, label: "Fanclub + distribution" },
                  { icon: <UserCheck className="w-3.5 h-3.5 text-amber-400" />, label: "No experience required" },
                ].map(chip => (
                  <div key={chip.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white/70 text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {chip.icon}{chip.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. WHO THIS IS FOR ─────────────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8"
          style={{ background: 'linear-gradient(180deg, #080508 0%, #0c0610 100%)' }}>
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                <Users className="w-3.5 h-3.5" />
                Applicant Types
              </div>
              <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
                Who We Are Looking For
              </h2>
              <p className="text-white/50 max-w-xl mx-auto text-base">
                FLESHLAB works with verified 18+ gay creators who have a slim, lean or twink look and want to build adult content with a studio-backed setup.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: <Star className="w-5 h-5 text-amber-400" />,
                  title: "New Creators",
                  desc: "No professional experience required. You need confidence, ID verification and willingness to follow production rules.",
                  color: [245, 158, 11]
                },
                {
                  icon: <TrendingUp className="w-5 h-5 text-rose-400" />,
                  title: "Existing OnlyFans / Fansly Creators",
                  desc: "Keep your platforms and use FLESHLAB for distribution, fanclub and long-term content value.",
                  color: [244, 63, 94]
                },
                {
                  icon: <Camera className="w-5 h-5 text-purple-400" />,
                  title: "Cam Models",
                  desc: "Keep camming while adding recorded content and fanclub income.",
                  color: [168, 85, 247]
                },
                {
                  icon: <Globe className="w-5 h-5 text-rose-400" />,
                  title: "International Creators",
                  desc: "We work with creators from Europe, North America, Australia and other regions, depending on review and production fit.",
                  color: [244, 63, 94]
                },
              ].map(card => {
                const [r, g, b] = card.color;
                return (
                  <div key={card.title} className="rounded-2xl p-6 flex flex-col gap-3"
                    style={{ background: `rgba(${r},${g},${b},0.07)`, border: `1px solid rgba(${r},${g},${b},0.25)` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `rgba(${r},${g},${b},0.15)`, border: `1px solid rgba(${r},${g},${b},0.3)` }}>
                      {card.icon}
                    </div>
                    <h3 className="text-white font-bold text-sm">{card.title}</h3>
                    <p className="text-white/50 text-xs leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3. CREATOR MODELS ──────────────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8"
          style={{ background: 'linear-gradient(180deg, #0c0610 0%, #100713 100%)' }}>
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                Revenue Models
              </div>
              <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
                Choose Your Creator Model
              </h2>
              <p className="text-white/45 max-w-lg mx-auto text-base">
                Two clear models. The split is shown prominently so you always know exactly where earnings go.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 60/40 Managed */}
              <div className="relative rounded-2xl p-8 flex flex-col gap-5"
                style={{ background: 'linear-gradient(135deg, rgba(30,5,15,0.98) 0%, rgba(20,3,10,0.98) 100%)', border: '1.5px solid rgba(244,63,94,0.45)', boxShadow: '0 0 40px rgba(244,63,94,0.12)' }}>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black text-white mb-4"
                    style={{ background: 'rgba(244,63,94,0.85)', boxShadow: '0 0 14px rgba(244,63,94,0.45)' }}>
                    FULL SUPPORT
                  </span>
                  <h3 className="text-xl font-black text-white mb-1">Managed Studio Model</h3>
                  <p className="text-white/35 text-xs uppercase tracking-wide font-bold">Studio-managed path</p>
                </div>
                <div className="rounded-xl px-5 py-4 flex items-center gap-3"
                  style={{ background: 'rgba(244,63,94,0.2)', border: '1.5px solid rgba(244,63,94,0.45)' }}>
                  <div className="text-center flex-1">
                    <div className="text-rose-300 font-black text-4xl leading-none">60%</div>
                    <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">Studio</div>
                  </div>
                  <div className="text-white/25 font-black text-xl">/</div>
                  <div className="text-center flex-1">
                    <div className="text-white font-black text-4xl leading-none">40%</div>
                    <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">You</div>
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Best if you want FLESHLAB to handle setup, publishing, promotion, fanclub management and production planning.
                </p>
                <ul className="space-y-2">
                  {["Creator setup", "Publishing support", "Fanclub management", "Promotion and distribution", "Production coordination"].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-xs text-white/65">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 70/30 Network */}
              <div className="relative rounded-2xl p-8 flex flex-col gap-5"
                style={{ background: 'linear-gradient(135deg, rgba(20,12,3,0.98) 0%, rgba(15,8,2,0.98) 100%)', border: '1.5px solid rgba(245,158,11,0.45)', boxShadow: '0 0 40px rgba(245,158,11,0.10)' }}>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black text-black mb-4"
                    style={{ background: 'rgba(245,158,11,0.9)', boxShadow: '0 0 14px rgba(245,158,11,0.5)' }}>
                    MAXIMUM CONTROL
                  </span>
                  <h3 className="text-xl font-black text-white mb-1">Network / Distribution Model</h3>
                  <p className="text-white/35 text-xs uppercase tracking-wide font-bold">Independent creator path</p>
                </div>
                <div className="rounded-xl px-5 py-4 flex items-center gap-3"
                  style={{ background: 'rgba(245,158,11,0.18)', border: '1.5px solid rgba(245,158,11,0.5)' }}>
                  <div className="text-center flex-1">
                    <div className="text-amber-300 font-black text-4xl leading-none">70%</div>
                    <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">You</div>
                  </div>
                  <div className="text-white/25 font-black text-xl">/</div>
                  <div className="text-center flex-1">
                    <div className="text-white font-black text-4xl leading-none">30%</div>
                    <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">Studio</div>
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Best if you already have content, followers or cam traffic and mainly want distribution, SEO support and platform tools.
                </p>
                <ul className="space-y-2">
                  {["Keep more control", "Keep existing platforms", "Add FLESHLAB distribution", "Fanclub support", "SEO and release support"].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-xs text-white/65">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. WHAT FLESHLAB HANDLES ───────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8"
          style={{ background: 'linear-gradient(180deg, #100713 0%, #0d0810 100%)' }}>
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-amber-400"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                Studio Support
              </div>
              <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
                What FLESHLAB Helps With
              </h2>
              <p className="text-white/45 max-w-xl mx-auto text-base">
                You stay focused on creating. FLESHLAB helps structure the business side, publishing flow and long-term distribution.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Film className="w-5 h-5 text-rose-400" />, label: "Content publishing" },
                { icon: <UserCheck className="w-5 h-5 text-rose-400" />, label: "Performer profile setup" },
                { icon: <Heart className="w-5 h-5 text-rose-400" />, label: "Fanclub access" },
                { icon: <Globe className="w-5 h-5 text-amber-400" />, label: "Platform distribution" },
                { icon: <TrendingUp className="w-5 h-5 text-amber-400" />, label: "SEO and release structure" },
                { icon: <FileCheck className="w-5 h-5 text-rose-400" />, label: "Contracts and release forms" },
                { icon: <DollarSign className="w-5 h-5 text-amber-400" />, label: "Payout tracking" },
                { icon: <Zap className="w-5 h-5 text-rose-400" />, label: "Content planning" },
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center gap-2.5 p-5 rounded-2xl text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {item.icon}
                  <span className="text-white/65 text-xs font-semibold leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. REQUIREMENTS ────────────────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8"
          style={{ background: 'linear-gradient(180deg, #0d0810 0%, #0a0610 100%)' }}>
          <div className="max-w-[900px] mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-emerald-400"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <Shield className="w-3.5 h-3.5" />
                Requirements
              </div>
              <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
                Basic Requirements
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {[
                { icon: <Shield className="w-4 h-4 text-emerald-400" />, label: "Verified 18+", desc: "Valid government ID required" },
                { icon: <FileCheck className="w-4 h-4 text-emerald-400" />, label: "Performer agreement", desc: "Signed before any production" },
                { icon: <Lock className="w-4 h-4 text-emerald-400" />, label: "Signed consent and release forms", desc: "Required for all content" },
                { icon: <Camera className="w-4 h-4 text-emerald-400" />, label: "Comfortable on camera", desc: "Solo or duo content options" },
                { icon: <Eye className="w-4 h-4 text-emerald-400" />, label: "Health/testing requirements", desc: "Depending on scene type" },
                { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, label: "FLESHLAB production rules", desc: "Compliance with all studio guidelines" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                  <div>
                    <div className="text-white font-bold text-sm">{item.label}</div>
                    <div className="text-white/45 text-xs mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Compliance box */}
            <div className="rounded-2xl p-6"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1.5px solid rgba(244,63,94,0.35)', boxShadow: '0 0 30px rgba(244,63,94,0.08)' }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(244,63,94,0.2)', border: '1px solid rgba(244,63,94,0.4)' }}>
                  <Shield className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-white font-black text-base mb-2">Verified 18+ Adult Production Only</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    FLESHLAB does not arrange private dates, escorting, off-platform meetings or guaranteed sexual services. All work is handled as verified adult-content production with consent, documentation and studio review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. WHY TWINK CREATORS FIT ──────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8"
          style={{ background: 'linear-gradient(180deg, #0a0610 0%, #0d0812 100%)' }}>
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                Creator Fit
              </div>
              <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
                Why Twink Creators Fit FLESHLAB
              </h2>
              <p className="text-white/45 max-w-2xl mx-auto text-base leading-relaxed">
                FLESHLAB is built around gay creator content, fanclub discovery and long-tail distribution. Twink performers with a natural, amateur or creator-driven style can fit especially well when the content is planned, released and promoted properly.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: <Camera className="w-5 h-5 text-rose-400" />, label: "Natural creator style", color: [244,63,94] },
                { icon: <Heart className="w-5 h-5 text-rose-400" />, label: "Fanclub-friendly content", color: [244,63,94] },
                { icon: <Users className="w-5 h-5 text-amber-400" />, label: "Solo and duo options", color: [245,158,11] },
                { icon: <TrendingUp className="w-5 h-5 text-amber-400" />, label: "Long-tail video value", color: [245,158,11] },
              ].map(card => {
                const [r, g, b] = card.color;
                return (
                  <div key={card.label} className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
                    style={{ background: `rgba(${r},${g},${b},0.08)`, border: `1px solid rgba(${r},${g},${b},0.28)` }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: `rgba(${r},${g},${b},0.15)`, border: `1px solid rgba(${r},${g},${b},0.35)` }}>
                      {card.icon}
                    </div>
                    <span className="text-white font-bold text-sm">{card.label}</span>
                  </div>
                );
              })}
            </div>

            <p className="text-white/25 text-xs text-center max-w-lg mx-auto">
              Earnings vary based on content quality, consistency, audience demand and activity level. No income guarantees are made.
            </p>
          </div>
        </section>

        {/* ── 7. FAQ ─────────────────────────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8"
          style={{ background: 'linear-gradient(180deg, #0d0812 0%, #0b0610 100%)' }}>
          <div className="max-w-[700px] mx-auto">
            <div className="text-center mb-10">
              <HelpCircle className="w-8 h-8 text-rose-500/50 mx-auto mb-3" />
              <h2 className="font-black text-white mb-2" style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-2">
              {FAQS.map(({ q, a }, i) => (
                <div key={i} className="rounded-2xl overflow-hidden"
                  style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    className="w-full text-left px-6 py-4 flex items-start justify-between gap-4"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-bold text-white text-sm leading-snug">{q}</span>
                    <ChevronRight className={`w-4 h-4 text-white/30 shrink-0 mt-0.5 transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 text-white/50 text-sm leading-relaxed border-t border-white/5 pt-4">{a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. INTERNAL LINKS ──────────────────────────────────────────── */}
        <section className="py-14 px-5 sm:px-8"
          style={{ background: 'linear-gradient(180deg, #0b0610 0%, #08060e 100%)' }}>
          <div className="max-w-[900px] mx-auto">
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest text-center mb-6">Related Pages</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { label: "Become a Performer", href: "/become-performer" },
                { label: "Philippines Recruitment", href: "/gay-performer-recruitment-philippines" },
                { label: "OnlyFans Alternative", href: "/gay-onlyfans-alternative" },
                { label: "Cam Model Studio", href: "/chaturbate-model-join-studio" },
                { label: "Fanclub", href: "/fanclub" },
              ].map(link => (
                <a key={link.href} href={link.href}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white/55 hover:text-rose-400 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. FINAL CTA ───────────────────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8" style={{ background: '#050505' }}>
          <div className="max-w-[800px] mx-auto">
            <div className="relative rounded-3xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(30,5,15,0.98) 0%, rgba(20,3,10,0.98) 100%)', border: '1.5px solid rgba(244,63,94,0.45)', boxShadow: '0 0 60px rgba(244,63,94,0.15)' }}>
              <div className="p-10 md:p-14 text-center">
                <h2 className="font-black text-white mb-4 leading-tight" style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
                  Ready to Apply as a<br />
                  <span className="text-rose-400">FLESHLAB Twink Creator?</span>
                </h2>
                <p className="text-white/55 mb-3 max-w-md mx-auto text-base">
                  Send your application and choose the creator model that fits your goals. We review every performer before approval.
                </p>
                <p className="text-white/25 text-xs mb-8 max-w-sm mx-auto">
                  All applicants must be verified 18+. Not all applications are approved.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Button size="lg"
                    className="font-black text-white rounded-xl px-10 h-14 text-base bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-900/40"
                    onClick={handleApplyClick}>
                    Apply as Performer
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                  <Button size="lg"
                    className="font-bold text-white rounded-xl px-10 h-14 text-base gap-2"
                    style={{ background: '#25D366', boxShadow: '0 0 22px rgba(37,211,102,0.4)' }}
                    onClick={handleWhatsAppClick}>
                    <MessageCircle className="h-5 w-5" /> Talk on WhatsApp
                  </Button>
                </div>
                <div className="flex flex-wrap justify-center gap-6 text-white/30 text-sm">
                  <div className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-rose-500/50" />Verified 18+</div>
                  <div className="flex items-center gap-1.5"><FileCheck className="h-4 w-4 text-rose-500/50" />KYC required</div>
                  <div className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-rose-500/50" />Consent docs</div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center space-y-3">
              <p className="text-white/20 text-xs leading-relaxed max-w-2xl mx-auto">
                All performers must be 18+ with valid government ID. Independent contractor position. Earnings vary and are not guaranteed. No exclusivity required unless explicitly agreed.
              </p>
              <div className="flex flex-wrap justify-center gap-5 text-white/20 text-xs">
                <a href="/terms" className="hover:text-white/40 transition-colors">Terms</a>
                <a href="/privacy" className="hover:text-white/40 transition-colors">Privacy</a>
                <a href="/2257" className="hover:text-white/40 transition-colors">2257 Compliance</a>
                <a href="/faq" className="hover:text-white/40 transition-colors">FAQ</a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}