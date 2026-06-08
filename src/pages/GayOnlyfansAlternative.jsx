import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Film, Users, TrendingUp, CheckCircle2, AlertTriangle, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOMeta from "@/components/SEOMeta";
import { base44 } from "@/api/base44Client";
import RevenueModelsSection from "@/components/recruitment/RevenueModelsSection";
import WhoIsThisForSection from "@/components/recruitment/WhoIsThisForSection";
import ComplianceSection from "@/components/recruitment/ComplianceSection";
import FAQSection from "@/components/recruitment/FAQSection";
import ResourcesSection from "@/components/recruitment/ResourcesSection";

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

  // Track page view
  useEffect(() => {
    base44.analytics.track({
      eventName: "gay_onlyfans_alternative_page_view",
      properties: {
        source: "gay-onlyfans-alternative",
        market: "global",
        campaign: "onlyfans_alternative"
      }
    });
  }, []);

  const handleCtaClick = () => {
    base44.analytics.track({
      eventName: "gay_onlyfans_alternative_cta_click",
      properties: {
        source: "gay-onlyfans-alternative",
        market: "global",
        campaign: "onlyfans_alternative"
      }
    });
    navigate(ctaUrl);
  };

  return (
    <>
      <SEOMeta
        title="Gay OnlyFans Alternative for Creators | FLESHLAB"
        description="Looking for a studio-backed alternative as a gay adult creator? Join FLESHLAB for professional content distribution, creator support, and revenue-share options."
        canonical="/gay-onlyfans-alternative"
        ogImage="https://fleshlab.online/og-image.jpg"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-[#080808] text-white">
          
          {/* ── HERO SECTION ─────────────────────────────────────────────── */}
          <section className="relative overflow-hidden border-b border-white/6 bg-[#0a0505]">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 via-transparent to-transparent" />
            <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600/10 border border-rose-600/20 mb-6">
                  <Film className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-400 text-xs font-bold uppercase tracking-widest">Studio-Backed Creator Network</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                  A Studio-Backed Alternative for Gay Creators
                </h1>
                <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
                  FLESHLAB helps gay adult creators grow beyond solo platform management with professional distribution, production support, performer contracts, and revenue-share options.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={handleCtaClick}
                  className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-4 rounded-xl h-auto text-base shadow-lg shadow-rose-700/20"
                >
                  Apply as a Creator
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <Link
                  to="/how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/15 text-white/70 hover:bg-white/8 px-6 py-4 rounded-xl h-auto text-base"
                >
                  How It Works
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* ── WHY CREATORS LOOK FOR ALTERNATIVES ───────────────────────── */}
          <section className="py-16 md:py-20 border-b border-white/6">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-8 text-center">
                Why Creators Look for Alternatives
              </h2>
              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <div className="bg-[#111] border border-white/8 rounded-xl p-6">
                  <h3 className="text-white font-bold text-lg mb-3">Solo Platform Management is Hard</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Creator platforms can be overwhelming to manage alone. Promotion, editing, posting schedules, compliance requirements, and monetization strategies take significant time and effort away from content creation itself.
                  </p>
                </div>
                <div className="bg-[#111] border border-white/8 rounded-xl p-6">
                  <h3 className="text-white font-bold text-lg mb-3">Studio/Network Support</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    FLESHLAB offers a studio-backed structure with professional support for distribution, production planning, compliance workflows, and revenue-share options—so you can focus on creating content.
                  </p>
                </div>
              </div>
              <div className="bg-amber-600/8 border border-amber-600/20 rounded-xl p-5 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200/70 text-sm leading-relaxed">
                    <strong className="text-amber-200 block mb-1">Important:</strong>
                    FLESHLAB does not guarantee income. Results depend on content quality, audience demand, consistency, distribution effectiveness, and performance. We provide support and infrastructure, not income promises.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── HOW FLESHLAB SUPPORTS CREATORS ──────────────────────────── */}
          <section className="py-16 md:py-20 border-b border-white/6 bg-[#0a0505]">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 text-center">
                How FLESHLAB Supports Creators
              </h2>
              <p className="text-white/50 text-center max-w-2xl mx-auto mb-12">
                Professional infrastructure for gay adult creators who want studio backing instead of going it alone.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    icon: Film,
                    title: "Content Distribution Support",
                    desc: "Multi-platform distribution strategy and execution support to maximize your content's reach."
                  },
                  {
                    icon: Users,
                    title: "Production Planning",
                    desc: "Professional production coordination, scene planning, and content calendar support."
                  },
                  {
                    icon: Shield,
                    title: "Performer Profile Setup",
                    desc: "Complete profile creation with bio, images, and positioning for maximum audience appeal."
                  },
                  {
                    icon: TrendingUp,
                    title: "Fanclub & Network Exposure",
                    desc: "Access to FLESHLAB's fanclub system and network-wide promotional opportunities."
                  },
                  {
                    icon: CheckCircle2,
                    title: "Contract & Consent Workflow",
                    desc: "Professional contract generation, consent documentation, and release form management."
                  },
                  {
                    icon: Shield,
                    title: "Compliance & ID/KYC",
                    desc: "Full 18+ verification, identity documentation, and compliance record management."
                  }
                ].map((item, i) => (
                  <div key={i} className="bg-[#111] border border-white/8 rounded-xl p-6">
                    <item.icon className="w-6 h-6 text-rose-400 mb-4" />
                    <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── REVENUE MODELS ──────────────────────────────────────────── */}
          <RevenueModelsSection />

          {/* ── WHO THIS IS FOR ─────────────────────────────────────────── */}
          <WhoIsThisForSection />

          {/* ── COMPLIANCE AND TRUST ────────────────────────────────────── */}
          <ComplianceSection />

          {/* ── FAQ ─────────────────────────────────────────────────────── */}
          <FAQSection />

          {/* ── RESOURCES ───────────────────────────────────────────────── */}
          <ResourcesSection />

          {/* ── FINAL CTA ───────────────────────────────────────────────── */}
          <section className="py-16 md:py-20 border-b border-white/6 bg-[#0a0505]">
            <div className="max-w-3xl mx-auto px-4 text-center">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                Ready to Join a Studio-Backed Creator Network?
              </h2>
              <p className="text-white/50 mb-8 max-w-2xl mx-auto">
                Apply today to explore revenue-share options, distribution support, and professional creator infrastructure.
              </p>
              <Button
                onClick={handleCtaClick}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-5 rounded-xl h-auto text-lg shadow-xl shadow-rose-700/30"
              >
                Apply as a Creator
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </section>

        </div>
    </>
  );
}