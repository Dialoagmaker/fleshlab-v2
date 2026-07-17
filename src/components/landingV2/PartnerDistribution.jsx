import { motion } from "framer-motion";
import { Crown, HeartHandshake, Play, Radio, Sparkles } from "lucide-react";

const groups = [
  {
    label: "FREE",
    icon: Play,
    headline: "Open discovery.",
    sentence: "Free previews introduce new audiences to FLESHLAB creators.",
    platforms: ["xHamster"],
    surface: "border-white/12 bg-white/[0.055]",
    iconStyle: "bg-white/10 text-white"
  },
  {
    label: "PREMIUM",
    icon: Crown,
    headline: "Full releases.",
    sentence: "Cinematic productions and exclusives live on premium channels.",
    platforms: ["FapHouse", "LoyalFans", "ManyVids", "Clip4Sale"],
    surface: "border-[#d7b56d]/25 bg-[linear-gradient(135deg,rgba(215,181,109,0.12),rgba(255,255,255,0.035))]",
    iconStyle: "bg-[#d7b56d]/12 text-[#d7b56d]"
  },
  {
    label: "LIVE",
    icon: Radio,
    headline: "Real-time energy.",
    sentence: "Live platforms create immediacy, presence and interaction.",
    platforms: ["BongaCams", "xHamster Live", "LiveJasmin", "BongaModels"],
    surface: "border-[#f0183d]/35 bg-[radial-gradient(circle_at_top_right,rgba(240,24,61,0.18),rgba(255,255,255,0.035)_44%)]",
    iconStyle: "bg-[#f0183d]/12 text-[#f0183d]",
    live: true
  },
  {
    label: "SUPPORT",
    icon: HeartHandshake,
    headline: "Creator connection.",
    sentence: "Fans follow, unlock exclusives and directly back ongoing work.",
    platforms: ["LoyalFans", "ManyVids"],
    surface: "border-[#ff7aa2]/22 bg-[linear-gradient(135deg,rgba(255,122,162,0.10),rgba(255,255,255,0.035))]",
    iconStyle: "bg-[#ff7aa2]/12 text-[#ff7aa2]"
  },
  {
    label: "FAN PRODUCTIONS",
    icon: Sparkles,
    headline: "The most exclusive experience.",
    sentence: "Selected fans become part of real studio-managed productions.",
    platforms: ["FLESHLAB"],
    surface: "border-[#f0183d]/55 bg-[linear-gradient(135deg,rgba(240,24,61,0.24),rgba(215,181,109,0.10),rgba(255,255,255,0.04))] shadow-[0_0_60px_rgba(240,24,61,0.16)] xl:col-span-2",
    iconStyle: "bg-[#f0183d]/18 text-[#f0183d]"
  }
];

export default function PartnerDistribution() {
  return (
    <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#04070a] px-5 py-7 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(240,24,61,0.18),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(215,181,109,0.10),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_45%)]" />
      <svg className="absolute inset-0 h-full w-full opacity-35" viewBox="0 0 1200 560" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="flDistributionLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(240,24,61,0)" />
            <stop offset="45%" stopColor="rgba(240,24,61,0.75)" />
            <stop offset="100%" stopColor="rgba(215,181,109,0.25)" />
          </linearGradient>
        </defs>
        <path d="M80 285 C245 145 420 180 560 270 S870 420 1120 220" fill="none" stroke="url(#flDistributionLine)" strokeWidth="1.4" />
        <path d="M120 390 C330 290 455 360 610 250 S900 110 1080 330" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <path d="M170 145 C360 250 500 120 690 205 S955 310 1070 160" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {[160, 335, 520, 710, 900, 1060].map((x, index) => (
          <circle key={x} cx={x} cy={[220, 320, 190, 300, 180, 270][index]} r={index === 2 ? "6" : "4"} fill={index === 2 ? "#f0183d" : "rgba(255,255,255,0.58)"} />
        ))}
      </svg>
      <motion.div animate={{ x: ["-8%", "8%", "-8%"], opacity: [0.18, 0.3, 0.18] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute left-1/4 top-8 h-px w-1/2 bg-gradient-to-r from-transparent via-[#f0183d] to-transparent" />
      <div className="relative z-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">Publishing Ecosystem</p>
            <h2 className="fl-condensed mt-2 text-[42px] uppercase leading-none tracking-[-0.02em] text-white/90">The FLESHLAB Distribution Network</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/52">Smart distribution. Different roles. Better audience experiences.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {groups.map(({ label, icon: Icon, headline, sentence, platforms, surface, iconStyle, live }, index) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45, delay: index * 0.05 }} className={`relative flex min-h-[250px] flex-col overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition hover:-translate-y-1 ${surface}`}>
              {live && <div className="absolute right-5 top-5 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-[#f0183d]"><span className="fl-live-pulse" />Live</div>}
              <div className={`mb-6 flex h-11 w-11 items-center justify-center rounded-full ${iconStyle}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/52">{label}</h3>
              <p className="mt-4 text-2xl font-black leading-7 text-white">{headline}</p>
              <p className="mt-3 text-sm leading-5 text-white/56">{sentence}</p>
              <div className="mt-auto pt-6">
                <p className="mb-2 text-[8px] font-black uppercase tracking-[0.22em] text-white/30">Platforms</p>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <span key={platform} className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-[10px] font-bold text-white/62">{platform}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}