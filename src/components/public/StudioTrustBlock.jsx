import React from "react";
import { Shield, Globe, Award, Crown } from "lucide-react";

const features = [
  {
    icon: Award,
    title: "Original Studio Productions",
    desc: "Professional 4K scenes produced in-studio with cinematic lighting and authentic Filipino and Asian talent.",
  },
  {
    icon: Globe,
    title: "Asian Twink Specialists",
    desc: "Exclusively featuring the hottest Filipino and Asian performers — a niche done right.",
  },
  {
    icon: Shield,
    title: "Verified 18+ Performers",
    desc: "All performers are identity-verified, consent-documented, and working under safe professional conditions.",
  },
  {
    icon: Crown,
    title: "Fanclub & Early Access",
    desc: "Members get early releases, behind-the-scenes footage, and direct interaction with performers.",
  },
];

export default function StudioTrustBlock() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {features.map(({ icon: Icon, title, desc }) => (
        <div
          key={title}
          className="relative group bg-[#111] rounded-xl p-6 border border-white/[0.07] hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(180,30,50,0.12)] overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-white text-sm mb-2 leading-snug">{title}</h3>
            <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}