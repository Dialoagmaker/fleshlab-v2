import { Link, useNavigate } from "react-router-dom";
import { 
  Shield, 
  Film, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  ChevronRight,
  MessageCircle,
  Lock,
  DollarSign,
  Play,
  FileCheck,
  HelpCircle,
  Share2,
  Crown,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOMeta from "@/components/SEOMeta";
import { trackEvent, trackPerformerApplyClick, trackWhatsappRecruitmentClick } from "@/lib/analytics";

// JSON-LD structured data
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Gay OnlyFans Alternative for Creators | FLESHLAB",
    "description": "Looking for a studio-backed alternative as a gay adult creator? Join FLESHLAB for professional content distribution, creator support, and revenue-share options.",
    "url": "https://fleshlab.online/gay-onlyfans-alternative",
    "publisher": {
      "@type": "Organization",
      "name": "FLESHLAB",
      "url": "https://fleshlab.online"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is FLESHLAB an OnlyFans replacement?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "FLESHLAB is not a direct replacement for every creator. It is a studio-backed creator network for gay adult creators who want support with distribution, production planning, compliance, and revenue-share options."
        }
      },
      {
        "@type": "Question",
        "name": "Can I join if I already have an OnlyFans-style page?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Existing creators may apply for the network/distribution model if they already have content, a fanbase, or a creator workflow."
        }
      },
      {
        "@type": "Question",
        "name": "What revenue models are available?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "FLESHLAB offers a studio-managed model with Studio 60% / Performer 40%, and a network model with Performer 70% / Studio 30%."
        }
      },
      {
        "@type": "Question",
        "name": "Do you guarantee income?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. FLESHLAB does not guarantee income. Results depend on content quality, audience demand, consistency, distribution, and performance."
        }
      },
      {
        "@type": "Question",
        "name": "Is ID verification required?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. All performers must be verified 18+ and complete ID/KYC and consent documentation before participating."
        }
      }
    ]
  }
];

const ctaUrl = "/become-performer?source=gay-onlyfans-alternative&market=global&campaign=onlyfans_alternative";

export default function GayOnlyfansAlternative() {
  const navigate = useNavigate();

  const handleCtaClick = () => {
    trackPerformerApplyClick("onlyfans_alternative_apply", "/gay-onlyfans-alternative");
    navigate(ctaUrl);
  };

  const handleWhatsAppClick = () => {
    trackWhatsappRecruitmentClick("/gay-onlyfans-alternative", { source: "gay-onlyfans-alternative", cta_location: "onlyfans_alternative_whatsapp" });
    window.open("https://wa.me/886958679186?text=Hi%20FLESHLAB%2C%20I'm%20interested%20in%20joining%20as%20a%20creator", "_blank");
  };

  const handleRevenueModelClick = (model) => {
    trackEvent("revenue_model_info_click", { source: "gay-onlyfans-alternative", model });
  };

  const handleScrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const heroImage = "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/ChatGPT%20Image%208.%20Juni%202026%2C%2005_50_08.png";
  const dashboardImage = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/f4d689124_generated_image.png";

  return (
    <>
      <SEOMeta
        title="Gay OnlyFans Alternative for Creators | FLESHLAB"
        description="Looking for a studio-backed alternative as a gay adult creator? Join FLESHLAB for professional content distribution, creator support, and revenue-share options."
        canonical="/gay-onlyfans-alternative"
        ogImage="https://fleshlab.online/og-image.jpg"
        jsonLd={jsonLd}
      />
      
      <div style={{ background: '#050505' }}>

        {/* ── HERO SECTION ─────────────────────────────────────────────── */}
        <section className="relative w-full overflow-hidden" style={{ minHeight: '720px', height: 'auto' }}>
          <img 
            src={heroImage}
            alt="Creator setup with professional lighting and camera equipment"
            className="absolute inset-0 z-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 h-48 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, #050505)' }} />

          <div className="relative z-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1280px] mx-auto h-full flex items-center">
              <div className="max-w-[600px]" style={{ paddingTop: '130px', paddingBottom: '160px' }}>
                <div className="flex items-center gap-2 mb-6 w-fit">
                  <Film className="w-5 h-5 text-rose-400" />
                  <span className="text-white text-sm font-bold uppercase tracking-wide">Studio-Backed Creator Network</span>
                </div>
                <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] xl:text-[64px] font-black text-white mb-6 leading-[0.95] tracking-tight">
                  A Studio-Backed<br />Alternative for<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d6f] to-[#ff8a00]">Gay Creators</span>
                </h1>
                <p className="text-[18px] text-white/90 mb-10 leading-[1.55] font-medium" style={{ maxWidth: '540px' }}>
                  FLESHLAB is a studio-backed creator network for gay adult creators. We handle distribution, production support, contracts and revenue-share options so you don't have to figure it out alone.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Button size="lg" className="bg-[#16a34a] hover:bg-[#15803d] text-white shadow-xl px-12 h-[56px] text-lg w-full sm:w-auto font-bold rounded-xl"
                    onClick={handleWhatsAppClick}>
                    <MessageCircle className="mr-3 h-6 w-6" /> Apply on WhatsApp
                  </Button>
                  <Button size="lg" className="border border-white/35 text-white hover:bg-white/12 bg-transparent/50 backdrop-blur-sm h-[56px] px-12 text-lg w-full sm:w-auto font-bold rounded-xl"
                    onClick={() => handleScrollToSection('creator-models')}>
                    <Play className="mr-3 h-6 w-6" /> See Revenue Models
                  </Button>
                </div>
                <div className="flex flex-wrap gap-8 text-white font-semibold text-[14px]">
                  <div className="flex items-center gap-3"><Shield className="w-6 h-6 text-rose-500" /><span>Verified 18+</span></div>
                  <div className="flex items-center gap-3"><Lock className="w-6 h-6 text-rose-500" /><span>Private & Secure</span></div>
                  <div className="flex items-center gap-3"><DollarSign className="w-6 h-6 text-rose-500" /><span>Earn in USD or Crypto</span></div>
                </div>
              </div>
            </div>
            
            {/* Feature strip */}
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <div className="px-4 sm:px-6 lg:px-8"
                style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.12)', padding: '20px 24px' }}>
                <div className="max-w-[1280px] mx-auto">
                  <div className="flex flex-wrap gap-[28px] sm:gap-[32px] justify-center text-white/90 text-[13px] font-semibold">
                    {[
                      { icon: <Shield className="w-[16px] h-[16px] text-rose-500" />, label: "Discreet Process" },
                      { icon: <Film className="w-[16px] h-[16px] text-rose-500" />, label: "Professional Support" },
                      { icon: <Share2 className="w-[16px] h-[16px] text-rose-500" />, label: "Global Distribution" },
                      { icon: <Crown className="w-[16px] h-[16px] text-rose-500" />, label: "Build Your Fanbase" },
                    ].map(i => (
                      <div key={i.label} className="flex items-center gap-2.5">{i.icon}<span>{i.label}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY CREATORS LOOK FOR ALTERNATIVES ───────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ paddingTop: '80px', paddingBottom: '96px' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, #050505 0%, #0b0610 45%, #120814 100%)' }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(ellipse 60% 40% at 15% 50%, rgba(255,45,111,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 85% 60%, rgba(255,138,0,0.05) 0%, transparent 70%)' }} />

          <div className="max-w-[1280px] mx-auto relative z-10">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)', boxShadow: '0 0 16px rgba(244,63,94,0.2)' }}>
                Why Look Beyond Solo Platforms
              </div>
              <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: 'clamp(34px, 5vw, 52px)' }}>
                Solo platform management is <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">hard work</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-base">
                Promotion, editing, compliance requirements and monetization take a lot of time. Time you could spend on content.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="bg-[#111] border border-white/8 rounded-xl p-6">
                <h3 className="text-white font-bold text-lg mb-3">The Solo Creator Challenge</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Running a creator page alone is a lot. You're not just making content. You're also the editor, marketer, compliance officer and support team.
                </p>
              </div>
              <div className="bg-[#111] border border-white/8 rounded-xl p-6">
                <h3 className="text-white font-bold text-lg mb-3">Studio/Network Support</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  FLESHLAB gives you studio infrastructure: distribution, production planning, compliance support and revenue-share options. You don't have to do all of it yourself.
                </p>
              </div>
            </div>

            <div className="bg-amber-600/8 border border-amber-600/20 rounded-xl p-5 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-200/70 text-sm leading-relaxed">
                  <strong className="text-amber-200 block mb-1">Important:</strong>
                  FLESHLAB does not guarantee income. Results depend on content quality, audience demand, consistency and how well the content performs. We provide support and infrastructure, not income guarantees.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CREATOR MODELS ─────────────────────────────────────────── */}
        <section id="creator-models" className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #0f0b15 0%, #0d0a12 50%, #0b0810 100%)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(ellipse 70% 50% at 20% 60%, rgba(244,63,94,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 30%, rgba(245,158,11,0.1) 0%, transparent 60%)' }} />

          <div className="max-w-5xl mx-auto relative z-10">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)', boxShadow: '0 0 16px rgba(244,63,94,0.2)' }}>
                Creator Business Model
              </div>
              <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: 'clamp(32px, 5vw, 50px)' }}>
                Choose your <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">creator model</span>
              </h2>
              <p className="text-white/50 max-w-lg mx-auto text-base">
                Two models. Two splits. Pick the one that fits where you are right now.
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

              {/* ── LEFT: 60/40 Management ── */}
              <div className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-1"
                style={{ border: '1.5px solid rgba(244,63,94,0.6)', boxShadow: '0 0 50px rgba(244,63,94,0.2)' }}
                onClick={() => handleRevenueModelClick("60-40-management")}>

                {/* Background portrait — highly visible */}
                <div className="absolute inset-0">
                  <img
                    src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/db389db9b_generated_image.png"
                    alt=""
                    className="w-full h-full object-cover object-top-right"
                    style={{ opacity: 0.72 }}
                  />
                  {/* Left-to-right gradient: very subtle, content side darker */}
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(105deg, rgba(18,3,10,0.88) 0%, rgba(18,3,10,0.76) 40%, rgba(18,3,10,0.32) 65%, rgba(18,3,10,0.08) 100%)' }} />
                  {/* Bottom fade — shorter, more subtle */}
                  <div className="absolute bottom-0 left-0 right-0 h-20"
                    style={{ background: 'linear-gradient(to top, rgba(18,3,10,0.95) 0%, transparent 100%)' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 p-7 flex flex-col gap-4">
                  {/* Label */}
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black text-white"
                      style={{ background: 'rgba(244,63,94,0.9)', boxShadow: '0 0 14px rgba(244,63,94,0.5)' }}>
                      ✦ FULL SUPPORT
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight mb-0.5">Management / Build-Up</h3>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wide">Studio-Managed Creator Path</p>
                  </div>

                  {/* Revenue split — MOST PROMINENT */}
                  <div className="rounded-xl px-5 py-4 flex items-center gap-3"
                    style={{ background: 'rgba(244,63,94,0.25)', border: '1.5px solid rgba(244,63,94,0.55)', boxShadow: '0 0 24px rgba(244,63,94,0.18)' }}>
                    <div className="text-center flex-1">
                      <div className="text-rose-300 font-black text-4xl leading-none">60%</div>
                      <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">Studio</div>
                    </div>
                    <div className="text-white/30 font-black text-xl">/</div>
                    <div className="text-center flex-1">
                      <div className="text-white font-black text-4xl leading-none">40%</div>
                      <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">You</div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/70 text-sm leading-relaxed">
                    Best if you want full support. FLESHLAB handles setup, publishing, promotion and fanclub management.
                  </p>

                  {/* Feature rows */}
                  <div className="space-y-2.5 pt-1">
                    {[
                      { label: "Best for", value: "Beginners who want full creative support" },
                      { label: "Support", value: "Studio handles editing, promotion & fanclub" },
                      { label: "Publishing", value: "FLESHLAB manages & publishes for you" },
                    ].map(row => (
                      <div key={row.label} className="flex gap-2.5 items-start">
                        <span className="text-rose-400 font-bold text-[11px] w-20 flex-shrink-0 mt-0.5 uppercase tracking-wide">{row.label}</span>
                        <span className="text-white/75 text-xs leading-snug">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── RIGHT: 70/30 Network ── */}
              <div className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-1"
                style={{ border: '1.5px solid rgba(245,158,11,0.6)', boxShadow: '0 0 50px rgba(245,158,11,0.15)' }}
                onClick={() => handleRevenueModelClick("70-30-network")}>

                {/* Background portrait — highly visible */}
                <div className="absolute inset-0">
                  <img
                    src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/107a335d7_generated_image.png"
                    alt=""
                    className="w-full h-full object-cover object-top-right"
                    style={{ opacity: 0.72 }}
                  />
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(105deg, rgba(14,8,2,0.88) 0%, rgba(14,8,2,0.76) 40%, rgba(14,8,2,0.32) 65%, rgba(14,8,2,0.08) 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 h-20"
                    style={{ background: 'linear-gradient(to top, rgba(14,8,2,0.95) 0%, transparent 100%)' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 p-7 flex flex-col gap-4">
                  {/* Label */}
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black text-black"
                      style={{ background: 'rgba(245,158,11,0.95)', boxShadow: '0 0 14px rgba(245,158,11,0.5)' }}>
                      ✦ MAXIMUM CONTROL
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight mb-0.5">Network / Distribution</h3>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wide">Independent Creator Path</p>
                  </div>

                  {/* Revenue split — MOST PROMINENT */}
                  <div className="rounded-xl px-5 py-4 flex items-center gap-3"
                    style={{ background: 'rgba(245,158,11,0.22)', border: '1.5px solid rgba(245,158,11,0.55)', boxShadow: '0 0 24px rgba(245,158,11,0.15)' }}>
                    <div className="text-center flex-1">
                      <div className="text-amber-300 font-black text-4xl leading-none">70%</div>
                      <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">You</div>
                    </div>
                    <div className="text-white/30 font-black text-xl">/</div>
                    <div className="text-center flex-1">
                      <div className="text-white font-black text-4xl leading-none">30%</div>
                      <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">Studio</div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/70 text-sm leading-relaxed">
                    Best if you already have content or an audience and mainly want distribution, SEO support and platform tools.
                  </p>

                  {/* Feature rows */}
                  <div className="space-y-2.5 pt-1">
                    {[
                      { label: "Best for", value: "Creators with existing audience or experience" },
                      { label: "Support", value: "Platform tools, SEO & distribution only" },
                      { label: "Publishing", value: "You upload & control your own content" },
                    ].map(row => (
                      <div key={row.label} className="flex gap-2.5 items-start">
                        <span className="text-amber-400 font-bold text-[11px] w-20 flex-shrink-0 mt-0.5 uppercase tracking-wide">{row.label}</span>
                        <span className="text-white/75 text-xs leading-snug">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center px-6 py-5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}>
              <div className="sm:col-span-1 flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Not sure which model?</p>
                  <p className="text-white/35 text-xs">We'll help you decide.</p>
                </div>
              </div>
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 justify-end">
                <Button className="font-bold text-white rounded-xl gap-2 px-6 h-11"
                  style={{ background: '#25D366', boxShadow: '0 0 16px rgba(37,211,102,0.35)' }}
                  onClick={handleWhatsAppClick}>
                  <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                </Button>
                <Button className="font-bold text-white rounded-xl gap-2 px-6 h-11 border border-rose-500/40 bg-rose-600/15 hover:bg-rose-600/25"
                  onClick={handleCtaClick}>
                  <ChevronRight className="h-4 w-4" /> Start Your Application
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW FLESHLAB SUPPORTS CREATORS ─────────────────────────── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #100713 0%, #0a0610 100%)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 60%)' }} />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-black uppercase tracking-widest text-purple-400"
                  style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.35)' }}>
                  Your Journey
                </div>
                <h2 className="font-black text-white mb-2 leading-tight" style={{ fontSize: 'clamp(30px, 5vw, 44px)' }}>
                  From application<br />to <span className="text-rose-400">first release</span>
                </h2>
                <p className="text-gray-400 mb-10 text-base">
                  We walk you through setup, verification, profile creation, publishing and growth.
                </p>

                <div className="relative">
                  <div className="absolute left-5 top-5 bottom-5 w-[2px] rounded-full"
                    style={{ background: 'linear-gradient(to bottom, rgba(255,45,111,0.8), rgba(168,85,247,0.6), rgba(255,138,0,0.2))' }} />
                  <div className="space-y-6">
                    {[
                      { n: 1, icon: <ChevronRight className="h-4 w-4 text-rose-400" />, title: "Apply", desc: "Submit via WhatsApp or online application form", color: [255,45,111] },
                      { n: 2, icon: <Shield className="h-4 w-4 text-rose-400" />, title: "Verify 18+", desc: "Upload valid government ID for KYC review", color: [255,45,111] },
                      { n: 3, icon: <Users className="h-4 w-4 text-purple-400" />, title: "Choose Model", desc: "Pick 60/40 or 70/30 based on your experience", color: [168,85,247] },
                      { n: 4, icon: <Film className="h-4 w-4 text-purple-400" />, title: "Set Up Profile", desc: "We build your performer & fanclub page", color: [168,85,247] },
                      { n: 5, icon: <TrendingUp className="h-4 w-4 text-amber-400" />, title: "Publish & Grow", desc: "Upload content. We handle SEO and promotion.", color: [245,158,11] },
                    ].map(step => (
                      <div key={step.n} className="flex items-start gap-4 relative z-10">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `rgba(${step.color[0]},${step.color[1]},${step.color[2]},0.15)`, border: `1.5px solid rgba(${step.color[0]},${step.color[1]},${step.color[2]},0.65)`, boxShadow: `0 0 14px rgba(${step.color[0]},${step.color[1]},${step.color[2]},0.3)` }}>
                          {step.icon}
                        </div>
                        <div className="pt-1.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-black" style={{ color: `rgb(${step.color[0]},${step.color[1]},${step.color[2]})` }}>0{step.n}</span>
                            <h4 className="text-white font-bold text-sm">{step.title}</h4>
                          </div>
                          <p className="text-gray-400 text-xs">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative hidden lg:block">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ border: '1.5px solid rgba(168,85,247,0.3)', boxShadow: '0 0 70px rgba(168,85,247,0.15), 0 0 30px rgba(255,45,111,0.1)' }}>
                  <img src={dashboardImage}
                    alt="FLESHLAB creator dashboard" className="w-full object-cover" style={{ aspectRatio: '4/3' }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,3,18,0.08) 0%, rgba(10,3,18,0.45) 100%)' }} />
                  <div className="absolute bottom-4 left-4 right-4 px-4 py-3 rounded-xl backdrop-blur-sm"
                    style={{ background: 'rgba(10,3,18,0.8)', border: '1px solid rgba(168,85,247,0.35)' }}>
                    <p className="text-xs text-purple-400 font-bold mb-0.5">Welcome to FLESHLAB</p>
                    <p className="text-white text-xs">Your performer portal — manage earnings, uploads & fanclub.</p>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 px-4 py-3 rounded-xl backdrop-blur-md"
                  style={{ background: 'rgba(255,45,111,0.15)', border: '1px solid rgba(255,45,111,0.4)', boxShadow: '0 0 20px rgba(255,45,111,0.2)' }}>
                  <p className="text-xs text-rose-400 font-black">Earnings Active</p>
                  <p className="text-white text-lg font-black">$ 0.00</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPLIANCE AND TRUST ────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#050505' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                Compliance & Trust
              </div>
              <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(30px, 5vw, 44px)' }}>
                Verified 18+ • Legal • Safe
              </h2>
              <p className="text-gray-400 text-base max-w-2xl mx-auto">
                All creators must complete ID verification and consent documentation before any content is created or published.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  icon: <Shield className="w-6 h-6 text-rose-400" />,
                  title: "ID/KYC Verification",
                  desc: "Government-issued ID required for all creators. Must be verified 18+ before any content creation."
                },
                {
                  icon: <FileCheck className="w-6 h-6 text-rose-400" />,
                  title: "Consent & Release Forms",
                  desc: "Professional contract generation, consent documentation, and release form management for all productions."
                },
                {
                  icon: <Lock className="w-6 h-6 text-rose-400" />,
                  title: "Private & Secure",
                  desc: "Discreet application process. Your data is encrypted and stored securely. No public exposure without approval."
                },
              ].map((item, i) => (
                <div key={i} className="bg-[#111] border border-white/8 rounded-xl p-6">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(180deg, #050505 0%, #0b0610 100%)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                FAQ
              </div>
              <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(30px, 5vw, 44px)' }}>
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Is FLESHLAB an OnlyFans replacement?",
                  a: "Not for everyone. FLESHLAB is a studio-backed network for gay adult creators who want support with distribution, production planning, compliance and revenue-share options. It's not a self-serve platform."
                },
                {
                  q: "Can I join if I already have an OnlyFans-style page?",
                  a: "Yes. If you already have content, a following or a workflow, apply for the network model. That's what it's designed for."
                },
                {
                  q: "Do you guarantee income?",
                  a: "No. Income depends on content quality, audience demand, consistency and performance. We don't make income promises."
                },
                {
                  q: "Is ID verification required?",
                  a: "Yes. Government-issued ID required. All creators must be verified 18+ and complete KYC and consent documentation before anything else."
                },
              ].map((faq, i) => (
                <div key={i} className="bg-[#111] border border-white/8 rounded-xl p-6">
                  <h3 className="text-white font-bold text-base mb-3">{faq.q}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ───────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#050505' }}>
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(30,5,15,0.98) 0%, rgba(20,3,10,0.98) 100%)', border: '1.5px solid rgba(244,63,94,0.45)', boxShadow: '0 0 60px rgba(244,63,94,0.2)' }}>
              <div className="p-10 md:p-14 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-black uppercase tracking-widest text-rose-400"
                  style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                  Ready to Start?
                </div>
                <h2 className="font-black text-white mb-4" style={{ fontSize: 'clamp(30px, 5vw, 48px)' }}>
                  Join a Studio-Backed Creator Network
                </h2>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-base">
                  Apply and we'll go through your options together. No obligations, no pressure.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="font-bold text-white rounded-xl gap-2 px-10 py-5 h-auto text-lg"
                    style={{ background: '#25D366', boxShadow: '0 0 22px rgba(37,211,102,0.45)' }}
                    onClick={handleWhatsAppClick}>
                    <MessageCircle className="h-5 w-5" /> Apply on WhatsApp
                  </Button>
                  <Button className="font-bold text-white rounded-xl gap-2 px-10 py-5 h-auto text-lg border border-white/20 bg-transparent/50 backdrop-blur-sm"
                    onClick={handleCtaClick}>
                    <ChevronRight className="h-5 w-5" /> Apply Online
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}