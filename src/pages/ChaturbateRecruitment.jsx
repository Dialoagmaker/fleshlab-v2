import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  DollarSign, 
  Clock, 
  Users, 
  TrendingUp, 
  Shield, 
  CheckCircle2, 
  Play, 
  MessageCircle,
  BarChart3,
  Globe,
  Lock
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import SEOMeta from "@/components/SEOMeta";
import { canonicalUrl } from "@/lib/seoConfig";

export default function ChaturbateRecruitment() {
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent("recruitment_landing_view", { page: "chaturbate" });
  }, []);

  const handleApplyClick = () => {
    trackEvent("become_performer_cta_click", { source: "chaturbate_page" });
    navigate("/become-performer");
  };

  const handleSecondaryClick = () => {
    trackEvent("become_performer_cta_click", { source: "chaturbate_page", cta: "secondary" });
    navigate("/become-performer");
  };

  const handleRevenueModelClick = (model) => {
    trackEvent("revenue_model_info_click", { source: "chaturbate_page", model });
  };

  return (
    <>
      <SEOMeta
        title="Chaturbate Models: Add Passive Income | Studio Partnership | FLESHLAB"
        description="Chaturbate cam models: Add passive income with studio content. Keep camming. 70% revenue share. No exclusivity. Fanclub monetization. Apply in 5 minutes."
        canonical="/chaturbate-model-join-studio"
        ogImage="https://fleshlab.online/og-cam-recruitment.jpg"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-blue-900">
        {/* Hero Section - Cam Vibe */}
        <section className="relative py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <Badge className="mb-4 bg-purple-500 text-white hover:bg-purple-500">
                  <Video className="h-3 w-3 mr-1" />
                  For Cam Models
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                  Add Passive Income to Your Cam Earnings
                </h1>
                <p className="text-xl text-purple-100 mb-8">
                  Keep your Chaturbate schedule. Add studio-produced content that earns while you sleep. No exclusivity required. 70% revenue share.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-lg"
                    onClick={handleApplyClick}
                  >
                    Calculate Your Potential
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-purple-400 text-purple-100 hover:bg-purple-800 px-8 py-6 text-lg"
                    onClick={handleSecondaryClick}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    See How It Works
                  </Button>
                </div>
              </div>
              
              {/* Visual Comparison */}
              <div className="relative">
                <Card className="bg-white/10 backdrop-blur-sm border-purple-400/30">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-purple-900/50 rounded-lg">
                        <Clock className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                        <p className="text-purple-200 text-sm font-semibold">Live Cam Hours</p>
                        <p className="text-white text-2xl font-bold mt-1">Active Income</p>
                        <p className="text-purple-300 text-xs mt-2">Trade time for money</p>
                      </div>
                      <div className="text-center p-4 bg-pink-900/50 rounded-lg">
                        <TrendingUp className="h-8 w-8 text-pink-300 mx-auto mb-2" />
                        <p className="text-pink-200 text-sm font-semibold">Studio Content</p>
                        <p className="text-white text-2xl font-bold mt-1">Passive Income</p>
                        <p className="text-pink-300 text-xs mt-2">Earn while sleeping</p>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-purple-200 text-sm">2 hours filming = 12 months passive income</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Time vs Income Calculator - Unique to Cam */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-purple-800 to-blue-800 border-purple-500 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl text-white">
                  <BarChart3 className="h-6 w-6 text-pink-400" />
                  Your Revenue Potential
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-purple-900/50 rounded-lg">
                    <p className="text-purple-300 text-sm mb-2">Current Cam Tips</p>
                    <p className="text-white text-3xl font-bold">$500 - $3,000</p>
                    <p className="text-purple-400 text-xs mt-2">Monthly (active)</p>
                  </div>
                  <div className="text-center p-6 bg-pink-900/50 rounded-lg border-2 border-pink-500">
                    <p className="text-pink-300 text-sm mb-2">Studio Content (70%)</p>
                    <p className="text-white text-3xl font-bold">$500 - $5,000</p>
                    <p className="text-pink-400 text-xs mt-2">Monthly (passive)</p>
                  </div>
                  <div className="text-center p-6 bg-blue-900/50 rounded-lg">
                    <p className="text-blue-300 text-sm mb-2">Fanclub (70%)</p>
                    <p className="text-white text-3xl font-bold">$300 - $2,000</p>
                    <p className="text-blue-400 text-xs mt-2">Recurring monthly</p>
                  </div>
                </div>
                <p className="text-purple-300 text-xs mt-4 text-center">
                  Earnings vary based on content output, audience size, and engagement. Not guaranteed. Examples based on real performer data.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* No Exclusivity - Critical for Cam Models */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              No Exclusivity Required
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Keep All Your Platforms</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="font-semibold text-gray-900">Chaturbate</p>
                  <p className="text-sm text-gray-600">Keep camming</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-pink-600" />
                  </div>
                  <p className="font-semibold text-gray-900">OnlyFans</p>
                  <p className="text-sm text-gray-600">Keep your OF</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="font-semibold text-gray-900">All Platforms</p>
                  <p className="text-sm text-gray-600">No restrictions</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900">FLESHLAB</p>
                  <p className="text-sm text-gray-600">Add passive income</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Cam Schedule Integration - Unique */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-purple-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Works Around Your Cam Schedule</h2>
            <Card className="border-purple-200 shadow-lg">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Week 1: Apply</h4>
                    <p className="text-sm text-gray-600">5 min form, during cam break</p>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Video className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Week 2: Film</h4>
                    <p className="text-sm text-gray-600">2-4 hours, flexible schedule</p>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Week 3: Approve</h4>
                    <p className="text-sm text-gray-600">Review content from home</p>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Week 4+: Earn</h4>
                    <p className="text-sm text-gray-600">Passive income while you cam</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Fanclub + Cam Synergy - Unique */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Convert Cam Fans to Fanclub Members</h2>
            <p className="text-center text-gray-600 mb-8 text-lg">Recurring monthly revenue, not just tips</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-purple-200 shadow-md">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Cam Tips (Active)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Earn during live shows only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Income stops when you're offline</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Variable tips per show</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-pink-200 shadow-md bg-gradient-to-br from-pink-50 to-purple-50">
                <CardHeader className="bg-pink-50">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-pink-600" />
                    Fanclub + Studio (Passive + Recurring)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Earn 24/7 from recorded content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Monthly recurring fanclub subscriptions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Mention fanclub on cam for cross-promotion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Exclusive content drives subscriptions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Revenue Model - 70/30 Primary for Cam */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50 to-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Revenue Models for Cam Models</h2>
            <p className="text-center text-gray-600 mb-8">Diversify your income streams</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 70/30 Network - Primary for Cam */}
              <Card 
                className="border-2 border-pink-500 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleRevenueModelClick("70-30-network")}
              >
                <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50">
                  <Badge className="w-fit bg-pink-600">Best for Cam Models</Badge>
                  <CardTitle className="mt-2">70/30 Network Model</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">70%</p>
                    <p className="text-gray-600">Your Share</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Keep 70% of studio content revenue</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Fanclub: 70% recurring monthly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">No exclusivity - keep all platforms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Upload your own content or we help</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 60/40 Management - Optional for Cam */}
              <Card 
                className="border-2 border-gray-300 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleRevenueModelClick("60-40-management")}
              >
                <CardHeader className="bg-gray-50">
                  <Badge className="w-fit bg-gray-700">Optional Support</Badge>
                  <CardTitle className="mt-2">60/40 Management Model</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-gray-700">40%</p>
                    <p className="text-gray-600">Your Share</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Full production support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">We film, edit, market - you earn 40%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Hands-off approach</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Best if you want us to handle everything</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Cam Model Success Stories - Unique */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Cam Model Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-purple-100 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-purple-600 font-bold">A</span>
                  </div>
                  <p className="text-gray-700 mb-2">"Added $2k/month passive income. Still cam full-time."</p>
                  <p className="text-sm text-gray-600 font-semibold">- Alex, 2 years camming</p>
                </CardContent>
              </Card>
              
              <Card className="border-purple-100 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-purple-600 font-bold">J</span>
                  </div>
                  <p className="text-gray-700 mb-2">"Part-time cam + fanclub = steady income. Love it."</p>
                  <p className="text-sm text-gray-600 font-semibold">- Jamie, part-time cam</p>
                </CardContent>
              </Card>
              
              <Card className="border-purple-100 shadow-md">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-purple-600 font-bold">S</span>
                  </div>
                  <p className="text-gray-700 mb-2">"Studio content is my retirement fund. Smart diversification."</p>
                  <p className="text-sm text-gray-600 font-semibold">- Sam, full-time cam</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ - Cam Specific */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-purple-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Cam Model FAQ</h2>
            <div className="space-y-4">
              <Card className="border-purple-100">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Will this conflict with my cam schedule?</h3>
                  <p className="text-gray-600">No. Film 2-4 hours on your schedule. We edit, distribute, sell. You cam as usual. Content earns passively while you're live.</p>
                </CardContent>
              </Card>
              
              <Card className="border-purple-100">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Can I mention my cam shows in studio content?</h3>
                  <p className="text-gray-600">Yes! Cross-promotion encouraged. Mention cam schedule in fanclub content. Drive fans to both revenue streams.</p>
                </CardContent>
              </Card>
              
              <Card className="border-purple-100">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Do I need new content or can I use cam recordings?</h3>
                  <p className="text-gray-600">Studio content is higher quality (we help produce). Cam recordings can be repurposed for fanclub exclusives. Different content for different platforms.</p>
                </CardContent>
              </Card>
              
              <Card className="border-purple-100">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">How much time is required?</h3>
                  <p className="text-gray-600">2-4 hours filming per month (flexible). We handle editing, uploading, customer service. You focus on camming.</p>
                </CardContent>
              </Card>
              
              <Card className="border-purple-100">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">Can I do both exclusively?</h3>
                  <p className="text-gray-600">Yes! No exclusivity required. Keep Chaturbate, OnlyFans, all platforms. We add distribution and fanclub system.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Diversify Your Income?</h2>
            <p className="text-purple-100 mb-8 text-lg">Join cam models earning passive income with FLESHLAB</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg shadow-lg"
                onClick={handleApplyClick}
              >
                Calculate Earnings Potential
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/20 px-8 py-6 text-lg"
                onClick={handleSecondaryClick}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat With Us
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>No Exclusivity</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>70% Revenue</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Cam-Friendly</span>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400 text-sm">
          <div className="max-w-4xl mx-auto text-center space-y-2">
            <p>All performers must be 18+ with valid government ID. Independent contractor position. Earnings vary and are not guaranteed. No exclusivity required unless explicitly agreed.</p>
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