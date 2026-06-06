import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Film, Check, Lock, ChevronRight, Camera, Clock, MapPin, User, Eye, EyeOff, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import SEOMeta from "@/components/SEOMeta";

const STEPS = [
  { n: 1, title: "Choose your preferred performer", desc: "Request your favorite FLESHLAB performer. Availability and approval are required before confirmation." },
  { n: 2, title: "Choose country & city", desc: "Fan Productions are arranged inside the country where the selected performer is based. You may request the city." },
  { n: 3, title: "Choose production length", desc: "Select 30, 60, 90 minutes or custom on request. Production length means filmed scene content, not private personal time." },
  { n: 4, title: "Submit production preferences", desc: "Tell us what type of scene you are interested in. Preferences help us plan compatibility and production scope." },
  { n: 5, title: "Tell us your role & dynamic", desc: "Top, Bottom, Vers, Not sure, Depends on production. Helps evaluate compatibility." },
  { n: 6, title: "Choose your privacy option", desc: "Face visible, mask, blurred face, no-face edit or private/limited delivery on request." },
  { n: 7, title: "Studio review", desc: "FLESHLAB reviews the request for feasibility, safety, compliance and production scope." },
  { n: 8, title: "Performer approval", desc: "The performer must approve the request before any confirmation." },
  { n: 9, title: "Final quote", desc: "You receive a quote based on package, city, hotel/location, performer travel, complexity and release/privacy model." },
  { n: 10, title: "50% reservation", desc: "After approval and quote confirmation, a 50% reservation payment secures the performer, hotel/location, domestic travel and production schedule." },
  { n: 11, title: "Production day", desc: "The production is filmed within the agreed production window." },
];

const PACKAGES = [
  {
    key: "short",
    label: "Short Fan Production",
    filmed: "30 min filmed scene",
    window: "Production window up to 2 hours",
    price: "from $799",
    recommended: false,
  },
  {
    key: "full",
    label: "Full Fan Production",
    filmed: "60 min filmed scene",
    window: "Production window up to 3 hours",
    price: "from $1,499",
    recommended: true,
  },
  {
    key: "premium",
    label: "Premium Fan Production",
    filmed: "90 min filmed scene",
    window: "Production window up to 4.5 hours",
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
  { icon: Eye, label: "Show My Face", desc: "Your face may appear in the final production." },
  { icon: User, label: "Mask / Discreet Look", desc: "You can wear a mask or discreet look during filming." },
  { icon: EyeOff, label: "Blur My Face", desc: "Your face can be blurred in the final public edit." },
  { icon: Film, label: "No-Face Edit", desc: "We plan filming so your face is not shown where possible." },
  { icon: Lock, label: "Private / Limited Delivery", desc: "Available on request. May affect pricing and release terms." },
];

const INCLUDED = [
  "Studio review", "Performer coordination", "Production planning",
  "Consent & boundary planning", "Hotel/location setup (if in quote)",
  "Performer domestic round-trip travel", "Performer allowance (if travel > 24h)",
  "Contracts & releases", "Filming", "Basic post-production", "Privacy/release handling",
];

const PREFERENCES = [
  "Oral", "Anal", "Kissing", "Handjob", "Wanking / Masturbation",
  "BDSM / Fetish elements", "Soft / Teasing", "Explicit production", "Other / On request",
];

const FAQS = [
  { q: "Is a Fan Production a private date?", a: "No. It is a planned adult production with verification, approval, contracts and filming. Off-camera meetings are not included." },
  { q: "Can I choose a performer?", a: "You can request a preferred performer, but availability and performer approval are required before confirmation." },
  { q: "Does production length mean sex time?", a: "No. Production length refers to planned filmed scene content. Each package also includes setup, consent check, preparation and short breaks within the scheduled production window." },
  { q: "Can I hide my face?", a: "Yes. You can request face visible, mask, blurred face, no-face edit or private/limited delivery depending on release agreement." },
  { q: "Is approval guaranteed?", a: "No. Every request requires studio review and performer approval before confirmation." },
  { q: "Are my personal travel costs included?", a: "No. Your flights, personal hotel stays, meals, visa requirements and personal expenses are not included." },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQS.map(({ q, a }) => ({
    "@type": "Question",
    "name": q,
    "acceptedAnswer": { "@type": "Answer", "text": a },
  })),
};

export default function FanProductions() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const handleApply = () => {
    if (isAuthenticated) navigate('/guest-production');
    else navigate('/register?next=/guest-production');
  };

  return (
    <>
      <SEOMeta
        title="FLESHLAB Fan Productions | Become Part of a Homemade Adult Production"
        description="Apply for a FLESHLAB Fan Production and become part of an official homemade-style adult production with verified performers. Studio review, performer approval, consent rules, privacy options, contracts and filming required."
        canonical="/fan-productions"
        jsonLd={faqSchema}
      />

      <div className="min-h-screen bg-[#080808] text-white">

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden min-h-[600px] md:min-h-[680px] flex items-center py-24 px-6">
          {/* Background image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('https://video.fleshlab.online/applications/private/ChatGPT%20Image%206.%20Juni%202026%2C%2022_43_09.png')",
              backgroundSize: "cover",
              backgroundPosition: "center right",
            }}
            aria-hidden="true"
          />
          {/* Left-heavy dark overlay — readable text left, image visible right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/70 to-black/25" aria-hidden="true" />
          {/* Top & bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" aria-hidden="true" />
          {/* Subtle rose glow bottom-left */}
          <div className="absolute bottom-0 left-0 w-[400px] h-[250px] bg-rose-900/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative w-full max-w-[1280px] mx-auto">
          <div className="max-w-[620px]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-rose-600/15 border border-rose-700/30 rounded-full px-4 py-1.5 mb-7">
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 text-xs font-black uppercase tracking-widest">FLESHLAB Fan Productions · Verified 18+ Only</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-[0.92] tracking-tight mb-4">
              STOP WATCHING.<br />
              <span className="text-rose-500">BECOME PART</span><br />
              OF THE SCENE.
            </h1>

            <p className="text-white/55 text-lg md:text-xl leading-relaxed mb-5">
              Love our videos? Apply as a verified 18+ fan and take part in an official homemade-style FLESHLAB production with approved performers.
            </p>
            <p className="text-white/35 text-base leading-relaxed mb-10">
              You choose your preferred performer, city, production length, privacy option and production preferences. FLESHLAB reviews the request, checks performer availability and compatibility, and confirms only after performer approval.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
              <Button
                size="lg"
                onClick={handleApply}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-10 py-5 rounded-xl h-auto shadow-xl shadow-rose-700/35 text-base"
              >
                Build Your Fan Production Request
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/8 font-semibold px-8 py-5 rounded-xl h-auto text-base">
                  How It Works
                </Button>
              </a>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/30 text-xs">
              {["Verified 18+ only", "Performer approval required", "Filmed production", "Contracts & releases", "Consent rules"].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-rose-600/60 shrink-0" />{t}
                </span>
              ))}
            </div>
          </div>
          </div>
        </section>

        {/* ── EMOTIONAL INTRO ────────────────────────────────────────────── */}
        <section className="py-16 px-6 border-t border-white/6 bg-gradient-to-b from-[#0c0505] to-[#080808]">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-black mb-8 text-center">YOU LOVE OUR VIDEOS?</h2>
            <div className="space-y-4 text-white/60 text-lg leading-relaxed text-center max-w-xl mx-auto mb-8">
              <p>You love our videos.<br />You have a favorite performer.<br />You are into raw, animalistic, homemade-style adult scenes.</p>
              <p className="text-white font-black text-2xl">Then stop only watching.</p>
              <p>FLESHLAB Fan Productions let approved verified 18+ fans apply to become part of an official homemade-style FLESHLAB production.</p>
            </div>
            <div className="bg-[#111] border border-rose-900/30 rounded-2xl p-6 max-w-lg mx-auto">
              <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-3">Important</p>
              <p className="text-white/60 text-sm leading-relaxed">
                This is <strong className="text-white/80">not a private date</strong>. This is a planned adult production with verification, performer approval, consent rules, contracts, releases and filming.
              </p>
            </div>
          </div>
        </section>

        {/* ── WHAT IS A FAN PRODUCTION ───────────────────────────────────── */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-3">WHAT IS A FLESHLAB FAN PRODUCTION?</h2>
              <p className="text-white/50 text-base max-w-2xl mx-auto">
                Fan Productions are official FLESHLAB homemade-style adult productions where approved verified 18+ fans may participate as guest performers.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Film, label: "Homemade feeling", desc: "Raw, real, intimate — shot like a genuine homemade scene, not a staged studio set." },
                { icon: User, label: "Real chemistry", desc: "Matched with a performer based on compatibility, preferences and mutual approval." },
                { icon: Shield, label: "Studio-controlled process", desc: "Every production is reviewed, planned and supervised by FLESHLAB from request to delivery." },
                { icon: Check, label: "Performer approval", desc: "No confirmation happens without the performer's explicit approval of the guest and production scope." },
                { icon: Lock, label: "Consent & boundaries", desc: "Consent rules and hard boundaries are documented before any production is confirmed." },
                { icon: Camera, label: "Filmed production", desc: "Every Fan Production is filmed. This is not an unfilmed private session." },
                { icon: Film, label: "Contracts & releases", desc: "Legal contracts, releases and compliance documentation are required for every production." },
                { icon: Eye, label: "Privacy options", desc: "Choose your face visibility and release scope before production begins." },
              ].map(({ icon: Icon, label, desc }, i) => (
                <div key={i} className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-5">
                  <div className="w-9 h-9 rounded-lg bg-rose-600/15 border border-rose-700/20 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="font-black text-white text-sm mb-1.5">{label}</div>
                  <div className="text-white/40 text-xs leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-16 px-6 bg-gradient-to-b from-[#0d0606] to-[#080808] border-t border-white/5">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-3">HOW FAN PRODUCTIONS WORK</h2>
              <p className="text-white/45 text-base max-w-xl mx-auto">A clear step-by-step process from your first request to production day.</p>
            </div>
            <div className="space-y-3">
              {STEPS.map(({ n, title, desc }) => (
                <div key={n} className="flex gap-4 bg-[#0f0f0f] border border-white/6 rounded-2xl p-5">
                  <div className="w-8 h-8 rounded-full bg-rose-600/20 border border-rose-600/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-rose-400 text-xs font-black">{n}</span>
                  </div>
                  <div>
                    <div className="font-black text-white text-sm mb-1">{title}</div>
                    <div className="text-white/45 text-xs leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRODUCTION LENGTH ──────────────────────────────────────────── */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-3">PRODUCTION LENGTH VS PRODUCTION WINDOW</h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                Your package length refers to planned filmed scene content — not a private date or unstructured personal time.
              </p>
              <p className="text-white/35 text-sm mt-3 max-w-lg mx-auto">
                Each Fan Production includes reasonable setup, consent check, preparation, warm-up and short breaks within the scheduled production window.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Short Fan Production", filmed: "30 min filmed scene", window: "Up to 2 hours", custom: false },
                { label: "Full Fan Production", filmed: "60 min filmed scene", window: "Up to 3 hours", recommended: true, custom: false },
                { label: "Premium Fan Production", filmed: "90 min filmed scene", window: "Up to 4.5 hours", custom: false },
                { label: "Custom / Multi-scene", filmed: "On request", window: "Custom window", custom: true },
              ].map(({ label, filmed, window: w, recommended, custom }, i) => (
                <div key={i} className={`relative rounded-2xl p-5 border flex flex-col gap-2 ${recommended ? 'bg-gradient-to-br from-[#1a0808] to-[#0f0606] border-rose-600/40' : 'bg-[#0f0f0f] border-white/8'}`}>
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

            <div className="mt-6 bg-[#0f0f0f] border border-white/8 rounded-2xl p-5 text-white/40 text-xs leading-relaxed text-center">
              Extra private time, unfilmed extensions or off-schedule meetings are not included. Longer production windows require studio and performer approval and a custom quote.
            </div>
          </div>
        </section>

        {/* ── PREFERENCES ────────────────────────────────────────────────── */}
        <section className="py-16 px-6 bg-gradient-to-b from-[#0d0606] to-[#080808] border-t border-white/5">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">SUBMIT YOUR PRODUCTION PREFERENCES</h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                Tell us what kind of production you are interested in. These are production preferences, not guaranteed services.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 justify-center mb-8">
              {PREFERENCES.map((p, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white/60 text-sm font-medium">
                  {p}
                </div>
              ))}
            </div>
            <div className="bg-[#111] border border-rose-900/25 rounded-2xl p-5 text-center">
              <p className="text-white/40 text-xs leading-relaxed max-w-xl mx-auto">
                Preferences help us plan the scene. They are <strong className="text-white/60">not guaranteed services</strong>. Final production scope depends on performer consent, compatibility, boundaries, safety and FLESHLAB approval.
              </p>
            </div>
          </div>
        </section>

        {/* ── PRIVACY ────────────────────────────────────────────────────── */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">CHOOSE YOUR VISIBILITY</h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                You decide before production whether your face may appear in the final released production.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {PRIVACY_OPTIONS.map(({ icon: Icon, label, desc }, i) => (
                <div key={i} className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-5 flex gap-4">
                  <div className="w-9 h-9 rounded-lg bg-rose-600/12 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-rose-400" />
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

        {/* ── PRICING ────────────────────────────────────────────────────── */}
        <section className="py-16 px-6 bg-gradient-to-b from-[#0d0606] to-[#080808] border-t border-white/5">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-3">FAN PRODUCTION PRICING</h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                Production packages — not a per-service menu. Final quote is calculated individually.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {PACKAGES.map(({ key, label, filmed, window: w, price, recommended, custom }) => (
                <div key={key} className={`relative rounded-2xl p-6 border flex flex-col gap-3 ${recommended ? 'bg-gradient-to-br from-[#1a0808] to-[#0f0606] border-rose-600/50 shadow-[0_0_40px_rgba(220,38,38,0.12)]' : 'bg-[#0f0f0f] border-white/8'}`}>
                  {recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <div className="font-black text-white text-base leading-tight">{label}</div>
                  <div className="text-rose-400 font-black text-2xl">{price}</div>
                  <div className="text-white/55 text-xs leading-relaxed">
                    <div className="mb-1">{filmed}</div>
                    <div className="text-white/35">{w}</div>
                  </div>
                  {!custom && (
                    <Button
                      onClick={handleApply}
                      size="sm"
                      className={`w-full font-bold rounded-xl h-auto py-2.5 text-xs mt-auto ${recommended ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-700/25' : 'bg-white/8 hover:bg-white/14 text-white border border-white/12'}`}
                    >
                      Apply for This Package
                    </Button>
                  )}
                  {custom && (
                    <Button
                      onClick={handleApply}
                      size="sm"
                      className="w-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/12 font-bold rounded-xl h-auto py-2.5 text-xs mt-auto"
                    >
                      Request a Custom Quote
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Pricing factors */}
            <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-6 mb-4">
              <p className="text-white/35 text-xs font-black uppercase tracking-widest mb-3">Final quote depends on</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  "Selected performer", "Performer availability", "Production country & city",
                  "Hotel / location setup", "Domestic round-trip performer travel", "Production length",
                  "Production preferences", "Complexity / intensity", "Privacy or release model", "Post-production requirements",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/45 text-xs">
                    <div className="w-1 h-1 rounded-full bg-rose-600/60 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111] border border-amber-900/20 rounded-2xl p-5 text-center">
              <p className="text-amber-400/70 text-xs font-bold mb-1 uppercase tracking-wider">Not included</p>
              <p className="text-white/35 text-xs leading-relaxed max-w-xl mx-auto">
                Your personal flights, your own hotel outside the production booking, meals, visa requirements, travel insurance and personal expenses are <strong className="text-white/50">not included</strong> in the production quote.
              </p>
            </div>
          </div>
        </section>

        {/* ── LOCAL RATES ────────────────────────────────────────────────── */}
        <section className="py-12 px-6 border-t border-white/5">
          <div className="max-w-[700px] mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-black mb-3">LOCAL FAN PRODUCTION RATES</h2>
            <p className="text-white/50 text-base leading-relaxed mb-4">
              Local rates may be available for fans based in the same country as the selected performer.
            </p>
            <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-6 text-left">
              <p className="text-white/40 text-sm leading-relaxed mb-3">
                Local pricing is calculated after review and depends on country, city, local travel, hotel/location, production length, release/privacy model, content value and performer availability.
              </p>
              <div className="text-rose-400 font-black text-sm">Local rates available after review.</div>
            </div>
          </div>
        </section>

        {/* ── WHAT'S INCLUDED ────────────────────────────────────────────── */}
        <section className="py-16 px-6 bg-gradient-to-b from-[#0d0606] to-[#080808] border-t border-white/5">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">WHAT YOUR QUOTE CAN INCLUDE</h2>
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

        {/* ── TRAVEL / HOTEL ─────────────────────────────────────────────── */}
        <section className="py-12 px-6 border-t border-white/5">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-2xl md:text-3xl font-black mb-4 text-center">TRAVEL, HOTEL & PERFORMER COMFORT</h2>
            <div className="space-y-4 text-white/50 text-sm leading-relaxed">
              <p>Fan Productions are arranged inside the country where the selected performer is based. Performer domestic travel is calculated as round-trip travel and may include car, domestic flight, ferry, premium bus, taxi or transfers depending on the route.</p>
              <p>For most Philippines-based productions, domestic performer travel is estimated up to $1,200. Remote islands, peak-season bookings or complex routes may require a custom quote.</p>
              <p><strong className="text-white/70">Hotel/location:</strong> The quote may include a clean and suitable hotel/location setup for the production. Premium locations or special setups may increase the final quote.</p>
              <p><strong className="text-white/70">Performer allowance:</strong> If performer travel or production scheduling requires more than 24 hours away from the performer's home base, a daily performer allowance is added for meals, local movement and travel comfort.</p>
            </div>
          </div>
        </section>

        {/* ── 50% RESERVATION ────────────────────────────────────────────── */}
        <section className="py-12 px-6 bg-[#0a0505] border-t border-white/5">
          <div className="max-w-[700px] mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-black mb-3">50% RESERVATION AFTER APPROVAL</h2>
            <p className="text-white/50 text-base leading-relaxed mb-6 max-w-lg mx-auto">
              A 50% reservation payment is required only after studio review, performer approval and final quote confirmation.
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
            <div className="bg-[#111] border border-white/8 rounded-2xl p-5 text-white/40 text-xs leading-relaxed">
              The reservation secures performer availability, hotel/location, domestic travel and production scheduling. Remaining balance is due before the confirmed production date.
            </div>
          </div>
        </section>

        {/* ── SAFETY ─────────────────────────────────────────────────────── */}
        <section className="py-16 px-6 border-t border-white/5">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black mb-3">CONTROLLED. VERIFIED. APPROVED.</h2>
              <p className="text-white/50 text-base max-w-xl mx-auto">
                FLESHLAB Fan Productions are planned adult productions. They are not private dates, escort bookings or off-camera meetings.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                "Verified 18+ only", "Performer approval required", "Studio approval required",
                "Consent and boundaries documented", "Contracts and releases required",
                "No illegal, unsafe or non-consensual content",
                "No off-schedule private meetings", "No unapproved extensions",
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

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="py-16 px-6 bg-gradient-to-b from-[#0d0606] to-[#080808] border-t border-white/5">
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
                    <ChevronRight className={`w-4 h-4 text-white/30 shrink-0 mt-0.5 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 text-white/50 text-sm leading-relaxed border-t border-white/5 pt-4">{a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
        <section className="py-20 px-6 border-t border-white/5">
          <div className="relative max-w-[800px] mx-auto">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-rose-800/15 rounded-full blur-[90px]" />
            </div>
            <div className="relative bg-gradient-to-br from-[#1a0808] to-[#0d0808] border border-rose-600/25 rounded-3xl px-8 py-14 text-center">
              <h2 className="text-3xl md:text-4xl font-black mb-3">
                READY TO BUILD YOUR <span className="text-rose-500">FAN PRODUCTION REQUEST?</span>
              </h2>
              <p className="text-white/50 text-base mb-8 max-w-md mx-auto">
                Application required. Studio review required. Performer approval required.
              </p>
              <Button
                size="lg"
                onClick={handleApply}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-12 py-5 rounded-xl h-auto shadow-xl shadow-rose-700/30 text-base"
              >
                Build Your Fan Production Request
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-white/20 text-xs mt-5 max-w-md mx-auto leading-relaxed">
                FLESHLAB Fan Productions are planned adult productions for verified 18+ participants only. Not available to minors. Not a private dating or escort service. All productions require studio approval and performer consent.
              </p>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}