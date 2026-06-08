import FAQItem from "./FAQItem";

const faqs = [
  {
    q: "Is FLESHLAB an OnlyFans replacement?",
    a: "FLESHLAB is not a direct replacement for every creator. It is a studio-backed creator network for gay adult creators who want support with distribution, production planning, compliance, and revenue-share options."
  },
  {
    q: "Can I join if I already have an OnlyFans-style page?",
    a: "Yes. Existing creators may apply for the network/distribution model if they already have content, a fanbase, or a creator workflow."
  },
  {
    q: "What revenue models are available?",
    a: "FLESHLAB offers a studio-managed model with Studio 60% / Performer 40%, and a network model with Performer 70% / Studio 30%."
  },
  {
    q: "Do you guarantee income?",
    a: "No. FLESHLAB does not guarantee income. Results depend on content quality, audience demand, consistency, distribution, and performance."
  },
  {
    q: "Is ID verification required?",
    a: "Yes. All performers must be verified 18+ and complete ID/KYC and consent documentation before participating."
  }
];

export default function FAQSection() {
  return (
    <section className="py-16 md:py-20 border-b border-white/6 bg-[#0a0505]">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4 text-center">
          Frequently Asked Questions
        </h2>
        <p className="text-white/50 text-center max-w-2xl mx-auto mb-12">
          Common questions about joining FLESHLAB as a gay adult creator.
        </p>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}