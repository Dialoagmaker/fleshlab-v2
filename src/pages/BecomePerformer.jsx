import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOMeta from "@/components/SEOMeta";
import BPHero from "@/components/becomePerformer/BPHero";
import BPChapterSection from "@/components/becomePerformer/BPChapterSection";
import BPApplicationForm from "@/components/becomePerformer/BPApplicationForm";
import BPSuccessScreen from "@/components/becomePerformer/BPSuccessScreen";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart2, CheckCircle2, Crown, FileText, Film, Globe, Lock, Shield, Users, Video } from "lucide-react";
import { trackBecomePerformerCtaClick } from "@/lib/analytics";

const FAQ_JSON_LD = [
  { q: "Can I really make money with this?", a: "Yes, but not automatically. You can earn through views, video sales, fanclub subscriptions, PPV, partner platforms and livecam tokens." },
  { q: "Do I need experience?", a: "No. Beginners can apply. If you are new, the Managed Performer model may fit you better." },
  { q: "Do I have to do everything?", a: "No. Your boundaries matter. Productions are discussed and agreed." },
  { q: "What exactly do I do as a performer?", a: "You create adult content: solo scenes, partner scenes, fanclub drops, livecam shows, photos, short clips or promotional material." },
  { q: "How does livecam income work?", a: "Livecam income depends on how long you are online, what you offer and how viewers respond." },
  { q: "What makes videos earn more?", a: "Face visibility, sexual energy, real reactions, moaning, body language, story, fantasy, good climax, partner chemistry, niche appeal, strong title and thumbnail." },
  { q: "Do I need to show my face?", a: "Face visibility often helps but privacy concerns can be discussed during review." },
  { q: "Why does FLESHLAB take a studio share?", a: "Because we handle production support, profile setup, promo, distribution, contracts, compliance, fanclub tools, publishing and earnings tracking." },
  { q: "Is this escort, dating or private meetings?", a: "No. FLESHLAB is not escorting, dating or private meetings. This is adult content production, fanclub, PPV, livecam and distribution." },
  { q: "What makes a performer successful?", a: "Consistency, openness, reliability, scene ideas, fan interaction, niche, production quality and whether viewers want to see more of you." },
];

const SUPPORT = ["Profile setup", "Content planning", "Scene and boundary planning", "Solo and partner production planning", "Remote production support", "Thumbnails, titles and descriptions", "Promo assets", "Fanclub setup", "PPV / premium video sales", "FapHouse and partner distribution", "Livecam strategy", "Contracts and releases", "18+ compliance", "ID verification", "Earnings tracking"];
const INCOME = [
  { Icon: BarChart2, title: "Partner views", text: "Scenes can earn from platform performance over time." },
  { Icon: Film, title: "Video sales", text: "Premium scenes, PPV unlocks and paid purchases." },
  { Icon: Crown, title: "Fanclub", text: "Recurring fan access around your performer brand." },
  { Icon: Video, title: "Livecam", text: "Active token income and regular viewer growth." },
  { Icon: Users, title: "Collabs", text: "More variety, stronger thumbnails and shared audiences." },
];
const EARNING_FACTORS = ["Consistency", "Viewer demand", "Face visibility", "Sexual energy", "Real reactions", "Strong fantasy", "Clear climax", "Clickable packaging", "Niche appeal", "Fan interaction"];
const APPLICATION_STEPS = ["Apply privately", "Upload review media", "Verify 18+", "Team review", "Model discussion", "Contract + consent", "First production", "Track earnings"];

export default function BecomePerformer() {
  const formRef = useRef(null);
  const earnRef = useRef(null);
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const scrollToForm = () => {
    trackBecomePerformerCtaClick('hero_apply');
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToEarn = () => {
    trackBecomePerformerCtaClick('hero_earn');
    earnRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSuccess = (data) => {
    setSubmittedData(data);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted && submittedData) {
    return <BPSuccessScreen firstName={submittedData.first_name} lastName={submittedData.last_name} email={submittedData.email} />;
  }

  return (
    <>
      <SEOMeta
        title="Become a FLESHLAB Performer | Adult Performer Casting & Content Monetization"
        description="Apply to become a verified 18+ FLESHLAB performer. Earn from adult scenes, fanclub subscriptions, PPV video sales, partner platform distribution and livecam opportunities. Professional contracts, consent and private application review."
        canonical="/become-performer"
        ogImage="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png"
        jsonLd={{ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": FAQ_JSON_LD.map(({ q, a }) => ({ "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": a } })) }}
      />

      <div className="min-h-screen bg-[#080808] text-white">
        <BPHero onApplyClick={scrollToForm} onEarnClick={scrollToEarn} />

        <BPChapterSection number="01" eyebrow="Why FLESHLAB" question="Why build with FLESHLAB?" answer="Because you should not have to figure out production, publishing, compliance and sales alone. We help turn your performance into a real adult creator brand.">
          <div className="grid gap-7 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-rose-500/25 bg-gradient-to-br from-rose-950/30 to-white/[0.03] p-8 md:p-10">
              <p className="mb-7 text-2xl font-black leading-tight text-white md:text-3xl">Adult content production, fanclub access, PPV, livecam and distribution — with consent and contracts built in.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {["Verified 18+ only", "No escort or dating", "Private data handling", "Publishing needs consent"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white/68">{item}</div>)}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-[#111] p-6 md:p-8">
              <h3 className="mb-5 text-lg font-black uppercase tracking-wide text-white">Studio support</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUPPORT.map((item) => <div key={item} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-white/60"><CheckCircle2 className="h-4 w-4 shrink-0 text-rose-400" />{item}</div>)}
              </div>
            </div>
          </div>
        </BPChapterSection>

        <div ref={earnRef}>
          <BPChapterSection number="02" eyebrow="How You Earn" question="How can this make money?" answer="One scene can start the journey. A growing catalog, fanclub, livecam schedule and partner distribution create more chances to earn." tone="amber">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {INCOME.map(({ Icon, title, text }) => <div key={title} className="rounded-[1.6rem] border border-white/10 bg-[#111] p-5 transition hover:-translate-y-0.5 hover:border-rose-400/30"><Icon className="mb-5 h-7 w-7 text-rose-400" /><h3 className="mb-2 text-lg font-black text-white">{title}</h3><p className="text-sm leading-relaxed text-white/45">{text}</p></div>)}
            </div>
            <div className="mt-8 rounded-[2rem] border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent p-7 md:p-9">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div><div className="text-4xl font-black leading-none text-amber-300 md:text-5xl">One video is a chance.</div><p className="mt-4 text-white/58">A catalog becomes market presence. Older videos can keep working while new scenes go online.</p></div>
                <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-black/30 p-5 text-center"><b className="text-2xl text-rose-300">4–8</b><p className="mt-1 text-xs text-white/38">starter videos / month</p></div><div className="rounded-2xl bg-black/30 p-5 text-center"><b className="text-2xl text-rose-300">10–15</b><p className="mt-1 text-xs text-white/38">growth videos / month</p></div><div className="rounded-2xl bg-black/30 p-5 text-center"><b className="text-2xl text-rose-300">20+</b><p className="mt-1 text-xs text-white/38">aggressive build-up</p></div></div>
              </div>
            </div>
            <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-7 md:p-8">
              <h3 className="mb-4 text-xl font-black text-white">What improves performance</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{EARNING_FACTORS.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-white/56"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" />{item}</div>)}</div>
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/35">Earnings are not guaranteed. Some start at zero; some starter cam shows make $25–$30 in three hours. Growth depends on content, demand and consistency.</p>
            </div>
          </BPChapterSection>
        </div>

        <BPChapterSection number="03" eyebrow="Choose Your Model" question="Which model fits you?" answer="New performers usually need studio management. Established creators usually need reach, infrastructure and smarter monetization." tone="purple">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border-2 border-rose-500/45 bg-gradient-to-br from-rose-950/35 to-[#111] p-8 md:p-10"><span className="rounded-full bg-rose-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest">New Performers</span><h3 className="mt-7 text-2xl font-black text-white">Managed Performer</h3><div className="mt-4 flex items-end gap-3"><span className="text-6xl font-black text-rose-400">40%</span><span className="pb-2 text-sm text-white/48">performer share</span></div><ul className="mt-6 space-y-3 text-sm text-white/58"><li>• For beginners or performers starting from scratch</li><li>• Studio support for planning, setup, promo and compliance</li><li>• We help build the performer brand around you</li></ul></div>
            <div className="rounded-[2rem] border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/25 to-[#111] p-8 md:p-10"><span className="rounded-full bg-purple-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Established Creators</span><h3 className="mt-7 text-2xl font-black text-white">Network Performer</h3><div className="mt-4 flex items-end gap-3"><span className="text-6xl font-black text-purple-300">70%</span><span className="pb-2 text-sm text-white/48">performer share</span></div><ul className="mt-6 space-y-3 text-sm text-white/58"><li>• For creators with content, fans or cam experience</li><li>• FLESHLAB adds distribution, SEO, fanclub tools and sales</li><li>• Keep creating while the network helps you grow</li></ul></div>
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-white/32">Revenue models are reviewed during application. Splits apply to eligible gross revenue and may vary by product type or contract. Your boundaries still matter.</p>
        </BPChapterSection>

        <BPChapterSection number="04" eyebrow="Apply" question="Ready to start?" answer="This is the destination. Apply privately, verify safely, and let the team review your fit for FLESHLAB.">
          <div className="rounded-[2.2rem] border border-rose-500/25 bg-gradient-to-b from-rose-950/20 to-[#111] p-7 shadow-2xl shadow-rose-950/20 md:p-10">
            <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-6">
                <h3 className="mb-5 text-xl font-black text-white">Before you apply</h3>
                <div className="space-y-3">{[{ Icon: Shield, text: "Verified 18+ only" }, { Icon: FileText, text: "Valid ID + selfie required" }, { Icon: Film, text: "Private review photos and videos" }, { Icon: Lock, text: "Nothing published without consent" }].map(({ Icon, text }) => <div key={text} className="flex min-h-12 items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/66"><Icon className="h-4 w-4 shrink-0 text-rose-400" />{text}</div>)}</div>
              </div>
              <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-6">
                <h3 className="mb-5 text-xl font-black text-white">What happens next</h3>
                <div className="grid gap-3 sm:grid-cols-2">{APPLICATION_STEPS.map((step, i) => <div key={step} className="flex min-h-12 items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-xs font-black text-rose-300">{i + 1}</span><span className="text-sm text-white/60">{step}</span></div>)}</div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Link to="/gay-performer-recruitment-philippines" className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-6 transition hover:-translate-y-1 hover:border-amber-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-lg">🇵🇭</div><h3 className="mb-2 font-black text-white">Philippines Recruitment</h3><p className="mb-4 text-sm leading-relaxed text-white/50">Start from home, use your phone, get setup support and PHP/USD payouts.</p><span className="inline-flex items-center gap-2 text-xs font-bold text-amber-300">Learn more <Globe className="h-3.5 w-3.5" /></span></Link>
              <button type="button" aria-label="Learn more about the cam model partnership" onClick={() => navigate("/chaturbate-model-join-studio")} className="rounded-3xl border border-purple-500/25 bg-purple-500/10 p-6 text-left transition hover:-translate-y-1 hover:border-purple-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/15"><Video className="h-5 w-5 text-purple-300" /></div><h3 className="mb-2 font-black text-white">Cam Model Partnership</h3><p className="mb-4 text-sm leading-relaxed text-white/50">Already camming? Add studio content, fanclub income and the 70% network split.</p><span className="inline-flex items-center gap-2 text-xs font-bold text-purple-300">Learn more <ArrowRight className="h-3.5 w-3.5" /></span></button>
            </div>

            <div className="mx-auto mt-12 max-w-3xl text-center"><p className="mb-5 text-2xl font-black text-white md:text-3xl">Start here.</p><Button onClick={scrollToForm} className="h-auto min-h-14 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-10 py-5 text-base font-black uppercase tracking-wide text-white shadow-xl shadow-rose-700/35 hover:from-rose-500 hover:to-rose-600 focus-visible:ring-2 focus-visible:ring-rose-300">Start Private Application</Button><p className="mt-3 text-xs text-white/35">Reviewed within 48 hours · No obligation</p></div>
            <BPApplicationForm ref={formRef} onSuccess={handleSuccess} embedded />
          </div>
        </BPChapterSection>
      </div>
    </>
  );
}