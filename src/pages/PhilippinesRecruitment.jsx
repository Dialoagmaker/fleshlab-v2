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
  HelpCircle
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
  const heroImage = "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/ChatGPT%20Image%208.%20Juni%202026%2C%2006_33_23.png";
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
            style={{ objectPosition: '62% 45%' }}
          />
          <style>
            {`
              @media (min-width: 1400px) {
                [data-hero-section] {
                  min-height: 760px !important;
                }
              }
              @media (max-width: 1024px) {
                [data-hero-section] {
                  min-height: 660px !important;
                }
              }
              @media (max-width: 768px) {
                [data-hero-section] {
                  min-height: 760px !important;
                }
                [data-hero-img] {
                  object-position: 62% 45% !important;
                }
              }
              [data-hero-section] {
                min-height: 720px !important;
              }
            `}
          </style>
          
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

        {/* Start With What You Already Have - Warm Filipino Creator */}
        <section className="px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ paddingTop: '72px', paddingBottom: '96px' }}>
          {/* Warm Philippines Sunset Background */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: '#fff1e8',
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(255, 138, 0, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(225, 29, 72, 0.06) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(255, 191, 150, 0.05) 0%, transparent 70%)
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
                    backgroundColor: 'rgba(255, 138, 0, 0.12)',
                    color: '#9a3412',
                    border: '1px solid rgba(255, 138, 0, 0.25)'
                  }}
                >
                  CREATOR ESSENTIALS
                </Badge>
                
                <h2 
                  className="font-bold text-gray-900 mb-4 leading-tight"
                  style={{ 
                    fontSize: 'clamp(32px, 5vw, 48px)',
                    lineHeight: '1.05',
                    maxWidth: '560px'
                  }}
                >
                  Start with what you already have
                </h2>
                
                <p className="text-base text-gray-700 mb-8 leading-relaxed max-w-[520px]">
                  No studio needed. Your phone, a private room, good lighting and verified 18+ approval are enough to start the review process.
                </p>
                
                {/* 6 Requirement Cards - 2 Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {/* Smartphone */}
                  <div 
                    className="p-[22px] rounded-[20px] transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-default"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.82)',
                      border: '1px solid rgba(225, 70, 100, 0.18)',
                      boxShadow: '0 10px 28px rgba(20, 20, 20, 0.05)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Smartphone className="h-[22px] w-[22px] text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-[16px] mb-0.5">Smartphone</h4>
                        <p className="text-[14px] text-gray-700 leading-snug">1080p camera is enough to apply</p>
                      </div>
                    </div>
                  </div>

                  {/* Private Room */}
                  <div 
                    className="p-[22px] rounded-[20px] transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-default"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.82)',
                      border: '1px solid rgba(225, 70, 100, 0.18)',
                      boxShadow: '0 10px 28px rgba(20, 20, 20, 0.05)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Lock className="h-[22px] w-[22px] text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-[16px] mb-0.5">Private Room</h4>
                        <p className="text-[14px] text-gray-700 leading-snug">A quiet space where you control the scene</p>
                      </div>
                    </div>
                  </div>

                  {/* Good Lighting */}
                  <div 
                    className="p-[22px] rounded-[20px] transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-default"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.82)',
                      border: '1px solid rgba(225, 70, 100, 0.18)',
                      boxShadow: '0 10px 28px rgba(20, 20, 20, 0.05)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-[22px] w-[22px] text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-[16px] mb-0.5">Good Lighting</h4>
                        <p className="text-[14px] text-gray-700 leading-snug">Natural light or a simple ring light</p>
                      </div>
                    </div>
                  </div>

                  {/* Stable Internet */}
                  <div 
                    className="p-[22px] rounded-[20px] transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-default"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.82)',
                      border: '1px solid rgba(225, 70, 100, 0.18)',
                      boxShadow: '0 10px 28px rgba(20, 20, 20, 0.05)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Wifi className="h-[22px] w-[22px] text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-[16px] mb-0.5">Stable Internet</h4>
                        <p className="text-[14px] text-gray-700 leading-snug">Upload clips and stay in contact</p>
                      </div>
                    </div>
                  </div>

                  {/* Valid ID 18+ - Full Width */}
                  <div 
                    className="p-[22px] rounded-[20px] transition-all hover:-translate-y-0.5 hover:shadow-lg sm:col-span-2 cursor-default"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.82)',
                      border: '1px solid rgba(225, 70, 100, 0.18)',
                      boxShadow: '0 10px 28px rgba(20, 20, 20, 0.05)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <FileCheck className="h-[22px] w-[22px] text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-[16px] mb-0.5">Valid ID 18+</h4>
                        <p className="text-[14px] text-gray-700 leading-snug">Passport, UMID, driver's license or government ID</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method - Full Width */}
                  <div 
                    className="p-[22px] rounded-[20px] transition-all hover:-translate-y-0.5 hover:shadow-lg sm:col-span-2 cursor-default"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.82)',
                      border: '1px solid rgba(225, 70, 100, 0.18)',
                      boxShadow: '0 10px 28px rgba(20, 20, 20, 0.05)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Banknote className="h-[22px] w-[22px] text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-[16px] mb-0.5">Payment Method</h4>
                        <p className="text-[14px] text-gray-700 leading-snug">GCash, Maya, bank or crypto where available</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Local Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/60 text-gray-700 border border-rose-200">Manila</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/60 text-gray-700 border border-rose-200">Cebu</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/60 text-gray-700 border border-rose-200">Davao</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">GCash</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">Maya</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700 border border-green-200">PHP</span>
                </div>

                {/* Small Note */}
                <p className="text-xs text-gray-600 italic">
                  Availability and payout methods are confirmed during onboarding.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Choose Your Creator Path - Warm Light with Visible Background */}
        <section 
          className="relative overflow-hidden"
          style={{
            padding: 'clamp(76px, 10vw, 120px) 24px',
            background: `
              radial-gradient(circle at 12% 15%, rgba(225, 29, 72, 0.12), transparent 28%),
              radial-gradient(circle at 85% 20%, rgba(255, 138, 0, 0.1), transparent 30%),
              radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.08), transparent 34%),
              linear-gradient(135deg, #fff9f6 0%, #fff5f0 42%, #fef7f5 100%)`
          }}
        >
          {/* Background Image Layer - Fully Visible */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/ChatGPT%20Image%208.%20Juni%202026%2C%2006_33_23.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.85
            }}
          />

          <div className="max-w-[1280px] mx-auto relative z-10">
            {/* Header */}
            <div className="text-center mb-12">
              <Badge 
                className="mb-4 inline-block text-xs font-bold px-3 py-1.5 uppercase tracking-[0.16em]"
                style={{ 
                  backgroundColor: 'rgba(255, 138, 0, 0.12)',
                  color: '#9a3412',
                  border: '1px solid rgba(255, 138, 0, 0.35)'
                }}
              >
                ★ CHOOSE YOUR PATH
              </Badge>
              
              <h2 
                className="mb-4 leading-[1.0] font-black"
                style={{ fontSize: 'clamp(36px, 8vw, 64px)', color: '#1f2937' }}
              >
                <span style={{ color: '#1f2937' }}>Which </span>
                <span style={{ background: 'linear-gradient(90deg, #ff2d6f 0%, #ff8a00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>creator type</span>
                <span style={{ color: '#1f2937' }}> are you?</span>
              </h2>
              
              <p 
                className="text-center mx-auto leading-relaxed"
                style={{ 
                  color: '#4b5563',
                  maxWidth: '720px',
                  fontSize: 'clamp(15px, 3vw, 18px)'
                }}
              >
                Whether you're starting with a phone or already have fans, FLESHLAB helps you choose the right support model.
              </p>
            </div>
            
            {/* 5 Creator Path Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
              {/* Beginner with Phone */}
              <div 
                className="group relative rounded-[26px] overflow-hidden cursor-pointer transition-all hover:-translate-y-1.5 h-auto min-h-[300px]"
                onClick={() => handleRevenueModelClick('beginner-with-phone')}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
                  border: '1px solid rgba(225, 29, 72, 0.15)',
                  boxShadow: '0 12px 40px rgba(225, 29, 72, 0.12)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="relative z-10 p-7 h-full flex flex-col justify-between">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255, 138, 0, 0.15)', border: '1px solid rgba(255, 138, 0, 0.3)' }}>
                    <Smartphone className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Beginner with Phone</h3>
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">Never created before? Start with your phone, private space and full setup support.</p>
                    <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-semibold px-3 py-1">60/40 Management</Badge>
                  </div>
                </div>
              </div>

              {/* Existing Creator */}
              <div 
                className="group relative rounded-[26px] overflow-hidden cursor-pointer transition-all hover:-translate-y-1.5 h-auto min-h-[300px]"
                onClick={() => handleRevenueModelClick('existing-creator')}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
                  border: '1px solid rgba(236, 72, 153, 0.15)',
                  boxShadow: '0 12px 40px rgba(236, 72, 153, 0.12)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="relative z-10 p-7 h-full flex flex-col justify-between">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                    <Upload className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Existing Creator</h3>
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">Have clips or followers already? Add FLESHLAB as your fanclub and distribution hub.</p>
                    <Badge className="bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-semibold px-3 py-1">70/30 Network</Badge>
                  </div>
                </div>
              </div>

              {/* Cam Model */}
              <div 
                className="group relative rounded-[26px] overflow-hidden cursor-pointer transition-all hover:-translate-y-1.5 h-auto min-h-[300px]"
                onClick={() => handleRevenueModelClick('cam-model')}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
                  border: '1px solid rgba(168, 85, 247, 0.15)',
                  boxShadow: '0 12px 40px rgba(168, 85, 247, 0.12)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="relative z-10 p-7 h-full flex flex-col justify-between">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                    <Play className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Cam Model</h3>
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">Already on Chaturbate or cam sites? Turn live viewers into long-term fans.</p>
                    <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold px-3 py-1">Hybrid Model</Badge>
                  </div>
                </div>
              </div>

              {/* Couple Creator */}
              <div 
                className="group relative rounded-[26px] overflow-hidden cursor-pointer transition-all hover:-translate-y-1.5 h-auto min-h-[300px]"
                onClick={() => handleRevenueModelClick('couple-creator')}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  boxShadow: '0 12px 40px rgba(239, 68, 68, 0.12)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="relative z-10 p-7 h-full flex flex-col justify-between">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <Users className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Couple Creator</h3>
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">Create with a partner. Both must verify 18+ and approve every scene.</p>
                    <Badge className="bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-semibold px-3 py-1">Both Verify 18+</Badge>
                  </div>
                </div>
              </div>

              {/* Fanclub Creator */}
              <div 
                className="group relative rounded-[26px] overflow-hidden cursor-pointer transition-all hover:-translate-y-1.5 h-auto min-h-[300px]"
                onClick={() => handleRevenueModelClick('fanclub-creator')}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
                  border: '1px solid rgba(251, 146, 60, 0.15)',
                  boxShadow: '0 12px 40px rgba(251, 146, 60, 0.12)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="relative z-10 p-7 h-full flex flex-col justify-between">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251, 146, 60, 0.15)', border: '1px solid rgba(251, 146, 60, 0.3)' }}>
                    <Sparkles className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Fanclub Creator</h3>
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">Build recurring monthly income with exclusive clips, updates and supporter perks.</p>
                    <Badge className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-semibold px-3 py-1">Fanclub Setup</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Panel */}
            <div 
              className="p-8 rounded-[28px] mb-8"
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                border: '1px solid rgba(225, 29, 72, 0.18)',
                boxShadow: '0 24px 80px rgba(225, 29, 72, 0.12)',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(225, 29, 72, 0.12)', border: '1px solid rgba(225, 29, 72, 0.25)' }}>
                    <HelpCircle className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Not sure which path fits you?</h4>
                    <p className="text-gray-600 text-sm">Chat with our team on WhatsApp. No pressure, ask anything.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Button 
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-lg shadow-lg shadow-green-500/40 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
                  onClick={handleWhatsAppClick}
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat on WhatsApp
                </Button>
                <Button 
                  className="border-2 border-rose-500 text-rose-600 hover:bg-rose-500/10 font-bold px-8 py-3 rounded-lg transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none bg-transparent"
                  onClick={() => handleRevenueModelClick('compare')}
                >
                  <TrendingUp className="h-5 w-5" />
                  Compare 60/40 and 70/30
                </Button>
              </div>

              {/* Trust Pills */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full text-gray-700 text-xs font-semibold" style={{ background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.2)' }}>
                  <Shield className="h-4 w-4 text-rose-600" />
                  <span>Verified 18+ Only</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full text-gray-700 text-xs font-semibold" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <Lock className="h-4 w-4 text-purple-600" />
                  <span>Private & Discreet</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full text-gray-700 text-xs font-semibold" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span>You Approve Everything</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full text-gray-700 text-xs font-semibold" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <Globe className="h-4 w-4 text-amber-600" />
                  <span>Support for Filipino Creators</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full text-gray-700 text-xs font-semibold" style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <Banknote className="h-4 w-4 text-green-600" />
                  <span>Payouts in PHP</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Choose Your Creator Model - Dark Premium */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
          <div className="max-w-5xl mx-auto">
            <Badge className="mb-4 bg-rose-600 text-white text-sm px-4 py-1.5 font-semibold">
              Revenue Models
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
              Choose your creator model
            </h2>
            <p className="text-center text-gray-300 font-medium mb-12 text-lg max-w-2xl mx-auto">
              Different support levels, different splits — both positive paths
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 60/40 Management */}
              <Card 
                className="border-2 border-rose-500 shadow-2xl hover:shadow-rose-900/50 transition-all bg-gradient-to-br from-gray-800 to-gray-900"
                onClick={() => handleRevenueModelClick("60-40-management")}
              >
                <CardContent className="pt-6">
                  <Badge className="mb-4 bg-rose-600 text-white font-bold text-xs px-3 py-1.5">Full Support</Badge>
                  <h3 className="text-2xl font-bold text-white mb-2">60/40 Management</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-extrabold text-rose-500">Studio 60%</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-3xl font-extrabold text-white">Performer 40%</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-5 leading-relaxed">
                    We handle everything: planning, editing, thumbnails, publishing, promotion, fanclub management. You focus on creating. Perfect for first-timers.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span>Full content strategy & planning</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span>Professional editing & thumbnails</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span>Fanclub setup & promotion</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span>Platform distribution & SEO</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span>Graduate to 70/30 when ready</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 70/30 Network */}
              <Card 
                className="border-2 border-amber-500 shadow-2xl hover:shadow-amber-900/50 transition-all bg-gradient-to-br from-gray-800 to-gray-900"
                onClick={() => handleRevenueModelClick("70-30-network")}
              >
                <CardContent className="pt-6">
                  <Badge className="mb-4 bg-amber-600 text-white font-bold text-xs px-3 py-1.5">Maximum Control</Badge>
                  <h3 className="text-2xl font-bold text-white mb-2">70/30 Network</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-extrabold text-amber-500">Performer 70%</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-3xl font-extrabold text-white">Studio 30%</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-5 leading-relaxed">
                    You upload your own content, set your schedule. We provide platform, fanclub tools, and multi-platform distribution. Best for experienced creators.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>Keep 70% of all revenue</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>Upload your own content</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>Set your own schedule</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>Multi-platform distribution</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>Fanclub & PPV tools included</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-gray-400 mt-8 text-center">
              Revenue splits apply to eligible gross revenue. Specific terms discussed during application review.
            </p>
          </div>
        </section>

        {/* How FLESHLAB Helps - 5 Steps */}
        <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <Badge className="mb-4 bg-rose-600 text-white text-sm px-4 py-1.5 font-semibold">
              Simple Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              How FLESHLAB helps after approval
            </h2>
            <p className="text-center text-gray-700 mb-12 text-lg max-w-2xl mx-auto font-medium">
              Five steps from application to earning
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Step 1 */}
              <div className="relative">
                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Apply</h3>
                <p className="text-sm text-gray-600">Submit via WhatsApp or online form</p>
                <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-rose-200 -z-10"></div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Verify 18+</h3>
                <p className="text-sm text-gray-600">Upload valid government ID (KYC)</p>
                <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-rose-200 -z-10"></div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Choose Model</h3>
                <p className="text-sm text-gray-600">60/40 or 70/30 based on needs</p>
                <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-rose-200 -z-10"></div>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white font-bold text-lg">4</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Set Up Profile</h3>
                <p className="text-sm text-gray-600">We build your performer & fanclub page</p>
                <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-rose-200 -z-10"></div>
              </div>

              {/* Step 5 */}
              <div className="relative">
                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white font-bold text-lg">5</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Publish & Grow</h3>
                <p className="text-sm text-gray-600">Upload, we handle SEO & promotion</p>
              </div>
            </div>
          </div>
        </section>

        {/* Philippines Payout Options - Concise */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-amber-50">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-amber-600 text-white text-sm px-4 py-1.5 font-semibold">
              Payouts
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              Philippines payout options
            </h2>
            <p className="text-center text-gray-700 mb-8 text-lg max-w-2xl mx-auto font-medium">
              Multiple methods (subject to confirmation)
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge className="bg-blue-600 text-white text-sm px-4 py-2.5 font-semibold shadow-sm">GCash</Badge>
              <Badge className="bg-purple-600 text-white text-sm px-4 py-2.5 font-semibold shadow-sm">Maya</Badge>
              <Badge className="bg-red-600 text-white text-sm px-4 py-2.5 font-semibold shadow-sm">BDO</Badge>
              <Badge className="bg-indigo-600 text-white text-sm px-4 py-2.5 font-semibold shadow-sm">BPI</Badge>
              <Badge className="bg-orange-600 text-white text-sm px-4 py-2.5 font-semibold shadow-sm">UnionBank</Badge>
              <Badge className="bg-green-600 text-white text-sm px-4 py-2.5 font-semibold shadow-sm">Crypto (USDT)</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 bg-white rounded-xl border border-amber-200 shadow-sm">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Currency</p>
                <p className="font-bold text-gray-900 text-sm">PHP or USD</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-amber-200 shadow-sm">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Schedule</p>
                <p className="font-bold text-gray-900 text-sm">Weekly</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-amber-200 shadow-sm">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Exchange</p>
                <p className="font-bold text-gray-900 text-sm">Market Rate</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-amber-200 shadow-sm">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Status</p>
                <p className="font-bold text-gray-900 text-sm">Subject to Confirmation</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-gray-700 leading-relaxed text-center">
                <strong className="text-amber-800 font-semibold">Important:</strong> No guaranteed income. Earnings vary based on content quality, consistency, audience demand, and your activity level.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy, Consent & Safety - Clean Trust Block */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-green-600 text-white text-sm px-4 py-1.5 font-semibold">
              Trust & Safety
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              Privacy, consent & safety
            </h2>
            <p className="text-center text-gray-700 mb-10 text-lg max-w-2xl mx-auto font-medium">
              Non-negotiable protections for all creators
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-0.5">Verified 18+ Only</h4>
                  <p className="text-xs text-gray-700">Valid government ID required</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <FileCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-0.5">KYC Process</h4>
                  <p className="text-xs text-gray-700">Identity verification required</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <Heart className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-0.5">Your Boundaries</h4>
                  <p className="text-xs text-gray-700">You decide what to create</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-0.5">Explicit Consent</h4>
                  <p className="text-xs text-gray-700">Written approval for all content</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-0.5">No Forced Content</h4>
                  <p className="text-xs text-gray-700">Nothing published without approval</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-0.5">No Underage Content</h4>
                  <p className="text-xs text-gray-700">Strict 18+ policy enforced</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200 sm:col-span-2 lg:col-span-3">
                <Eye className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-0.5">Performer Approval Required</h4>
                  <p className="text-xs text-gray-700">All content reviewed and approved by you before publishing. No exceptions.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200 sm:col-span-2 lg:col-span-3">
                <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-0.5">No Guaranteed Acceptance</h4>
                  <p className="text-xs text-gray-700">Applications reviewed individually. Not all applicants are accepted.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-xs text-gray-700 leading-relaxed text-center">
                <strong className="text-green-800 font-semibold">2257 Compliance:</strong> All performers must provide valid government-issued ID proving age 18+. Records maintained per international compliance requirements.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA - Dark Emotional Banner */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 via-rose-950 to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Ready to apply from the Philippines?
            </h2>
            <p className="text-gray-300 mb-10 text-base sm:text-lg max-w-2xl mx-auto">
              Ask questions first. No pressure. Verified 18+ applicants only.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center mb-10">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white shadow-xl hover:shadow-2xl px-10 sm:px-12 py-8 text-lg sm:text-xl w-full sm:w-auto font-bold transition-all"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="mr-3 h-6 w-6" />
                Chat on WhatsApp
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/60 text-white hover:bg-white/15 bg-transparent shadow-xl px-10 sm:px-12 py-8 text-lg sm:text-xl w-full sm:w-auto font-bold transition-all"
                onClick={handleApplyClick}
              >
                Start Application
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-gray-300 font-medium text-sm">
              <div className="flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-rose-500" />
                <span>Verified 18+</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Lock className="h-5 w-5 text-rose-500" />
                <span>Private & Secure</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileCheck className="h-5 w-5 text-rose-500" />
                <span>KYC Required</span>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Footer */}
        <footer className="py-10 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-300 text-sm">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <p className="text-gray-400">All performers must be 18+ with valid Philippine government ID. Independent contractor position. Earnings vary and are not guaranteed. You are responsible for your own taxes (BIR).</p>
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