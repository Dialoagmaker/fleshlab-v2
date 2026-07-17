import { FileCheck, Fingerprint, LockKeyhole, BadgeDollarSign, Shield, RotateCcw } from "lucide-react";
import SectionHeader from "./SectionHeader";

const items = [
  ["Is this legal?", "18+ verification, consent records and compliance workflows.", FileCheck],
  ["Identity protected", "Private verification data and controlled profile publishing.", Fingerprint],
  ["Verification", "Every creator and participant is reviewed before production.", Shield],
  ["Payments", "Monthly transparent payouts so creators know exactly when and how they get paid.", BadgeDollarSign],
  ["Contracts", "Clear production agreements and content ownership terms.", LockKeyhole],
  ["Can I stop?", "Creators can pause, request review and manage future participation.", RotateCcw],
];

export default function TrustCenter({ text }) {
  return (
    <section id="trust" className="px-5 py-24 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeader eyebrow="Safety, legality, control" title={text.trustTitle} text="The page should answer the uncomfortable questions immediately — before anyone has to ask." align="center" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(([title, body, Icon]) => <div key={title} className="rounded-[28px] border border-white/10 bg-[#11100e] p-7"><Icon className="mb-10 h-8 w-8 text-[#d97d52]" /><h3 className="text-2xl font-black uppercase tracking-[-0.04em] text-white">{title}</h3><p className="mt-4 text-sm leading-6 text-white/58">{body}</p></div>)}
        </div>
      </div>
    </section>
  );
}