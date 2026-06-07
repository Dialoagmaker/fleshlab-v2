import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, CheckCircle2, DollarSign, Smartphone, Users, Clock, Shield, AlertCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import SEOMeta from "@/components/SEOMeta";
import { canonicalUrl } from "@/lib/seoConfig";

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

  return (
    <>
      <SEOMeta
        title="Gay Content Creator Jobs Philippines | Earn From Home | FLESHLAB Studios"
        description="Filipino gay men: Earn USD from home creating content. Full training provided. 40-70% revenue share. Verified 18+ only. WhatsApp application available. Apply in 5 minutes."
        canonical="/gay-performer-recruitment-philippines"
        ogImage="https://fleshlab.online/og-ph-recruitment.jpg"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        {/* Hero Section - Mobile First */}
        <section className="relative py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-orange-100 text-orange-800 hover:bg-orange-100">
              🇵🇭 Philippines Exclusive
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Become a Gay Content Creator in the Philippines
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Work remotely. Set your schedule. Earn in USD or PHP. No experience needed - we provide full training and support.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg"
                onClick={handleApplyClick}
              >
                Start Application (5 min)
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-6 text-lg"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat on WhatsApp
              </Button>
            </div>
          </div>
        </section>

        {/* Income Calculator - Unique to PH */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <Card className="border-orange-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                  Potential Monthly Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Part-time (10-15 hrs/week)</p>
                    <p className="text-3xl font-bold text-orange-600">₱15,000 - ₱40,000</p>
                    <p className="text-xs text-gray-500 mt-2">~$270 - $720 USD</p>
                  </div>
                  <div className="text-center p-6 bg-orange-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Full-time (30+ hrs/week)</p>
                    <p className="text-3xl font-bold text-orange-600">₱40,000 - ₱80,000+</p>
                    <p className="text-xs text-gray-500 mt-2">~$720 - $1,440+ USD</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  Earnings vary based on content output, audience engagement, and platform performance. Not guaranteed.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why FLESHLAB Philippines */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-orange-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Why FLESHLAB Philippines</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Work From Anywhere</h3>
                  <p className="text-gray-600 text-sm">Manila, Cebu, Davao, abroad - all OK. Use just your smartphone to start.</p>
                </CardContent>
              </Card>
              
              <Card className="text-center border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Get Paid in PHP or USD</h3>
                  <p className="text-gray-600 text-sm">GCash, Maya, BDO, BPI, UnionBank, or crypto. Weekly payouts at market rate.</p>
                </CardContent>
              </Card>
              
              <Card className="text-center border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Full Training Included</h3>
                  <p className="text-gray-600 text-sm">Never done this before? We guide you step-by-step with Filipino support team.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Revenue Models - PH Focus on 60/40 */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Choose Your Path</h2>
            <p className="text-center text-gray-600 mb-8">Start with support, or jump in with experience</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 60/40 Management - Primary for PH */}
              <Card 
                className="border-2 border-orange-500 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleRevenueModelClick("60-40-management")}
              >
                <CardHeader className="bg-orange-50">
                  <Badge className="w-fit bg-orange-600">Best for Beginners</Badge>
                  <CardTitle className="mt-2">60/40 Management Model</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-orange-600">40%</p>
                    <p className="text-gray-600">Your Share</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>We handle everything: filming, editing, marketing, fanclub setup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>You focus on creating - we handle the business</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Full training and equipment guidance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Graduate to 70/30 after 6 months</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 70/30 Network - Optional for PH */}
              <Card 
                className="border-2 border-gray-300 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleRevenueModelClick("70-30-network")}
              >
                <CardHeader className="bg-gray-50">
                  <Badge className="w-fit bg-gray-700">For Existing Creators</Badge>
                  <CardTitle className="mt-2">70/30 Network Model</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-gray-700">70%</p>
                    <p className="text-gray-600">Your Share</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Keep 70% of revenue</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Upload your own content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>We distribute to multiple platforms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Perfect if you already have audience</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* What You Need - Unique to PH */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50 to-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Start with Your Phone</h2>
            <Card className="border-orange-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">Smartphone (1080p+)</h4>
                      <p className="text-sm text-gray-600">Most modern phones work great</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">Government ID (18+)</h4>
                      <p className="text-sm text-gray-600">Passport, driver's license, or UMID</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">Private Space</h4>
                      <p className="text-sm text-gray-600">Room or area where you can film</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold">Payment Method</h4>
                      <p className="text-sm text-gray-600">GCash, Maya, or bank account</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-orange-100 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Optional upgrades:</strong> Ring light (₱500-1,000), tripod (₱300-800). We'll guide you after application.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Filipino Success Stories - Unique to PH */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Filipino Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-orange-600 font-bold">M</span>
                  </div>
                  <p className="text-gray-700 mb-2">"Started with just my phone camera. Now it's my full-time income."</p>
                  <p className="text-sm text-gray-600 font-semibold">- Mark, 24, Manila</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-orange-600 font-bold">J</span>
                  </div>
                  <p className="text-gray-700 mb-2">"Part-time alongside my day job. Flexible schedule is perfect."</p>
                  <p className="text-sm text-gray-600 font-semibold">- Jake, 28, Cebu</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-orange-600 font-bold">A</span>
                  </div>
                  <p className="text-gray-700 mb-2">"Student life made easy. I control when I work."</p>
                  <p className="text-sm text-gray-600 font-semibold">- Alex, 22, Davao</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Payment Methods - Unique to PH */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-orange-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Get Paid Your Way</h2>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Badge className="px-4 py-2 text-sm bg-blue-100 text-blue-800">GCash</Badge>
              <Badge className="px-4 py-2 text-sm bg-purple-100 text-purple-800">Maya</Badge>
              <Badge className="px-4 py-2 text-sm bg-red-100 text-red-800">BDO</Badge>
              <Badge className="px-4 py-2 text-sm bg-blue-200 text-blue-900">BPI</Badge>
              <Badge className="px-4 py-2 text-sm bg-orange-100 text-orange-800">UnionBank</Badge>
              <Badge className="px-4 py-2 text-sm bg-green-100 text-green-800">Crypto (USDT)</Badge>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Weekly payouts</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>USD to PHP at market rate</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - Philippines Specific */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <Card className="border-orange-100">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Is this legal in the Philippines?</h3>
                  <p className="text-gray-600">Yes, adult content creation is legal for adults 18+. We comply with all Philippine laws and international 2257 requirements.</p>
                </CardContent>
              </Card>
              
              <Card className="border-orange-100">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">How do I get paid in PHP?</h3>
                  <p className="text-gray-600">Choose from GCash, Maya, local bank transfer (BDO, BPI, UnionBank), or USD crypto. Weekly payouts at current exchange rate.</p>
                </CardContent>
              </Card>
              
              <Card className="border-orange-100">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Do I need experience?</h3>
                  <p className="text-gray-600">No! 60% of our Filipino performers started with zero experience. We provide full training, equipment guidance, and ongoing support.</p>
                </CardContent>
              </Card>
              
              <Card className="border-orange-100">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Can I do this remotely?</h3>
                  <p className="text-gray-600">Yes! Most of our PH performers work from home. You need: smartphone (1080p+), good lighting, private space. We send equipment recommendations.</p>
                </CardContent>
              </Card>
              
              <Card className="border-orange-100">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Is WhatsApp application OK?</h3>
                  <p className="text-gray-600">Yes! Many Filipino performers apply via WhatsApp. Click 'Chat on WhatsApp' to start. Same secure process, just more convenient.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-600 to-orange-700">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
            <p className="text-orange-100 mb-8 text-lg">Join hundreds of Filipino creators earning on their own terms</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-6 text-lg"
                onClick={handleApplyClick}
              >
                Start Your Application
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/20 px-8 py-6 text-lg"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Have Questions? Chat on WhatsApp
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>18+ Verified</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Secure Application</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>2257 Compliant</span>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400 text-sm">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <p>All performers must be 18+ with valid Philippine government ID. Independent contractor position. Earnings vary and are not guaranteed. You are responsible for your own taxes (BIR).</p>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
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