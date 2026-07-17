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
  { Icon: BarChart2, title: "Partner platform views", text: "Scenes can be distributed to selected partner platforms and earn from performance over time." },
  { Icon: Film, title: "Video sales and PPV", text: "Selected scenes can sell as premium videos, paid unlocks or FLESHLAB/FapHouse purchases." },
  { Icon: Crown, title: "Fanclub subscriptions", text: "Fans who want more of you can subscribe to your performer fanclub for recurring access." },
  { Icon: Video, title: "Livecam tokens", text: "Cam shows add active income and help turn viewers into regular fans." },
  { Icon: Users, title: "Collaborations", text: "Partner scenes create variety, stronger thumbnails, audience overlap and more viewer interest." },
];
const EARNING_FACTORS = ["Consistency", "Viewer demand", "Face visibility", "Sexual energy", "Real reactions", "Strong fantasy or story", "Clear climax", "Clickable titles and thumbnails", "Niche appeal", "Fan interaction"];
const APPLICATION_STEPS = ["Apply privately", "Upload photos and review videos", "Verify age and identity", "Team review", "Model discussion", "Contract and consent", "First production", "Earnings tracking"];

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

        <BPChapterSection number="01" eyebrow="Why FLESHLAB" question="Why should I build with FLESHLAB?" answer="FLESHLAB is an adult studio and performer network for verified 18+ performers. We are not escort, dating or private meetings — we are a content production, fanclub, PPV, livecam and distribution platform built around consent, contracts and monetization.">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-rose-500/25 bg-gradient-to-br from-rose-950/30 to-white/[0.03] p-8">
              <h3 className="mb-4 text-2xl font-black text-white">What FLESHLAB does</h3>
              <div className="space-y-4 text-base leading-relaxed text-white/58">
                <p>We help performers build professional adult profiles, produce content, publish scenes, launch fanclubs, sell videos, distribute content across partner platforms and track earnings.</p>
                <p>You bring your look, body, performance, sexual energy and boundaries. We help build the structure around you.</p>
              </div>
              <div className="mt-6 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5 text-rose-200/90 font-bold">You perform. We help turn it into a monetized adult performer brand.</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#111] p-8">
              <h3 className="mb-5 text-xl font-black text-white">Support included</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUPPORT.map((item) => <div key={item} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-white/60"><CheckCircle2 className="h-4 w-4 shrink-0 text-rose-400" />{item}</div>)}
              </div>
            </div>
          </div>
        </BPChapterSection>

        <div ref={earnRef}>
          <BPChapterSection number="02" eyebrow="How You Earn" question="How can my content earn?" answer="You can start earning from the first video we produce and publish with you, but income is not automatic. Every scene, cam show, fanclub update and collaboration creates another chance for views, sales, subscribers and audience growth." tone="amber">
            <div className="grid gap-6 lg:grid-cols-5">
              {INCOME.map(({ Icon, title, text }) => <div key={title} className="rounded-3xl border border-white/10 bg-[#111] p-6"><Icon className="mb-5 h-7 w-7 text-rose-400" /><h3 className="mb-3 text-lg font-black text-white">{title}</h3><p className="text-sm leading-relaxed text-white/45">{text}</p></div>)}
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-7">
                <div className="mb-2 text-4xl font-black text-amber-300">One video is a chance.</div>
                <p className="text-white/55 leading-relaxed">A catalog is a market presence. Older videos can keep generating views, sales and fan interest while new videos go online.</p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-black/30 p-3"><b className="text-rose-300">4–8</b><p className="text-[10px] text-white/35">starter videos / month</p></div><div className="rounded-xl bg-black/30 p-3"><b className="text-rose-300">10–15</b><p className="text-[10px] text-white/35">growth videos / month</p></div><div className="rounded-xl bg-black/30 p-3"><b className="text-rose-300">20+</b><p className="text-[10px] text-white/35">aggressive build-up</p></div></div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#111] p-7">
                <h3 className="mb-4 text-xl font-black text-white">What makes earnings stronger</h3>
                <div className="grid gap-2 sm:grid-cols-2">{EARNING_FACTORS.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-white/55"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" />{item}</div>)}</div>
                <p className="mt-5 text-sm leading-relaxed text-white/35">Some performers start at zero. Some make $25–$30 in a 3-hour livecam show. Others need time to prove themselves, learn the camera and build followers. FLESHLAB can position, promote and publish you, but cannot guarantee big earnings.</p>
              </div>
            </div>
          </BPChapterSection>
        </div>

        <BPChapterSection number="03" eyebrow="Choose Your Model" question="Which performer model fits me?" answer="Your model depends on how much support you need and what you already bring: new performers usually need more studio management, while established creators may need network, distribution and growth infrastructure." tone="purple">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border-2 border-rose-500/45 bg-gradient-to-br from-rose-950/35 to-[#111] p-8"><span className="rounded-full bg-rose-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest">New Performers</span><h3 className="mt-6 text-2xl font-black text-white">Managed Performer</h3><div className="mt-4 flex items-baseline gap-3"><span className="text-6xl font-black text-rose-400">40%</span><span className="text-white/45">performer share · 60% studio share</span></div><p className="mt-5 text-white/55 leading-relaxed">Best for beginners, first-time adult workers or performers starting from scratch. We support planning, filming coordination, profile setup, content strategy, fanclub setup, promo, compliance and ongoing management.</p></div>
            <div className="rounded-3xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/25 to-[#111] p-8"><span className="rounded-full bg-purple-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Established Creators</span><h3 className="mt-6 text-2xl font-black text-white">Network Performer</h3><div className="mt-4 flex items-baseline gap-3"><span className="text-6xl font-black text-purple-300">70%</span><span className="text-white/45">performer share · 30% studio share</span></div><p className="mt-5 text-white/55 leading-relaxed">Best for creators with existing content, fanbase, livecam experience, followers or platform activity. FLESHLAB provides infrastructure, SEO, distribution, fanclub tools, video sales and audience growth.</p></div>
          </div>
          <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-relaxed text-white/30">Revenue models are reviewed and agreed during application review. Splits apply to eligible gross revenue and may differ by product type or contract. You do not need experience, and you do not need to do everything — your boundaries matter.</p>
        </BPChapterSection>

        <BPChapterSection number="04" eyebrow="Apply" question="How do I apply safely?" answer="The application is private, reviewed by the team, and built around age verification, consent and contract review. Nothing is published without approval, contract and consent.">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-white/10 bg-[#111] p-7">
              <h3 className="mb-5 text-xl font-black text-white">Requirements</h3>
              <div className="space-y-3">{[{ Icon: Shield, text: "You must be verified 18+" }, { Icon: FileText, text: "Valid ID and selfie with ID are required" }, { Icon: Film, text: "Private photos and short review videos are required" }, { Icon: Lock, text: "Uploads are confidential and never published without consent" }].map(({ Icon, text }) => <div key={text} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-white/60"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />{text}</div>)}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#111] p-7">
              <h3 className="mb-5 text-xl font-black text-white">Application journey</h3>
              <div className="grid gap-3 sm:grid-cols-2">{APPLICATION_STEPS.map((step, i) => <div key={step} className="flex items-center gap-3 rounded-xl bg-black/25 p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-xs font-black text-rose-300">{i + 1}</span><span className="text-sm text-white/58">{step}</span></div>)}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link to="/gay-performer-recruitment-philippines" className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-6 transition hover:-translate-y-1 hover:border-amber-400/40"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-lg">🇵🇭</div><h3 className="mb-2 font-black text-white">Philippines Recruitment</h3><p className="mb-4 text-sm leading-relaxed text-white/50">Filipino gay creators: start from home, use your phone, get setup support and PHP/USD payouts.</p><span className="inline-flex items-center gap-2 text-xs font-bold text-amber-300">Learn more <Globe className="h-3.5 w-3.5" /></span></Link>
            <button type="button" onClick={() => navigate("/chaturbate-model-join-studio")} className="rounded-3xl border border-purple-500/25 bg-purple-500/10 p-6 text-left transition hover:-translate-y-1 hover:border-purple-400/40"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/15"><Video className="h-5 w-5 text-purple-300" /></div><h3 className="mb-2 font-black text-white">Cam Model Partnership</h3><p className="mb-4 text-sm leading-relaxed text-white/50">Already on Chaturbate or similar? Keep camming, add studio content and fanclub income. 70% network split.</p><span className="inline-flex items-center gap-2 text-xs font-bold text-purple-300">Learn more <ArrowRight className="h-3.5 w-3.5" /></span></button>
          </div>

          <div className="mt-10 text-center"><Button onClick={scrollToForm} className="h-auto rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-10 py-5 text-base font-black uppercase tracking-wide text-white shadow-xl shadow-rose-700/35 hover:from-rose-500 hover:to-rose-600">Start Private Application</Button><p className="mt-3 text-xs text-white/28">Reviewed within 48 hours · No obligation</p></div>
          <BPApplicationForm ref={formRef} onSuccess={handleSuccess} embedded />
        </BPChapterSection>
      </div>
    </>
  );
}