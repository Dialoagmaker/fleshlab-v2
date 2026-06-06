import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield, Film, Check, Lock, ChevronRight, Camera, Clock,
  MapPin, User, Eye, EyeOff, HelpCircle, Star, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import SEOMeta from "@/components/SEOMeta";
import { storeAuthIntent } from "@/lib/authRedirect";

/* ── Static Data ─────────────────────────────────────────────────────────── */

const PACKAGES = [
  {
    key: "short",
    label: "Short Fan Production",
    filmed: "30 min filmed scene",
    window: "Production window: up to 2 hours",
    price: "from $799",
    recommended: false,
  },
  {
    key: "full",
    label: "Full Fan Production",
    filmed: "60 min filmed scene",
    window: "Production window: up to 3 hours",
    price: "from $1,499",
    recommended: true,
  },
  {
    key: "premium",
    label: "Premium Fan Production",
    filmed: "90 min filmed scene",
    window: "Production window: up to 4.5 hours",
    price: "from $2,499",
    recommended: false,
  },
  {
    key: "custom",
    label: "Custom / Multi-scene",
    filmed: "On request",
    window: "Multiple scenes, special locations or complex concepts",
    price: "Quote on request",
    recommended: false,
    custom: true,
  },
];

const PRIVACY_OPTIONS = [
  { icon: Eye,    label: "Show My Face",           desc: "Your face may appear in the final released production." },
  { icon: User,   label: "Mask / Discreet Look",   desc: "You can wear a mask or discreet look during filming." },
  { icon: EyeOff, label: "Blur My Face",           desc: "Your face can be blurred in the final public edit." },
  { icon: Film,   label: "No-Face Edit",           desc: "We plan filming so your face is not shown where possible." },
  { icon: Lock,   label: "Private / Limited Delivery", desc: "Available on request. May affect pricing and release terms." },
];

const INCLUDED = [
  "Studio review", "Performer coordination", "Production planning",
  "Consent & boundary planning", "Hotel/location setup (if included in quote)",
  "Performer domestic round-trip travel", "Performer allowance (if travel > 24h)",
  "Contracts & releases", "Filming", "Basic post-production", "Privacy/release handling",
];

const PREFERENCES = [
  "Oral", "Anal", "Kissing", "Handjob", "Wanking / Masturbation",
  "BDSM / Fetish elements", "Soft / Teasing", "Explicit production", "Other / On request",
];

const PHASES = [
  {
    phase: "Phase 1",
    title: "Build Your Request",
    color: "border-rose-600/40 bg-gradient-to-br from-[#160606] to-[#0f0606]",
    badge: "bg-rose-600/20 text-rose-400 border-rose-600/30",
    steps: [
      "Choose your preferred performer",
      "Choose production country & city",
      "Choose production length",
      "Submit production preferences",
      "Choose your privacy option",
    ],
  },
  {
    phase: "Phase 2",
    title: "Studio Review",
    color: "border-white/10 bg-[#0f0f0f]",
    badge: "bg-white/8 text-white/50 border-white/15",
    steps: [
      "Studio reviews feasibility, safety & compliance",
      "Performer approval required",
      "Compatibility & boundary check",
      "Final quote prepared",
    ],
  },
  {
    phase: "Phase 3",
    title: "Confirm & Produce",
    color: "border-white/10 bg-[#0f0f0f]",
    badge: "bg-white/8 text-white/50 border-white/15",
    steps: [
      "50% reservation after approval",
      "Production scheduling confirmed",
      "Production day / filming",
    ],
  },
];

const FAQS = [
  {
    q: "Is a Fan Production a private date?",
    a: "No. It is a planned adult production with verification, approval, contracts and filming. Off-camera meetings are not included.",
  },
  {
    q: "Can I choose a performer?",
    a: "You can request a preferred performer, but availability and performer approval are required before confirmation.",
  },
  {
    q: "What does production length mean?",
    a: "Production length refers to planned filmed scene content. Each package also includes reasonable setup, consent check, preparation, warm-up and short breaks within the scheduled production window. It is not private date time.",
  },
  {
    q: "Can I hide my face?",
    a: "Yes. You can request face visible, mask, blurred face, no-face edit or private/limited delivery depending on release agreement.",
  },
  {
    q: "Is approval guaranteed?",
    a: "No. Every request requires studio review and performer approval before confirmation.",
  },
  {
    q: "Are my personal travel costs included?",
    a: "No. Your flights, personal hotel stays, meals, visa requirements and personal expenses are not included.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

/* ── Component ───────────────────────────────────────────────────────────── */

export default function FanProductions() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const handleApply = () => {
    if (isAuthenticated) {
      navigate("/fan-productions/request");
    } else {
      storeAuthIntent({ actionType: "guest-production", nextUrl: "/fan-productions/request" });
      navigate("/register?next=/fan-productions/request");
    }
  };

  return (
    <>
      <SEOMeta
        title="FLESHLAB Fan Productions | Become Part of a Homemade Adult Production"
        description="Apply for a FLESHLAB Fan Production and become part of an official homemade-style adult production with verified performers. Studio review, performer approval, consent rules, privacy options, contracts and filming required."
        canonical="/fan-productions"
        jsonLd={faqSchema}
      />

      <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">

        {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden min-h-[580px] md:min-h-[680px] flex items-center py-20 md:py-28 px-5 sm:px-8">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('https://video.fleshlab.online/applications/private/ChatGPT%20Image%206.%20Juni%202026%2C%2022_43_09.png')",
              backgroundSize: "cover",
              backgroundPosition: "center right",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/70 to-black/25" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/65" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[250px] bg-rose-900/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative w-full max-w-[1280px] mx-auto">
            <div className="max-w-[620px]">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-700/30 rounded-full px-4 py-1.5 mb-6">
                <Camera className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300 text-xs font-black uppercase tracking-widest">FLESHLAB Fan Productions · Verified 18+ Only</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[0.92] tracking-tight mb-5">
                STOP WATCHING.<br />
                <span className="text-rose-500">BECOME PART</span><br />
                OF THE SCENE.
              </h1>

              <p className="text-white/60 text-base md:text-lg leading-relaxed mb-4">
                Love our videos? Got a favorite performer? Apply as a verified 18+ fan and become part of an official homemade-style FLESHLAB production with approved performers.
              </p>
              <p className="text-white/35 text-sm leading-relaxed mb-9">
                Choose your preferred performer, city, production length, privacy option and production preferences. FLESHLAB reviews the request, checks compatibility and confirms only after performer approval.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
                <Button
                  size="lg"
                  onClick={handleApply}
                  className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-8 py-4 rounded-xl h-auto shadow-xl shadow-rose-700/35 text-sm md:text-base"
                >
                  Build Your Fan Production Request
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full border-white/20 text-white hover:bg-white/8 font-semibold px-8 py-4 rounded-xl h-auto text-sm md:text-base">
                    How It Works
                  </Button>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/30 text-xs">
                {["Verified 18+ only", "Performer approval required", "Filmed production", "Contracts & releases", "Consent rules"].map((t, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-rose-600/60 shrink-0" />{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. EMOTIONAL HOOK ────────────────────────────────────────────── */}
        <section className="py-16 px-5 sm:px-8 border-t border-white/6 bg-gradient-to-b from-[#0c0505] to-[#080808]">
          <div className="max-w-[760px] mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-8">YOU LOVE OUR VIDEOS?</h2>
            <div className="space-y-3 text-white/55 text-lg leading-relaxed mb-8">
              <p>You love our videos.<br />You have a favorite performer.<br />You know what turns you on.</p>
              <p className="text-white font-black text-2xl md:text-3xl py-2">Now imagine being part of the scene.</p>
              <p>Then stop only watching.</p>
              <p>FLESHLAB Fan Productions let approved verified 18+ fans apply to become part of an official homemade-style FLESHLAB production.</p>
            </div>
            <div className="bg-[#111] border border-rose-900/35 rounded-2xl p-6 max-w-lg mx-auto">
              <p className="text-rose-400/80 text-xs font-black uppercase tracking-widest mb-3">Important</p>
              <p className="text-white/65 text-sm leading-relaxed">
                This is <strong className="text-white">not a private date</strong>. This is a planned adult production with verification, performer approval, consent rules, contracts, releases and filming.
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. WHAT IS A FAN PRODUCTION ──────────────────────────────────── */}
        <section className="py-16 px-5 sm:px-8 border-t border-white/5">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-3">WHAT IS A FLESHLAB FAN PRODUCTION?</h2>
              <p className="text-white/50 text-base max-w-2xl mx-auto">
                Fan Productions are official FLESHLAB homemade-style adult productions where approved verified 18+ fans may participate as guest performers.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Film,   label: "Homemade feeling",         desc: "Raw, real, intimate — shot like a genuine homemade scene, not a staged studio set." },
                { icon: User,   label: "Real chemistry",           desc: "Matched with a performer based on compatibility, preferences and mutual approval." },
                { icon: Shield, label: "Studio-controlled process",desc: "Every production is reviewed, planned and supervised by FLESHLAB from request to delivery." },
                { icon: Check,  label: "Performer approval",       desc: "No confirmation happens without the performer's explicit approval of the guest and production scope." },
                { icon: Lock,   label: "Consent & boundaries",     desc: "Consent rules and hard boundaries are documented before any production is confirmed." },
                { icon: Camera, label: "Filmed production",        desc: "Every Fan Production is filmed. This is not an unfilmed private session." },
                { icon: Film,   label: "Contracts & releases",     desc: "Legal contracts, releases and compliance documentation are required for every production." },
                { icon: Eye,    label: "Privacy options",          desc: "Choose your face visibility and release scope before production begins." },
              ].map(({ icon: Icon, label, desc }, i) => (
                <div key={i} className="bg-[#0f0f0f] border border-white/8 hover:border-rose-600/30 rounded-2xl p-6 transition-colors group">
                  <div className="w-11 h-11 rounded-xl bg-rose-600/15 border border-rose-700/25 flex items-center justify-center mb-4 group-hover:bg-rose-600/20 transition-colors">
                    <Icon className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="font-black text-white text-sm mb-2">{label}</div>
                  <div className="text-white/40 text-xs leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. CHOOSE YOUR VISIBILITY ────────────────────────────────────── */}
        <section className="py-16 px-5 sm:px-8 bg-gradient-to-b from-[#0d0606] to-[#080808] border-t border-white/5">
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">CHOOSE YOUR VISIBILITY</h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                You decide before production whether your face may appear in the final released production, should be masked, blurred or kept out of the public edit.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              {PRIVACY_OPTIONS.map(({ icon: Icon, label, desc }, i) => (
                <div key={i} className="bg-[#0f0f0f] border border-white/8 hover:border-rose-600/25 rounded-2xl p-5 flex gap-4 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-rose-600/12 border border-rose-700/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <div className="font-black text-white text-sm mb-1">{label}</div>
                    <div className="text-white/40 text-xs leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#111] border border-white/8 rounded-2xl p-5 text-center">
              <p className="text-white/35 text-xs leading-relaxed max-w-xl mx-auto">
                FLESHLAB still verifies your real identity internally for 18+ compliance, contracts and safety. Privacy options affect the final production/edit, not the required verification process.
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. PRODUCTION LENGTH VS WINDOW ───────────────────────────────── */}
        <section className="py-16 px-5 sm:px-8 border-t border-white/5">
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">PRODUCTION LENGTH VS PRODUCTION WINDOW</h2>
              <p className="text-white/60 text-base max-w-xl mx-auto font-semibold mb-3">
                You pay for filmed scene content — inside a planned production window.
              </p>
              <p className="text-white/40 text-sm max-w-lg mx-auto">
                Your package length refers to planned filmed scene content, not a private date or unstructured personal time. Each Fan Production includes reasonable setup, consent check, preparation, warm-up and short breaks within the scheduled production window.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {[
                { label: "Short Fan Production",   filmed: "30 min filmed scene",  window: "Up to 2 hours",    recommended: false, custom: false },
                { label: "Full Fan Production",    filmed: "60 min filmed scene",  window: "Up to 3 hours",    recommended: true,  custom: false },
                { label: "Premium Fan Production", filmed: "90 min filmed scene",  window: "Up to 4.5 hours",  recommended: false, custom: false },
                { label: "Custom / Multi-scene",   filmed: "On request",           window: "Custom window",    recommended: false, custom: true  },
              ].map(({ label, filmed, window: w, recommended }, i) => (
                <div key={i} className={`relative rounded-2xl p-5 border flex flex-col gap-2 ${recommended ? "bg-gradient-to-br from-[#1a0808] to-[#0f0606] border-rose-600/40" : "bg-[#0f0f0f] border-white/8"}`}>
                  {recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      Recommended
                    </div>
                  )}
                  <Clock className="w-4 h-4 text-rose-400" />
                  <div className="font-black text-white text-sm">{label}</div>
                  <div className="text-rose-400 text-xs font-bold">{filmed}</div>
                  <div className="text-white/40 text-xs">Production window: {w}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-5 text-white/40 text-xs leading-relaxed text-center">
              Extra private time, unfilmed extensions or off-schedule meetings are not included. Longer production windows require studio and performer approval and a custom quote.
            </div>
          </div>
        </section>

        {/* ── 6. HOW IT WORKS — 3 PHASES ───────────────────────────────────── */}
        <section id="how-it-works" className="py-16 px-5 sm:px-8 bg-gradient-to-b from-[#0d0606] to-[#080808] border-t border-white/5">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-3">HOW FAN PRODUCTIONS WORK</h2>
              <p className="text-white/45 text-base max-w-xl mx-auto">From your first request to production day — in three clear phases.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {PHASES.map(({ phase, title, color, badge, steps }, i) => (
                <div key={i} className={`rounded-2xl border p-6 flex flex-col gap-4 ${color}`}>
                  <div>
                    <span className={`inline-block text-xs font-black uppercase tracking-widest border rounded-full px-3 py-1 mb-3 ${badge}`}>{phase}</span>
                    <h3 className="text-white font-black text-lg leading-tight">{title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {steps.map((step, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-rose-600/20 border border-rose-600/30 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-rose-400 text-[9px] font-black">{j + 1}</span>
                        </div>
                        <span className="text-white/55 text-sm leading-snug">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. PRODUCTION PREFERENCES ────────────────────────────────────── */}
        <section className="py-16 px-5 sm:px-8 border-t border-white/5">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">SUBMIT YOUR PRODUCTION PREFERENCES</h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                Tell us what kind of scene you want to be part of. Your preferences help us check compatibility and plan the production.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 justify-center mb-8">
              {PREFERENCES.map((p, i) => (
                <div key={i} className="bg-white/5 border border-white/10 hover:border-rose-600/30 rounded-full px-4 py-2 text-white/60 text-sm font-medium transition-colors">
                  {p}
                </div>
              ))}
            </div>
            <div className="bg-[#111] border border-rose-900/25 rounded-2xl p-5 text-center">
              <p className="text-white/40 text-xs leading-relaxed max-w-xl mx-auto">
                Preferences are not guaranteed services. Final scope depends on performer consent, compatibility, boundaries, safety and FLESHLAB approval.
              </p>
            </div>
          </div>
        </section>

        {/* ── 8. PRICING ───────────────────────────────────────────────────── */}
        <section className="py-16 px-5 sm:px-8 bg-gradient-to-b from-[#0d0606] to-[#080808] border-t border-white/5">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-3">FAN PRODUCTION PRICING</h2>
              <p className="text-white/50 text-base max-w-xl mx-auto mb-2">
                Production packages — not a per-service menu. Final quote is calculated individually.
              </p>
              <p className="text-amber-400/70 text-sm font-bold">Your personal travel costs are not included.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              {PACKAGES.map(({ key, label, filmed, window: w, price, recommended, custom }) => (
                <div
                  key={key}
                  className={`relative rounded-2xl p-6 border flex flex-col gap-3 ${recommended
                    ? "bg-gradient-to-br from-[#1a0808] to-[#0f0606] border-rose-600/50 shadow-[0_0_40px_rgba(220,38,38,0.12)]"
                    : "bg-[#0f0f0f] border-white/8"
                  }`}
                >
                  {recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <div className="font-black text-white text-base leading-tight">{label}</div>
                  <div className="text-rose-400 font-black text-3xl leading-none">{price}</div>
                  <div className="text-white/55 text-xs leading-relaxed">
                    <div className="mb-1 font-semibold">{filmed}</div>
                    <div className="text-white/35">{w}</div>
                  </div>
                  <div className="mt-auto pt-1">
                    {!custom ? (
                      <Button
                        onClick={handleApply}
                        size="sm"
                        className={`w-full font-bold rounded-xl h-auto py-2.5 text-xs ${recommended
                          ? "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-700/25"
                          : "bg-white/8 hover:bg-white/14 text-white border border-white/12"
                        }`}
                      >
                        Apply for This Package
                      </Button>
                    ) : (
                      <Button
                        onClick={handleApply}
                        size="sm"
                        className="w-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/12 font-bold rounded-xl h-auto py-2.5 text-xs"
                      >
                        Request a Custom Quote
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quote factors */}
            <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-6 mb-4">
              <p className="text-white/35 text-xs font-black uppercase tracking-widest mb-3">Final quote depends on</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  "Selected performer", "Performer availability", "Production country & city",
                  "Hotel / location setup", "Domestic round-trip performer travel", "Production length",
                  "Production preferences", "Complexity / intensity", "Privacy or release model", "Post-production requirements",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/45 text-xs">
                    <div className="w-1 h-1 rounded-full bg-rose-600/60 shrink-0" />{f}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111] border border-amber-900/25 rounded-2xl p-5 text-center">
              <p className="text-amber-400/70 text-xs font-bold mb-1 uppercase tracking-wider">Not included in your quote</p>
              <p className="text-white/40 text-xs leading-relaxed max-w-xl mx-auto">
                Your personal flights, your own hotel outside the production booking, meals, visa requirements, travel insurance and personal expenses are <strong className="text-white/55">not included</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ── 9. WHAT YOUR QUOTE CAN INCLUDE ───────────────────────────────── */}
        <section className="py-16 px-5 sm:px-8 border-t border-white/5">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">WHAT YOUR QUOTE CAN INCLUDE</h2>
              <p className="text-white/50 text-base max-w-2xl mx-auto">
                Your quote can cover the full production setup — from performer coordination and planning to hotel/location, filming, contracts and post-production.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {INCLUDED.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#0f0f0f] border border-white/6 rounded-xl p-4">
                  <div className="w-2 h-2 rounded-full bg-rose-600/70 shrink-0" />
                  <span className="text-white/60 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 10. TRAVEL / HOTEL / PERFORMER COMFORT ───────────────────────── */}
        <section className="py-16 px-5 sm:px-8 bg-gradient-to-b from-[#0d0606] to-[#080808] border-t border-white/5">
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">TRAVEL, HOTEL & PERFORMER COMFORT</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5 mb-6">
              {[
                {
                  icon: MapPin,
                  title: "Hotel / Location",
                  body: "The quote may include a clean and suitable hotel/location setup for the production. Premium locations or special setups may increase the final quote.",
                },
                {
                  icon: ArrowRight,
                  title: "Domestic Performer Travel",
                  body: "Fan Productions are arranged inside the country where the selected performer is based. Performer domestic travel is calculated as round-trip and may include car, domestic flight, ferry, premium bus, taxi or transfers. For most Philippines-based productions, domestic performer travel is estimated up to $1,200. Remote islands, peak-season bookings or complex routes may require a custom quote.",
                },
                {
                  icon: Star,
                  title: "Performer Allowance",
                  body: "If travel or production scheduling requires more than 24 hours away from the performer's home base, a daily performer allowance is added for meals, local movement and travel comfort.",
                },
              ].map(({ icon: Icon, title, body }, i) => (
                <div key={i} className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-rose-600/15 border border-rose-700/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="font-black text-white text-sm mb-2">{title}</div>
                  <div className="text-white/45 text-xs leading-relaxed">{body}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#111] border border-amber-900/20 rounded-2xl p-5 text-center">
              <p className="text-white/35 text-xs leading-relaxed max-w-xl mx-auto">
                Your personal flights, personal hotel stays, meals, visa, travel insurance and personal expenses are <strong className="text-white/55">not included</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ── 11. 50% RESERVATION ──────────────────────────────────────────── */}
        <section className="py-14 px-5 sm:px-8 bg-[#0a0505] border-t border-white/5">
          <div className="max-w-[700px] mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-black mb-4">50% RESERVATION AFTER APPROVAL</h2>
            <p className="text-white/50 text-base leading-relaxed mb-6 max-w-lg mx-auto">
              A 50% reservation payment is required only after studio review, performer approval and final quote confirmation. The reservation secures performer availability, hotel/location, domestic travel and production scheduling. Remaining balance is due before the confirmed production date.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              {["Studio review complete", "Performer approval confirmed", "Final quote confirmed"].map((s, i) => (
                <div key={i} className="bg-[#0f0f0f] border border-rose-900/25 rounded-xl p-4 text-center">
                  <div className="w-7 h-7 rounded-full bg-rose-600/20 flex items-center justify-center mx-auto mb-2">
                    <span className="text-rose-400 text-xs font-black">{i + 1}</span>
                  </div>
                  <div className="text-white/55 text-xs leading-tight">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 12. CONTROLLED / VERIFIED / APPROVED ─────────────────────────── */}
        <section className="py-16 px-5 sm:px-8 border-t border-white/5">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">CONTROLLED. VERIFIED. APPROVED.</h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                FLESHLAB Fan Productions are planned adult productions. They are not private dates, escort bookings or off-camera meetings.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                "Verified 18+ only",
                "Performer approval required",
                "Studio approval required",
                "Consent and boundaries documented",
                "Contracts and releases required",
                "No illegal, unsafe or non-consensual content",
                "No off-schedule private meetings",
                "No unapproved extensions",
                "Studio can reject any request",
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-3 bg-[#0f0f0f] border border-white/6 rounded-xl p-4">
                  <Shield className="w-4 h-4 text-rose-500/70 shrink-0 mt-0.5" />
                  <span className="text-white/55 text-sm leading-snug">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 13. FAQ ───────────────────────────────────────────────────────── */}
        <section className="py-16 px-5 sm:px-8 bg-gradient-to-b from-[#0d0606] to-[#080808] border-t border-white/5">
          <div className="max-w-[700px] mx-auto">
            <div className="text-center mb-10">
              <HelpCircle className="w-8 h-8 text-rose-500/50 mx-auto mb-3" />
              <h2 className="text-3xl font-black mb-2">FREQUENTLY ASKED QUESTIONS</h2>
            </div>
            <div className="space-y-2">
              {FAQS.map(({ q, a }, i) => (
                <div key={i} className="bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden">
                  <button
                    className="w-full text-left px-6 py-4 flex items-start justify-between gap-4"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-bold text-white text-sm leading-snug">{q}</span>
                    <ChevronRight className={`w-4 h-4 text-white/30 shrink-0 mt-0.5 transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 text-white/50 text-sm leading-relaxed border-t border-white/5 pt-4">{a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 14. FINAL CTA ────────────────────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8 border-t border-white/5">
          <div className="relative max-w-[800px] mx-auto">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-rose-800/15 rounded-full blur-[90px]" />
            </div>
            <div className="relative bg-gradient-to-br from-[#1a0808] to-[#0d0808] border border-rose-600/25 rounded-3xl px-6 sm:px-12 py-14 text-center">
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                READY TO BUILD YOUR <span className="text-rose-500">FAN PRODUCTION REQUEST?</span>
              </h2>
              <p className="text-white/50 text-base mb-3 max-w-md mx-auto">
                Tell us your preferred performer, city, production length, privacy option and production preferences. FLESHLAB will review the request and contact you with the next steps.
              </p>
              <p className="text-white/25 text-xs mb-8 max-w-sm mx-auto">
                Application does not guarantee approval. Every request requires studio review and performer approval.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={handleApply}
                  className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-10 py-4 rounded-xl h-auto shadow-xl shadow-rose-700/30 text-sm md:text-base"
                >
                  Build Your Fan Production Request
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full border-white/20 text-white hover:bg-white/8 font-semibold px-8 py-4 rounded-xl h-auto text-sm md:text-base">
                    Review How It Works
                  </Button>
                </a>
              </div>
              <p className="text-white/20 text-xs mt-6 max-w-md mx-auto leading-relaxed">
                FLESHLAB Fan Productions are planned adult productions for verified 18+ participants only. Not available to minors. Not a private dating or escort service. All productions require studio approval and performer consent.
              </p>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}