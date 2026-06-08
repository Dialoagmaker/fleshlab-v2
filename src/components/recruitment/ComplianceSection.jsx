import { Shield, CheckCircle2, FileText, Users, Film, AlertTriangle } from "lucide-react";

const complianceItems = [
  {
    icon: Shield,
    title: "Verified 18+ Only",
    desc: "All performers must provide valid government-issued ID proving they are 18 years or older."
  },
  {
    icon: CheckCircle2,
    title: "ID/KYC Required",
    desc: "Complete identity verification and know-your-customer documentation before participation."
  },
  {
    icon: FileText,
    title: "Consent & Release Forms",
    desc: "Professional consent documentation and release forms required for all productions."
  },
  {
    icon: Users,
    title: "Performer Approval",
    desc: "All participants must be approved through our performer application and compliance workflow."
  },
  {
    icon: Film,
    title: "Studio Policy Compliance",
    desc: "All content must follow FLESHLAB studio policies and platform guidelines."
  },
  {
    icon: AlertTriangle,
    title: "No Private Meetings",
    desc: "FLESHLAB is not escorting, dating, or selling sex acts. Professional studio productions only."
  }
];

export default function ComplianceSection() {
  return (
    <section className="py-16 md:py-20 border-b border-white/6">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4 text-center">
          Compliance and Trust
        </h2>
        <p className="text-white/50 text-center max-w-2xl mx-auto mb-12">
          Professional standards for safety, consent, and legal compliance.
        </p>
        <div className="grid md:grid-cols-2 gap-5">
          {complianceItems.map((item, i) => (
            <div key={i} className="bg-[#111] border border-white/8 rounded-xl p-5 flex items-start gap-4">
              <item.icon className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}