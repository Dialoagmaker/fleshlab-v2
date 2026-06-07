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
  Sparkles
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
  const heroImage = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/7d8872b99_generated_image.png";
  const setupImage = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/7d8872b99_generated_image.png";
  const workflowImage = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/8390c41e6_generated_image.png";
  const earningsImage = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/d2a01df7f_generated_image.png";

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
            `}
          </style>
          
          {/* Desktop Overlays */}
          <div className="hidden md:block absolute inset-0 z-10">
            {/* Left text gradient - optimized to protect model visibility */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.88) 28%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.22) 70%, rgba(0,0,0,0.00) 100%)'
              }}
            ></div>
            
            {/* Bottom vignette - subtle */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.00) 70%)'
              }}
            ></div>
          </div>

          {/* Mobile Overlay - stronger but still show model */}
          <div 
            className="md:hidden absolute inset-0 z-10"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.78) 100%)'
            }}
          ></div>
          
          {/* Content Container */}
          <div className="relative z-20 px-4 sm:px-6 lg:px-8" style={{ minHeight: '720px' }}>
            <div className="max-w-[1280px] mx-auto h-full flex items-center">
              <div className="max-w-[600px]" style={{ paddingTop: '110px', paddingBottom: '120px' }}>
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
                  background: 'rgba(0,0,0,0.58)',
                  backdropFilter: 'blur(10px)',
                  borderTop: '1px solid rgba(255,255,255,0.12)',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  padding: '18px 24px'
                }}
              >
                <div className="max-w-[1280px] mx-auto">
                  <div className="flex flex-wrap gap-8 sm:gap-10 justify-center text-white/90 text-[14px] font-semibold">
                    <div className="flex items-center gap-3">
                      <Shield className="w-[16px] h-[16px] text-red-500" />
                      <span>Discreet Process</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-[16px] h-[16px] text-red-500" />
                      <span>Professional Support</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-[16px] h-[16px] text-red-500" />
                      <span>Global Audience</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Heart className="w-[16px] h-[16px] text-red-500" />
                      <span>Build Your Fanbase</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Start With What You Already Have - Visual Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-rose-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left: Image */}
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <img 
                    src={setupImage} 
                    alt="Creator bedroom setup with smartphone and ring light"
                    className="w-full h-auto rounded-2xl shadow-2xl"
                  />
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-rose-600 rounded-full opacity-20 blur-2xl"></div>
                  <div className="absolute -top-6 -left-6 w-32 h-32 bg-rose-400 rounded-full opacity-20 blur-2xl"></div>
                </div>
              </div>
              
              {/* Right: Content */}
              <div className="order-1 lg:order-2">
                <Badge className="mb-4 bg-rose-100 text-rose-800 text-sm px-4 py-1.5">
                  What You Need
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  Start with what you already have
                </h2>
                <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                  You don't need expensive equipment to begin. Most successful Filipino creators started with these basics:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-rose-100 shadow-sm">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Smartphone</h4>
                      <p className="text-sm text-gray-700 font-medium">Any phone with 1080p camera</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-rose-100 shadow-sm">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Good Lighting</h4>
                      <p className="text-sm text-gray-700 font-medium">Natural light or ring light</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-rose-100 shadow-sm">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lock className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Private Room</h4>
                      <p className="text-sm text-gray-700 font-medium">Film undisturbed</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-rose-100 shadow-sm">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Wifi className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Stable Internet</h4>
                      <p className="text-sm text-gray-700 font-medium">For uploading & communication</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-rose-100 shadow-sm sm:col-span-2">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileCheck className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Valid ID (18+)</h4>
                      <p className="text-sm text-gray-700 font-medium">Passport, driver's license, UMID, or government ID</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-rose-100 shadow-sm sm:col-span-2">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Banknote className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Payment Method</h4>
                      <p className="text-sm text-gray-700 font-medium">GCash, Maya, bank account, or crypto</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-6 italic">
                  💡 Optional upgrades like ring lights (₱500-1,000) or tripods (₱300-800) can come later. We'll guide you after application.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who This Is For - Creator Types */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <Badge className="mb-4 bg-rose-100 text-rose-800 text-sm px-4 py-1.5">
              Creator Paths
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              Who this is for
            </h2>
            <p className="text-center text-gray-700 mb-12 text-lg max-w-2xl mx-auto font-medium">
              Different paths depending on your experience and goals
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Beginner with Phone */}
              <Card className="border-2 border-rose-300 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-rose-50 to-white">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 bg-rose-200 rounded-2xl flex items-center justify-center mb-4">
                    <UserCheck className="h-7 w-7 text-rose-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Beginner with Phone</h3>
                  <p className="text-gray-800 mb-4 leading-relaxed text-sm">
                    Never created content before? Start with our 60/40 Management Model. We help with everything from planning to publishing.
                  </p>
                  <Badge className="bg-rose-600 text-white text-xs font-semibold">Most common for first-timers</Badge>
                </CardContent>
              </Card>

              {/* Existing Creator */}
              <Card className="border-2 border-rose-300 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-rose-50 to-white">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 bg-rose-200 rounded-2xl flex items-center justify-center mb-4">
                    <Camera className="h-7 w-7 text-rose-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Existing Amateur Creator</h3>
                  <p className="text-gray-800 mb-4 leading-relaxed text-sm">
                    Already have some content or followers? Use our 70/30 Network Model to expand your reach and keep 70% of revenue.
                  </p>
                  <Badge className="bg-gray-700 text-white text-xs font-semibold">Best if you have audience</Badge>
                </CardContent>
              </Card>

              {/* Cam Model */}
              <Card className="border-2 border-rose-300 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-rose-50 to-white">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 bg-rose-200 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="h-7 w-7 text-rose-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Cam Model</h3>
                  <p className="text-gray-800 mb-4 leading-relaxed text-sm">
                    Already doing livecam shows on Chaturbate or other platforms? Add recorded content as passive income while continuing your cam work.
                  </p>
                  <Badge className="bg-rose-600 text-white text-xs font-semibold">Hybrid approach</Badge>
                </CardContent>
              </Card>

              {/* Couple Creator */}
              <Card className="border-2 border-rose-300 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-rose-50 to-white md:col-span-2">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 bg-rose-200 rounded-2xl flex items-center justify-center mb-4">
                    <Heart className="h-7 w-7 text-rose-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Couple Creator</h3>
                  <p className="text-gray-800 mb-4 leading-relaxed text-sm">
                    Creating with a partner or in a relationship? Both must verify 18+ with valid ID and consent to all content. Content requires explicit approval from all parties before publishing.
                  </p>
                  <Badge className="bg-rose-600 text-white text-xs font-semibold">Both partners must verify 18+</Badge>
                </CardContent>
              </Card>

              {/* Fanclub Creator */}
              <Card className="border-2 border-rose-300 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-rose-50 to-white">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 bg-rose-200 rounded-2xl flex items-center justify-center mb-4">
                    <Sparkles className="h-7 w-7 text-rose-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Fanclub Creator</h3>
                  <p className="text-gray-800 mb-4 leading-relaxed text-sm">
                    Want recurring monthly income? Build a subscriber base with exclusive fanclub content. Fans pay monthly for access to your exclusive photos, videos, and personal updates.
                  </p>
                  <Badge className="bg-rose-600 text-white text-xs font-semibold">Recurring revenue</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Choose Your Creator Model */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <Badge className="mb-4 bg-rose-100 text-rose-800 text-sm px-4 py-1.5">
              Revenue Models
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              Choose your creator model
            </h2>
            <p className="text-center text-gray-800 font-medium mb-12 text-lg max-w-2xl mx-auto">
              Different support levels, different splits
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 60/40 Management */}
              <Card 
                className="border-3 border-rose-400 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 cursor-pointer bg-gradient-to-br from-white to-rose-50"
                onClick={() => handleRevenueModelClick("60-40-management")}
              >
                <CardContent className="pt-8">
                  <Badge className="mb-6 bg-rose-600 text-white font-bold text-sm px-4 py-2">For Beginners</Badge>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">60/40<br/>Management Model</h3>
                  <div className="text-center mb-8 py-6 bg-white rounded-2xl border-3 border-rose-200 shadow-sm">
                    <p className="text-5xl font-extrabold text-rose-600 mb-2">Studio 60%</p>
                    <p className="text-5xl font-extrabold text-rose-600">Performer 40%</p>
                  </div>
                  <p className="text-gray-800 font-medium mb-8 leading-relaxed">
                    Best if you need help with setup, editing, publishing, promotion, and fanclub management. We handle the business side while you focus on creating.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 font-bold" />
                      <span className="text-gray-900 font-semibold">Full content planning & strategy</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 font-bold" />
                      <span className="text-gray-900 font-semibold">Professional editing & thumbnails</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 font-bold" />
                      <span className="text-gray-900 font-semibold">Fanclub setup & promotion</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 font-bold" />
                      <span className="text-gray-900 font-semibold">Platform distribution</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 font-bold" />
                      <span className="text-gray-900 font-semibold">Option to graduate to 70/30 later</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 70/30 Network */}
              <Card 
                className="border-3 border-green-400 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 cursor-pointer bg-gradient-to-br from-white to-green-50"
                onClick={() => handleRevenueModelClick("70-30-network")}
              >
                <CardContent className="pt-8">
                  <Badge className="mb-6 bg-green-600 text-white font-bold text-sm px-4 py-2">For Existing Creators</Badge>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">70/30<br/>Network Model</h3>
                  <div className="text-center mb-8 py-6 bg-white rounded-2xl border-3 border-green-200 shadow-sm">
                    <p className="text-5xl font-extrabold text-green-600 mb-2">Performer 70%</p>
                    <p className="text-5xl font-extrabold text-green-600">Studio 30%</p>
                  </div>
                  <p className="text-gray-800 font-medium mb-8 leading-relaxed">
                    Best if you already have content, audience, or experience. Use FLESHLAB as an additional network and fanclub hub while keeping most revenue.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 font-bold" />
                      <span className="text-gray-900 font-semibold">Keep 70% of all revenue</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 font-bold" />
                      <span className="text-gray-900 font-semibold">Upload your own content</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 font-bold" />
                      <span className="text-gray-900 font-semibold">Set your own schedule</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 font-bold" />
                      <span className="text-gray-900 font-semibold">Multi-platform distribution</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5 font-bold" />
                      <span className="text-gray-900 font-semibold">Fanclub & PPV tools included</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <p className="text-sm text-gray-700 mt-10 text-center font-medium">
              Revenue splits apply to eligible gross revenue. Specific terms discussed during application review.
            </p>
          </div>
        </section>

        {/* How FLESHLAB Helps After Approval */}
        <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-rose-50">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-rose-100 text-rose-800 text-sm px-4 py-1.5">
              Step-by-Step Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              How FLESHLAB helps after approval
            </h2>
            <p className="text-center text-gray-700 mb-12 text-lg max-w-2xl mx-auto font-medium">
              From application to earning - we guide you every step
            </p>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-rose-200 hidden sm:block"></div>
              
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-md bg-white">
                    <CardContent className="pt-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">Apply</h3>
                      <p className="text-gray-800 font-medium">Submit your application via WhatsApp or online form</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-md bg-white">
                    <CardContent className="pt-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">Verify 18+</h3>
                      <p className="text-gray-800 font-medium">Upload valid government ID for age verification (KYC)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-md bg-white">
                    <CardContent className="pt-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">Choose Model</h3>
                      <p className="text-gray-800 font-medium">Select 60/40 Management or 70/30 Network based on your needs</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 4 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <span className="text-white text-sm font-bold">4</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-md bg-white">
                    <CardContent className="pt-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">Set Up Profile</h3>
                      <p className="text-gray-800 font-medium">We help create your performer profile and fanclub page</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 5 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <span className="text-white text-sm font-bold">5</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-md bg-white">
                    <CardContent className="pt-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">Upload Content</h3>
                      <p className="text-gray-800 font-medium">Film and upload your first scenes from home</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 6 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <span className="text-white text-sm font-bold">6</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-md bg-white">
                    <CardContent className="pt-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">Publish</h3>
                      <p className="text-gray-800 font-medium">Content goes live after approval and quality check</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 7 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <span className="text-white text-sm font-bold">7</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-md bg-white">
                    <CardContent className="pt-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">Promote</h3>
                      <p className="text-gray-800 font-medium">We handle SEO, platform distribution, and marketing</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 8 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <span className="text-white text-sm font-bold">8</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-md bg-white">
                    <CardContent className="pt-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">Track Earnings</h3>
                      <p className="text-gray-800 font-medium">Monitor your revenue and request weekly payouts</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Philippines Payout Options */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-rose-100 text-rose-800 text-sm px-4 py-1.5">
              Payment Methods
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              Philippines payout options
            </h2>
            <p className="text-center text-gray-700 mb-12 text-lg max-w-2xl mx-auto font-medium">
              Multiple payment methods available (subject to confirmation)
            </p>
            
            <Card className="border-2 border-rose-300 shadow-xl mb-8 bg-gradient-to-br from-rose-50 to-white">
              <CardContent className="pt-8">
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-14 h-14 bg-rose-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Banknote className="h-7 w-7 text-rose-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Available Payout Methods</h3>
                    <div className="flex flex-wrap gap-3">
                      <Badge className="bg-blue-600 text-white text-sm px-4 py-2 font-semibold hover:bg-blue-700 transition-colors">GCash</Badge>
                      <Badge className="bg-purple-600 text-white text-sm px-4 py-2 font-semibold hover:bg-purple-700 transition-colors">Maya</Badge>
                      <Badge className="bg-red-600 text-white text-sm px-4 py-2 font-semibold hover:bg-red-700 transition-colors">BDO</Badge>
                      <Badge className="bg-indigo-600 text-white text-sm px-4 py-2 font-semibold hover:bg-indigo-700 transition-colors">BPI</Badge>
                      <Badge className="bg-orange-600 text-white text-sm px-4 py-2 font-semibold hover:bg-orange-700 transition-colors">UnionBank</Badge>
                      <Badge className="bg-green-600 text-white text-sm px-4 py-2 font-semibold hover:bg-green-700 transition-colors">Crypto (USDT)</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  <div className="p-5 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-colors">
                    <p className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">Currency</p>
                    <p className="font-bold text-gray-900 text-lg text-blue-900">PHP or USD equivalent</p>
                  </div>
                  <div className="p-5 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-colors">
                    <p className="text-xs font-bold text-purple-700 mb-2 uppercase tracking-wide">Schedule</p>
                    <p className="font-bold text-gray-900 text-lg text-purple-900">Weekly payouts</p>
                  </div>
                  <div className="p-5 bg-white rounded-xl border-2 border-orange-200 hover:border-orange-400 transition-colors">
                    <p className="text-xs font-bold text-orange-700 mb-2 uppercase tracking-wide">Exchange Rate</p>
                    <p className="font-bold text-gray-900 text-lg text-orange-900">Market rate at payout</p>
                  </div>
                  <div className="p-5 bg-white rounded-xl border-2 border-green-200 hover:border-green-400 transition-colors">
                    <p className="text-xs font-bold text-green-700 mb-2 uppercase tracking-wide">Availability</p>
                    <p className="font-bold text-gray-900 text-lg text-green-900">Subject to confirmation</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-5 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong className="text-yellow-800 font-semibold">Important:</strong> No guaranteed income. Earnings depend on content consistency, quality, audience demand, platform performance, and your activity level. Results vary by creator.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy, Consent and Safety */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-rose-50">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-green-100 text-green-800 text-sm px-4 py-1.5">
              Safety First
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              Privacy, consent and safety
            </h2>
            <p className="text-center text-gray-700 mb-12 text-lg max-w-2xl mx-auto font-medium">
              Clear requirements and protections
            </p>
            
            <Card className="border-green-200 shadow-xl mb-8 bg-white">
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                    <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Verified 18+ Only</h4>
                      <p className="text-sm text-gray-800 font-medium">Valid government ID required before any publishing</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                    <FileCheck className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">KYC Process</h4>
                      <p className="text-sm text-gray-800 font-medium">Identity verification required</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                    <Heart className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Your Boundaries</h4>
                      <p className="text-sm text-gray-800 font-medium">You decide what you're comfortable creating</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Explicit Consent</h4>
                      <p className="text-sm text-gray-800 font-medium">Written approval required for all content</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                    <Lock className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">No Forced Content</h4>
                      <p className="text-sm text-gray-800 font-medium">Nothing published without your approval</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                    <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">No Underage Content</h4>
                      <p className="text-sm text-gray-800 font-medium">Strict 18+ policy enforced</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl sm:col-span-2">
                    <Eye className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Performer Approval</h4>
                      <p className="text-sm text-gray-800 font-medium">All content reviewed and approved by you before publishing</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl sm:col-span-2">
                    <UserCheck className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">No Guaranteed Acceptance</h4>
                      <p className="text-sm text-gray-800 font-medium">Applications reviewed individually. Not all applicants accepted.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-5 bg-green-50 border-2 border-green-200 rounded-xl">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong className="text-green-800 font-semibold">2257 Compliance:</strong> All performers must provide valid government-issued ID proving age 18+. Records kept per international compliance requirements.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              Ready to apply from the Philippines?
            </h2>
            <p className="text-rose-100 mb-10 text-lg sm:text-xl max-w-2xl mx-auto">
              Start your verified 18+ application today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center mb-10">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white shadow-xl hover:shadow-2xl px-10 sm:px-12 py-8 text-xl sm:text-2xl w-full sm:w-auto font-bold transition-all"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="mr-3 h-7 w-7" />
                Apply on WhatsApp
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white/20 bg-transparent shadow-xl px-10 sm:px-12 py-8 text-xl sm:text-2xl w-full sm:w-auto font-bold transition-all"
                onClick={handleApplyClick}
              >
                Start Application
                <ArrowRight className="ml-3 h-7 w-7" />
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-white font-medium text-sm sm:text-base">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <span>Verified 18+</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <span>Private Application</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <FileCheck className="h-5 w-5" />
                </div>
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