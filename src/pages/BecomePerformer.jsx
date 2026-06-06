import { useRef, useState } from "react";
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
import BPSuccessScreen from "@/components/becomePerformer/BPSuccessScreen";

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
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToEarn = () => earnRef.current?.scrollIntoView({ behavior: "smooth" });

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

        <BPApplicationForm ref={formRef} onSuccess={handleSuccess} />
      </div>
    </>
  );
}