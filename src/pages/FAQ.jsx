import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Is FLESHLAB free?",
      answer: "Public previews are completely free to watch with no account required. Full-length scenes and exclusive content require Fanclub membership, PPV purchase, or subscription access."
    },
    {
      question: "What is Fanclub?",
      answer: "Fanclub is FLESHLAB's membership program that provides access to full-length HD videos, exclusive behind-the-scenes content, extended cuts, and member-only productions. Members support the studio directly and get priority access to new releases."
    },
    {
      question: "How do performers apply?",
      answer: "Performers can apply through our Become a Performer page. We're looking for gay/bi/queer Asian creators aged 18+. The application takes 3 minutes and requires age verification. We accept both beginners and experienced performers."
    },
    {
      question: "What is Guest Production?",
      answer: "Guest Production is our professional studio program for verified 18+ performers to participate in studio-controlled productions. This requires application, compatibility review, legal contracts, and studio approval. All productions are filmed under professional supervision with full consent documentation."
    },
    {
      question: "Are performers verified 18+?",
      answer: "Yes. All FLESHLAB performers are verified 18+ through government ID and age verification. We maintain 18 U.S.C. 2257 compliance records for all performers as required by law."
    },
    {
      question: "How do I report content?",
      answer: "If you need to report content for any reason, please contact us at info@fleshlab.online with details about the content and your concern. We take all reports seriously and will respond within 48 hours."
    },
    {
      question: "How do I request takedown/DMCA?",
      answer: "For DMCA takedown requests, please email info@fleshlab.online with: (1) identification of the copyrighted work, (2) location of infringing content, (3) your contact information, (4) statement of good faith belief, and (5) your signature. We process all valid DMCA requests promptly."
    },
    {
      question: "How do I contact support?",
      answer: "Contact us at info@fleshlab.online for any questions, concerns, or support requests. We typically respond within 48 hours. For urgent matters, include 'URGENT' in your subject line."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept major credit cards and secure payment processors. All transactions are discreet and appear as billing descriptor on statements. Payment processing is handled through secure, PCI-compliant systems."
    },
    {
      question: "Can I cancel my membership?",
      answer: "Yes, you can cancel your Fanclub membership at any time. Your access will continue until the end of your current billing period. No refunds are provided for partial periods, but you retain access until the period ends."
    }
  ];

  return (
    <>
      <SEOMeta
        title="FLESHLAB FAQ"
        description="Frequently asked questions about FLESHLAB studio. Learn about Fanclub access, performer applications, guest production, payments, and more."
        canonical="/faq"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "name": "FLESHLAB FAQ"
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
        {/* Hero */}
        <section className="relative py-20 px-4 border-b border-white/8">
          <div className="max-w-[1280px] mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/50">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
              FREQUENTLY <span className="text-rose-500">ASKED</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Answers to common questions about FLESHLAB studio, Fanclub, performer applications, and more.
            </p>
          </div>
        </section>

        {/* FAQ List */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="text-white font-bold text-lg pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-6 h-6 text-rose-500 transition-transform ${
                        openIndex === idx ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openIndex === idx && (
                    <div className="px-6 pb-5">
                      <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-20 px-4 bg-[#0f0f0f] border-y border-white/8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              STILL HAVE <span className="text-rose-500">QUESTIONS</span>?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Contact us at info@fleshlab.online and we'll respond within 48 hours.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}