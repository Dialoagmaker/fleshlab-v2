import { motion } from "framer-motion";
import { Crown, HeartHandshake, Play, Radio, Sparkles } from "lucide-react";

const groups = [
  {
    label: "FREE DISCOVERY",
    icon: Play,
    role: "Introduces new audiences to FLESHLAB creators through free previews and discovery releases.",
    purpose: "Built for reach, sampling and first contact with the studio universe.",
    platforms: ["xHamster"]
  },
  {
    label: "PREMIUM RELEASES",
    icon: Crown,
    role: "Carries full productions, exclusive edits and higher-value creator-led content.",
    purpose: "Built for fans who want the complete release, not just the preview.",
    platforms: ["FapHouse", "LoyalFans", "ManyVids", "Clip4Sale"]
  },
  {
    label: "LIVE PERFORMANCES",
    icon: Radio,
    role: "Connects creators with live audiences through real-time performance and interaction.",
    purpose: "Built for immediacy, presence and direct creator-fan energy.",
    platforms: ["BongaCams", "xHamster Live", "LiveJasmin", "BongaModels"]
  },
  {
    label: "CREATOR SUPPORT",
    icon: HeartHandshake,
    role: "Gives audiences ways to follow creators, unlock exclusives and support ongoing work.",
    purpose: "Built for recurring fan relationships beyond a single video release.",
    platforms: ["LoyalFans", "ManyVids"]
  },
  {
    label: "FAN PRODUCTIONS",
    icon: Sparkles,
    role: "Turns selected fan requests into real FLESHLAB productions managed by the studio.",
    purpose: "Built for participatory experiences that expand the story world.",
    platforms: ["FLESHLAB"]
  }
];

export default function PartnerDistribution() {
  return (
    <div className="mb-8 border-b border-white/8 pb-8">
      <div className="mb-6 max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">Publishing Ecosystem</p>
        <h2 className="fl-condensed mt-2 text-[42px] uppercase leading-none tracking-[-0.02em] text-white/86">The FLESHLAB Distribution Network</h2>
        <p className="mt-3 text-sm leading-6 text-white/48">FLESHLAB distributes content intelligently across multiple platforms. Each channel has a different role — discovery, premium releases, live performance, creator support or fan-led production.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {groups.map(({ label, icon: Icon, role, purpose, platforms }, index) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45, delay: index * 0.05 }} className="flex min-h-[270px] flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-[#f0183d]/55 hover:bg-white/[0.055]">
            <Icon className="mb-5 h-7 w-7 text-[#f0183d]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f0183d]">{label}</h3>
            <p className="mt-4 text-lg font-black leading-6 text-white">{role}</p>
            <p className="mt-3 text-xs leading-5 text-white/48">{purpose}</p>
            <div className="mt-auto pt-6">
              <p className="mb-2 text-[8px] font-black uppercase tracking-[0.22em] text-white/32">Platforms in this role</p>
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