import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import SEOMeta from "@/components/SEOMeta";
import BPHero from "@/components/becomePerformer/BPHero";
import BPEarnSection from "@/components/becomePerformer/BPEarnSection";
import BPRealityCheck from "@/components/becomePerformer/BPRealityCheck";
import BPCatalogGrowth from "@/components/becomePerformer/BPCatalogGrowth";
import BPWhatIsFleshlab from "@/components/becomePerformer/BPWhatIsFleshlab";
import BPModels from "@/components/becomePerformer/BPModels";
import BPFaq from "@/components/becomePerformer/BPFaq";
import BPCalculator from "@/components/becomePerformer/BPCalculator";
import BPHowItWorks from "@/components/becomePerformer/BPHowItWorks";
import BPApplicationForm from "@/components/becomePerformer/BPApplicationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BPSuccessScreen from "@/components/becomePerformer/BPSuccessScreen";
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
    return (
      <BPSuccessScreen
        firstName={submittedData.first_name}
        lastName={submittedData.last_name}
        email={submittedData.email}
      />
    );
  }

  return (
    <>
      <SEOMeta
        title="Become a FLESHLAB Performer | Adult Performer Casting & Content Monetization"
        description="Apply to become a verified 18+ FLESHLAB performer. Earn from adult scenes, fanclub subscriptions, PPV video sales, partner platform distribution and livecam opportunities. Professional contracts, consent and private application review."
        canonical="/become-performer"
        ogImage="https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/3e64bceff_image.png"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQ_JSON_LD.map(({ q, a }) => ({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": { "@type": "Answer", "text": a },
          })),
        }}
      />

      <div className="min-h-screen bg-[#080808] text-white">
        <BPHero onApplyClick={scrollToForm} onEarnClick={scrollToEarn} />

        {/* Attach ref to earn section wrapper */}
        <div ref={earnRef}>
          <BPEarnSection />
        </div>

        <BPRealityCheck />
        <BPCatalogGrowth />
        <BPWhatIsFleshlab />
        <BPModels />
        <BPFaq />
        <BPCalculator />
        <BPHowItWorks onApplyClick={scrollToForm} />

        {/* Recruitment Landing Pages Links */}
        <section className="py-16 px-4" style={{ background: '#080808' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-black uppercase tracking-widest text-rose-400"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.35)' }}>
                Creator Paths
              </div>
              <h2 className="font-black text-white text-2xl mb-2">Specific programs</h2>
              <p className="text-white/40 text-sm">Depending on where you are and what you already do.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/gay-performer-recruitment-philippines" className="block group">
                <div className="rounded-2xl p-6 h-full transition-all duration-200 hover:-translate-y-1"
                  style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.3)', boxShadow: '0 0 30px rgba(255,138,0,0.06)' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: 'rgba(255,138,0,0.15)', border: '1px solid rgba(255,138,0,0.35)' }}>
                      🇵🇭
                    </div>
                    <div>
                      <h3 className="text-white font-black text-base mb-1">Philippines Recruitment</h3>
                      <p className="text-white/50 text-sm leading-relaxed mb-4">Filipino gay creators: start from home, use your phone, get setup support and PHP/USD payouts.</p>
                      <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                        Learn More <Globe className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="rounded-2xl p-6 h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 group"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 0 30px rgba(168,85,247,0.06)' }}
                onClick={() => navigate("/chaturbate-model-join-studio")}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)' }}>
                    <Video className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-base mb-1">Cam Model Partnership</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-4">Already on Chaturbate or similar? Keep camming, add studio content and fanclub income. 70% network split.</p>
                    <span className="text-purple-400 text-xs font-bold flex items-center gap-1">
                      Learn More <Video className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <BPApplicationForm ref={formRef} onSuccess={handleSuccess} />
      </div>
    </>
  );
}