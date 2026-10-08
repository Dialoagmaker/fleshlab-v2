import { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ChevronDown, Play, Users, Film, ShieldCheck } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

// ── FAQ data ───────────────────────────────────────────────────────────────────
const sections = [
  {
    id: "fans",
    icon: Play,
    label: "For Fans",
    faqs: [
      {
        q: "What is FLESHLAB?",
        a: "FLESHLAB is a gay adult studio and content platform based in Southeast Asia, producing original scenes featuring verified 18+ Asian and Filipino performers. We publish exclusive videos, operate a Fanclub membership program, and offer Guest Production opportunities for qualified fans. FLESHLAB is independently operated and committed to ethical, consent-first production across all content.",
      },
      {
        q: "Is FLESHLAB free to browse?",
        a: "Yes. Public previews, performer profiles, and select free scenes are accessible without an account. Full-length HD videos and exclusive Fanclub content require a Fanclub membership or individual pay-per-view unlock. You can browse the video library and performer pages freely at any time.",
      },
      {
        q: "What is included in the Fanclub?",
        a: "Fanclub membership provides access to full-length HD scenes, extended cuts, behind-the-scenes content, and member-only productions. Members support the studio directly and receive priority access to new releases from their followed performers. Fanclub content is exclusive and not available through free previews.",
      },
      {
        q: "How do video purchases or locked videos work?",
        a: "Certain videos are available as pay-per-view (PPV) unlocks. When you purchase a video, access is granted permanently to your account. Fanclub membership unlocks a broader library under a single monthly subscription. Free-tier users can browse previews and trailers but must upgrade to view full content.",
      },
      {
        q: "Is the content made by verified 18+ performers?",
        a: "Yes. All performers appearing in FLESHLAB productions are verified 18+ through government-issued ID before any content is created. We maintain 18 U.S.C. 2257 compliance records for every performer. Age verification is mandatory, non-negotiable, and documented for every production.",
      },
      {
        q: "Can I follow specific performers?",
        a: "Yes. Each performer has a dedicated profile page on the platform. You can browse their video catalogue, view their biography, and access their Fanclub if they operate one. Fanclub membership for a specific performer supports them directly and unlocks their exclusive content library.",
      },
      {
        q: "What payment methods are supported?",
        a: "We accept major credit and debit cards through secure, PCI-compliant payment processors. All transactions are discreetly billed with a neutral descriptor. We are continually expanding payment options. If you experience a payment issue, contact support at info@fleshlab.online.",
      },
      {
        q: "What should I do if a payment is pending or failed?",
        a: "If a payment is showing as pending or failed, wait 30 minutes before retrying, as some processors take time to confirm. If the issue persists after 30 minutes, contact info@fleshlab.online with your account email and approximate transaction date. Do not submit multiple charges for the same purchase.",
      },
    ],
  },
  {
    id: "performers",
    icon: Users,
    label: "For Performers",
    faqs: [
      {
        q: "How can I apply as a performer?",
        a: "You can apply through our Become a Performer page at fleshlab.online/become-performer. The application collects basic information about you, your experience, your preferences, and your availability. After submission, you will be asked to upload supporting media and a government-issued ID for age verification. The review process typically takes 5–10 business days.",
      },
      {
        q: "Who can apply to FLESHLAB?",
        a: "FLESHLAB accepts applications from gay and bisexual male creators aged 18+ regardless of experience level. We actively welcome Filipino performers, Pinoy creators, Asian gay performers, and queer content creators across Southeast Asia. Applicants must be legally eligible to perform in adult content in their country of residence and able to provide valid government ID.",
      },
      {
        q: "Do performers need ID verification?",
        a: "Yes. Government-issued ID verification is mandatory for all performers before any content is created or published. This is required by law under 18 U.S.C. 2257 and our own compliance standards. Compliance documentation is reviewed and stored securely by the studio team.",
      },
      {
        q: "What content can performers create?",
        a: "Content types depend on the performer's preferences, boundaries, and compatibility review. FLESHLAB produces solo scenes, duo and group productions, behind-the-scenes content, and Fanclub-exclusive material. All content is produced within clearly agreed boundaries that the performer approves before any shoot. Nothing is produced outside of what the performer has explicitly consented to.",
      },
      {
        q: "What are the revenue split models?",
        a: "FLESHLAB offers two primary revenue models. The Studio Management model (60/40) is designed for new or managed performers where the studio handles production, marketing, distribution, and platform management — the performer receives 40% of gross revenue. The Network model (70/30) is for performers with an established fanbase who primarily use FLESHLAB for distribution and network access — the performer receives 70% of gross revenue. Actual splits are defined in the performer's contract.",
      },
      {
        q: "What is the Studio Management model (60/40)?",
        a: "Under the Studio Management model, FLESHLAB takes 60% of gross revenue in exchange for full production management, including filming, editing, marketing, platform distribution, and Fanclub setup. The performer receives 40%. This model is suited for performers who want full studio support without managing the production or business side themselves.",
      },
      {
        q: "What is the Network model (70/30)?",
        a: "Under the Network (Established) model, performers with an existing audience or content library receive 70% of gross revenue. FLESHLAB takes 30% to cover platform infrastructure, distribution, payment processing, and network access. This model is suited for experienced adult content creators who already manage their own brand and production.",
      },
      {
        q: "How are performer earnings tracked?",
        a: "Performer earnings are calculated monthly based on video revenue, Fanclub subscriptions, and platform-specific stats. Each performer has access to an earnings dashboard showing gross revenue, their share, and payout status. Monthly closeouts are reviewed and approved before payouts are processed.",
      },
      {
        q: "Do performers need to upload photos, videos, and ID?",
        a: "Yes. As part of the application process, performers are asked to upload profile photos, an introduction video, and a government-issued ID. These materials are used for age verification, compliance review, and compatibility assessment. Media uploads are handled through a secure upload portal and are not published publicly without studio approval.",
      },
      {
        q: "Can Filipino, Asian, Pinoy, twink, or gay male creators apply?",
        a: "Yes — explicitly. FLESHLAB was built for and around Asian gay performers, with a particular focus on Filipino and Southeast Asian creators. We welcome applications from Pinoy gay performers, Filipino twinks, and queer Asian creators across all body types and experience levels. Our performer roster reflects the diversity of gay male identity in the region.",
      },
    ],
  },
  {
    id: "guest",
    icon: Film,
    label: "Guest Productions",
    faqs: [
      {
        q: "What is a Guest Production?",
        a: "A Guest Production is a professional adult film production in which a verified 18+ fan or external participant applies to perform in a studio-controlled scene. It is a structured content creation program — not a personal meeting, date, or escort arrangement. All participants are screened, verified, and required to sign legal contracts before any production takes place.",
      },
      {
        q: "Is a Guest Production a date or escort service?",
        a: "No. FLESHLAB Guest Production is strictly a professional adult film production program. It is not a dating service, escort arrangement, or private meeting with performers. Any request that implies otherwise will be declined. Participation requires a formal application, age verification, compatibility review, legal contracts, and studio approval.",
      },
      {
        q: "How does the approval process work?",
        a: "After submitting a Guest Production application, the studio team reviews your preferences, requested performers, and production package. Compatibility with the requested performer is assessed based on their documented boundaries. If approved, you will receive a formal quote and booking confirmation. Approval is not guaranteed — the studio and the performer both retain the right to decline any request.",
      },
      {
        q: "Are all Guest Production participants verified 18+?",
        a: "Yes. Every participant in a Guest Production — including applicants — must provide valid government-issued ID confirming they are 18 years of age or older. Verification is completed before any production agreement is finalized. This is a legal requirement and a non-negotiable studio standard.",
      },
      {
        q: "Are performer boundaries and consent reviewed?",
        a: "Yes. Every FLESHLAB performer maintains a documented production compatibility profile that details what they are and are not available for. Guest Production requests are assessed against these boundaries. No production proceeds if there is a boundary conflict. Performers retain the right to withdraw consent at any stage before or during production.",
      },
      {
        q: "Are contracts and release forms required?",
        a: "Yes. Legal production contracts and release forms are required from all participants before any Guest Production proceeds. These documents cover age verification, consent, content usage rights, revenue terms, and production scope. Contracts are reviewed by the studio team and must be signed by all parties before the shoot date is confirmed.",
      },
      {
        q: "What does the production deposit cover?",
        a: "The production deposit secures your booking and covers studio time, crew, equipment, and initial production costs. The deposit is non-refundable if the cancellation occurs within a defined window before the production date. Specific terms are outlined in the production contract provided after approval.",
      },
      {
        q: "Can a performer reject a Guest Production request?",
        a: "Yes, absolutely. Performers have full authority to decline any Guest Production request at any time, for any reason, including after initial approval. No production proceeds without explicit, informed performer consent. The studio does not pressure performers to accept requests, and all rejections are respected without penalty.",
      },
    ],
  },
  {
    id: "trust",
    icon: ShieldCheck,
    label: "Trust, Safety & Support",
    faqs: [
      {
        q: "How does FLESHLAB handle age verification?",
        a: "All performers are required to provide valid government-issued identification confirming they are 18 years of age or older before any content is created. ID verification is reviewed by the compliance team and securely stored in accordance with 18 U.S.C. 2257. No content is published until all compliance records are confirmed.",
      },
      {
        q: "What is the 2257 compliance page?",
        a: "The 2257 page documents our compliance with 18 U.S.C. 2257, a US federal law that requires producers of sexually explicit content to maintain and make available records verifying that all performers are adults. You can view our 2257 records statement at fleshlab.online/2257.",
      },
      {
        q: "How do I report copyright infringement or request a DMCA takedown?",
        a: "To submit a DMCA takedown request, email info@fleshlab.online with: (1) identification of the copyrighted work claimed to have been infringed, (2) the specific URL of the infringing content, (3) your contact information, (4) a statement of good faith belief, and (5) a physical or electronic signature. We process all valid DMCA requests promptly. Full details are on our DMCA page at fleshlab.online/dmca.",
      },
      {
        q: "How do I contact support?",
        a: "For all support inquiries, email info@fleshlab.online. We typically respond within 48 hours. For urgent matters, include 'URGENT' in your subject line. For billing issues, include your account email and approximate transaction date. For compliance or legal matters, specify the nature in the subject.",
      },
      {
        q: "Is my payment and account data private?",
        a: "Yes. All payment processing is handled by PCI-compliant third-party processors. FLESHLAB does not store raw card data. Billing descriptors are designed to be discreet. Account data is protected and is not sold to third parties. For full details, see our Privacy Policy at fleshlab.online/privacy.",
      },
      {
        q: "Why are some videos locked or behind a paywall?",
        a: "FLESHLAB operates on a tiered access model. Free-tier users can watch previews and select free scenes. Full-length HD scenes and exclusive content are available through Fanclub membership or individual pay-per-view purchase. This model allows us to fund ongoing production and fairly compensate performers for their work.",
      },
    ],
  },
];

// ── FAQPage schema ─────────────────────────────────────────────────────────────
// Select strongest 16 items across all sections for schema (schema limit best practice)
const schemaItems = [
  sections[0].faqs[0], // What is FLESHLAB
  sections[0].faqs[1], // Is it free
  sections[0].faqs[2], // What is Fanclub
  sections[0].faqs[4], // Are performers 18+
  sections[0].faqs[6], // Payment methods
  sections[1].faqs[0], // How to apply
  sections[1].faqs[1], // Who can apply
  sections[1].faqs[2], // ID verification
  sections[1].faqs[4], // Revenue splits
  sections[1].faqs[5], // 60/40 model
  sections[1].faqs[6], // 70/30 model
  sections[2].faqs[0], // What is Guest Production
  sections[2].faqs[1], // Not a date/escort
  sections[2].faqs[4], // Boundaries/consent
  sections[3].faqs[0], // Age verification
  sections[3].faqs[2], // DMCA
];

const faqJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": schemaItems.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a,
      },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fleshlab.online" },
      { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://fleshlab.online/faq" },
    ],
  },
];

// ── CTA config per section ─────────────────────────────────────────────────────
const CTAs = {
  fans: [
    { label: "Browse Videos", href: "/videos" },
    { label: "Join Fanclub", href: "/fanclub" },
    { label: "View Performers", href: "/performers" },
  ],
  performers: [
    { label: "Apply as Performer", href: "/become-performer" },
  ],
  guest: [
    { label: "Guest Production Info", href: "/guest-production" },
  ],
  trust: [
    { label: "DMCA Policy", href: "/dmca" },
    { label: "2257 Records", href: "/2257" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

// ── FAQ Item ───────────────────────────────────────────────────────────────────
// Answer text is ALWAYS in the DOM and readable — accordion only controls
// visual expansion. No sr-only duplicates.
function FAQItem({ item, idx, isOpen, onToggle }) {
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden bg-[#0f0f0f]">
      <button
        onClick={() => onToggle(idx)}
        className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-white/5 transition-colors gap-4"
        aria-expanded={isOpen}
      >
        <span className="text-white font-bold text-base md:text-lg leading-snug">{item.q}</span>
        <ChevronDown
          className={`w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {/*
        Answer is always rendered in the DOM with full text content.
        CSS max-height/opacity transition handles visual show/hide.
        No sr-only fallback, no duplicate nodes.
        Crawlers read the text regardless of open state.
      */}
      {/*
        Text node always present in DOM. Crawlers read it regardless of CSS.
        max-h-0 + overflow-hidden collapses visual height for users.
        No visibility:hidden, no display:none, no sr-only duplicate.
      */}
      <div
        className={`px-6 transition-all duration-200 overflow-hidden ${isOpen ? "pb-5 max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="text-white/70 leading-relaxed text-sm md:text-base">{item.a}</p>
      </div>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────────
function FAQSection({ section, ctaKey }) {
  const [openIndex, setOpenIndex] = useState(null);
  const Icon = section.icon;
  const ctas = CTAs[ctaKey] || [];

  return (
    <div id={section.id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-600/30 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-rose-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{section.label}</h2>
      </div>

      <div className="space-y-3 mb-8">
        {section.faqs.map((item, idx) => (
          <FAQItem
            key={idx}
            item={item}
            idx={idx}
            isOpen={openIndex === idx}
            onToggle={(i) => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>

      {ctas.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {ctas.map(cta => (
            <Link
              key={cta.href}
              to={cta.href}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors"
            >
              {cta.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function FAQ() {
  return (
    <>
      <SEOMeta
        title="FLESHLAB FAQ | Fanclub, Performer Applications & Guest Productions"
        description="Answers about FLESHLAB's gay fanclub, verified 18+ performer applications, Asian creator revenue splits, guest productions, payments, and content policies."
        canonical="/faq"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={faqJsonLd}
      />

      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">

        {/* ── Hero ── */}
        <section className="relative py-20 px-4 border-b border-white/8">
          <div className="max-w-[1280px] mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/40">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
              FREQUENTLY <span className="text-rose-500">ASKED</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Everything you need to know about FLESHLAB — the gay adult studio platform for fans, performers, and collaborators.
            </p>
          </div>
        </section>

        {/* ── Intro / SEO text ── */}
        <section className="py-14 px-4 border-b border-white/8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-8 md:p-10">
              <h2 className="text-xl font-bold text-white mb-4">About FLESHLAB</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                FLESHLAB is an independent gay adult studio and content platform based in Southeast Asia. We produce original adult content featuring verified 18+ Asian and Filipino gay performers, operate a premium Fanclub membership program, and offer structured Guest Production opportunities for qualified participants. All content is produced ethically, with full consent documentation and age verification for every performer.
              </p>
              <p className="text-white/70 leading-relaxed mb-4">
                This FAQ page covers the most common questions from three audiences: <strong className="text-white">fans and viewers</strong> who want to access content or join the Fanclub; <strong className="text-white">performers and creators</strong> — including Filipino, Pinoy, and Asian gay performers — who want to apply or understand our revenue split models; and <strong className="text-white">Guest Production applicants</strong> who want to understand how our professional adult production participation program works.
              </p>
              <p className="text-white/70 leading-relaxed">
                For questions not covered here, contact us at{" "}
                <a href="mailto:info@fleshlab.online" className="text-rose-400 hover:text-rose-300 underline">
                  info@fleshlab.online
                </a>
                . We respond within 48 hours. You can also review our{" "}
                <Link to="/terms" className="text-rose-400 hover:text-rose-300 underline">Terms of Service</Link>,{" "}
                <Link to="/privacy" className="text-rose-400 hover:text-rose-300 underline">Privacy Policy</Link>,{" "}
                <Link to="/2257" className="text-rose-400 hover:text-rose-300 underline">2257 Records</Link>, and{" "}
                <Link to="/dmca" className="text-rose-400 hover:text-rose-300 underline">DMCA Policy</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section nav ── */}
        <nav className="py-8 px-4 border-b border-white/8 sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-3 justify-center">
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-rose-500/50 text-sm font-medium transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ── FAQ sections ── */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            <FAQSection section={sections[0]} ctaKey="fans" />
            <FAQSection section={sections[1]} ctaKey="performers" />
            <FAQSection section={sections[2]} ctaKey="guest" />
            <FAQSection section={sections[3]} ctaKey="trust" />
          </div>
        </section>

        {/* ── Contact CTA ── */}
        <section className="py-20 px-4 bg-[#0f0f0f] border-t border-white/8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              STILL HAVE <span className="text-rose-500">QUESTIONS</span>?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Reach us at{" "}
              <a href="mailto:info@fleshlab.online" className="text-rose-400 hover:text-rose-300 underline">
                info@fleshlab.online
              </a>{" "}
              — we typically respond within 48 hours.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/videos" className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors">Browse Videos</Link>
              <Link to="/become-performer" className="px-6 py-3 rounded-xl border border-white/20 hover:border-rose-500/50 text-white font-bold text-sm transition-colors">Apply as Performer</Link>
              <Link to="/guest-production" className="px-6 py-3 rounded-xl border border-white/20 hover:border-rose-500/50 text-white font-bold text-sm transition-colors">Guest Production</Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}