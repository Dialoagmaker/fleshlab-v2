import { motion } from "framer-motion";
import { Crown, HeartHandshake, Play, Radio, Sparkles } from "lucide-react";

const groups = [
  {
    label: "WATCH FREE",
    icon: Play,
    promise: "Start discovering FLESHLAB creators through free previews.",
    feeling: "Explore before you commit.",
    platforms: ["xHamster"]
  },
  {
    label: "WATCH PREMIUM",
    icon: Crown,
    promise: "Unlock full productions and exclusive creator-led content.",
    feeling: "Go deeper into the worlds you like.",
    platforms: ["FapHouse", "LoyalFans", "ManyVids"]
  },
  {
    label: "WATCH LIVE",
    icon: Radio,
    promise: "Meet creators live and interact in real time.",
    feeling: "Direct energy, real presence, live connection.",
    platforms: ["BongaCams", "xHamster Live", "LiveJasmin", "BongaModels"]
  },
  {
    label: "SUPPORT CREATORS",
    icon: HeartHandshake,
    promise: "Follow creators, unlock exclusives and support their work.",
    feeling: "Turn watching into direct backing.",
    platforms: ["LoyalFans", "ManyVids"]
  },
  {
    label: "FAN EXPERIENCES",
    icon: Sparkles,
    promise: "Become part of a real FLESHLAB production.",
    feeling: "Move from audience to story participant.",
    platforms: ["FLESHLAB Fan Productions"]
  }
];

export default function PartnerDistribution() {
  return (
    <div className="mb-8 border-b border-white/8 pb-8">
      <div className="mb-6 max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">Experience Network</p>
        <h2 className="fl-condensed mt-2 text-[42px] uppercase leading-none tracking-[-0.02em] text-white/86">Choose how you enter FLESHLAB</h2>
        <p className="mt-3 text-sm leading-6 text-white/48">The ecosystem starts with what visitors want to feel and do — discover, unlock, meet, support or become part of the story.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {groups.map(({ label, icon: Icon, promise, feeling, platforms }, index) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45, delay: index * 0.05 }} className="flex min-h-[270px] flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-[#f0183d]/55 hover:bg-white/[0.055]">
            <Icon className="mb-5 h-7 w-7 text-[#f0183d]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f0183d]">{label}</h3>
            <p className="mt-4 text-lg font-black leading-6 text-white">{promise}</p>
            <p className="mt-3 text-xs leading-5 text-white/48">{feeling}</p>
            <div className="mt-auto pt-6">
              <p className="mb-2 text-[8px] font-black uppercase tracking-[0.22em] text-white/32">Available through</p>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <span key={platform} className="rounded-full border border-white/10 bg-black/22 px-3 py-1 text-[10px] font-bold text-white/58">{platform}</span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}