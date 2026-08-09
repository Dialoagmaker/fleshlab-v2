import { useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SEOMeta from "@/components/SEOMeta";
import BPHero from "@/components/becomePerformer/BPHero";
import BPChapterSection from "@/components/becomePerformer/BPChapterSection";
import BPApplicationForm from "@/components/becomePerformer/BPApplicationForm";
import PrivateCreatorIntake from "@/components/becomePerformer/PrivateCreatorIntake";
import RecruitmentMeasurement from "@/components/becomePerformer/RecruitmentMeasurement";
import RecruitmentCredibilitySection from "@/components/becomePerformer/RecruitmentCredibilitySection";
import BPSuccessScreen from "@/components/becomePerformer/BPSuccessScreen";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart2, CheckCircle2, Crown, FileText, Film, Globe, Lock, MessageCircle, Shield, Users, Video } from "lucide-react";
import { trackBecomePerformerCtaClick, trackWhatsappRecruitmentClick } from "@/lib/analytics";
import { trackRecruitmentFunnelStage } from "@/lib/recruitmentOptimization";

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
  const intakeRef = useRef(null);
  const earnRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      source: params.get("utm_source") || params.get("source") || null,
      market: params.get("market") || null,
      campaign: params.get("utm_campaign") || params.get("campaign") || null,
      medium: params.get("utm_medium") || null,
      content: params.get("utm_content") || null,
      term: params.get("utm_term") || null,
      referralCode: params.get("ref") || params.get("referral_code") || null,
      campaignId: params.get("campaign_id") || null,
    };
  }, [location.search]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const scrollToForm = () => {
    trackRecruitmentFunnelStage('hero_interaction', { cta_location: 'hero_apply' });
    intakeRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToVerification = () => {
    trackBecomePerformerCtaClick('intake_continue_verification');
    trackRecruitmentFunnelStage('verification_started', { cta_location: 'intake_continue_verification' });
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToEarn = () => {
    trackBecomePerformerCtaClick('hero_earn');
    earnRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAskFirst = () => {
    trackWhatsappRecruitmentClick('/become-performer', { cta_location: 'global_ask_first', market: 'global', recruitment_type: 'performer_recruitment' });
    window.open("https://wa.me/886958679186?text=Hi%20FLESHLAB%2C%20I'm%20interested%20in%20becoming%20a%20performer", "_blank");
  };

  const handleSuccess = (data) => {
    trackRecruitmentFunnelStage('application_submitted');
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

      <div className="min-h-screen bg-fl-background text-foreground">
        <RecruitmentMeasurement />
        <div data-recruitment-section="hero">
          <BPHero onApplyClick={scrollToForm} onEarnClick={scrollToEarn} />
        </div>

        <section className="border-y border-border bg-card px-6 py-8">
          <div className="mx-auto grid max-w-[1180px] gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary">Creator recruitment</p>
              <h2 className="mt-2 text-2xl font-black text-foreground">Become a verified 18+ gay/adult content creator or performer with FLESHLAB.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">The Philippines recruitment path is available for applicants who want to start from home with phone-shot review materials where appropriate.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/gay-performer-recruitment-philippines" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary/90">Philippines path <Globe className="h-4 w-4" /></Link>
              <button type="button" onClick={handleAskFirst} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold text-foreground transition hover:bg-secondary"><MessageCircle className="h-4 w-4 text-primary" /> Ask first</button>
            </div>
          </div>
        </section>

        <div data-recruitment-section="why_fleshlab">
        <BPChapterSection number="01" eyebrow="Why FLESHLAB" question="Why build with FLESHLAB?" answer="Start with what you already have: body, confidence and energy. We add production, publishing, compliance, sales and support.">
          <div className="grid gap-7 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/12 to-card p-8 md:p-10">
              <p className="mb-7 text-2xl font-black leading-tight text-foreground md:text-3xl">You bring the raw material. FLESHLAB turns it into a performer brand.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {["Your look", "Your boundaries", "Your sexual energy", "Your consistency"].map((item) => <div key={item} className="rounded-2xl border border-border bg-background/45 px-4 py-3 text-sm font-bold text-foreground/70">{item}</div>)}
              </div>
            </div>
            <div className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
              <h3 className="mb-5 text-lg font-black uppercase tracking-wide text-foreground">Studio support</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUPPORT.map((item) => <div key={item} className="flex items-center gap-2 rounded-xl border border-border bg-secondary/45 px-3 py-2.5 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />{item}</div>)}
              </div>
            </div>
          </div>
        </BPChapterSection>
        </div>

        <div ref={earnRef} data-recruitment-section="earnings">
          <BPChapterSection number="02" eyebrow="How You Earn" question="How can this make money?" answer="Scenes create income opportunities. A catalog, fanclub, livecam schedule and partner distribution create momentum." tone="amber">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {INCOME.map(({ Icon, title, text }) => <div key={title} className="rounded-[1.6rem] border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30"><Icon className="mb-5 h-7 w-7 text-primary" /><h3 className="mb-2 text-lg font-black text-foreground">{title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{text}</p></div>)}
            </div>
            <div className="mt-8 rounded-[2rem] border border-primary/25 bg-gradient-to-r from-primary/12 via-card to-card p-7 md:p-9">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div><div className="text-4xl font-black leading-none text-primary md:text-5xl">One video is a chance.</div><p className="mt-4 text-muted-foreground">A catalog becomes market presence. Older videos can keep working while new scenes go online.</p></div>
                <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-background/45 p-5 text-center"><b className="text-2xl text-primary">4–8</b><p className="mt-1 text-xs text-muted-foreground">starter videos / month</p></div><div className="rounded-2xl bg-background/45 p-5 text-center"><b className="text-2xl text-primary">10–15</b><p className="mt-1 text-xs text-muted-foreground">growth videos / month</p></div><div className="rounded-2xl bg-background/45 p-5 text-center"><b className="text-2xl text-primary">20+</b><p className="mt-1 text-xs text-muted-foreground">aggressive build-up</p></div></div>
              </div>
            </div>
            <div className="mt-6 rounded-[2rem] border border-border bg-card p-7 md:p-8">
              <h3 className="mb-4 text-xl font-black text-foreground">What improves performance</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{EARNING_FACTORS.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{item}</div>)}</div>
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground/70">Earnings are not guaranteed. Some start at zero; some starter cam shows make $25–$30 in three hours. Growth depends on content, demand and consistency.</p>
            </div>
          </BPChapterSection>
        </div>

        <div data-recruitment-section="creator_models">
        <BPChapterSection number="03" eyebrow="Choose Your Model" question="Which model fits you?" answer="New performers usually need studio management. Established creators usually need reach, infrastructure and smarter monetization.">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border-2 border-primary/45 bg-gradient-to-br from-primary/12 to-card p-8 md:p-10"><span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">New Performers</span><h3 className="mt-7 text-2xl font-black text-foreground">Managed Performer</h3><div className="mt-4 flex items-end gap-3"><span className="text-6xl font-black text-primary">40%</span><span className="pb-2 text-sm text-muted-foreground">performer share</span></div><ul className="mt-6 space-y-3 text-sm text-muted-foreground"><li>• For beginners or performers starting from scratch</li><li>• Studio support for planning, setup, promo and compliance</li><li>• We help build the performer brand around you</li></ul></div>
            <div className="rounded-[2rem] border-2 border-border bg-card p-8 md:p-10"><span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">Established Creators</span><h3 className="mt-7 text-2xl font-black text-foreground">Network Performer</h3><div className="mt-4 flex items-end gap-3"><span className="text-6xl font-black text-primary">70%</span><span className="pb-2 text-sm text-muted-foreground">performer share</span></div><ul className="mt-6 space-y-3 text-sm text-muted-foreground"><li>• For creators with content, fans or cam experience</li><li>• FLESHLAB adds distribution, SEO, fanclub tools and sales</li><li>• Keep creating while the network helps you grow</li></ul></div>
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground/70">Revenue models are reviewed during application. Splits apply to eligible gross revenue and may vary by product type or contract. Your boundaries still matter.</p>
        </BPChapterSection>
        </div>

        <div data-recruitment-section="credibility_proof">
        <BPChapterSection number="04" eyebrow="Proof" question="Why should you believe FLESHLAB?" answer="The process is visible before you commit: review stages, verification, publishing approval and the tools creators use after approval.">
          <RecruitmentCredibilitySection />
        </BPChapterSection>
        </div>

        <div data-recruitment-section="apply">
        <BPChapterSection number="05" eyebrow="Apply" question="Apply today" answer="You have seen the path. Start privately, verify safely, and let the team review your fit for FLESHLAB.">
          <div className="rounded-[2.2rem] border border-primary/25 bg-gradient-to-b from-primary/12 to-card p-7 shadow-2xl shadow-primary/10 md:p-10">
            <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.7rem] border border-border bg-background/35 p-6">
                <h3 className="mb-5 text-xl font-black text-foreground">Before you apply</h3>
                <div className="space-y-3">{[{ Icon: Shield, text: "Verified 18+ only" }, { Icon: FileText, text: "Valid ID + selfie required" }, { Icon: Film, text: "Private review photos and videos" }, { Icon: Lock, text: "Nothing published without consent" }].map(({ Icon, text }) => <div key={text} className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-secondary/45 px-4 py-3 text-sm text-muted-foreground"><Icon className="h-4 w-4 shrink-0 text-primary" />{text}</div>)}</div>
              </div>
              <div className="rounded-[1.7rem] border border-border bg-background/35 p-6">
                <h3 className="mb-5 text-xl font-black text-foreground">What happens next</h3>
                <div className="grid gap-3 sm:grid-cols-2">{APPLICATION_STEPS.map((step, i) => <div key={step} className="flex min-h-12 items-center gap-3 rounded-xl bg-secondary/45 px-3 py-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-black text-primary">{i + 1}</span><span className="text-sm text-muted-foreground">{step}</span></div>)}</div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Link to="/gay-performer-recruitment-philippines" className="rounded-3xl border border-border bg-secondary/35 p-6 transition hover:-translate-y-1 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-lg">🇵🇭</div><h3 className="mb-2 font-black text-foreground">Philippines Recruitment</h3><p className="mb-4 text-sm leading-relaxed text-muted-foreground">Start from home, use your phone, get setup support and PHP/USD payouts.</p><span className="inline-flex items-center gap-2 text-xs font-bold text-primary">Learn more <Globe className="h-3.5 w-3.5" /></span></Link>
              <button type="button" aria-label="Learn more about the cam model partnership" onClick={() => navigate("/chaturbate-model-join-studio")} className="rounded-3xl border border-border bg-secondary/35 p-6 text-left transition hover:-translate-y-1 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10"><Video className="h-5 w-5 text-primary" /></div><h3 className="mb-2 font-black text-foreground">Cam Model Partnership</h3><p className="mb-4 text-sm leading-relaxed text-muted-foreground">Already camming? Add studio content, fanclub income and the 70% network split.</p><span className="inline-flex items-center gap-2 text-xs font-bold text-primary">Learn more <ArrowRight className="h-3.5 w-3.5" /></span></button>
            </div>

            <div ref={intakeRef} className="mx-auto mt-14 max-w-5xl">
              <PrivateCreatorIntake onVerifyClick={scrollToVerification} />
            </div>
            <BPApplicationForm
              ref={formRef}
              onSuccess={handleSuccess}
              sourcePage="become-performer"
              sourceCountry={urlParams.market}
              utmSource={urlParams.source}
              utmMarket={urlParams.market}
              utmCampaign={urlParams.campaign}
              utmMedium={urlParams.medium}
              utmContent={urlParams.content}
              utmTerm={urlParams.term}
              referralCode={urlParams.referralCode}
              recruitmentCampaignId={urlParams.campaignId}
              embedded
            />
          </div>
        </BPChapterSection>
        </div>
      </div>
    </>
  );
}