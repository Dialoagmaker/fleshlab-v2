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
  CreditCard
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

  return (
    <>
      <SEOMeta
        title="Gay Performer Recruitment Philippines | Become a Filipino Creator"
        description="Apply as a verified 18+ Filipino gay content creator with FLESHLAB. Start from home with your phone, choose a support model, and build your fanclub safely."
        canonical="/gay-performer-recruitment-philippines"
        noIndex={false}
      />
      
      <div className="min-h-screen bg-white">
        {/* Hero Section - Mobile First, Emotional */}
        <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-rose-50 to-white">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-rose-100 text-rose-800 hover:bg-rose-100 text-sm px-4 py-1">
              🇵🇭 For Filipino Creators 18+
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Start Creating Gay Content From Home in the Philippines
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              No studio needed. Start with your phone, a private space, and a verified 18+ application. FLESHLAB helps with setup, publishing, promotion and fanclub monetization.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-6 text-base sm:text-lg w-full sm:w-auto"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Apply on WhatsApp
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-rose-600 text-rose-600 hover:bg-rose-50 px-6 sm:px-8 py-6 text-base sm:text-lg w-full sm:w-auto"
                onClick={() => handleScrollToSection('how-it-works')}
              >
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 mt-8">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Verified 18+ Only</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600" />
                <span>Private & Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-green-600" />
                <span>KYC Required</span>
              </div>
            </div>
          </div>
        </section>

        {/* Start With What You Have */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              Start with what you already have
            </h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              You don't need expensive equipment to begin. Most Filipino creators start with these basics:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Phone Camera</h4>
                      <p className="text-sm text-gray-600">Any smartphone with 1080p video works</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Good Lighting</h4>
                      <p className="text-sm text-gray-600">Natural light or basic ring light</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Lock className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Private Space</h4>
                      <p className="text-sm text-gray-600">A room where you can film privately</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Wifi className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Stable Internet</h4>
                      <p className="text-sm text-gray-600">For uploading and communicating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm sm:col-span-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Valid ID (18+)</h4>
                      <p className="text-sm text-gray-600">Passport, driver's license, UMID, or any government ID</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-gray-500 mt-6 text-center italic">
              Optional upgrades like ring lights (₱500-1,000) or tripods (₱300-800) can come later. We'll guide you after application.
            </p>
          </div>
        </section>

        {/* Three Ways to Start */}
        <section id="how-it-works" className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-rose-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              Three ways to start
            </h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              Choose the path that fits your situation
            </p>
            
            <div className="grid grid-cols-1 gap-4">
              <Card className="border-rose-200 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCheck className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Beginner / No Fanbase</h3>
                      <p className="text-sm text-gray-600">Never created content before</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Start with our 60/40 Management Model. We help with everything: planning your content, setup, editing, publishing, and building your first fans. You focus on being comfortable on camera.
                  </p>
                  <Badge className="bg-rose-600 text-sm">Most common for first-timers</Badge>
                </CardContent>
              </Card>

              <Card className="border-rose-200 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Camera className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Existing Creator</h3>
                      <p className="text-sm text-gray-600">Already have content or followers</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Use our 70/30 Network Model. Keep 70% of revenue while we handle distribution, SEO, fanclub setup, and platform management. Upload your own content on your schedule.
                  </p>
                  <Badge className="bg-gray-700 text-sm">Best if you have audience</Badge>
                </CardContent>
              </Card>

              <Card className="border-rose-200 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Cam Model</h3>
                      <p className="text-sm text-gray-600">Already doing livecam shows</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Add recorded content to your income streams. Use FLESHLAB as your content hub while continuing camming. Cross-promote to build multiple revenue sources.
                  </p>
                  <Badge className="bg-rose-600 text-sm">Hybrid approach</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Choose Your Creator Model */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              Choose your creator model
            </h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              Different support levels, different splits
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* 60/40 Management */}
              <Card 
                className="border-2 border-rose-500 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleRevenueModelClick("60-40-management")}
              >
                <CardContent className="pt-6">
                  <Badge className="mb-3 bg-rose-600">Best for Beginners</Badge>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">60/40 Management Model</h3>
                  <div className="text-center mb-4 py-3 bg-rose-50 rounded-lg">
                    <p className="text-4xl font-bold text-rose-600">40%</p>
                    <p className="text-sm text-gray-600">Your Share | Studio 60%</p>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    FLESHLAB handles setup, editing, publishing, promotion, and fanclub management. You focus on creating content.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Full content planning & strategy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Professional editing & thumbnails</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Fanclub setup & promotion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Platform distribution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Graduate to 70/30 after 6 months</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 70/30 Network */}
              <Card 
                className="border-2 border-gray-300 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleRevenueModelClick("70-30-network")}
              >
                <CardContent className="pt-6">
                  <Badge className="mb-3 bg-gray-700">For Existing Creators</Badge>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">70/30 Network Model</h3>
                  <div className="text-center mb-4 py-3 bg-gray-50 rounded-lg">
                    <p className="text-4xl font-bold text-gray-700">70%</p>
                    <p className="text-sm text-gray-600">Your Share | Studio 30%</p>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    You create and upload content. FLESHLAB provides the platform, SEO, distribution, and fanclub infrastructure.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Keep 70% of all revenue</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Upload your own content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Set your own schedule</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Multi-platform distribution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Fanclub & PPV tools included</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-gray-500 mt-6 text-center">
              Revenue splits apply to eligible gross revenue. Specific terms discussed during application review.
            </p>
          </div>
        </section>

        {/* What FLESHLAB Helps With */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-rose-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              What FLESHLAB helps with
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Content Planning</h4>
                      <p className="text-sm text-gray-600">Scene ideas that work for you</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <UserCheck className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Profile Setup</h4>
                      <p className="text-sm text-gray-600">Professional performer page</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Camera className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Video Publishing</h4>
                      <p className="text-sm text-gray-600">Upload, edit, and release</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Users className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Fanclub Setup</h4>
                      <p className="text-sm text-gray-600">Monthly subscriber access</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Globe className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Promotion</h4>
                      <p className="text-sm text-gray-600">SEO and platform marketing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Compliance</h4>
                      <p className="text-sm text-gray-600">18+ verification & contracts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm sm:col-span-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Payouts</h4>
                      <p className="text-sm text-gray-600">PHP or USD via GCash, Maya, bank, or crypto</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* What You Can Create */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              What you can create
            </h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              Content types depend on your comfort level, boundaries, and approval
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="border-rose-100">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Solo Content</h4>
                  <p className="text-sm text-gray-600">Masturbation, showers, stripping, teasing</p>
                </CardContent>
              </Card>

              <Card className="border-rose-100">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Couple Content</h4>
                  <p className="text-sm text-gray-600">Partner scenes (with consent & approval)</p>
                </CardContent>
              </Card>

              <Card className="border-rose-100">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Fanclub Clips</h4>
                  <p className="text-sm text-gray-600">Exclusive content for subscribers</p>
                </CardContent>
              </Card>

              <Card className="border-rose-100">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Livecam Add-on</h4>
                  <p className="text-sm text-gray-600">Recorded content to complement cam shows</p>
                </CardContent>
              </Card>

              <Card className="border-rose-100 sm:col-span-2">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Guest Production</h4>
                  <p className="text-sm text-gray-600">Only if verified, approved, and matches your boundaries</p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-rose-800">Important:</strong> Everything depends on your consent, comfort level, and explicit approval. You set your boundaries. Nothing is forced. All content goes through approval before publishing.
              </p>
            </div>
          </div>
        </section>

        {/* Payouts for Philippines */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-rose-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              Payouts for Philippines
            </h2>
            
            <Card className="border-rose-200 shadow-md mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <CreditCard className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Payment Methods</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-100 text-blue-800">GCash</Badge>
                      <Badge className="bg-purple-100 text-purple-800">Maya</Badge>
                      <Badge className="bg-red-100 text-red-800">BDO</Badge>
                      <Badge className="bg-blue-200 text-blue-900">BPI</Badge>
                      <Badge className="bg-orange-100 text-orange-800">UnionBank</Badge>
                      <Badge className="bg-green-100 text-green-800">Crypto (USDT)</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Currency</p>
                    <p className="font-semibold text-gray-900">PHP or USD equivalent</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Schedule</p>
                    <p className="font-semibold text-gray-900">Weekly payouts</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Exchange Rate</p>
                    <p className="font-semibold text-gray-900">Market rate at payout</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Minimum</p>
                    <p className="font-semibold text-gray-900">Contact for details</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-yellow-800">Important:</strong> Income is not guaranteed. Earnings depend on content consistency, quality, audience demand, platform performance, and your activity level. Some creators earn modestly, others build significant income. Your results vary based on your work.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy, Consent and Safety */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              Privacy, consent and safety
            </h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              Your safety and consent come first
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-green-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Verified 18+ Only</h4>
                      <p className="text-sm text-gray-600">Valid government ID required</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">KYC Process</h4>
                      <p className="text-sm text-gray-600">Identity verification before publishing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Heart className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Your Boundaries</h4>
                      <p className="text-sm text-gray-600">You decide what you're comfortable with</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Explicit Consent</h4>
                      <p className="text-sm text-gray-600">Written approval for all content</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Lock className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">No Forced Content</h4>
                      <p className="text-sm text-gray-600">Nothing you don't explicitly approve</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">No Underage Content</h4>
                      <p className="text-sm text-gray-600">Strict 18+ policy enforced</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-green-800">2257 Compliance:</strong> All performers must provide valid government-issued ID proving age 18+. Records are kept per international compliance requirements.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-600 to-rose-700">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to apply from the Philippines?
            </h2>
            <p className="text-rose-100 mb-8 text-base sm:text-lg">
              Start your verified 18+ application today
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-6 text-base sm:text-lg w-full sm:w-auto"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Apply on WhatsApp
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/20 px-6 sm:px-8 py-6 text-base sm:text-lg w-full sm:w-auto"
                onClick={handleApplyClick}
              >
                Start Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-white/90 text-xs sm:text-sm mt-8">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Verified 18+</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Private Application</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                <span>KYC Required</span>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400 text-xs sm:text-sm">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <p>All performers must be 18+ with valid Philippine government ID. Independent contractor position. Earnings vary and are not guaranteed. You are responsible for your own taxes (BIR).</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <a href="/terms" className="hover:text-white">Terms</a>
              <a href="/privacy" className="hover:text-white">Privacy</a>
              <a href="/2257" className="hover:text-white">2257 Compliance</a>
              <a href="/faq" className="hover:text-white">FAQ</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}