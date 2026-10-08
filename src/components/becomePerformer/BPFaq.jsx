import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Can I really make money with this?",
    a: "Yes, but not automatically. You can earn through views, video sales, fanclub subscriptions, PPV, partner platforms and livecam tokens. Some start with zero. Some make small amounts first. The more you produce, the better you perform and the faster your fans grow, the stronger your earning potential becomes.",
  },
  {
    q: "Do I need experience?",
    a: "No. Beginners can apply. If you are new, the Managed Performer model may fit you better. If you already have content, fans or platform experience, the Network model may fit you better.",
  },
  {
    q: "Do I have to do everything?",
    a: "No. Your boundaries matter. Productions are discussed and agreed. But sexually open, creative and reliable performers usually have stronger chances to grow.",
  },
  {
    q: "What exactly do I do as a performer?",
    a: "You create adult content: solo scenes, partner scenes, fanclub drops, livecam shows, photos, short clips or promotional material. What you do depends on your interests, limits and contract.",
  },
  {
    q: "How does livecam income work?",
    a: "Livecam income depends on how long you are online, what you offer, how viewers respond, whether you build followers and whether you use niches like BDSM, fetish, partner shows or private requests. Some shows make nothing. Some make $25–$30 in three hours. Strong performers can grow higher with regular fans.",
  },
  {
    q: "What makes videos earn more?",
    a: "Videos perform better when viewers click and stay. Face visibility, sexual energy, real reactions, moaning, body language, story, fantasy, good climax, partner chemistry, niche appeal, strong title and thumbnail all matter.",
  },
  {
    q: "Do I need to show my face?",
    a: "Face visibility often helps because fans connect faster and thumbnails perform better. But privacy concerns can be discussed during review. Some content can be planned more carefully depending on your situation.",
  },
  {
    q: "Why does FLESHLAB take a studio share?",
    a: "Because we handle production support, profile setup, promo, distribution, contracts, compliance, fanclub tools, publishing and earnings tracking. The more we build and manage, the more studio work is involved.",
  },
  {
    q: "Is this escort, dating or private meetings?",
    a: "No. FLESHLAB is not escorting, dating or private meetings. This is adult content production, fanclub, PPV, livecam and distribution.",
  },
  {
    q: "What makes a performer successful?",
    a: "Not only looks. Sex appeal matters, but so do consistency, openness, reliability, scene ideas, fan interaction, niche, production quality and whether viewers want to see more of you.",
  },
];

function FaqItem({ q, a, open, onClick }) {
  return (
    <div
      className={cn(
        "border rounded-2xl overflow-hidden transition-colors cursor-pointer",
        open ? "border-rose-600/40 bg-rose-600/5" : "border-white/8 bg-[#111] hover:border-white/15"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <span className={cn("font-bold text-base", open ? "text-white" : "text-white/70")}>{q}</span>
        <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform text-rose-400", open && "rotate-180")} />
      </div>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-white/55 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function BPFaq() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section className="py-24 px-6 border-t border-white/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-3 text-white">
            10 QUESTIONS YOU PROBABLY<br />
            <span className="text-rose-500">HAVE BEFORE APPLYING</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-2">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={i}
              q={`${i + 1}. ${faq.q}`}
              a={faq.a}
              open={openIdx === i}
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}