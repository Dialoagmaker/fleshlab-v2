import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SEOMeta from "@/components/SEOMeta";
import BPHero from "@/components/becomePerformer/BPHero";
import BPChapterSection from "@/components/becomePerformer/BPChapterSection";
import BPApplicationForm from "@/components/becomePerformer/BPApplicationForm";
import PrivateCreatorIntake from "@/components/becomePerformer/PrivateCreatorIntake";
import RecruitmentMeasurement from "@/components/becomePerformer/RecruitmentMeasurement";
import RecruitmentCredibilitySection from "@/components/becomePerformer/RecruitmentCredibilitySection";
import BPSuccessScreen from "@/components/becomePerformer/BPSuccessScreen";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart2, CheckCircle2, Crown, FileText, Film, Lock, MessageCircle, Shield, Users, Video } from "lucide-react";
import { trackPerformerApplyClick, trackWhatsappRecruitmentClick } from "@/lib/analytics";

const FAQS = [
  { q: "How do I become a FLESHLAB performer?", a: "Start with the private intake on this page. If there may be a fit, FLESHLAB reviews your application, age-verification readiness, media, goals and creator model before any contract or publishing step." },
  { q: "Do I need experience to apply?", a: "No. Beginners can apply. New performers are usually reviewed for the Management / Build-Up model, while experienced creators may fit the Network / Distribution model." },
  { q: "Can I apply without an existing audience?", a: "Yes. An existing audience can help, but it is not required to start an application. FLESHLAB reviews fit, reliability, verification readiness and production suitability." },
  { q: "How do FLESHLAB performers earn?", a: "Approved performers may earn through eligible scenes, video sales, fanclub access, PPV, partner platform distribution, livecam activity or collaborations depending on the agreed model and contract. Income is not guaranteed." },
  { q: "What happens after I apply?", a: "A team member reviews the application. If it moves forward, the next steps can include verification, review media, model discussion, contract review, consent confirmation, profile setup and first content planning." },
  { q: "Do I need to create explicit content immediately?", a: "No. The private intake comes first. Full verification, review materials, boundaries and consent are handled before any production or publishing decision." },
  { q: "Is my application private?", a: "Yes. Intake details, ID and review media are private. Nothing becomes public without verification, contract, consent and publishing approval." },
  { q: "Can I keep using other creator platforms?", a: "That depends on your agreement and creator model. Existing creators can discuss how FLESHLAB may work alongside other platforms during review." },
];

const SUPPORT = ["Profile setup", "Content planning", "Scene and boundary planning", "Solo and partner production planning", "Remote production support", "Titles and descriptions", "Promo assets", "Fanclub setup", "PPV / premium video sales", "FapHouse and partner distribution", "Livecam strategy", "Contracts and releases", "18+ compliance", "ID verification", "Earnings tracking"];
const INCOME = [
  { Icon: BarChart2, title: "Partner views", text: "Scenes can create platform performance opportunities over time." },
  { Icon: Film, title: "Video sales", text: "Premium scenes, PPV unlocks and paid purchases." },
  { Icon: Crown, title: "Fanclub", text: "Recurring fan access around your performer brand." },
  { Icon: Video, title: "Livecam", text: "Token income and regular viewer growth where livecam fits the creator plan." },
  { Icon: Users, title: "Collabs", text: "Partner productions can add variety and shared audience signals." },
];
const EARNING_FACTORS = ["Consistency", "Viewer demand", "Reliability", "Clear boundaries", "Strong performance", "Creator fit", "Production quality", "Clickable packaging", "Niche appeal", "Fan interaction"];
const APPLICATION_STEPS = ["Apply privately", "Upload review media", "Verify 18+", "Team review", "Model discussion", "Contract + consent", "First production plan", "Track performance"];
const WHO_CAN_APPLY = [
  ["Do I need professional experience?", "No. Beginners can apply and may be reviewed for a managed build-up path."],
  ["Do I need an existing audience?", "No. Existing fans help, but they are not required for the first review."],
  ["Can beginners apply?", "Yes. The intake is designed to identify the right starting point before deeper verification."],
  ["Is this employment?", "It is a creator/revenue-share opportunity reviewed through application, verification, contract and consent steps."],
  ["What happens after I apply?", "A human team member reviews fit, completeness, verification readiness and model suitability."],
];
const HUB_LINKS = [
  ["Philippines creator path", "/gay-performer-recruitment-philippines", "For applicants in the Philippines who want country-specific setup, remote intake and payout context."],
  ["OnlyFans-style creator comparison", "/gay-onlyfans-alternative", "For creators comparing FLESHLAB with subscription-platform workflows, not the general casting path."],
  ["Cam model partnership", "/chaturbate-model-join-studio", "For creators already doing livecam who want to add studio content, fanclub and distribution."],
  ["Twink performer casting", "/gay-twink-performer-recruitment", "For performers who specifically match the twink/niche recruitment path."],
];

export default function BecomePerformer() {
  const formRef = useRef(null);
  const intakeRef = useRef(null);
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

  const scrollToForm = (ctaLocation = 'hero_apply') => {
    trackPerformerApplyClick(ctaLocation, '/become-performer');
    intakeRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToVerification = () => {
    trackPerformerApplyClick('intake_continue_verification', '/become-performer');
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleAskFirst = () => {
    trackWhatsappRecruitmentClick('/become-performer', { cta_location: 'global_ask_first', market: 'global', recruitment_type: 'performer_recruitment' });
    window.open("https://wa.me/886958679186?text=Hi%20FLESHLAB%2C%20I'm%20interested%20in%20becoming%20a%20performer", "_blank");
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
        title="Become a Gay Performer or Adult Content Creator | FLESHLAB"
        description="Apply to become a verified 18+ FLESHLAB performer or adult content creator. Beginners and experienced creators can be reviewed for managed or network creator models with contracts, consent and private application review."
        canonical="/become-performer"
        ogImage="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Become a Gay Performer or Adult Content Creator | FLESHLAB",
            "url": "https://fleshlab.online/become-performer",
            "description": "Apply to become a verified 18+ FLESHLAB performer or adult content creator. Beginners and experienced creators can be reviewed for managed or network creator models with contracts, consent and private application review."
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQS.map(({ q, a }) => ({ "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": a } }))
          }
        ]}
      />

      <div className="min-h-screen bg-fl-background text-foreground">
        <RecruitmentMeasurement />
        <div data-recruitment-section="hero">
          <BPHero onApplyClick={scrollToForm} onAskFirst={handleAskFirst} />
        </div>

        <section className="border-y border-border bg-card px-6 py-10">
          <div className="mx-auto max-w-[1180px]">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">Global recruitment hub</p>
                <h2 className="mt-2 text-2xl font-black text-foreground">Start here if you want to join FLESHLAB as a performer or adult content creator.</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">This page covers the global application path. Specialized pages below explain country, platform or niche-specific routes without replacing the main creator application.</p>
              </div>
              <button type="button" onClick={handleAskFirst} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold text-foreground transition hover:bg-secondary"><MessageCircle className="h-4 w-4 text-primary" /> Ask first on WhatsApp</button>
            </div>
            <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {HUB_LINKS.map(([label, href, text]) => (
                <Link key={href} to={href} className="rounded-2xl border border-border bg-secondary/35 p-4 transition hover:-translate-y-0.5 hover:border-primary/40">
                  <h3 className="text-sm font-black text-foreground">{label}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide text-primary">Specialized path <ArrowRight className="h-3 w-3" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-fl-background px-6 py-20">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-10 max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Who can apply?</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-5xl">A clear first step for beginners, experienced creators and performers exploring studio support.</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">Applications are reviewed by people. Applying does not guarantee acceptance, earnings, production work or publication.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {WHO_CAN_APPLY.map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="text-sm font-black text-foreground">{title}</h3>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div data-recruitment-section="why_fleshlab">
        <BPChapterSection number="01" eyebrow="What FLESHLAB does" question="Why apply through FLESHLAB?" answer="FLESHLAB helps verified 18+ adult creators with production planning, publishing, compliance, contracts, monetization tools and private review before anything goes public.">
          <div className="grid gap-7 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/12 to-card p-8 md:p-10">
              <p className="mb-7 text-2xl font-black leading-tight text-foreground md:text-3xl">You bring the interest, boundaries and consistency. FLESHLAB reviews whether there is a safe creator path to build around you.</p>
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

        <div data-recruitment-section="earnings">
          <BPChapterSection number="02" eyebrow="Creator monetization" question="How can performers earn?" answer="Approved creators may earn through eligible scenes, fanclub access, PPV, partner distribution, livecam activity or collaborations depending on the reviewed model and contract." tone="amber">
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
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground/70">Earnings are not guaranteed. Growth depends on content, demand, consistency, reliability and the agreed creator model.</p>
            </div>
          </BPChapterSection>
        </div>

        <div data-recruitment-section="creator_models">
        <BPChapterSection number="03" eyebrow="Choose Your Model" question="Which creator model fits you?" answer="FLESHLAB reviews applicants for a management/build-up path or a network/distribution path. The right model depends on experience, content readiness, audience, support needs and contract review.">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border-2 border-primary/45 bg-gradient-to-br from-primary/12 to-card p-8 md:p-10"><span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">Management / Build-Up</span><h3 className="mt-7 text-2xl font-black text-foreground">Managed Performer</h3><div className="mt-4 flex items-end gap-3"><span className="text-6xl font-black text-primary">40%</span><span className="pb-2 text-sm text-muted-foreground">performer share</span></div><ul className="mt-6 space-y-3 text-sm text-muted-foreground"><li>• For beginners or performers starting from scratch</li><li>• Fits creators who need planning, setup, compliance, publishing and promo support</li><li>• FLESHLAB helps shape the first creator roadmap around boundaries and review fit</li></ul></div>
            <div className="rounded-[2rem] border-2 border-border bg-card p-8 md:p-10"><span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">Network / Distribution</span><h3 className="mt-7 text-2xl font-black text-foreground">Network Performer</h3><div className="mt-4 flex items-end gap-3"><span className="text-6xl font-black text-primary">70%</span><span className="pb-2 text-sm text-muted-foreground">performer share</span></div><ul className="mt-6 space-y-3 text-sm text-muted-foreground"><li>• For creators with content, fans, cam experience or existing platform activity</li><li>• FLESHLAB adds distribution, SEO, fanclub tools, video sales and audience infrastructure</li><li>• Designed to support creators who already know how they want to produce</li></ul></div>
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground/70">Revenue models are reviewed during application. Splits apply to eligible gross revenue and may vary by product type or contract. No income is guaranteed, and your boundaries still matter.</p>
        </BPChapterSection>
        </div>

        <div data-recruitment-section="credibility_proof">
        <BPChapterSection number="04" eyebrow="Proof" question="Why should you believe FLESHLAB?" answer="The process is visible before you commit: review stages, verification, publishing approval and the tools creators use after approval.">
          <RecruitmentCredibilitySection />
        </BPChapterSection>
        </div>

        <section className="border-t border-border bg-card px-6 py-24">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-10 max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Performer application FAQ</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-5xl">Questions before applying to become a FLESHLAB creator</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="rounded-2xl border border-border bg-background/35 p-5">
                  <h3 className="text-base font-black text-foreground">{q}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div data-recruitment-section="apply">
        <BPChapterSection number="05" eyebrow="Apply" question="Start your private performer application" answer="One primary path: begin with the private intake, then continue only if you want to move into verification and review. Prefer to ask first? Use the WhatsApp option above.">
          <div className="rounded-[2.2rem] border border-primary/25 bg-gradient-to-b from-primary/12 to-card p-7 shadow-2xl shadow-primary/10 md:p-10">
            <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.7rem] border border-border bg-background/35 p-6">
                <h3 className="mb-5 text-xl font-black text-foreground">Before you apply</h3>
                <div className="space-y-3">{[{ Icon: Shield, text: "Verified 18+ only" }, { Icon: FileText, text: "Valid ID / KYC may be required before approval" }, { Icon: Lock, text: "Private review and human application review" }, { Icon: FileText, text: "Contract and consent before publishing" }, { Icon: Film, text: "Nothing published without approval" }, { Icon: Shield, text: "No escort, dating or private meeting service" }].map(({ Icon, text }) => <div key={text} className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-secondary/45 px-4 py-3 text-sm text-muted-foreground"><Icon className="h-4 w-4 shrink-0 text-primary" />{text}</div>)}</div>
              </div>
              <div className="rounded-[1.7rem] border border-border bg-background/35 p-6">
                <h3 className="mb-5 text-xl font-black text-foreground">What happens next</h3>
                <div className="grid gap-3 sm:grid-cols-2">{APPLICATION_STEPS.map((step, i) => <div key={step} className="flex min-h-12 items-center gap-3 rounded-xl bg-secondary/45 px-3 py-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-black text-primary">{i + 1}</span><span className="text-sm text-muted-foreground">{step}</span></div>)}</div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <button type="button" onClick={() => scrollToForm('apply_section_primary')} className="rounded-3xl border border-primary/35 bg-primary/10 p-6 text-left transition hover:-translate-y-1 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10"><ArrowRight className="h-5 w-5 text-primary" /></div><h3 className="mb-2 font-black text-foreground">Primary application path</h3><p className="mb-4 text-sm leading-relaxed text-muted-foreground">Start with private intake, then continue to verification only if you want to move forward.</p><span className="inline-flex items-center gap-2 text-xs font-bold text-primary">Start intake <ArrowRight className="h-3.5 w-3.5" /></span></button>
              <button type="button" onClick={handleAskFirst} className="rounded-3xl border border-border bg-secondary/35 p-6 text-left transition hover:-translate-y-1 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10"><MessageCircle className="h-5 w-5 text-primary" /></div><h3 className="mb-2 font-black text-foreground">Ask first on WhatsApp</h3><p className="mb-4 text-sm leading-relaxed text-muted-foreground">Not ready to apply? Ask about fit, privacy, verification or creator models first.</p><span className="inline-flex items-center gap-2 text-xs font-bold text-primary">Ask first <ArrowRight className="h-3.5 w-3.5" /></span></button>
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