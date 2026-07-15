import { Camera, CheckCircle, CreditCard, MessageCircle, ShieldCheck } from "lucide-react";
import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";
import RecruitmentSection from "./RecruitmentSection";

const steps = ["Private application", "Friendly studio chat", "Boundaries and concept", "First shoot with support", "Edit, release and payment"];
const faqs = [
  ["Do I need experience?", "No. Most creators start with nerves. We care more about honesty, comfort and chemistry than a perfect body or performance history."],
  ["Can I set limits?", "Yes. Your boundaries are discussed before anything is planned. A good shoot only works when everyone understands the limits."],
  ["Will people know?", "Privacy options are discussed early. We explain what is public, what is private and what choices you have before you commit."],
  ["How fast do I earn?", "Payment terms are explained clearly before the shoot, including what is paid, when it is paid and what can grow over time."],
];

function StoryPanel({ video }) {
  return (
    <div className="relative min-h-[540px] overflow-hidden rounded-[42px] border border-white/10 bg-[#111]">
      <MediaImage src={getVideoThumbnailUrl(video)} alt="Behind the scenes" className="absolute inset-0 h-full w-full opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
      <div className="absolute bottom-0 max-w-2xl p-8 md:p-10">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#E51D2A]">Behind the scenes</p>
        <h3 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-6xl">The first day should feel clear, not confusing.</h3>
        <p className="mt-5 text-lg leading-relaxed text-white/68">Before the camera, there is a conversation. What are you comfortable with? What do you want to avoid? What would make you feel confident?</p>
      </div>
    </div>
  );
}

export default function RecruitmentJourney({ videos = [] }) {
  return (
    <>
      <RecruitmentSection eyebrow="Can I really do this?" title="You do not need to arrive confident." intro="Confidence is built step by step. The studio’s job is to make the first step understandable, safe and real.">
        <div className="grid gap-5 md:grid-cols-3">
          {["Nobody starts as a pornstar.", "A first shoot is planned slowly.", "Real chemistry beats fake performance."].map((text) => <div key={text} className="border-l border-[#E51D2A] bg-white/[0.03] p-6 text-2xl font-black uppercase leading-none tracking-[-0.04em] text-white">{text}</div>)}
        </div>
      </RecruitmentSection>

      <RecruitmentSection eyebrow="Why trust FLESHLAB?" title="A studio for real first-timers." intro="We do not sell you a fantasy. We explain the work, the risks, the boundaries and the opportunity before anything happens.">
        <StoryPanel video={videos[1] || videos[0]} />
      </RecruitmentSection>

      <section id="first-shoot">
        <RecruitmentSection eyebrow="How your first shooting works" title="No mystery. No pressure." intro="The process is simple because nervous people need clarity, not sales talk.">
          <div className="grid gap-4 lg:grid-cols-5">
            {steps.map((step, index) => <div key={step} className="min-h-[180px] border border-white/10 bg-[#0d0d0d] p-6"><p className="text-5xl font-black text-[#E51D2A]">{index + 1}</p><h3 className="mt-6 text-xl font-black uppercase leading-none text-white">{step}</h3></div>)}
          </div>
        </RecruitmentSection>
      </section>

      <RecruitmentSection eyebrow="Safety & money" title="The practical fears matter." intro="People apply because they want a better life. Trust is built by answering the uncomfortable questions directly.">
        <div className="grid gap-5 lg:grid-cols-3">
          {[{ icon: ShieldCheck, title: "Boundaries first", text: "You should know what is expected before you ever arrive." }, { icon: CreditCard, title: "Weekly payments", text: "Money matters because bills, phones, rent and family pressure are real." }, { icon: MessageCircle, title: "Human communication", text: "You can ask nervous questions without being treated like a product." }].map((item) => <div key={item.title} className="bg-[#0f0f0f] p-7"><item.icon className="mb-6 h-8 w-8 text-[#E51D2A]" /><h3 className="text-2xl font-black uppercase tracking-[-0.04em] text-white">{item.title}</h3><p className="mt-4 text-sm leading-relaxed text-white/62">{item.text}</p></div>)}
        </div>
      </RecruitmentSection>

      <RecruitmentSection eyebrow="Frequently asked questions" title="The questions everyone is afraid to ask.">
        <div className="grid gap-3 md:grid-cols-2">
          {faqs.map(([q, a]) => <div key={q} className="border border-white/10 bg-[#0b0b0b] p-6"><div className="flex gap-3"><CheckCircle className="mt-1 h-5 w-5 shrink-0 text-[#E51D2A]" /><div><h3 className="text-lg font-black text-white">{q}</h3><p className="mt-2 text-sm leading-relaxed text-white/62">{a}</p></div></div></div>)}
        </div>
      </RecruitmentSection>
    </>
  );
}