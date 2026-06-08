import { CheckCircle2 } from "lucide-react";

const creatorTypes = [
  "Gay solo creators",
  "Gay couples or duo creators",
  "Cam performers seeking broader distribution",
  "Creators with existing OnlyFans-style content",
  "New creators who want studio support",
  "Creators from the Philippines and Asia"
];

export default function WhoIsThisForSection() {
  return (
    <section className="py-16 md:py-20 border-b border-white/6 bg-[#0a0505]">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4 text-center">
          Who This Is For
        </h2>
        <p className="text-white/50 text-center max-w-2xl mx-auto mb-12">
          FLESHLAB welcomes diverse gay adult creators at different stages of their journey.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creatorTypes.map((item, i) => (
            <div key={i} className="bg-[#111] border border-white/8 rounded-xl p-5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span className="text-white/80 text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}