import { Link, useNavigate } from "react-router-dom";
import { Lock, Check, Shield, Film, MapPin, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAccessControl } from "@/lib/useAccessControl";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";

// Real FLESHLAB video thumbnails used as visual proof
const PROOF_THUMBS = [
  "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg",
  "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/mj1.jpg",
  "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/DialogMaxX_BI-Alex---Wanking-in-the-School-Locker-Room.jpg",
  "https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/pinkboys-studios/thumbnails/DialogMaxX_Cute-Raven---hunky-Asian-twink-lying-touching-and-cumming.jpg",
];

const TIMELINE_STEPS = [
  { num: "01", label: "Apply",                desc: "Submit your guest production application with contact details." },
  { num: "02", label: "Verification",          desc: "Identity verification and 18+ age confirmation required." },
  { num: "03", label: "Compatibility Review",  desc: "Studio reviews your application and performer compatibility." },
  { num: "04", label: "Performer Approval",    desc: "Performer reviews and must independently approve the production." },
  { num: "05", label: "Studio Planning",       desc: "Production scope, location, timeline and boundary documentation." },
  { num: "06", label: "Production Quote",      desc: "Final quote issued based on scope, location and post-production." },
  { num: "07", label: "Filming",               desc: "Professional studio production with full safety protocols and contracts." },
  { num: "08", label: "Post-Production & Release", desc: "Editing, finishing and release under agreed licensing terms." },
];

const LOCATIONS = [
  {
    name: "Philippines",
    desc: "Tropical locations, hotel shoots, studio scenes and verified performer collaborations in Southeast Asia.",
    flag: "🇵🇭",
  },
  {
    name: "Taiwan",
    desc: "Urban, discreet and production-controlled environment for selected shoots with Asian performers.",
    flag: "🇹🇼",
  },
  {
    name: "Madagascar",
    desc: "Exotic destination productions with custom planning, travel coordination and premium production scope.",
    flag: "🇲🇬",
  },
];

export default function GuestProduction({ canonical, noIndex }) {
  const { isAuthenticated } = useAuth();
  const { requireSignup } = useAccessControl();
  const navigate = useNavigate();

  const handleApply = () => {
    if (isAuthenticated) {
      document.getElementById('apply-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      requireSignup('/guest-production');
    }
  };

  return (
    <>
      <SEOMeta
        title="Guest Production | FLESHLAB Studios — 18+ Studio Application"
        description="Apply for a professional 18+ guest production with FLESHLAB Studios. Application-based, verified performers, studio review, contracts, safety protocols. Starting from $999."
        canonical={canonical || "/guest-production"}
        noIndex={noIndex}
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", "name": "FLESHLAB Studios Guest Production" }}
      />

      <div className="min-h-screen bg-[#080808] text-white">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative py-28 px-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-[700px] h-[500px] bg-rose-700/8 rounded-full blur-[130px]" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-rose-900/6 rounded-full blur-[100px]" />
          </div>

          <div className="relative max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-600/30 rounded-full px-4 py-1.5 mb-8">
                <Film className="w-4 h-4 text-rose-400" />
                <span className="text-rose-300 text-sm font-semibold tracking-widest uppercase">Guest Production</span>
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[1.0] tracking-tight mb-6">
                LIKE WHAT<br />
                YOU SEE?<br />
                <span className="text-rose-500">NOW STEP INSIDE<br />THE PRODUCTION.</span>
              </h1>

              <p className="text-lg text-white/60 leading-relaxed mb-6 max-w-xl">
                You are not just watching anymore. Selected fans can apply to become verified 18+ guest performers in professional FLESHLAB studio productions.
              </p>

              <div className="flex items-center gap-2 text-white/40 text-sm mb-8">
                <MapPin className="w-4 h-4 text-rose-500/60 shrink-0" />
                <span>Philippines · Taiwan · Madagascar</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={handleApply}
                  className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-5 rounded-xl h-auto shadow-xl shadow-rose-600/35 text-base"
                >
                  Apply for Guest Production
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-white/20 text-white hover:bg-white/8 font-semibold px-8 py-5 rounded-xl h-auto text-base"
                >
                  See How It Works
                </Button>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/35 text-sm">
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Application required</span>
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Verified 18+ only</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Performer approval</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />Legal releases</span>
              </div>
            </div>

            {/* Right — proof thumbnails */}
            <div className="hidden lg:grid grid-cols-2 gap-3">
              {PROOF_THUMBS.map((src, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden border border-white/8">
                  <img src={src} alt="FLESHLAB production" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STORY — from fan to guest performer ──────────────────────── */}
        <section className="py-20 px-6 border-t border-white/6 bg-[#0d0d0d]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-8">
              FROM FAN TO <span className="text-rose-500">GUEST PERFORMER</span>
            </h2>
            <div className="space-y-5 text-white/60 text-lg leading-relaxed">
              <p>You discovered the performers.<br />You watched the previews.<br />Maybe you joined Fanclub.<br />Maybe one of our guys caught your attention.</p>
              <p>Guest Production is for selected applicants who want to take the next step and participate in a professional FLESHLAB production as a verified guest performer.</p>
              <div className="bg-amber-600/10 border border-amber-600/25 rounded-xl p-5">
                <p className="text-amber-200/80 text-base font-medium leading-relaxed">
                  This is not a private date.<br />
                  This is not escort booking.<br />
                  This is not an off-platform arrangement.<br /><br />
                  It is a reviewed adult studio production with identity verification, consent, compatibility review, performer approval, contracts, releases and professional production planning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW GUEST PRODUCTIONS WORK — timeline ────────────────────── */}
        <section id="how-it-works" className="py-20 px-6">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-center mb-14">
              HOW GUEST PRODUCTIONS <span className="text-rose-500">WORK</span>
            </h2>

            <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={i} className="flex gap-4 bg-[#111] border border-white/6 rounded-xl p-5">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-rose-600/15 border border-rose-600/20 flex items-center justify-center">
                    <span className="text-rose-400 font-black text-xs">{step.num}</span>
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm mb-1">{step.label}</div>
                    <div className="text-white/45 text-xs leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LOCATIONS ────────────────────────────────────────────────── */}
        <section className="py-20 px-6 bg-[#0d0d0d] border-y border-white/6">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl font-black text-center mb-4">PRODUCTION <span className="text-rose-500">LOCATIONS</span></h2>
            <p className="text-white/40 text-center text-sm mb-12 max-w-xl mx-auto">
              All locations depend on availability, local compliance, performer approval, production feasibility and studio review.
            </p>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {LOCATIONS.map((loc, i) => (
                <div key={i} className="bg-[#111] border border-white/8 rounded-2xl p-7">
                  <div className="text-4xl mb-4">{loc.flag}</div>
                  <h3 className="text-xl font-black text-white mb-3">{loc.name}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{loc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-[#150e0e] to-[#0d0d0d] border border-rose-600/20 rounded-3xl overflow-hidden">
                <div className="bg-rose-950/30 border-b border-rose-600/15 px-10 py-6 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-xs font-bold tracking-widest text-rose-500/60 uppercase mb-1">Production Packages</div>
                    <h2 className="text-3xl font-black text-white">PRODUCTION PACKAGES</h2>
                    <p className="text-white/45 text-sm mt-1">Start from</p>
                  </div>
                  <div className="text-right">
                    <div className="text-6xl font-black text-white">$999</div>
                  </div>
                </div>

                <div className="p-10">
                  <p className="text-white/50 text-sm leading-relaxed mb-10">
                    Final quote depends on production scope, location, filming time, performer compatibility, travel, compliance, contracts, releases and post-production.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 mb-10">
                    {[
                      { req: true,  label: "Application required" },
                      { req: true,  label: "Verified 18+ only" },
                      { req: true,  label: "Studio approval required" },
                      { req: true,  label: "Performer approval required" },
                      { inc: true,  label: "Legal contracts & releases" },
                      { inc: true,  label: "Safety protocol" },
                      { inc: true,  label: "Professional filming" },
                      { inc: true,  label: "Post-production included" },
                    ].map(({ req, label }, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${req ? 'bg-rose-600/20' : 'bg-emerald-600/15'}`}>
                          {req ? <Lock className="w-2.5 h-2.5 text-rose-400" /> : <Check className="w-2.5 h-2.5 text-emerald-400" />}
                        </div>
                        <span className="text-white/65 text-sm">{label}</span>
                      </div>
                    ))}
                  </div>

                  <div id="apply-section" className="text-center">
                    <Button
                      size="lg"
                      onClick={handleApply}
                      className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-12 py-5 rounded-xl h-auto shadow-xl shadow-rose-600/25 text-base"
                    >
                      Apply for Guest Production
                    </Button>
                    {!isAuthenticated && (
                      <p className="text-white/25 text-xs mt-3">Account required before submitting application</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Compliance notice */}
              <div className="mt-6 bg-amber-600/8 border border-amber-600/20 rounded-xl p-5">
                <p className="text-amber-200/70 text-sm leading-relaxed text-center">
                  Guest Production is a professional studio program for verified 18+ participants. This is not a dating, hookup or escort service. All productions are studio-controlled with full consent documentation and safety protocols.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────── */}
        <section className="py-20 px-6 border-t border-white/6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-5">
              READY TO <span className="text-rose-500">APPLY?</span>
            </h2>
            <p className="text-white/55 text-lg mb-10">
              Submit your application and our team will review it within 48 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={handleApply}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-5 rounded-xl h-auto shadow-xl shadow-rose-600/30 text-base"
              >
                Apply for Guest Production
              </Button>
              <Link to="/fanclub">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/8 font-semibold px-8 py-5 rounded-xl h-auto text-base">
                  Browse Fanclub First
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}