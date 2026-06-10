/**
 * FanclubSupportBlock — Premium membership benefits section
 * Full redesign: VIP member area feel, premium benefit cards, conversion-focused
 */
import { Link } from "react-router-dom";
import { Crown, Check, Play, Star, Zap, Film, Eye, Lock, Sparkles, ChevronRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FANCLUB_PLANS } from "@/lib/pricingConfig";

const BENEFITS = [
  {
    icon: Lock,
    headline: "Members-Only Scenes",
    description: "Exclusive content that never appears on the public side of the platform.",
    accent: "rose",
  },
  {
    icon: Zap,
    headline: "Early Access Drops",
    description: "Watch new releases before they go public. First in, every time.",
    accent: "amber",
  },
  {
    icon: Film,
    headline: "Bonus Clips & Extras",
    description: "Behind-the-scenes moments, outtakes, and content not shown publicly.",
    accent: "rose",
  },
  {
    icon: Crown,
    headline: "Fanclub Exclusives",
    description: "Dedicated fanclub releases produced specifically for members.",
    accent: "amber",
  },
  {
    icon: Eye,
    headline: "Behind the Scenes",
    description: "Production moments and personal updates from your favorite performers.",
    accent: "rose",
  },
  {
    icon: Star,
    headline: "Better Than PPV",
    description: "Unlimited member access beats buying individual premium videos.",
    accent: "amber",
  },
];

const TRUST_POINTS = [
  "Cancel anytime — no contracts",
  "Supports performers directly",
  "Immediate access after joining",
];

export default function FanclubSupportBlock({ performerName, isAuthenticated, onJoin, performers = [] }) {
  const visualPerformers = performers.filter(p => p.profile_image_url).slice(0, 6);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#070505]">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[400px] bg-rose-950/60 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-amber-950/30 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(120,10,20,0.15)_0%,transparent_60%)]" />
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-600/40 to-transparent" />
        {/* Fine grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10 p-8 lg:p-14">

        {/* TOP — headline + CTA */}
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start mb-12">
          <div>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-950/80 to-rose-950/80 border border-amber-700/35 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 text-[10px] font-black uppercase tracking-[0.22em]">VIP Fanclub Membership</span>
            </div>

            {/* Performer image row */}
            {visualPerformers.length > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <div className="flex">
                  {visualPerformers.map((p, i) => (
                    <div
                      key={i}
                      className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#070505] shadow-lg"
                      style={{ marginLeft: i > 0 ? '-8px' : '0', zIndex: visualPerformers.length - i }}
                    >
                      <img src={p.profile_image_url} alt={p.display_name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="text-white/35 text-xs font-medium">+{visualPerformers.length} FLESHLAB performers</span>
              </div>
            )}

            {/* Main headline */}
            <h2 className="font-black text-white uppercase leading-[0.88] mb-4" style={{ fontSize: 'clamp(2rem,4.5vw,3.8rem)' }}>
              {performerName ? (
                <>
                  Want More of<br />
                  <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                    {performerName}?
                  </span>
                </>
              ) : (
                <>
                  Support Your<br />
                  <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
                    Favorite Performers
                  </span>
                </>
              )}
            </h2>

            <p className="text-white/45 text-base leading-relaxed max-w-xl">
              {performerName
                ? `Join Fanclub to unlock member-only content, early drops, bonus clips and exclusive releases from ${performerName} and the full FLESHLAB roster.`
                : "Join Fanclub to unlock member-only content and support the performers you want to see more of."}
            </p>
          </div>

          {/* CTA card — right side on desktop */}
          <div className="lg:min-w-[280px]">
            <div className="relative overflow-hidden rounded-[20px] border border-amber-700/30 bg-gradient-to-br from-amber-950/60 to-rose-950/50 p-6 shadow-2xl shadow-amber-900/20">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-amber-300 text-xs font-black uppercase tracking-widest">Fanclub Access</span>
              </div>
              <div className="mb-1">
                <span className="text-white font-black text-4xl">${FANCLUB_PLANS.fanclub_monthly.promoPrice}</span>
                <span className="text-white/40 text-sm font-medium">/month</span>
              </div>
              <p className="text-white/30 text-xs mb-5">Full access to all fanclub content</p>
              <Button
                onClick={onJoin}
                className="w-full relative overflow-hidden bg-gradient-to-r from-amber-600 to-rose-700 hover:from-amber-500 hover:to-rose-600 text-white h-12 font-black text-sm rounded-xl shadow-xl shadow-rose-900/40 gap-2 mb-4 group"
              >
                <Crown className="w-4 h-4" />
                {isAuthenticated ? 'Join Now' : 'Unlock Access'}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
              <div className="space-y-1.5">
                {TRUST_POINTS.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/30 text-xs">
                    <Check className="w-3 h-3 text-emerald-500/60 shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM — benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BENEFITS.map(({ icon: Icon, headline, description, accent }, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-[16px] border border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 p-5"
            >
              {/* Hover glow */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 ${accent === 'amber' ? 'bg-amber-700/0 group-hover:bg-amber-700/12' : 'bg-rose-700/0 group-hover:bg-rose-700/12'} rounded-full blur-[40px] transition-all duration-500`} />
              <div className="relative z-10 flex gap-4">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${accent === 'amber' ? 'bg-amber-950/60 border-amber-700/30' : 'bg-rose-950/60 border-rose-700/30'}`}>
                  <Icon className={`w-5 h-5 ${accent === 'amber' ? 'text-amber-400' : 'text-rose-400'}`} />
                </div>
                <div>
                  <div className="text-white font-bold text-sm leading-tight mb-1">{headline}</div>
                  <div className="text-white/35 text-xs leading-relaxed">{description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-8 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-white/25 text-sm">
            <Heart className="w-4 h-4 text-rose-500/50" />
            Your membership directly supports {performerName || 'the performers'}
          </div>
          <Link to="/performers">
            <Button variant="outline" className="border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 px-6 h-10 text-xs font-semibold rounded-xl gap-2">
              <Play className="w-3.5 h-3.5" /> Browse All Performers
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}