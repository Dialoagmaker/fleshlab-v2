import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Video,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Shield,
  CheckCircle2,
  MessageCircle,
  BarChart3,
  Globe,
  Lock,
  Zap,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Film,
  Crown
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import SEOMeta from "@/components/SEOMeta";

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

  const handleWhatsAppClick = () => {
    trackEvent("whatsapp_cta_click", { source: "chaturbate_page" });
    window.open("https://wa.me/886958679186?text=Hi%20FLESHLAB%2C%20I'm%20a%20cam%20model%20and%20interested%20in%20adding%20studio%20content", "_blank");
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

      <style>{`
        @media (max-width: 768px) {
          .hero-bg { background-position: 65% center !important; }
        }
      `}</style>
      <div style={{ background: '#050505' }}>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="hero-bg relative px-4 sm:px-6 lg:px-8 overflow-hidden"
          style={{
            minHeight: '760px',
            backgroundImage: 'url("https://video.fleshlab.online/banner%20and%20logos/ChatGPT%20Image%209.%20Juni%202026%2C%2022_39_56.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            backgroundRepeat: 'no-repeat',
          }}>
          {/* Gradient overlay — left heavy, fades to transparent right */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to right, rgba(5,5,5,0.88) 0%, rgba(5,5,5,0.65) 35%, rgba(5,5,5,0.32) 60%, rgba(5,5,5,0.1) 100%)' }} />
          {/* Bottom fade into next section */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, #080508)' }} />

          <div className="max-w-5xl mx-auto relative z-10" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Left — copy */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 text-xs font-black uppercase tracking-widest text-rose-400"
                  style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                  <Video className="w-3.5 h-3.5" />
                  For Cam Models
                </div>

                <h1 className="font-black text-white leading-[1.0] tracking-tight mb-5"
                  style={{ fontSize: 'clamp(38px, 5vw, 60px)' }}>
                  Keep Camming.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">
                    Add Studio Income.
                  </span>
                </h1>

                <p className="text-white/75 text-lg mb-8 leading-relaxed" style={{ maxWidth: '480px' }}>
                  Add recorded studio content and fanclub income on top of your cam earnings. No exclusivity. Keep all your platforms. 70% revenue share on the network model.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button size="lg"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 h-[52px] text-base rounded-xl shadow-lg shadow-rose-900/30"
                    onClick={handleApplyClick}>
                    Start Your Application
                  </Button>
                  <Button size="lg"
                    className="border border-white/25 text-white hover:bg-white/8 bg-transparent h-[52px] px-8 text-base font-bold rounded-xl"
                    onClick={handleWhatsAppClick}>
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Talk on WhatsApp
                  </Button>
                </div>

                {/* Benefit chips */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: <Shield className="w-3.5 h-3.5 text-rose-400" />, label: "No exclusivity" },
                    { icon: <Globe className="w-3.5 h-3.5 text-rose-400" />, label: "Keep your platforms" },
                    { icon: <DollarSign className="w-3.5 h-3.5 text-rose-400" />, label: "70% revenue share" },
                  ].map(chip => (
                    <div key={chip.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white/70 text-xs font-semibold"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {chip.icon}{chip.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — income comparison */}
              <div className="relative hidden lg:block">
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(5,5,5,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div className="px-6 py-4 border-b border-white/8">
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest">Income Comparison</p>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="rounded-xl p-5 text-center"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Clock className="h-6 w-6 text-white/30 mx-auto mb-3" />
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wide mb-1">Live Cam</p>
                      <p className="text-white font-black text-lg leading-tight">Active Income</p>
                      <p className="text-white/30 text-xs mt-2">Stops when you go offline</p>
                    </div>
                    <div className="rounded-xl p-5 text-center"
                      style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)' }}>
                      <TrendingUp className="h-6 w-6 text-rose-400 mx-auto mb-3" />
                      <p className="text-rose-400 text-xs font-bold uppercase tracking-wide mb-1">Studio Content</p>
                      <p className="text-white font-black text-lg leading-tight">Passive Income</p>
                      <p className="text-white/50 text-xs mt-2">Earns while you sleep</p>
                    </div>
                  </div>
                  <div className="px-6 pb-5 text-center">
                    <p className="text-white/35 text-sm">2 hours filming can generate income for 12+ months</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── NO EXCLUSIVITY ───────────────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(180deg, #080508 0%, #0b0610 100%)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-emerald-400"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                No Exclusivity
              </div>
              <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
                Keep all your platforms
              </h2>
              <p className="text-white/45 max-w-xl mx-auto text-base">
                FLESHLAB doesn't ask you to leave Chaturbate, OnlyFans or anything else. You add a studio content layer on top of what you already do.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Chaturbate", desc: "Keep camming as usual", color: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', text: 'text-purple-400' },
                { label: "OnlyFans", desc: "Keep your OF page", color: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)', text: 'text-rose-400' },
                { label: "All Platforms", desc: "No restrictions at all", color: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: 'text-blue-400' },
                { label: "FLESHLAB", desc: "Add studio + fanclub income", color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: 'text-amber-400' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-5 text-center"
                  style={{ background: item.color, border: `1px solid ${item.border}` }}>
                  <p className={`font-black text-base mb-1 ${item.text}`}>{item.label}</p>
                  <p className="text-white/50 text-xs leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REVENUE POTENTIAL ────────────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(180deg, #0b0610 0%, #100713 100%)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                <BarChart3 className="w-3.5 h-3.5" />
                Revenue Potential
              </div>
              <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
                Three income streams, not one
              </h2>
              <p className="text-white/45 max-w-xl mx-auto text-base">
                Most cam models rely entirely on live tips. Studio content and fanclub subscriptions can run in parallel.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {[
                { label: "Live Cam Tips", range: "$500–$3,000", period: "Monthly (active)", color: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)', text: 'text-purple-300', sub: 'text-purple-400/60' },
                { label: "Studio Content (70%)", range: "$500–$5,000", period: "Monthly (passive)", color: 'rgba(244,63,94,0.18)', border: 'rgba(244,63,94,0.4)', text: 'text-rose-300', sub: 'text-rose-400/60', featured: true },
                { label: "Fanclub (70%)", range: "$300–$2,000", period: "Monthly recurring", color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: 'text-amber-300', sub: 'text-amber-400/60' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-6 text-center"
                  style={{ background: item.color, border: `${item.featured ? '1.5px' : '1px'} solid ${item.border}`, boxShadow: item.featured ? '0 0 30px rgba(244,63,94,0.12)' : 'none' }}>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">{item.label}</p>
                  <p className={`font-black text-3xl ${item.text} leading-none mb-2`}>{item.range}</p>
                  <p className={`text-xs font-semibold ${item.sub}`}>{item.period}</p>
                </div>
              ))}
            </div>
            <p className="text-white/25 text-xs text-center">
              Earnings vary based on content output, audience size and engagement. Not guaranteed. Ranges based on general performer data, not FLESHLAB-specific results.
            </p>
          </div>
        </section>

        {/* ── HOW IT FITS YOUR SCHEDULE ────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(180deg, #100713 0%, #0d0810 100%)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-amber-400"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <Clock className="w-3.5 h-3.5" />
                Works With Your Schedule
              </div>
              <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
                From application to passive income in 4 weeks
              </h2>
              <p className="text-white/45 max-w-xl mx-auto text-base">
                Minimal time investment. We handle production, editing and distribution.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { week: "Week 1", title: "Apply", desc: "5-minute form. Quick ID verification. We contact you to discuss options.", color: [244,63,94] },
                { week: "Week 2", title: "Film", desc: "2–4 hours, flexible timing. We coordinate around your cam schedule.", color: [168,85,247] },
                { week: "Week 3", title: "Approve", desc: "Review your content from home before anything goes live.", color: [168,85,247] },
                { week: "Week 4+", title: "Earn", desc: "Content publishes. Fanclub goes live. Passive income runs while you cam.", color: [245,158,11] },
              ].map((step, i) => (
                <div key={step.week} className="relative rounded-xl p-6"
                  style={{ background: `rgba(${step.color[0]},${step.color[1]},${step.color[2]},0.08)`, border: `1px solid rgba(${step.color[0]},${step.color[1]},${step.color[2]},0.25)` }}>
                  <p className="text-xs font-black uppercase tracking-widest mb-2"
                    style={{ color: `rgba(${step.color[0]},${step.color[1]},${step.color[2]},0.9)` }}>{step.week}</p>
                  <h3 className="text-white font-black text-base mb-2">{step.title}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CAM vs STUDIO+FANCLUB ─────────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(180deg, #0d0810 0%, #0f0a12 100%)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
                Live tips vs. recurring income
              </h2>
              <p className="text-white/45 max-w-xl mx-auto text-base">
                Fanclub subscriptions run every month. Cam tips don't.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl p-7"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <Users className="h-5 w-5 text-white/30" />
                  <h3 className="text-white font-bold text-base">Cam Tips (Active Only)</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Earn only during live shows",
                    "Income stops when you go offline",
                    "Variable per session",
                    "Time-for-money model",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 flex-shrink-0" />
                      <span className="text-white/50 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl p-7"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1.5px solid rgba(244,63,94,0.3)', boxShadow: '0 0 30px rgba(244,63,94,0.1)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <TrendingUp className="h-5 w-5 text-rose-400" />
                  <h3 className="text-white font-bold text-base">Fanclub + Studio (Passive + Recurring)</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Earn 24/7 from recorded content",
                    "Monthly recurring fanclub subscriptions",
                    "Cross-promote your fanclub on cam",
                    "One filming session, months of earnings",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/70 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── REVENUE MODELS ───────────────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(180deg, #0f0a12 0%, #100713 100%)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                Revenue Models
              </div>
              <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
                Two models. Pick the one that fits.
              </h2>
              <p className="text-white/45 max-w-lg mx-auto text-base">
                For most cam models with existing content or audience, the 70/30 Network Model is the right starting point.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* 70/30 Network — primary for cam */}
              <div className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-1"
                style={{ border: '1.5px solid rgba(245,158,11,0.55)', boxShadow: '0 0 40px rgba(245,158,11,0.14)' }}
                onClick={() => handleRevenueModelClick("70-30-network")}>
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(14,8,2,0.97) 0%, rgba(14,8,2,0.85) 60%, rgba(14,8,2,0.5) 100%)' }} />
                <div className="relative z-10 p-7 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black text-black"
                      style={{ background: 'rgba(245,158,11,0.95)', boxShadow: '0 0 14px rgba(245,158,11,0.5)' }}>
                      ✦ BEST FOR CAM MODELS
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-0.5">Network / Distribution Model</h3>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wide">Independent Creator Path</p>
                  </div>
                  <div className="rounded-xl px-5 py-4 flex items-center gap-3"
                    style={{ background: 'rgba(245,158,11,0.22)', border: '1.5px solid rgba(245,158,11,0.5)', boxShadow: '0 0 20px rgba(245,158,11,0.12)' }}>
                    <div className="text-center flex-1">
                      <div className="text-amber-300 font-black text-4xl leading-none">70%</div>
                      <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">You</div>
                    </div>
                    <div className="text-white/25 font-black text-xl">/</div>
                    <div className="text-center flex-1">
                      <div className="text-white font-black text-4xl leading-none">30%</div>
                      <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">Studio</div>
                    </div>
                  </div>
                  <p className="text-white/65 text-sm leading-relaxed">
                    Best if you already have content, an audience or a cam following. You keep full platform control. FLESHLAB handles SEO, distribution and fanclub infrastructure.
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Exclusivity", value: "None — keep all your platforms" },
                      { label: "Control", value: "You upload and manage your own content" },
                      { label: "Support", value: "Platform tools, SEO and distribution" },
                    ].map(row => (
                      <div key={row.label} className="flex gap-2.5 items-start">
                        <span className="text-amber-400 font-bold text-[11px] w-20 flex-shrink-0 mt-0.5 uppercase tracking-wide">{row.label}</span>
                        <span className="text-white/70 text-xs leading-snug">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 60/40 Management — optional */}
              <div className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-1"
                style={{ border: '1.5px solid rgba(244,63,94,0.45)', boxShadow: '0 0 30px rgba(244,63,94,0.1)' }}
                onClick={() => handleRevenueModelClick("60-40-management")}>
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(18,3,10,0.97) 0%, rgba(18,3,10,0.85) 60%, rgba(18,3,10,0.5) 100%)' }} />
                <div className="relative z-10 p-7 flex flex-col gap-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black text-white"
                      style={{ background: 'rgba(244,63,94,0.85)', boxShadow: '0 0 14px rgba(244,63,94,0.45)' }}>
                      ✦ FULL SUPPORT
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-0.5">Management / Build-Up Model</h3>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wide">Studio-Managed Creator Path</p>
                  </div>
                  <div className="rounded-xl px-5 py-4 flex items-center gap-3"
                    style={{ background: 'rgba(244,63,94,0.2)', border: '1.5px solid rgba(244,63,94,0.45)', boxShadow: '0 0 20px rgba(244,63,94,0.1)' }}>
                    <div className="text-center flex-1">
                      <div className="text-rose-300 font-black text-4xl leading-none">60%</div>
                      <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">Studio</div>
                    </div>
                    <div className="text-white/25 font-black text-xl">/</div>
                    <div className="text-center flex-1">
                      <div className="text-white font-black text-4xl leading-none">40%</div>
                      <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1.5">You</div>
                    </div>
                  </div>
                  <p className="text-white/65 text-sm leading-relaxed">
                    Best if you want full support. FLESHLAB handles filming, editing, promotion and fanclub management.
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Best for", value: "Beginners who want full creative support" },
                      { label: "Support", value: "Studio handles editing, promotion and fanclub" },
                      { label: "Publishing", value: "FLESHLAB manages and publishes for you" },
                    ].map(row => (
                      <div key={row.label} className="flex gap-2.5 items-start">
                        <span className="text-rose-400 font-bold text-[11px] w-20 flex-shrink-0 mt-0.5 uppercase tracking-wide">{row.label}</span>
                        <span className="text-white/70 text-xs leading-snug">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Not sure which model fits?</p>
                  <p className="text-white/35 text-xs">We'll help you figure it out.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="font-bold text-white rounded-xl gap-2 px-6 h-11"
                  style={{ background: '#25D366', boxShadow: '0 0 16px rgba(37,211,102,0.3)' }}
                  onClick={handleWhatsAppClick}>
                  <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                </Button>
                <Button className="font-bold text-white rounded-xl gap-2 px-6 h-11 border border-rose-500/40 bg-rose-600/15 hover:bg-rose-600/25"
                  onClick={handleApplyClick}>
                  <ChevronRight className="h-4 w-4" /> Apply Online
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(180deg, #100713 0%, #0b0610 100%)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                FAQ
              </div>
              <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
                Cam model questions
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: "Will this conflict with my cam schedule?",
                  a: "No. Filming takes 2–4 hours and you schedule it when it works for you. We edit and distribute. You cam as usual — the studio content just runs in the background."
                },
                {
                  q: "Do I need to leave Chaturbate or OnlyFans?",
                  a: "No. No exclusivity required. Keep all your platforms. FLESHLAB adds a studio content and fanclub layer on top of what you already do."
                },
                {
                  q: "Can I use cam recordings or do I need new content?",
                  a: "Studio content is produced separately and at higher quality. Cam recordings can sometimes be repurposed for fanclub exclusives. We'll discuss what works when you apply."
                },
                {
                  q: "Can I mention my cam show in fanclub content?",
                  a: "Yes. Cross-promotion between your cam and fanclub is fine and often useful. We can help you set that up."
                },
                {
                  q: "How is the 70% calculated?",
                  a: "70% of net revenue from studio content sales and fanclub subscriptions goes to you. We handle distribution, platform fees, and payment processing. You receive your share monthly."
                },
              ].map((faq, i) => (
                <div key={i} className="rounded-xl p-6"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-white font-bold text-base mb-2">{faq.q}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            {/* Compliance notice */}
            <div className="mt-6 p-4 rounded-xl flex gap-3"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-200/60 text-sm leading-relaxed">
                <strong className="text-amber-200/80 block mb-0.5">Important:</strong>
                FLESHLAB does not guarantee income. Results depend on content quality, audience size, consistency and performance. We provide infrastructure and support, not income guarantees.
              </p>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#050505' }}>
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(30,5,15,0.98) 0%, rgba(20,3,10,0.98) 100%)', border: '1.5px solid rgba(244,63,94,0.45)', boxShadow: '0 0 60px rgba(244,63,94,0.18)' }}>
              <div className="p-10 md:p-14 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-black uppercase tracking-widest text-rose-400"
                  style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                  Ready to Start?
                </div>
                <h2 className="font-black text-white mb-4 leading-tight" style={{ fontSize: 'clamp(28px, 5vw, 46px)' }}>
                  Keep Camming. Add Studio Income.
                </h2>
                <p className="text-white/50 mb-8 max-w-xl mx-auto text-base">
                  Apply now and we'll go through your options together. No pressure, no exclusivity, no commitment until you're ready.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                  <Button className="font-bold text-white rounded-xl gap-2 px-10 py-5 h-auto text-lg"
                    style={{ background: '#25D366', boxShadow: '0 0 22px rgba(37,211,102,0.4)' }}
                    onClick={handleWhatsAppClick}>
                    <MessageCircle className="h-5 w-5" /> Talk on WhatsApp
                  </Button>
                  <Button className="font-bold text-white rounded-xl gap-2 px-10 py-5 h-auto text-lg border border-white/20 bg-transparent hover:bg-white/6"
                    onClick={handleApplyClick}>
                    <ChevronRight className="h-5 w-5" /> Apply Online
                  </Button>
                </div>
                <div className="flex flex-wrap justify-center gap-6 text-white/35 text-sm">
                  <div className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-rose-500/50" /><span>No exclusivity</span></div>
                  <div className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-rose-500/50" /><span>70% revenue share</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-rose-500/50" /><span>Verified 18+</span></div>
                </div>
              </div>
            </div>

            {/* Compliance footer */}
            <div className="mt-8 text-center space-y-3">
              <p className="text-white/20 text-xs leading-relaxed max-w-2xl mx-auto">
                All performers must be 18+ with valid government ID. Independent contractor position. Earnings vary and are not guaranteed. No exclusivity required unless explicitly agreed.
              </p>
              <div className="flex flex-wrap justify-center gap-5 text-white/20 text-xs">
                <a href="/terms" className="hover:text-white/40 transition-colors">Terms</a>
                <a href="/privacy" className="hover:text-white/40 transition-colors">Privacy</a>
                <a href="/2257" className="hover:text-white/40 transition-colors">2257 Compliance</a>
                <a href="/faq" className="hover:text-white/40 transition-colors">FAQ</a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}