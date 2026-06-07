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
  Banknote
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
        title="Gay Performer Recruitment Philippines | Start as a Filipino Creator"
        description="Apply as a verified 18+ Filipino gay content creator with FLESHLAB. Start from home with your phone, choose a support model, and build your creator profile safely."
        canonical="/gay-performer-recruitment-philippines"
        noIndex={false}
      />
      
      <div className="min-h-screen bg-white">
        {/* Hero Section - Mobile First, Practical */}
        <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-rose-50 to-white">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-rose-100 text-rose-800 hover:bg-rose-100 text-sm px-4 py-1">
              🇵🇭 Philippines 18+ Only
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

        {/* Start With Your Phone */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              Start with your phone
            </h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              You don't need expensive equipment to begin. Here's what you actually need:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Smartphone</h4>
                      <p className="text-sm text-gray-600">Any phone with 1080p camera works</p>
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
                      <h4 className="font-semibold text-gray-900">Private Room</h4>
                      <p className="text-sm text-gray-600">A space where you can film undisturbed</p>
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
                      <p className="text-sm text-gray-600">For uploading content and communication</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Valid ID (18+)</h4>
                      <p className="text-sm text-gray-600">Passport, driver's license, UMID, or government ID</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Banknote className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Payment Method</h4>
                      <p className="text-sm text-gray-600">GCash, Maya, bank account, or crypto wallet</p>
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

        {/* How FLESHLAB Helps After Approval */}
        <section id="how-it-works" className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-rose-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              How FLESHLAB helps after approval
            </h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              Step-by-step process from application to earning
            </p>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-rose-200 hidden sm:block"></div>
              
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-sm">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-gray-900 mb-1">Apply</h3>
                      <p className="text-sm text-gray-600">Submit your application via WhatsApp or online form</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-sm">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-gray-900 mb-1">Verify 18+</h3>
                      <p className="text-sm text-gray-600">Upload valid government ID for age verification (KYC)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-sm">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-gray-900 mb-1">Choose Model</h3>
                      <p className="text-sm text-gray-600">Select 60/40 Management or 70/30 Network based on your needs</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 4 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-white text-sm font-bold">4</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-sm">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-gray-900 mb-1">Set Up Profile</h3>
                      <p className="text-sm text-gray-600">We help create your performer profile and fanclub page</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 5 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-white text-sm font-bold">5</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-sm">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-gray-900 mb-1">Upload Content</h3>
                      <p className="text-sm text-gray-600">Film and upload your first scenes from home</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 6 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-white text-sm font-bold">6</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-sm">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-gray-900 mb-1">Publish</h3>
                      <p className="text-sm text-gray-600">Content goes live after approval and quality check</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 7 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-white text-sm font-bold">7</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-sm">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-gray-900 mb-1">Promote</h3>
                      <p className="text-sm text-gray-600">We handle SEO, platform distribution, and marketing</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Step 8 */}
                <div className="relative flex items-start gap-4">
                  <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-white text-sm font-bold">8</span>
                  </div>
                  <Card className="flex-1 border-rose-100 shadow-sm">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-gray-900 mb-1">Track Earnings</h3>
                      <p className="text-sm text-gray-600">Monitor your revenue and request weekly payouts</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
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
                  <Badge className="mb-3 bg-rose-600">For Beginners</Badge>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">60/40 Management Model</h3>
                  <div className="text-center mb-4 py-3 bg-rose-50 rounded-lg">
                    <p className="text-3xl font-bold text-rose-600">Studio 60%</p>
                    <p className="text-3xl font-bold text-rose-600">Performer 40%</p>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Best if you need help with setup, editing, publishing, promotion, and fanclub management. We handle the business side while you focus on creating.
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
                      <span>Option to graduate to 70/30 later</span>
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
                    <p className="text-3xl font-bold text-gray-700">Performer 70%</p>
                    <p className="text-3xl font-bold text-gray-700">Studio 30%</p>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Best if you already have content, audience, or experience. Use FLESHLAB as an additional network and fanclub hub while keeping most revenue.
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

        {/* For Different Creator Types */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-rose-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              For different creator types
            </h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              Different paths depending on your experience and goals
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCheck className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Beginner with Phone</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Never created content before. Start with 60/40 Management Model. We help with everything from planning to publishing.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Camera className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Existing Amateur Creator</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Already have some content or followers. Use 70/30 Network Model to expand your reach and add revenue streams.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Cam Model</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Already doing livecam shows. Add recorded content as passive income while continuing your cam work.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Couple Creator</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Create with a partner. Both must verify 18+ and consent. Content requires explicit approval from all parties.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-rose-100 shadow-sm sm:col-span-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Fanclub Creator</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Build a subscriber base with exclusive monthly content. Recurring revenue from dedicated fans who want more.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Philippines Payout Options */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              Philippines payout options
            </h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              Multiple payment methods available (subject to confirmation)
            </p>
            
            <Card className="border-rose-200 shadow-md mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <Banknote className="h-6 w-6 text-rose-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Available Methods</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">GCash</Badge>
                      <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1">Maya</Badge>
                      <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">BDO</Badge>
                      <Badge className="bg-blue-200 text-blue-900 text-sm px-3 py-1">BPI</Badge>
                      <Badge className="bg-orange-100 text-orange-800 text-sm px-3 py-1">UnionBank</Badge>
                      <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">Crypto (USDT)</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Currency</p>
                    <p className="font-semibold text-gray-900 text-sm">PHP or USD equivalent</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Schedule</p>
                    <p className="font-semibold text-gray-900 text-sm">Weekly payouts</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Exchange Rate</p>
                    <p className="font-semibold text-gray-900 text-sm">Market rate at payout</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                    <p className="font-semibold text-gray-900 text-sm">Confirmed during onboarding</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-yellow-800">Important:</strong> Income is not guaranteed. Earnings depend on content consistency, quality, audience demand, platform performance, and your activity level. Some creators earn modestly, others build more. Your results vary based on your work and commitment.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy, Consent and Safety */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-rose-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
              Privacy, consent and safety
            </h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              Clear requirements and protections
            </p>
            
            <Card className="border-green-100 shadow-md mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Verified 18+ Only</h4>
                      <p className="text-sm text-gray-600">Valid government ID required before any publishing</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileCheck className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">KYC Process</h4>
                      <p className="text-sm text-gray-600">Identity verification required</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Heart className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Your Boundaries</h4>
                      <p className="text-sm text-gray-600">You decide what you're comfortable creating</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Explicit Consent</h4>
                      <p className="text-sm text-gray-600">Written approval required for all content</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Lock className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">No Forced Content</h4>
                      <p className="text-sm text-gray-600">Nothing published without your approval</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">No Underage Content</h4>
                      <p className="text-sm text-gray-600">Strict 18+ policy enforced</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:col-span-2">
                    <Eye className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Performer Approval</h4>
                      <p className="text-sm text-gray-600">All content reviewed and approved by you before publishing</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:col-span-2">
                    <UserCheck className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">No Guaranteed Acceptance</h4>
                      <p className="text-sm text-gray-600">Applications reviewed individually. Not all applicants accepted.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-green-800">2257 Compliance:</strong> All performers must provide valid government-issued ID proving age 18+. Records kept per international compliance requirements.
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