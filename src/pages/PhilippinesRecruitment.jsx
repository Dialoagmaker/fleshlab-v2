import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  CreditCard,
  Laptop,
  Upload,
  Eye,
  Settings,
  TrendingUp,
  Calendar,
  Clock,
  MapPin,
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

export default function PhilippinesRecruitment() {
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent("recruitment_landing_view", { page: "philippines" });
  }, []);

  const handleApplyClick = () => {
    trackEvent("become_performer_cta_click", { source: "philippines_page" });
    navigate("/become-performer");
  };

  const handleWhatsAppClick = () => {
    trackEvent("whatsapp_recruitment_click", { source: "philippines_page" });
    window.open("https://wa.me/639001234567?text=Hi%20FLESHLAB%2C%20I'm%20interested%20in%20becoming%20a%20performer%20from%20the%20Philippines", "_blank");
  };

  const handleRevenueModelClick = (model) => {
    trackEvent("revenue_model_info_click", { source: "philippines_page", model });
  };

  const handleScrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // AI-generated visuals for Filipino creator representation
  const heroImage = "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/ChatGPT%20Image%208.%20Juni%202026%2C%2005_50_08.png";
  const setupImage = "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/ChatGPT%20Image%208.%20Juni%202026%2C%2006_13_39.png";

  return (
    <>
      <SEOMeta
        title="Gay Performer Recruitment Philippines | Start as a Filipino Creator"
        description="Apply as a verified 18+ Filipino gay content creator with FLESHLAB. Start from home with your phone, choose a support model, and build your creator profile safely."
        canonical="/gay-performer-recruitment-philippines"
        noIndex={false}
      />
      
      <div className="min-h-screen bg-white">
        {/* Hero Section - New AI Banner with Overlays */}
        <section data-hero-section className="relative w-full overflow-hidden" style={{ minHeight: '720px', height: 'auto' }}>
          {/* Hero Image Background - using img for better control */}
          <img 
            data-hero-img
            src={heroImage}
            alt="Filipino creator bedroom setup with smartphone, ring light and laptop"
            className="absolute inset-0 z-0 w-full h-full object-cover"
          />

          
          {/* No overlay - image fully visible */}
          
          {/* Content Container */}
          <div className="relative z-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1280px] mx-auto h-full flex items-center">
              <div className="max-w-[600px]" style={{ paddingTop: '130px', paddingBottom: '130px' }}>
                {/* Badge */}
                <div className="flex items-center gap-2 mb-6 w-fit">
                  <span className="text-2xl">🇵🇭</span>
                  <span className="text-white text-sm font-bold tracking-wide uppercase">Filipino Creators 18+</span>
                </div>

                {/* H1 */}
                <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] xl:text-[64px] font-black text-white mb-6 leading-[0.95] tracking-tight">
                  Start Creating<br />From Home in<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2d6f] to-[#ff8a00]">the Philippines</span>
                </h1>
                
                {/* Subheadline */}
                <p className="text-[18px] text-white/90 mb-10 leading-[1.55] font-medium" style={{ maxWidth: '540px' }}>
                  Use your phone, a private space, and a verified 18+ application to get started. FLESHLAB helps with setup, publishing, promotion and fanclub monetization.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Button 
                    size="lg" 
                    className="bg-[#16a34a] hover:bg-[#15803d] text-white shadow-xl hover:shadow-2xl px-12 h-[56px] text-lg w-full sm:w-auto font-bold transition-all rounded-xl"
                    onClick={handleWhatsAppClick}
                  >
                    <MessageCircle className="mr-3 h-6 w-6" />
                    Apply on WhatsApp
                  </Button>
                  <Button 
                    size="lg" 
                    className="border border-white/35 text-white hover:bg-white/12 bg-transparent/50 backdrop-blur-sm h-[56px] px-12 text-lg w-full sm:w-auto font-bold transition-all rounded-xl"
                    onClick={() => handleScrollToSection('how-it-works')}
                  >
                    <Play className="mr-3 h-6 w-6" />
                    See How It Works
                  </Button>
                </div>

                {/* Trust Row */}
                <div className="flex flex-wrap gap-8 text-white font-semibold text-[14px]">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-red-500" />
                    <span>Verified 18+</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-red-500" />
                    <span>Private & Secure</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-red-500" />
                    <span>Earn in PHP or USD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Feature Strip */}
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <div 
                className="px-4 sm:px-6 lg:px-8"
                style={{
                  background: 'rgba(0,0,0,0.62)',
                  backdropFilter: 'blur(10px)',
                  borderTop: '1px solid rgba(255,255,255,0.12)',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  padding: '20px 24px'
                }}
              >
                <div className="max-w-[1280px] mx-auto">
                  <div className="flex flex-wrap gap-[28px] sm:gap-[32px] justify-center text-white/90 text-[13px] font-semibold">
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-[16px] h-[16px] text-red-500" />
                      <span>Discreet Process</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-[16px] h-[16px] text-red-500" />
                      <span>Professional Support</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-[16px] h-[16px] text-red-500" />
                      <span>Global Audience</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-[16px] h-[16px] text-red-500" />
                      <span>Build Your Fanbase</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Start With What You Already Have - Dark */}
        <section className="px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ paddingTop: '72px', paddingBottom: '96px' }}>
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: '#07030a',
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(244, 63, 94, 0.06) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.04) 0%, transparent 50%)
              `
            }}
          />
          
          <div className="max-w-[1280px] mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              {/* Left: Image Card with Overlay */}
              <div className="order-2 lg:order-1">
                <div className="relative max-w-[560px] mx-auto lg:mx-0">
                  <img 
                    src={setupImage}
                    alt="Filipino creator setup with smartphone, ring light, private bedroom"
                    className="w-full rounded-[32px] overflow-hidden object-cover"
                    style={{
                      aspectRatio: '16 / 10',
                      border: '1px solid rgba(255, 138, 0, 0.28)',
                      boxShadow: '0 30px 90px rgba(225, 29, 72, 0.22)',
                      objectPosition: 'center'
                    }}
                  />
                  {/* Subtle Gradient Overlay */}
                  <div 
                    className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none"
                    style={{
                      background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.42) 100%)'
                    }}
                  />
                  {/* HTML Overlay Text */}
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <p className="text-xs font-semibold tracking-wide uppercase opacity-90">
                      Phone. Room. Light. Start.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right: Text + Requirements */}
              <div className="order-1 lg:order-2">
                <Badge 
                  className="mb-5 inline-block text-xs font-bold px-3 py-1.5"
                  style={{ 
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(244, 63, 94, 0.3)'
                  }}
                >
                  CREATOR ESSENTIALS
                </Badge>
                
                <h2 
                  className="font-bold text-white mb-4 leading-tight"
                  style={{ 
                    fontSize: 'clamp(32px, 5vw, 48px)',
                    lineHeight: '1.05',
                    maxWidth: '560px'
                  }}
                >
                  Start with what you already have
                </h2>
                
                <p className="text-base text-gray-400 mb-8 leading-relaxed max-w-[520px]">
                  No studio needed. Your phone, a private room, good lighting and verified 18+ approval are enough to start the review process.
                </p>
                
                {/* 6 Requirement Cards - 2 Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: <Smartphone className="h-[22px] w-[22px] text-rose-400 flex-shrink-0 mt-0.5" />, title: "Smartphone", desc: "1080p camera is enough to apply" },
                    { icon: <Lock className="h-[22px] w-[22px] text-rose-400 flex-shrink-0 mt-0.5" />, title: "Private Room", desc: "A quiet space where you control the scene" },
                    { icon: <Lightbulb className="h-[22px] w-[22px] text-amber-400 flex-shrink-0 mt-0.5" />, title: "Good Lighting", desc: "Natural light or a simple ring light" },
                    { icon: <Wifi className="h-[22px] w-[22px] text-amber-400 flex-shrink-0 mt-0.5" />, title: "Stable Internet", desc: "Upload clips and stay in contact" },
                    { icon: <FileCheck className="h-[22px] w-[22px] text-rose-400 flex-shrink-0 mt-0.5" />, title: "Valid ID 18+", desc: "Passport, UMID, driver's license or government ID", wide: true },
                    { icon: <Banknote className="h-[22px] w-[22px] text-amber-400 flex-shrink-0 mt-0.5" />, title: "Payment Method", desc: "GCash, Maya, bank or crypto where available", wide: true },
                  ].map(item => (
                    <div key={item.title}
                      className={`p-[22px] rounded-[20px] transition-all hover:-translate-y-0.5 cursor-default ${item.wide ? 'sm:col-span-2' : ''}`}
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(244,63,94,0.2)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                    >
                      <div className="flex items-start gap-3">
                        {item.icon}
                        <div>
                          <h4 className="font-bold text-white text-[16px] mb-0.5">{item.title}</h4>
                          <p className="text-[14px] text-gray-400 leading-snug">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Local Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-gray-300 border border-white/15">Manila</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-gray-300 border border-white/15">Cebu</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-gray-300 border border-white/15">Davao</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">GCash</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Maya</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">PHP</span>
                </div>

                {/* Small Note */}
                <p className="text-xs text-gray-500 italic">
                  Availability and payout methods are confirmed during onboarding.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Choose Your Creator Path - Full Background Image with Glass Neon Cards */}
        <section 
          className="relative overflow-hidden bg-black text-white"
          style={{
            padding: 'clamp(76px, 10vw, 120px) 24px'
          }}
        >
          {/* Full Clean Background Image (07_12_26.png) */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/ChatGPT%20Image%208.%20Juni%202026%2C%2007_12_26.png)',
              backgroundSize: '100% auto',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#000000'
            }}
          />

          <div className="max-w-[1280px] mx-auto relative z-10">
            {/* Header */}
            <div className="text-center mb-12">
              <Badge 
                className="mb-4 inline-block text-xs font-black px-4 py-1.5 uppercase tracking-[0.2em] rounded-full"
                style={{ 
                  background: 'transparent',
                  color: '#ff2d6f',
                  border: '1.5px solid #ff2d6f',
                  boxShadow: '0 0 15px rgba(255, 45, 111, 0.4)'
                }}
              >
                CHOOSE YOUR PATH
              </Badge>
              
              <h2 
                className="mb-4 font-black tracking-tight text-white"
                style={{ fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: '1.1' }}
              >
                Which creator type are you?
              </h2>
              
              <p 
                className="text-center mx-auto text-gray-300 leading-relaxed max-w-[720px] font-medium"
                style={{ fontSize: 'clamp(15px, 2.5vw, 17px)' }}
              >
                Whether you're starting with a phone or already have fans, <span className="text-[#ff2d6f] font-bold">FLESHLAB</span> helps you choose the right support model.
              </p>
            </div>

            {/* 5 Glassmorphic Creator Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              
              {/* Card 1: Beginner with Phone (Orange Glow) */}
              <div 
                className="relative rounded-[20px] overflow-hidden flex flex-col justify-between min-h-[460px] transition-all duration-300 cursor-pointer group"
                style={{
                  backgroundImage: `url('https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/7a1c1e9ab_generated_image.png')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  border: '2px solid rgba(249,115,22,0.65)',
                  boxShadow: '0 0 25px rgba(249,115,22,0.3)'
                }}
              >
                {/* Dark gradient overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.8) 65%, rgba(0,0,0,0.97) 100%)' }} />
                
                {/* Icon top-left with neon circle outline */}
                <div className="relative z-10 p-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{
                      border: '1.5px solid rgba(249,115,22,0.85)',
                      boxShadow: '0 0 12px rgba(249,115,22,0.6)',
                      background: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <Smartphone className="h-4 w-4 text-orange-400" />
                  </div>
                </div>

                {/* Bottom content */}
                <div className="relative z-10 p-4 pt-0">
                  <h3 className="font-black text-white leading-[1.1] mb-1.5" style={{ fontSize: 'clamp(20px, 2.5vw, 26px)' }}>Beginner<br />with Phone</h3>
                  <p className="text-gray-300 text-xs leading-relaxed mb-3">Never created before? Start with your phone, private space and full setup support.</p>
                  <div className="flex justify-center">
                    <div 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-orange-300 transition-all group-hover:bg-orange-900/60"
                      style={{
                        background: 'rgba(60,25,0,0.85)',
                        border: '1.5px solid rgba(249,115,22,0.7)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 0 12px rgba(249,115,22,0.3)'
                      }}
                    >
                      <Shield className="h-3.5 w-3.5 text-orange-400" />
                      60/40 Management
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Existing Creator (Pink Glow) */}
              <div 
                className="relative rounded-[20px] overflow-hidden flex flex-col justify-between min-h-[460px] transition-all duration-300 cursor-pointer group"
                style={{
                  backgroundImage: `url('https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/14dcbc4fd_generated_image.png')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  border: '2px solid rgba(244,63,94,0.65)',
                  boxShadow: '0 0 25px rgba(244,63,94,0.3)'
                }}
              >
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.8) 65%, rgba(0,0,0,0.97) 100%)' }} />
                <div className="relative z-10 p-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ border: '1.5px solid rgba(244,63,94,0.85)', boxShadow: '0 0 12px rgba(244,63,94,0.6)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                  >
                    <Camera className="h-4 w-4 text-rose-400" />
                  </div>
                </div>
                <div className="relative z-10 p-4 pt-0">
                  <h3 className="font-black text-white leading-[1.1] mb-1.5" style={{ fontSize: 'clamp(20px, 2.5vw, 26px)' }}>Existing<br />Creator</h3>
                  <p className="text-gray-300 text-xs leading-relaxed mb-3">Have clips or followers already? Add FLESHLAB as your fanclub and distribution hub.</p>
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-rose-300 transition-all group-hover:bg-rose-900/60"
                      style={{ background: 'rgba(60,0,15,0.85)', border: '1.5px solid rgba(244,63,94,0.7)', backdropFilter: 'blur(8px)', boxShadow: '0 0 12px rgba(244,63,94,0.3)' }}
                    >
                      <Share2 className="h-3.5 w-3.5 text-rose-400" />
                      70/30 Network
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Cam Model (Purple Glow) */}
              <div 
                className="relative rounded-[20px] overflow-hidden flex flex-col justify-between min-h-[460px] transition-all duration-300 cursor-pointer group"
                style={{
                  backgroundImage: `url('https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/d55ea64b1_generated_image.png')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  border: '2px solid rgba(168,85,247,0.65)',
                  boxShadow: '0 0 25px rgba(168,85,247,0.3)'
                }}
              >
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.8) 65%, rgba(0,0,0,0.97) 100%)' }} />
                <div className="relative z-10 p-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ border: '1.5px solid rgba(168,85,247,0.85)', boxShadow: '0 0 12px rgba(168,85,247,0.6)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                  >
                    <Play className="h-4 w-4 text-purple-400" />
                  </div>
                </div>
                <div className="relative z-10 p-4 pt-0">
                  <h3 className="font-black text-white leading-[1.1] mb-1.5" style={{ fontSize: 'clamp(20px, 2.5vw, 26px)' }}>Cam<br />Model</h3>
                  <p className="text-gray-300 text-xs leading-relaxed mb-3">Already on Chaturbate, Bigo or other cam sites? Turn live viewers into long-term fans.</p>
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-purple-300 transition-all group-hover:bg-purple-900/60"
                      style={{ background: 'rgba(25,0,50,0.85)', border: '1.5px solid rgba(168,85,247,0.7)', backdropFilter: 'blur(8px)', boxShadow: '0 0 12px rgba(168,85,247,0.3)' }}
                    >
                      <Zap className="h-3.5 w-3.5 text-purple-400" />
                      Hybrid Model
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Couple Creator (Crimson Glow) */}
              <div 
                className="relative rounded-[20px] overflow-hidden flex flex-col justify-between min-h-[460px] transition-all duration-300 cursor-pointer group"
                style={{
                  backgroundImage: `url('https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/ad9918dfa_generated_image.png')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  border: '2px solid rgba(255,0,85,0.65)',
                  boxShadow: '0 0 25px rgba(255,0,85,0.3)'
                }}
              >
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.8) 65%, rgba(0,0,0,0.97) 100%)' }} />
                <div className="relative z-10 p-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ border: '1.5px solid rgba(255,0,85,0.85)', boxShadow: '0 0 12px rgba(255,0,85,0.6)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                  >
                    <Users className="h-4 w-4 text-rose-400" />
                  </div>
                </div>
                <div className="relative z-10 p-4 pt-0">
                  <h3 className="font-black text-white leading-[1.1] mb-1.5" style={{ fontSize: 'clamp(20px, 2.5vw, 26px)' }}>Couple<br />Creator</h3>
                  <p className="text-gray-300 text-xs leading-relaxed mb-3">Create with a partner. Both must verify 18+ and approve every scene.</p>
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-rose-300 transition-all group-hover:bg-rose-900/60"
                      style={{ background: 'rgba(60,0,20,0.85)', border: '1.5px solid rgba(255,0,85,0.7)', backdropFilter: 'blur(8px)', boxShadow: '0 0 12px rgba(255,0,85,0.3)' }}
                    >
                      <Shield className="h-3.5 w-3.5 text-rose-400" />
                      Both Verify 18+
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 5: Fanclub Creator (Amber Glow) */}
              <div 
                className="relative rounded-[20px] overflow-hidden flex flex-col justify-between min-h-[460px] transition-all duration-300 cursor-pointer group"
                style={{
                  backgroundImage: `url('https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/792333559_image.png')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  border: '2px solid rgba(245,158,11,0.65)',
                  boxShadow: '0 0 25px rgba(245,158,11,0.3)'
                }}
              >
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.8) 65%, rgba(0,0,0,0.97) 100%)' }} />
                <div className="relative z-10 p-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ border: '1.5px solid rgba(245,158,11,0.85)', boxShadow: '0 0 12px rgba(245,158,11,0.6)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                  >
                    <Star className="h-4 w-4 text-amber-400" />
                  </div>
                </div>
                <div className="relative z-10 p-4 pt-0">
                  <h3 className="font-black text-white leading-[1.1] mb-1.5" style={{ fontSize: 'clamp(20px, 2.5vw, 26px)' }}>Fanclub<br />Creator</h3>
                  <p className="text-gray-300 text-xs leading-relaxed mb-3">Build recurring monthly income with exclusive clips, updates and supporter perks.</p>
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-amber-300 transition-all group-hover:bg-amber-900/60"
                      style={{ background: 'rgba(50,30,0,0.85)', border: '1.5px solid rgba(245,158,11,0.7)', backdropFilter: 'blur(8px)', boxShadow: '0 0 12px rgba(245,158,11,0.3)' }}
                    >
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                      Fanclub Setup
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Elegant Dark Glowing CTA Panel */}
            <div 
              className="px-8 py-6 rounded-[20px] mb-6 relative overflow-hidden backdrop-blur-md"
              style={{
                background: 'rgba(10,0,5,0.75)',
                border: '1.5px solid rgba(244,63,94,0.35)',
                boxShadow: '0 0 40px rgba(244,63,94,0.12), inset 0 0 60px rgba(0,0,0,0.3)'
              }}
            >
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                
                {/* Left Side Info */}
                <div className="flex items-center gap-5 flex-1 w-full">
                  <div 
                    className="h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      border: '2px solid rgba(244,63,94,0.7)',
                      background: 'rgba(244,63,94,0.12)',
                      boxShadow: '0 0 16px rgba(244,63,94,0.4)'
                    }}
                  >
                    <HelpCircle className="h-7 w-7 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xl">Not sure which path fits you?</h4>
                    <p className="text-gray-400 text-sm">Chat with our team on WhatsApp. No pressure, ask anything.</p>
                  </div>
                </div>

                {/* Right Side Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <Button 
                    className="text-white font-extrabold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    style={{
                      background: '#25D366',
                      boxShadow: '0 0 20px rgba(37,211,102,0.4)'
                    }}
                    onClick={handleWhatsAppClick}
                  >
                    <MessageCircle className="h-5 w-5" />
                    Chat on WhatsApp
                  </Button>
                  
                  <Button 
                    className="text-white font-extrabold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center bg-transparent hover:bg-white/5"
                    style={{
                      border: '2px solid rgba(255,255,255,0.35)'
                    }}
                    onClick={() => handleRevenueModelClick('compare')}
                  >
                    Compare 60/40 & 70/30
                  </Button>
                </div>
              </div>
            </div>

            {/* Bottom Trust Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              <div 
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-bold"
                style={{ background: 'rgba(10,0,5,0.75)', border: '1.5px solid rgba(244,63,94,0.35)', boxShadow: '0 0 10px rgba(244,63,94,0.15)' }}
              >
                <Shield className="h-3.5 w-3.5 text-rose-400" />
                <span>Verified 18+ Only</span>
              </div>
              <div 
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-bold"
                style={{ background: 'rgba(10,0,5,0.75)', border: '1.5px solid rgba(244,63,94,0.35)', boxShadow: '0 0 10px rgba(244,63,94,0.15)' }}
              >
                <Lock className="h-3.5 w-3.5 text-rose-400" />
                <span>Private & Discreet</span>
              </div>
              <div 
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-bold"
                style={{ background: 'rgba(10,0,5,0.75)', border: '1.5px solid rgba(244,63,94,0.35)', boxShadow: '0 0 10px rgba(244,63,94,0.15)' }}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-rose-400" />
                <span>You Approve Everything</span>
              </div>
              <div 
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-bold"
                style={{ background: 'rgba(10,0,5,0.75)', border: '1.5px solid rgba(244,63,94,0.35)', boxShadow: '0 0 10px rgba(244,63,94,0.15)' }}
              >
                <img src="https://flagcdn.com/w20/ph.png" alt="PH" className="h-3.5 w-auto" />
                <span>Support for Filipino Creators</span>
              </div>
              <div 
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-bold"
                style={{ background: 'rgba(10,0,5,0.75)', border: '1.5px solid rgba(244,63,94,0.35)', boxShadow: '0 0 10px rgba(244,63,94,0.15)' }}
              >
                <span className="text-[14px]">₱</span>
                <span>Payouts in PHP</span>
              </div>
            </div>

          </div>
        </section>

        {/* Choose Your Creator Model - Dark Cinematic */}
        <section style={{ background: '#07030a' }} className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/60 text-rose-400 text-xs font-black uppercase tracking-widest mb-5"
                style={{ background: 'rgba(244,63,94,0.08)', boxShadow: '0 0 14px rgba(244,63,94,0.2)' }}>
                Revenue Models
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight">
                Choose your <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">creator</span> model
              </h2>
              <p className="text-gray-400 text-base max-w-xl mx-auto">
                Different support levels, different splits — both are real paths<br />depending on where you start.
              </p>
            </div>

            {/* Two Model Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {/* 60/40 Management Card */}
              <div 
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                style={{ border: '1.5px solid rgba(244,63,94,0.4)', boxShadow: '0 0 30px rgba(244,63,94,0.12)', background: 'rgba(20,5,12,0.95)' }}
                onClick={() => handleRevenueModelClick("60-40-management")}
              >
                {/* Background portrait image right side */}
                <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden">
                  <img 
                    src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/db389db9b_generated_image.png"
                    alt="" className="w-full h-full object-cover object-top opacity-40"
                    style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)' }}
                  />
                </div>
                <div className="relative z-10 p-6">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 text-white"
                    style={{ background: 'rgba(244,63,94,0.85)', boxShadow: '0 0 12px rgba(244,63,94,0.5)' }}>
                    FULL SUPPORT
                  </span>
                  <h3 className="text-lg font-bold text-gray-300 mb-1">60/40 Management Model</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-rose-500">Studio 60%</span>
                    <span className="text-white text-2xl font-black">/ Performer 40%</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-5 leading-relaxed max-w-xs">
                    Best if you want FLESHLAB to help with planning, editing, thumbnails, publishing, promotion, fanclub setup and management.
                  </p>
                  <ul className="space-y-2">
                    {["Full content strategy & planning", "Professional editing & thumbnails", "Fanclub setup & promotion", "Platform distribution & SEO", "Graduate to 70/30 when ready"].map(item => (
                      <li key={item} className="flex items-center gap-2 text-gray-300 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-rose-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 70/30 Network Card */}
              <div 
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                style={{ border: '1.5px solid rgba(245,158,11,0.4)', boxShadow: '0 0 30px rgba(245,158,11,0.1)', background: 'rgba(15,10,3,0.95)' }}
                onClick={() => handleRevenueModelClick("70-30-network")}
              >
                <div className="absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden">
                  <img 
                    src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/107a335d7_generated_image.png"
                    alt="" className="w-full h-full object-cover object-top opacity-40"
                    style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)' }}
                  />
                </div>
                <div className="relative z-10 p-6">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 text-white"
                    style={{ background: 'rgba(245,158,11,0.85)', boxShadow: '0 0 12px rgba(245,158,11,0.5)' }}>
                    MAXIMUM CONTROL
                  </span>
                  <h3 className="text-lg font-bold text-gray-300 mb-1">70/30 Network Model</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-amber-400">Performer 70%</span>
                    <span className="text-white text-2xl font-black">/ Studio 30%</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-5 leading-relaxed max-w-xs">
                    Best if you already have content, followers, cam traffic or experience and want FLESHLAB as an additional fanclub, SEO and distribution hub.
                  </p>
                  <ul className="space-y-2">
                    {["Keep 70% of all revenue", "Upload your own content", "Set your own schedule", "Multi-platform distribution", "Fanclub & PPV tools included"].map(item => (
                      <li key={item} className="flex items-center gap-2 text-gray-300 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th className="text-left py-3 px-4 text-gray-500 font-semibold">Model</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-semibold">Support Level</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-semibold hidden sm:table-cell">Best For</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-semibold hidden md:table-cell">Content Ownership</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-semibold hidden lg:table-cell">Promotion Help</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-semibold hidden lg:table-cell">Fanclub Setup</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="py-3 px-4 text-rose-400 font-bold">60/40 Management</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-0.5">{[1,2,3,4].map(i=><Star key={i} className="h-3.5 w-3.5 text-rose-500 fill-rose-500"/>)}<Star className="h-3.5 w-3.5 text-gray-600"/></div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 hidden sm:table-cell">Beginners or creators who want full support</td>
                    <td className="py-3 px-4 text-gray-400 hidden md:table-cell">Studio manages & publishes</td>
                    <td className="py-3 px-4 text-gray-400 hidden lg:table-cell">Full promotion by FLESHLAB</td>
                    <td className="py-3 px-4 text-gray-400 hidden lg:table-cell">We handle everything</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-amber-400 font-bold">70/30 Network</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-0.5">{[1,2,3].map(i=><Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400"/>)}<Star className="h-3.5 w-3.5 text-gray-600"/><Star className="h-3.5 w-3.5 text-gray-600"/></div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 hidden sm:table-cell">Experienced creators who want more control</td>
                    <td className="py-3 px-4 text-gray-400 hidden md:table-cell">You own & control your content</td>
                    <td className="py-3 px-4 text-gray-400 hidden lg:table-cell">Shared tools & platform support</td>
                    <td className="py-3 px-4 text-gray-400 hidden lg:table-cell">You set up & we support</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Not sure which model fits?</p>
                  <p className="text-gray-500 text-xs">Let's find the best path for your goals.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button className="font-bold text-white rounded-xl gap-2 flex-shrink-0"
                  style={{ background: '#25D366', boxShadow: '0 0 16px rgba(37,211,102,0.35)' }}
                  onClick={handleWhatsAppClick}>
                  <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                </Button>
                <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/5 rounded-xl font-semibold flex-shrink-0"
                  onClick={handleApplyClick}>
                  Ask during application
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How FLESHLAB Helps - Dark with Visual */}
        <section id="how-it-works" style={{ background: '#0a0610' }} className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Steps */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/40 text-rose-400 text-xs font-black uppercase tracking-widest mb-5"
                  style={{ background: 'rgba(244,63,94,0.06)' }}>
                  Your Journey
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
                  How FLESHLAB helps <span className="text-rose-400">after approval</span>
                </h2>
                <p className="text-gray-400 mb-10">Five simple steps from application to earning.</p>

                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-5 bottom-5 w-px" style={{ background: 'linear-gradient(to bottom, rgba(244,63,94,0.6), rgba(244,63,94,0.1))' }} />
                  <div className="space-y-7">
                    {[
                      { n: 1, icon: <ArrowRight className="h-4 w-4 text-rose-400" />, title: "Apply", desc: "Submit via WhatsApp or online form" },
                      { n: 2, icon: <Shield className="h-4 w-4 text-rose-400" />, title: "Verify 18+", desc: "Upload valid ID (KYC) to verify" },
                      { n: 3, icon: <UserCheck className="h-4 w-4 text-rose-400" />, title: "Choose Model", desc: "Pick 60/40 or 70/30 based on your goals" },
                      { n: 4, icon: <Settings className="h-4 w-4 text-rose-400" />, title: "Set Up Profile", desc: "We build your performer & fanclub page" },
                      { n: 5, icon: <TrendingUp className="h-4 w-4 text-rose-400" />, title: "Publish & Grow", desc: "Upload, we handle SEO & promotion — you earn" },
                    ].map(step => (
                      <div key={step.n} className="flex items-start gap-4 relative z-10">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(244,63,94,0.15)', border: '1.5px solid rgba(244,63,94,0.6)', boxShadow: '0 0 12px rgba(244,63,94,0.25)' }}>
                          {step.icon}
                        </div>
                        <div className="pt-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-rose-500 font-black">0{step.n}</span>
                            <h4 className="text-white font-bold text-sm">{step.title}</h4>
                          </div>
                          <p className="text-gray-400 text-xs">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Dashboard mockup visual */}
              <div className="relative hidden lg:block">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(244,63,94,0.25)', boxShadow: '0 0 60px rgba(244,63,94,0.15)' }}>
                  <img 
                    src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/f4d689124_generated_image.png"
                    alt="FLESHLAB creator dashboard"
                    className="w-full object-cover"
                    style={{ aspectRatio: '4/3' }}
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,3,18,0.1) 0%, rgba(10,3,18,0.4) 100%)' }} />
                  <div className="absolute bottom-4 left-4 right-4 px-4 py-3 rounded-xl backdrop-blur-sm"
                    style={{ background: 'rgba(10,3,18,0.75)', border: '1px solid rgba(244,63,94,0.3)' }}>
                    <p className="text-xs text-rose-400 font-bold mb-0.5">Welcome to FLESHLAB</p>
                    <p className="text-white text-xs">Your performer portal — manage earnings, uploads & fanclub.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Philippines Payout Options - Dark with Side Visual */}
        <section style={{ background: '#06030c' }} className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Right side visual */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden xl:block overflow-hidden">
            <img src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/07e76e1e0_generated_image.png"
              alt="" className="w-full h-full object-cover object-center opacity-40"
              style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,0.7), transparent)', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.7), transparent)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(220,0,100,0.15), transparent)' }} />
          </div>

          <div className="max-w-3xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-widest mb-5"
              style={{ background: 'rgba(245,158,11,0.06)' }}>
              Payouts
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Philippines payout options</h2>
            <p className="text-gray-400 mb-8">Multiple methods (subject to confirmation)</p>

            {/* Payment method logos */}
            <div className="flex flex-wrap gap-3 mb-8 items-center">
              {[
                { name: 'GCash', logo: 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/1fa2efa81_generated_image.png', shadow: 'rgba(0,112,224,0.4)' },
                { name: 'Maya', logo: 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/2a6161fc0_generated_image.png', shadow: 'rgba(0,168,89,0.4)' },
                { name: 'BDO', logo: 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/78d5a5e05_generated_image.png', shadow: 'rgba(192,0,0,0.4)' },
                { name: 'BPI', logo: 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3a0e4c484_generated_image.png', shadow: 'rgba(29,58,138,0.4)' },
                { name: 'UnionBank', logo: 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/22bebcbb9_generated_image.png', shadow: 'rgba(234,88,12,0.4)' },
                { name: 'USDT', logo: 'https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/e403a0d8b_generated_image.png', shadow: 'rgba(38,161,123,0.4)' },
              ].map(p => (
                <div key={p.name}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.07)', boxShadow: `0 0 14px ${p.shadow}`, border: `1px solid ${p.shadow}` }}>
                  <img src={p.logo} alt={p.name} className="h-8 w-8 object-contain rounded-lg" />
                  <span className="text-white font-bold text-sm">{p.name}</span>
                </div>
              ))}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Currency', value: 'PHP or USD equivalent', icon: <Banknote className="h-5 w-5 text-amber-400" /> },
                { label: 'Schedule', value: 'Weekly / Monthly depending on agreement', icon: <Calendar className="h-5 w-5 text-amber-400" /> },
                { label: 'Exchange', value: 'Market Rate applied', icon: <TrendingUp className="h-5 w-5 text-amber-400" /> },
                { label: 'Confirmation', value: 'Payout method confirmed during onboarding', icon: <CheckCircle2 className="h-5 w-5 text-amber-400" /> },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-xl flex flex-col gap-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  {item.icon}
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-wide">{item.label}</p>
                  <p className="text-gray-300 text-xs leading-snug">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <HelpCircle className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-400">Important:</strong> No guaranteed income. Earnings vary based on content quality, consistency, audience demand, and your activity level.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy, Consent & Safety - Dark */}
        <section style={{ background: '#040208' }} className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/40 text-green-400 text-xs font-black uppercase tracking-widest mb-5"
              style={{ background: 'rgba(22,163,74,0.06)' }}>
              Trust &amp; Safety
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
              Privacy, consent &amp; <span className="text-green-400">safety</span>
            </h2>
            <p className="text-gray-400 mb-10">Non-negotiable protections for all creators.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[
                { icon: <Shield className="h-5 w-5 text-green-400" />, title: "Verified 18+ Only", desc: "Valid government ID required" },
                { icon: <FileCheck className="h-5 w-5 text-green-400" />, title: "KYC Process", desc: "Identity verification required" },
                { icon: <CheckCircle2 className="h-5 w-5 text-green-400" />, title: "Explicit Consent", desc: "Written approval for all content" },
                { icon: <Lock className="h-5 w-5 text-green-400" />, title: "No Forced Content", desc: "Nothing published without approval" },
                { icon: <Shield className="h-5 w-5 text-green-400" />, title: "No Underage Content", desc: "Strict 18+ policy enforced" },
                { icon: <Heart className="h-5 w-5 text-green-400" />, title: "Your Boundaries", desc: "You decide what to create" },
                { icon: <Eye className="h-5 w-5 text-green-400" />, title: "Performer Approval Required", desc: "All content reviewed and approved by you before publishing", wide: true },
                { icon: <UserCheck className="h-5 w-5 text-green-400" />, title: "No Guaranteed Acceptance", desc: "Applications reviewed individually. Not all applicants are accepted.", wide: true },
              ].map(item => (
                <div key={item.title}
                  className={`flex items-start gap-3 p-4 rounded-xl ${item.wide ? 'sm:col-span-2 lg:col-span-3' : ''}`}
                  style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)' }}>
                  {item.icon}
                  <div>
                    <h4 className="font-bold text-white text-sm mb-0.5">{item.title}</h4>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)' }}>
              <FileCheck className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-green-400">2257 Compliance:</strong> All performers must provide valid government-issued ID proving age 18+. Records maintained as required.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA - Cinematic Dark Banner */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0a0610 0%, #1a0510 50%, #0a0610 100%)' }}>
          {/* Right side image */}
          <div className="absolute right-0 top-0 bottom-0 w-2/5 hidden md:block overflow-hidden">
            <img src="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/792333559_image.png"
              alt="" className="w-full h-full object-cover object-center opacity-50"
              style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,0.8), transparent)', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.8), transparent)' }} />
            {/* Neon vertical lines overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(220,0,100,0.2), transparent)' }} />
          </div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="max-w-xl">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight">
                Ready to apply from<br />the <span className="text-rose-400">Philippines?</span>
                <img src="https://flagcdn.com/w20/ph.png" alt="PH" className="inline-block ml-2 h-6 w-auto align-middle" />
              </h2>
              <p className="text-gray-400 mb-8 text-base">
                Ask questions first. No pressure.<br />Verified 18+ applicants only.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button 
                  size="lg"
                  className="font-bold text-white px-8 h-14 text-base rounded-xl gap-2"
                  style={{ background: '#25D366', boxShadow: '0 0 24px rgba(37,211,102,0.4)' }}
                  onClick={handleWhatsAppClick}>
                  <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
                </Button>
                <Button 
                  size="lg"
                  className="font-bold text-white px-8 h-14 text-base rounded-xl gap-2 bg-transparent border-white/30 hover:bg-white/8"
                  variant="outline"
                  onClick={handleApplyClick}>
                  Start Application <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-6 text-gray-400 text-sm">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-rose-500" /> Verified 18+</div>
                <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-rose-500" /> Private &amp; Secure</div>
                <div className="flex items-center gap-2"><FileCheck className="h-4 w-4 text-rose-500" /> KYC Required</div>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Footer */}
        <footer className="py-10 px-4 sm:px-6 lg:px-8 text-gray-500 text-sm" style={{ background: '#030106' }}>
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <p className="text-gray-600">All performers must be 18+ with valid Philippine government ID. Independent contractor position. Earnings vary and are not guaranteed. You are responsible for your own taxes (BIR).</p>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/2257" className="hover:text-white transition-colors">2257 Compliance</a>
              <a href="/faq" className="hover:text-white transition-colors">FAQ</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}