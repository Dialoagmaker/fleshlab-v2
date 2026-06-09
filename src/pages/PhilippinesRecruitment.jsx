import React, { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  CheckCircle2, 
  Shield, 
  Smartphone, 
  Wifi, 
  Lightbulb, 
  UserCheck,
  Camera,
  DollarSign,
  Heart,
  Lock,
  FileCheck,
  ArrowRight,
  Play,
  Users,
  Globe,
  Upload,
  Eye,
  Settings,
  TrendingUp,
  Calendar,
  Banknote,
  Sparkles,
  Zap,
  Star,
  HelpCircle,
  Crown,
  Share2
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import SEOMeta from "@/components/SEOMeta";
import BPApplicationForm from "@/components/becomePerformer/BPApplicationForm";
import gcashLogo from "@/assets/payment-logos/gcash.svg";
import mayaLogo from "@/assets/payment-logos/maya.svg";
import bdoLogo from "@/assets/payment-logos/bdo.svg";
import bpiLogo from "@/assets/payment-logos/bpi.svg";
import unionbankLogo from "@/assets/payment-logos/unionbank.svg";
import usdtLogo from "@/assets/payment-logos/usdt.svg";

export default function PhilippinesRecruitment() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract URL params for attribution
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      source: params.get("source") || "philippines-recruitment",
      market: params.get("market") || "philippines",
      campaign: params.get("campaign") || "pinoy_recruitment",
    };
  }, [location.search]);

  useEffect(() => {
    // Track Philippines-specific page view
    trackEvent("philippines_recruitment_page_view", { 
      page: "philippines", 
      market: urlParams.market,
      source: urlParams.source,
      campaign: urlParams.campaign 
    });
  }, [urlParams]);

  const handleApplyClick = () => {
    trackEvent("philippines_recruitment_cta_click", { source: "philippines_page", market: "philippines" });
    navigate("/application-upload?source=philippines-recruitment&market=philippines");
  };

  const handleWhatsAppClick = () => {
    trackEvent("philippines_whatsapp_click", { source: "philippines_page", market: "philippines" });
    window.open("https://wa.me/886958679186?text=Hi%20FLESHLAB%2C%20I'm%20interested%20in%20becoming%20a%20performer%20from%20the%20Philippines", "_blank");
  };

  const handleRevenueModelClick = (model) => {
    trackEvent("revenue_model_info_click", { source: "philippines_page", model });
  };

  const handleScrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const heroImage = "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/ChatGPT%20Image%208.%20Juni%202026%2C%2005_50_08.png";
  const setupImage = "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/ChatGPT%20Image%208.%20Juni%202026%2C%2006_13_39.png";

  return (
    <>
      <SEOMeta
        title="Gay Performer Recruitment Philippines | FLESHLAB"
        description="Apply as a verified Filipino gay performer or adult content creator with FLESHLAB. Professional studio support, content distribution, performer contracts, and revenue share options."
        canonical="/gay-performer-recruitment-philippines"
        noIndex={false}
      />
      
      <div style={{ background: '#050505' }}>

        {/* ── SECTION 1: HERO ── keep untouched, just ensure dark bottom fade */}
        <section data-hero-section className="relative w-full overflow-hidden" style={{ minHeight: '720px', height: 'auto' }}>
          <img 
            data-hero-img
            src={heroImage}
            alt="Filipino creator bedroom setup with smartphone, ring light and laptop"
            className="absolute inset-0 z-0 w-full h-full object-cover"
          />
          {/* bottom dark fade into next section */}
          <div className="absolute bottom-0 left-0 right-0 h-48 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, #050505)' }} />

          <div className="relative z-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1280px] mx-auto h-full flex items-center">
              <div className="max-w-[600px]" style={{ paddingTop: '130px', paddingBottom: '160px' }}>
                <div className="flex items-center gap-2 mb-6 w-fit">
                  <span className="text-2xl">🇵🇭</span>
                  <span className="text-white text-sm font-bold tracking-wide uppercase">Filipino Creators 18+</span>
                </div>
                <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] xl:text-[64px] font-black text-white mb-6 leading-[0.95] tracking-tight">
                  Start Creating<br />From Home in<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d6f] to-[#ff8a00]">the Philippines</span>
                </h1>
                <p className="text-[18px] text-white/90 mb-10 leading-[1.55] font-medium" style={{ maxWidth: '540px' }}>
                  Use your phone, a private space, and a verified 18+ application to get started. FLESHLAB helps with setup, publishing, promotion and fanclub monetization.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Button size="lg" className="bg-[#16a34a] hover:bg-[#15803d] text-white shadow-xl px-12 h-[56px] text-lg w-full sm:w-auto font-bold rounded-xl"
                    onClick={handleWhatsAppClick}>
                    <MessageCircle className="mr-3 h-6 w-6" /> Apply on WhatsApp
                  </Button>
                  <Button size="lg" className="border border-white/35 text-white hover:bg-white/12 bg-transparent/50 backdrop-blur-sm h-[56px] px-12 text-lg w-full sm:w-auto font-bold rounded-xl"
                    onClick={() => handleScrollToSection('how-it-works')}>
                    <Play className="mr-3 h-6 w-6" /> See How It Works
                  </Button>
                </div>
                <div className="flex flex-wrap gap-8 text-white font-semibold text-[14px]">
                  <div className="flex items-center gap-3"><Shield className="w-6 h-6 text-rose-500" /><span>Verified 18+</span></div>
                  <div className="flex items-center gap-3"><Lock className="w-6 h-6 text-rose-500" /><span>Private & Secure</span></div>
                  <div className="flex items-center gap-3"><DollarSign className="w-6 h-6 text-rose-500" /><span>Earn in PHP or USD</span></div>
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
                      { icon: <Smartphone className="w-[16px] h-[16px] text-rose-500" />, label: "Professional Support" },
                      { icon: <Globe className="w-[16px] h-[16px] text-rose-500" />, label: "Global Audience" },
                      { icon: <Heart className="w-[16px] h-[16px] text-rose-500" />, label: "Build Your Fanbase" },
                    ].map(i => (
                      <div key={i.label} className="flex items-center gap-2.5">{i.icon}<span>{i.label}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: CREATOR TOOLKIT ── */}
        <section className="px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ paddingTop: '80px', paddingBottom: '96px' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, #050505 0%, #0b0610 45%, #120814 100%)' }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(ellipse 60% 40% at 15% 50%, rgba(255,45,111,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 85% 60%, rgba(255,138,0,0.05) 0%, transparent 70%)' }} />

          <div className="max-w-[1280px] mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: image */}
              <div className="order-2 lg:order-1">
                <div className="relative max-w-[560px] mx-auto lg:mx-0">
                  <img src={setupImage}
                    alt="Filipino creator setup with smartphone and ring light"
                    className="w-full rounded-[28px] object-cover"
                    style={{ aspectRatio: '16/10', border: '1.5px solid rgba(255,45,111,0.3)', boxShadow: '0 0 60px rgba(255,45,111,0.18), 0 30px 80px rgba(0,0,0,0.6)', objectPosition: 'center' }} />
                  <div className="absolute inset-0 rounded-[28px] pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(11,6,16,0.75) 100%)' }} />
                  <div className="absolute bottom-5 left-5 right-5">
                    <span className="text-xs font-black tracking-[0.18em] uppercase text-rose-400/90">Phone. Room. Light. Start.</span>
                  </div>
                </div>
              </div>

              {/* Right: text + cards */}
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-black uppercase tracking-widest text-rose-400"
                  style={{ background: 'rgba(255,45,111,0.1)', border: '1px solid rgba(255,45,111,0.3)' }}>
                  Creator Toolkit
                </div>
                <h2 className="font-black text-white mb-4 leading-[1.05]" style={{ fontSize: 'clamp(30px, 5vw, 46px)' }}>
                  Start with what<br />you already have
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed text-base">
                  No studio needed. Your phone, a private room, good lighting and verified 18+ approval are enough to start the review process.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: <Smartphone className="h-5 w-5 text-rose-400 flex-shrink-0" />, title: "Smartphone", desc: "1080p camera is enough to apply" },
                    { icon: <Lock className="h-5 w-5 text-rose-400 flex-shrink-0" />, title: "Private Room", desc: "A quiet space where you control the scene" },
                    { icon: <Lightbulb className="h-5 w-5 text-amber-400 flex-shrink-0" />, title: "Good Lighting", desc: "Natural light or a simple ring light" },
                    { icon: <Wifi className="h-5 w-5 text-amber-400 flex-shrink-0" />, title: "Stable Internet", desc: "Upload clips and stay in contact" },
                    { icon: <FileCheck className="h-5 w-5 text-rose-400 flex-shrink-0" />, title: "Valid ID 18+", desc: "Passport, UMID, driver's license or government ID", wide: true },
                    { icon: <Banknote className="h-5 w-5 text-amber-400 flex-shrink-0" />, title: "Payment Method", desc: "GCash, Maya, bank or crypto where available", wide: true },
                  ].map(item => (
                    <div key={item.title}
                      className={`flex items-start gap-3 p-4 rounded-2xl transition-all hover:-translate-y-0.5 cursor-default ${item.wide ? 'sm:col-span-2' : ''}`}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,45,111,0.18)', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}>
                      <div className="mt-0.5">{item.icon}</div>
                      <div>
                        <h4 className="font-bold text-white text-sm mb-0.5">{item.title}</h4>
                        <p className="text-xs text-gray-400 leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Manila", style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#9ca3af' } },
                    { label: "Cebu", style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#9ca3af' } },
                    { label: "Davao", style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#9ca3af' } },
                    { label: "GCash", style: { background: 'rgba(0,112,224,0.15)', border: '1px solid rgba(0,112,224,0.35)', color: '#93c5fd' } },
                    { label: "Maya", style: { background: 'rgba(0,168,89,0.12)', border: '1px solid rgba(0,168,89,0.3)', color: '#86efac' } },
                    { label: "PHP", style: { background: 'rgba(255,138,0,0.12)', border: '1px solid rgba(255,138,0,0.3)', color: '#fcd34d' } },
                  ].map(p => (
                    <span key={p.label} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={p.style}>{p.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: CREATOR PATH ── kept, improved borders + card size */}
        <section className="relative overflow-hidden" style={{ padding: 'clamp(72px, 10vw, 112px) 24px', background: '#050505' }}>
          {/* Background performer image */}
          <div className="absolute inset-0 z-0"
            style={{ backgroundImage: 'url(https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/ChatGPT%20Image%208.%20Juni%202026%2C%2007_12_26.png)', backgroundSize: '100% auto', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat', backgroundColor: '#000' }} />
          {/* Heavy overlay so text stays readable */}
          <div className="absolute inset-0 z-1 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.4) 40%, rgba(5,5,5,0.75) 80%, #050505 100%)' }} />

          <div className="max-w-[1280px] mx-auto relative z-10">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-[0.2em] text-rose-400"
                style={{ background: 'transparent', border: '1.5px solid #ff2d6f', boxShadow: '0 0 16px rgba(255,45,111,0.4)' }}>
                Choose Your Path
              </div>
              <h2 className="font-black text-white mb-4" style={{ fontSize: 'clamp(36px, 6vw, 62px)', lineHeight: '1.08' }}>
                Which creator type are you?
              </h2>
              <p className="text-gray-300 max-w-xl mx-auto leading-relaxed" style={{ fontSize: 'clamp(15px, 2.5vw, 17px)' }}>
                Whether you're starting with a phone or already have fans, <span className="text-rose-400 font-bold">FLESHLAB</span> helps you choose the right support model.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {[
                { img: 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/7a1c1e9ab_generated_image.png', icon: <Smartphone className="h-4 w-4 text-orange-400" />, title: 'Beginner\nwith Phone', desc: 'Never created before? Start with your phone, private space and full setup support.', badge: '60/40 Management', badgeIcon: <Shield className="h-3.5 w-3.5" />, color: [249,115,22], path: 'beginner_phone' },
                { img: 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/14dcbc4fd_generated_image.png', icon: <Camera className="h-4 w-4 text-rose-400" />, title: 'Existing\nCreator', desc: 'Have clips or followers already? Add FLESHLAB as your fanclub and distribution hub.', badge: '70/30 Network', badgeIcon: <Share2 className="h-3.5 w-3.5" />, color: [244,63,94], path: 'existing_creator' },
                { img: 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/d55ea64b1_generated_image.png', icon: <Play className="h-4 w-4 text-purple-400" />, title: 'Cam\nModel', desc: 'Already on Chaturbate or Bigo? Turn live viewers into long-term fanclub subscribers.', badge: 'Hybrid Model', badgeIcon: <Zap className="h-3.5 w-3.5" />, color: [168,85,247], path: 'cam_model' },
                { img: 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/ad9918dfa_generated_image.png', icon: <Users className="h-4 w-4 text-rose-400" />, title: 'Couple\nCreator', desc: 'Create with a partner. Both must verify 18+ and approve every scene.', badge: 'Both Verify 18+', badgeIcon: <Shield className="h-3.5 w-3.5" />, color: [255,0,85], path: 'couple_creator' },
                { img: 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/792333559_image.png', icon: <Star className="h-4 w-4 text-amber-400" />, title: 'Fanclub\nCreator', desc: 'Build recurring monthly income with exclusive clips, updates and supporter perks.', badge: 'Fanclub Setup', badgeIcon: <Crown className="h-3.5 w-3.5" />, color: [245,158,11], path: 'fanclub_creator' },
              ].map(card => {
                const [r,g,b] = card.color;
                const handlePathClick = () => {
                  trackEvent("creator_path_card_click", { source: "philippines_page", path: card.path, title: card.title });
                };
                return (
                  <div key={card.title}
                    onClick={handlePathClick}
                    className="relative rounded-[22px] overflow-hidden flex flex-col justify-between cursor-pointer group transition-all duration-300 hover:-translate-y-1"
                    style={{ minHeight: '480px', backgroundImage: `url('${card.img}')`, backgroundSize: 'cover', backgroundPosition: 'center top', border: `2px solid rgba(${r},${g},${b},0.7)`, boxShadow: `0 0 30px rgba(${r},${g},${b},0.35)` }}>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.82) 65%, rgba(0,0,0,0.98) 100%)' }} />
                    <div className="relative z-10 p-5">
                      <div className="h-11 w-11 rounded-full flex items-center justify-center"
                        style={{ border: `1.5px solid rgba(${r},${g},${b},0.9)`, boxShadow: `0 0 16px rgba(${r},${g},${b},0.7)`, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
                        {card.icon}
                      </div>
                    </div>
                    <div className="relative z-10 p-5 pt-0">
                      <h3 className="font-black text-white leading-[1.1] mb-2 whitespace-pre-line" style={{ fontSize: 'clamp(20px, 2.2vw, 25px)' }}>{card.title}</h3>
                      <p className="text-gray-300 text-xs leading-relaxed mb-4">{card.desc}</p>
                      <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs w-fit"
                        style={{ background: `rgba(${r},${g},${b},0.18)`, border: `1.5px solid rgba(${r},${g},${b},0.75)`, backdropFilter: 'blur(8px)', boxShadow: `0 0 14px rgba(${r},${g},${b},0.35)`, color: `rgb(${Math.min(r+80,255)},${Math.min(g+80,255)},${Math.min(b+80,255)})` }}>
                        {card.badgeIcon}{card.badge}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA panel */}
            <div className="px-8 py-6 rounded-[20px] backdrop-blur-md"
              style={{ background: 'rgba(8,0,4,0.82)', border: '1.5px solid rgba(255,45,111,0.35)', boxShadow: '0 0 50px rgba(255,45,111,0.1)' }}>
              <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ border: '2px solid rgba(255,45,111,0.7)', background: 'rgba(255,45,111,0.12)', boxShadow: '0 0 18px rgba(255,45,111,0.4)' }}>
                    <HelpCircle className="h-6 w-6 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Not sure which path fits you?</h4>
                    <p className="text-gray-400 text-sm">Chat with our team. No pressure, ask anything.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <Button className="font-extrabold text-white px-7 py-3.5 rounded-xl gap-2"
                    style={{ background: '#25D366', boxShadow: '0 0 22px rgba(37,211,102,0.45)' }}
                    onClick={handleWhatsAppClick}>
                    <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: CREATOR BUSINESS MODEL ── */}
        <section style={{ background: 'linear-gradient(180deg, #050505 0%, #0b0610 50%, #100713 100%)' }} className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(ellipse 70% 50% at 20% 60%, rgba(244,63,94,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 30%, rgba(245,158,11,0.05) 0%, transparent 60%)' }} />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)', boxShadow: '0 0 16px rgba(244,63,94,0.2)' }}>
                Creator Business Model
              </div>
              <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: 'clamp(34px, 5vw, 52px)' }}>
                Choose your <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">creator model</span>
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto text-base">
                Two creator models. Pick the setup that fits your goals.
              </p>
            </div>

            {/* Two premium model cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* 60/40 */}
              <div className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, rgba(30,5,15,0.98) 0%, rgba(20,3,10,0.98) 100%)', border: '1.5px solid rgba(244,63,94,0.45)', boxShadow: '0 0 40px rgba(244,63,94,0.15)' }}
                onClick={() => handleRevenueModelClick("60-40-management")}>
                {/* Background portrait */}
                <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden">
                  <img src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/db389db9b_generated_image.png"
                    alt="" className="w-full h-full object-cover object-top opacity-30"
                    style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,0.5), transparent)', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.5), transparent)' }} />
                </div>
                <div className="relative z-10 p-8">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black mb-5 text-white"
                    style={{ background: 'rgba(244,63,94,0.85)', boxShadow: '0 0 14px rgba(244,63,94,0.55)' }}>
                    ✦ FULL SUPPORT
                  </span>
                  <h3 className="text-2xl font-black text-white mb-1">60/40 Management</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-black text-rose-400">Studio 60%</span>
                    <span className="text-gray-400 text-xl font-bold">/ You 40%</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-xs">
                    Best if you want FLESHLAB to help build your creator presence — from setup to publishing, promotion and fanclub management.
                  </p>
                  {/* 3 comparison rows */}
                  <div className="space-y-3">
                    {[
                      { label: "Best for", value: "Beginners who want full creative support" },
                      { label: "Support level", value: "Studio handles editing, promotion & fanclub" },
                      { label: "Publishing", value: "FLESHLAB manages & publishes for you" },
                    ].map(row => (
                      <div key={row.label} className="flex gap-3">
                        <span className="text-rose-500 font-bold text-xs w-28 flex-shrink-0 mt-0.5">{row.label}</span>
                        <span className="text-gray-300 text-xs leading-snug">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 70/30 */}
              <div className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, rgba(20,12,3,0.98) 0%, rgba(15,8,2,0.98) 100%)', border: '1.5px solid rgba(245,158,11,0.45)', boxShadow: '0 0 40px rgba(245,158,11,0.12)' }}
                onClick={() => handleRevenueModelClick("70-30-network")}>
                <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden">
                  <img src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/107a335d7_generated_image.png"
                    alt="" className="w-full h-full object-cover object-top opacity-30"
                    style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,0.5), transparent)', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.5), transparent)' }} />
                </div>
                <div className="relative z-10 p-8">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black mb-5 text-black"
                    style={{ background: 'rgba(245,158,11,0.9)', boxShadow: '0 0 14px rgba(245,158,11,0.5)' }}>
                    ✦ MAXIMUM CONTROL
                  </span>
                  <h3 className="text-2xl font-black text-white mb-1">70/30 Network</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-black text-amber-400">You 70%</span>
                    <span className="text-gray-400 text-xl font-bold">/ Studio 30%</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-xs">
                    Best if you already have content, followers, cam traffic or experience and want FLESHLAB as an extra fanclub, SEO and distribution hub.
                  </p>
                  <div className="space-y-3">
                    {[
                      { label: "Best for", value: "Creators with existing audience or experience" },
                      { label: "Support level", value: "Platform tools, SEO & distribution" },
                      { label: "Publishing", value: "You upload & control your own content" },
                    ].map(row => (
                      <div key={row.label} className="flex gap-3">
                        <span className="text-amber-400 font-bold text-xs w-28 flex-shrink-0 mt-0.5">{row.label}</span>
                        <span className="text-gray-300 text-xs leading-snug">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Model CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Not sure which model fits?</p>
                  <p className="text-gray-500 text-xs">Chat on WhatsApp — we'll figure it out together.</p>
                </div>
              </div>
              <Button className="font-bold text-white rounded-xl gap-2 flex-shrink-0 px-7"
                style={{ background: '#25D366', boxShadow: '0 0 18px rgba(37,211,102,0.4)' }}
                onClick={handleWhatsAppClick}>
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </Button>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: FROM APPLICATION TO FIRST RELEASE ── */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
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
                  We guide the setup, verification, profile, publishing and growth process.
                </p>

                <div className="relative">
                  {/* Vertical neon line */}
                  <div className="absolute left-5 top-5 bottom-5 w-[2px] rounded-full"
                    style={{ background: 'linear-gradient(to bottom, rgba(255,45,111,0.8), rgba(168,85,247,0.6), rgba(255,138,0,0.2))' }} />
                  <div className="space-y-6">
                    {[
                      { n: 1, icon: <ArrowRight className="h-4 w-4 text-rose-400" />, title: "Apply", desc: "Submit via WhatsApp or online application form", color: [255,45,111] },
                      { n: 2, icon: <Shield className="h-4 w-4 text-rose-400" />, title: "Verify 18+", desc: "Upload valid government ID for KYC review", color: [255,45,111] },
                      { n: 3, icon: <UserCheck className="h-4 w-4 text-purple-400" />, title: "Choose Model", desc: "Pick 60/40 or 70/30 based on your experience", color: [168,85,247] },
                      { n: 4, icon: <Settings className="h-4 w-4 text-purple-400" />, title: "Set Up Profile", desc: "We build your performer & fanclub page", color: [168,85,247] },
                      { n: 5, icon: <TrendingUp className="h-4 w-4 text-amber-400" />, title: "Publish & Grow", desc: "Upload content — we handle SEO & promotion, you earn", color: [245,158,11] },
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

              {/* Right: dark glass dashboard mockup */}
              <div className="relative hidden lg:block">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ border: '1.5px solid rgba(168,85,247,0.3)', boxShadow: '0 0 70px rgba(168,85,247,0.15), 0 0 30px rgba(255,45,111,0.1)' }}>
                  <img src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/f4d689124_generated_image.png"
                    alt="FLESHLAB creator dashboard" className="w-full object-cover" style={{ aspectRatio: '4/3' }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,3,18,0.08) 0%, rgba(10,3,18,0.45) 100%)' }} />
                  <div className="absolute bottom-4 left-4 right-4 px-4 py-3 rounded-xl backdrop-blur-sm"
                    style={{ background: 'rgba(10,3,18,0.8)', border: '1px solid rgba(168,85,247,0.35)' }}>
                    <p className="text-xs text-purple-400 font-bold mb-0.5">Welcome to FLESHLAB</p>
                    <p className="text-white text-xs">Your performer portal — manage earnings, uploads & fanclub.</p>
                  </div>
                </div>
                {/* Floating stat cards */}
                <div className="absolute -top-4 -right-4 px-4 py-3 rounded-xl backdrop-blur-md"
                  style={{ background: 'rgba(255,45,111,0.15)', border: '1px solid rgba(255,45,111,0.4)', boxShadow: '0 0 20px rgba(255,45,111,0.2)' }}>
                  <p className="text-xs text-rose-400 font-black">Earnings Active</p>
                  <p className="text-white text-lg font-black">₱ 0.00</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 6: PAYOUT OPTIONS ── */}
        <section style={{ background: 'linear-gradient(180deg, #0a0610 0%, #06030c 100%)' }} className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(245,158,11,0.05) 0%, transparent 60%)' }} />
          <div className="max-w-3xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-black uppercase tracking-widest text-amber-400"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', boxShadow: '0 0 14px rgba(245,158,11,0.15)' }}>
              Payouts
            </div>
            <h2 className="font-black text-white mb-2" style={{ fontSize: 'clamp(28px, 5vw, 42px)' }}>
              Payout options in the Philippines
            </h2>
            <p className="text-gray-500 mb-10 text-base">Local payout methods are confirmed during onboarding.</p>

            {/* Payment method logos — real SVG assets */}
            <div className="flex flex-wrap gap-2.5 mb-10">
              {[
                { name: 'GCash',      logo: gcashLogo },
                { name: 'Maya',       logo: mayaLogo },
                { name: 'BDO',        logo: bdoLogo },
                { name: 'BPI',        logo: bpiLogo },
                { name: 'UnionBank',  logo: unionbankLogo },
                { name: 'USDT',       logo: usdtLogo },
              ].map(method => (
                <div key={method.name}
                  className="payment-logo-chip"
                  style={{
                    height: '56px',
                    minWidth: '130px',
                    padding: '0 18px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <img
                    src={method.logo}
                    alt={`${method.name} payout option`}
                    className="payment-logo"
                    style={{
                      maxHeight: '30px',
                      maxWidth: '125px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block'
                    }} />
                </div>
              ))}
            </div>

            {/* 3 info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { icon: <Banknote className="h-5 w-5 text-amber-400" />, label: "Currency", value: "PHP or USD equivalent" },
                { icon: <Calendar className="h-5 w-5 text-amber-400" />, label: "Schedule", value: "Weekly or monthly depending on agreement" },
                { icon: <CheckCircle2 className="h-5 w-5 text-amber-400" />, label: "Confirmation", value: "Payout method confirmed during onboarding" },
              ].map(item => (
                <div key={item.label} className="p-5 rounded-2xl flex flex-col gap-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}>
                  {item.icon}
                  <p className="text-amber-400 text-xs font-black uppercase tracking-wider">{item.label}</p>
                  <p className="text-gray-300 text-sm leading-snug">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <HelpCircle className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-400">Important:</strong> No guaranteed income. Earnings vary based on content quality, consistency, audience demand, and your activity level.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: PRIVACY, CONSENT & SAFETY ── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #06030c 0%, #03120b 50%, #03120b 100%)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(22,163,74,0.07) 0%, transparent 60%)' }} />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-black uppercase tracking-widest text-emerald-400"
                style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.35)' }}>
                Trust & Safety
              </div>
              <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(30px, 5vw, 44px)' }}>
                Privacy, consent &amp; <span className="text-emerald-400">safety</span>
              </h2>
              <p className="text-gray-400 max-w-md mx-auto">You stay in control of what you create. These are non-negotiable protections for all creators.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[
                { icon: <Shield className="h-5 w-5 text-emerald-400" />, title: "Verified 18+ Only", desc: "Valid government ID required — no exceptions" },
                { icon: <FileCheck className="h-5 w-5 text-emerald-400" />, title: "KYC Process", desc: "Identity verification required before any content" },
                { icon: <Heart className="h-5 w-5 text-emerald-400" />, title: "Your Boundaries", desc: "You decide exactly what you create and what you don't" },
                { icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />, title: "Explicit Consent", desc: "Written approval required for all content" },
                { icon: <Lock className="h-5 w-5 text-emerald-400" />, title: "No Forced Content", desc: "Nothing is published without your direct approval" },
                { icon: <Shield className="h-5 w-5 text-emerald-400" />, title: "No Underage Content", desc: "Strict 18+ policy — enforced, not negotiable" },
                { icon: <Eye className="h-5 w-5 text-emerald-400" />, title: "Performer Approval Required", desc: "Every piece of content is reviewed and approved by you before publishing", wide: true },
                { icon: <UserCheck className="h-5 w-5 text-emerald-400" />, title: "No Guaranteed Acceptance", desc: "Applications are reviewed individually. Not all applicants are accepted.", wide: true },
              ].map(item => (
                <div key={item.title}
                  className={`flex items-start gap-3 p-4 rounded-2xl transition-all hover:-translate-y-0.5 cursor-default ${item.wide ? 'sm:col-span-2 lg:col-span-3' : ''}`}
                  style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.22)', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                  <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-0.5">{item.title}</h4>
                    <p className="text-xs text-gray-400 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)' }}>
              <FileCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-emerald-400">2257 Compliance:</strong> All performers must provide valid government-issued ID proving age 18+. Records maintained as required by applicable law.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 8: FINAL CTA ── */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0a0610 0%, #1a0510 40%, #0b0808 70%, #050505 100%)' }}>
          {/* Neon glow orbs */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(ellipse 50% 70% at 70% 50%, rgba(255,45,111,0.12) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 20% 80%, rgba(37,211,102,0.06) 0%, transparent 50%)' }} />
          {/* Right side image */}
          <div className="absolute right-0 top-0 bottom-0 w-2/5 hidden md:block overflow-hidden">
            <img src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/792333559_image.png"
              alt="" className="w-full h-full object-cover object-center opacity-40"
              style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,0.7), transparent)', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.7), transparent)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(220,0,100,0.15), transparent)' }} />
          </div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="max-w-xl">
              <h2 className="font-black text-white mb-4 leading-tight" style={{ fontSize: 'clamp(36px, 6vw, 58px)' }}>
                Ready to apply from<br />the <span className="text-rose-400">Philippines?</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" className="inline-block ml-2 align-middle" style={{ height: '26px', width: 'auto', borderRadius: '3px', verticalAlign: 'middle', flexShrink: 0 }}>
                  <rect width="900" height="300" fill="#0038A8"/>
                  <rect width="900" height="300" y="300" fill="#CE1126"/>
                  <polygon points="0,0 450,300 0,600" fill="white"/>
                  <g transform="translate(155,300)">
                    <polygon points="0,-38 8.6,-11.8 32.4,-11.8 13,4.5 20.5,30.4 0,15.6 -20.5,30.4 -13,4.5 -32.4,-11.8 -8.6,-11.8" fill="#FCD116" transform="translate(-85,-105)"/>
                    <polygon points="0,-38 8.6,-11.8 32.4,-11.8 13,4.5 20.5,30.4 0,15.6 -20.5,30.4 -13,4.5 -32.4,-11.8 -8.6,-11.8" fill="#FCD116" transform="translate(-85,105)"/>
                    <polygon points="0,-38 8.6,-11.8 32.4,-11.8 13,4.5 20.5,30.4 0,15.6 -20.5,30.4 -13,4.5 -32.4,-11.8 -8.6,-11.8" fill="#FCD116" transform="translate(75,0)"/>
                    <circle r="50" fill="none" stroke="#FCD116" strokeWidth="9"/>
                    <circle r="28" fill="#FCD116"/>
                    <circle r="18" fill="#0038A8"/>
                  </g>
                </svg>
              </h2>
              <p className="text-gray-400 mb-10 text-lg leading-relaxed">
                Ask questions first. No pressure.<br />
                <span className="text-gray-500 text-base">Verified 18+ applicants only.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button size="lg" className="font-bold text-white px-10 h-14 text-base rounded-xl gap-2"
                  style={{ background: '#25D366', boxShadow: '0 0 30px rgba(37,211,102,0.5)' }}
                  onClick={handleWhatsAppClick}>
                  <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
                </Button>
                <Button size="lg" variant="outline"
                  className="font-bold text-white px-10 h-14 text-base rounded-xl gap-2 bg-transparent hover:bg-white/8"
                  style={{ border: '1.5px solid rgba(255,255,255,0.28)' }}
                  onClick={handleApplyClick}>
                  Start Application <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-6 text-gray-400 text-sm">
                <div className="flex items-center gap-2.5"><Shield className="h-4 w-4 text-rose-500" /><span>Verified 18+</span></div>
                <div className="flex items-center gap-2.5"><Lock className="h-4 w-4 text-rose-500" /><span>Private & Secure</span></div>
                <div className="flex items-center gap-2.5"><FileCheck className="h-4 w-4 text-rose-500" /><span>KYC Required</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── APPLICATION FORM ── */}
        <section id="apply-section" className="py-24 px-4 bg-[#050505]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(255,45,111,0.1)', border: '1px solid rgba(255,45,111,0.35)' }}>
                <span>🇵🇭 Philippines Application</span>
              </div>
              <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(30px, 5vw, 44px)' }}>
                Start Your <span className="text-rose-400">Application</span>
              </h2>
              <p className="text-gray-400 max-w-md mx-auto">Private application · Reviewed within 48 hours · All uploads are confidential</p>
            </div>
            <BPApplicationForm 
              sourcePage="gay-performer-recruitment-philippines" 
              sourceCountry="Philippines"
              utmSource={urlParams.source}
              utmMarket={urlParams.market}
              utmCampaign={urlParams.campaign}
            />
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-10 px-4 sm:px-6 lg:px-8 text-gray-600 text-sm" style={{ background: '#030106', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <p className="text-gray-600 text-xs leading-relaxed">All performers must be 18+ with valid Philippine government ID. Independent contractor position. Earnings vary and are not guaranteed. You are responsible for your own taxes (BIR).</p>
            <div className="flex flex-wrap justify-center gap-6">
              {[['/terms','Terms'], ['/privacy','Privacy'], ['/2257','2257 Compliance'], ['/faq','FAQ']].map(([href, label]) => (
                <a key={href} href={href} className="hover:text-white transition-colors">{label}</a>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}