import { motion } from "framer-motion";
import { Crown, HeartHandshake, Play, Radio, Sparkles } from "lucide-react";

const groups = [
  {
    label: "WATCH FREE",
    icon: Play,
    items: [["xHamster", "Discover free releases, previews and creator introductions."]]
  },
  {
    label: "PREMIUM CONTENT",
    icon: Crown,
    items: [["FapHouse", "Premium amateur productions with stronger presentation."]]
  },
  {
    label: "SUPPORT CREATORS",
    icon: HeartHandshake,
    items: [["LoyalFans", "Exclusive content and direct creator support."]]
  },
  {
    label: "WATCH LIVE",
    icon: Radio,
    items: [["BongaCams", "Live creator experiences and real-time fan interaction."], ["xHamster Live", "Live amateur performances from familiar creator worlds."], ["LiveJasmin", "Premium live rooms for established performer audiences."], ["BongaModels", "Creator-facing live opportunities and partner reach."]]
  },
  {
    label: "SPECIAL COLLECTIONS",
    icon: Sparkles,
    items: [["Clip4Sale", "Curated premium productions and themed releases."], ["ManyVids", "Exclusive releases for fans looking for creator-led collections."]]
  }
];

export default function PartnerDistribution() {
  return (
    <div className="mb-8 border-b border-white/8 pb-8">
      <div className="mb-6 max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">Distribution Network</p>
        <h2 className="fl-condensed mt-2 text-[42px] uppercase leading-none tracking-[-0.02em] text-white/86">Where FLESHLAB travels</h2>
        <p className="mt-3 text-sm leading-6 text-white/48">Each partner has a role in the ecosystem — discovery, premium releases, creator support, live experiences or special collections.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {groups.map(({ label, icon: Icon, items }, index) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45, delay: index * 0.05 }} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <Icon className="mb-5 h-7 w-7 text-[#f0183d]" />
            <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/78">{label}</h3>
            <div className="space-y-4">
              {items.map(([name, description]) => (
                <div key={name} className="border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                  <p className="text-sm font-black text-white">{name}</p>
                  <p className="mt-1 text-[11px] leading-5 text-white/48">{description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}