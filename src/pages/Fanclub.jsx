import { Link } from "react-router-dom";
import { Lock, Star, Play, Check } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAccessControl, PRICING } from "@/lib/useAccessControl";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";

export default function Fanclub() {
  const { isAuthenticated } = useAuth();
  const { requireSignup } = useAccessControl();
  
  const handleJoinFanclub = () => {
    requireSignup('/fanclub');
  };
  return (
    <>
      <SEOMeta
        title="FLESHLAB Fanclub | Exclusive Gay Videos & Creator Access"
        description="Join FLESHLAB Fanclub for exclusive gay videos, full-length gay videos, premium gay content, creator access, behind-the-scenes content and exclusive studio productions. Free public previews available."
        canonical="/fanclub"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "FLESHLAB Fanclub",
          "description": "Exclusive fanclub membership with full-length HD gay videos and behind-the-scenes content",
          "hasPart": {
            "@type": "Offer",
            "name": "FLESHLAB Fanclub Membership",
            "description": "Monthly membership for exclusive content access",
            "category": "Adult Entertainment",
            "availability": "https://schema.org/InStock",
            "eligibleRegion": {
              "@type": "Country",
              "name": "Worldwide"
            },
            "ageRestriction": "18+"
          }
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
        {/* Hero */}
        <section className="relative py-20 px-4 border-b border-white/8">
          <div className="max-w-[1280px] mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/50">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
              FANCLUB <span className="text-rose-500">ACCESS</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
              Watch free public previews. Full-length videos, premium content and exclusive creator access require membership.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={handleJoinFanclub} className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-6 rounded-full text-base h-auto shadow-xl shadow-rose-600/50">
                <Star className="w-5 h-5 mr-2 fill-current" />
                {isAuthenticated ? `Join Fanclub — $${PRICING.fanclub.monthly}/month` : 'Create Account to Join Fanclub'}
              </Button>
              <Link to="/videos">
                <Button size="lg" variant="outline" className="border-2 border-white/40 text-white hover:bg-white/15 font-bold px-8 py-6 rounded-full text-base h-auto backdrop-blur-sm">
                  Browse Previews
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-12">
              HOW <span className="text-rose-500">FANCLUB</span> WORKS
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Play,
                  title: "Public Previews",
                  desc: "Watch free previews of all studio content. No account required."
                },
                {
                  icon: Lock,
                  title: "Full Access",
                  desc: "Fanclub members unlock complete scenes in HD quality."
                },
                {
                  icon: Star,
                  title: "Exclusive Content",
                  desc: "Behind-the-scenes, extended cuts, and member-only productions."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#0f0f0f] border border-white/8 p-8 rounded-2xl">
                  <item.icon className="w-12 h-12 text-rose-500 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-white/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-4">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-4">
              SIMPLE <span className="text-rose-500">PRICING</span>
            </h2>
            <p className="text-xl text-white/70 text-center mb-12">
              One membership. All exclusive content.
            </p>
            <div className="max-w-md mx-auto bg-gradient-to-br from-rose-900/20 to-rose-800/10 border border-rose-600/30 rounded-3xl p-8">
              <div className="text-center mb-6">
                <div className="text-5xl font-black text-white mb-2">
                  ${PRICING.fanclub.monthly}
                  <span className="text-lg text-white/60 font-medium">/month</span>
                </div>
                <p className="text-white/70 text-sm">Cancel anytime. No hidden fees.</p>
              </div>
              <ul className="space-y-3 mb-8">
                {PRICING.fanclub.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-white/80">
                    <Check className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" onClick={handleJoinFanclub} className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-6 rounded-full text-base h-auto shadow-xl shadow-rose-600/50">
                {isAuthenticated ? 'Join Fanclub Now' : 'Create Free Account'}
              </Button>
              {!isAuthenticated && (
                <p className="text-white/50 text-xs text-center mt-3">
                  Sign up required before checkout
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-4 bg-[#0f0f0f] border-y border-white/8">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-12">
              MEMBER <span className="text-rose-500">BENEFITS</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                "Full-length HD videos",
                "Exclusive behind-the-scenes",
                "Early access to new releases",
                "Member-only productions",
                "Extended cuts & extras",
                "Priority support",
                "Cancel anytime",
                "Secure & private"
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white/80 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              READY TO <span className="text-rose-500">UNLOCK</span>?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Create a free account to get started. Choose your access level.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-6 rounded-full text-lg h-auto shadow-xl shadow-rose-600/50">
                Get Started Free
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}