import SEOMeta from "@/components/SEOMeta";

const FAQ_CATEGORIES = [
  {
    category: "About Fleshlab Studios",
    faqs: [
      {
        q: "What is Fleshlab Studios?",
        a: "Fleshlab Studios is a premium gay adult creator network specializing in verified Asian male performers. We produce original studio content, manage creator fanclubs, and operate a curated video library with verified 18+ performers.",
      },
      {
        q: "What kind of content does Fleshlab Studios produce?",
        a: "We produce premium gay adult content including solo series, studio-directed scenes, partner productions, and creator-managed fanclub content. All content features verified performers and is produced under professional safety and consent standards.",
      },
      {
        q: "Is Fleshlab Studios an amateur tube site?",
        a: "No. Fleshlab Studios is a curated creator network and production studio, not a user-generated tube site. Every piece of content is produced by verified performers with documented consent and studio compliance standards.",
      },
    ],
  },
  {
    category: "Videos and Content",
    faqs: [
      {
        q: "Is content on Fleshlab Studios free to watch?",
        a: "Selected trailers and preview clips are available free. Full scenes are available through fanclub memberships or pay-per-view. Access tiers are clearly labeled on every video.",
      },
      {
        q: "What video quality does Fleshlab Studios offer?",
        a: "Studio productions are available in HD and 4K depending on the production. We maintain consistent quality standards across our library with professional production values.",
      },
      {
        q: "How often is new content released?",
        a: "New content is released weekly across the library. Fanclub subscribers typically receive exclusive early-access content on a more frequent schedule depending on the performer.",
      },
      {
        q: "Can I download videos from Fleshlab Studios?",
        a: "Download options depend on the content tier and individual performer settings. PPV and fanclub content may include download rights. Check individual content listings for download availability.",
      },
    ],
  },
  {
    category: "Performers and Creators",
    faqs: [
      {
        q: "Who are Fleshlab Studios performers?",
        a: "Fleshlab Studios works with verified Asian male performers — primarily from the Philippines, Southeast Asia, and the broader Asia-Pacific region. All performers are 18+ identity verified and professionally managed.",
      },
      {
        q: "How are performers verified?",
        a: "Every performer provides government-issued identification for age and identity verification. They sign model release agreements and complete compliance requirements before any content is published under their name.",
      },
      {
        q: "Can I interact directly with performers?",
        a: "Select performers offer direct messaging and interaction through their fanclub. This varies by performer and is listed on their individual profile page.",
      },
    ],
  },
  {
    category: "Fanclub and Subscriptions",
    faqs: [
      {
        q: "What is a Fleshlab Studios fanclub?",
        a: "A fanclub is a performer's private subscription channel. Members get exclusive access to content not available in the public library — private series, behind-the-scenes content, early releases, and sometimes direct performer messaging.",
      },
      {
        q: "How do I join a performer's fanclub?",
        a: "Visit the performer's profile page and select the fanclub join option. Fanclubs are billed monthly and can be cancelled at any time. Each performer sets their own fanclub content schedule.",
      },
    ],
  },
  {
    category: "Become a Performer",
    faqs: [
      {
        q: "Can I apply to become a Fleshlab Studios performer?",
        a: "Yes. Fleshlab Studios accepts applications from male creators 18+. We welcome gay, bisexual, and queer creators from Southeast Asia and beyond. Visit our Become a Performer page to apply.",
      },
      {
        q: "Do I need professional equipment or experience to apply?",
        a: "No prior experience or professional equipment is required. Many performers start with just a smartphone. Fleshlab Studios provides guidance, strategy, and production support as your creator career develops.",
      },
      {
        q: "Is my personal information kept confidential if I apply?",
        a: "Yes. All applications are handled confidentially. Your identity documents are used only for age and identity verification and are never made public. Only authorized staff access application data.",
      },
    ],
  },
  {
    category: "Safety, Consent and Compliance",
    faqs: [
      {
        q: "How does Fleshlab Studios handle performer consent?",
        a: "Performer consent is documented before each production and is ongoing — performers can withdraw consent and request content removal at any time. Model release agreements are required for all published content.",
      },
      {
        q: "Are all performers verified as 18 or older?",
        a: "Yes. Age verification is mandatory and enforced before any content is published. Government-issued ID is required from every performer. Fleshlab Studios maintains compliance records for all published content.",
      },
    ],
  },
  {
    category: "Account and Support",
    faqs: [
      {
        q: "How do I contact Fleshlab Studios support?",
        a: "For support, use the contact options available on our site. Performer-specific support requests can be submitted through the performer portal. We aim to respond to all support requests within 48 hours.",
      },
      {
        q: "What do I do if content is posted without my consent?",
        a: "Contact Fleshlab Studios support immediately. We take content consent violations seriously. All takedown requests are reviewed urgently and actioned under our consent and compliance policy.",
      },
    ],
  },
];

const allFaqs = FAQ_CATEGORIES.flatMap(c => c.faqs);

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": allFaqs.map(f => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a },
  })),
};

export default function FAQ() {
  return (
    <>
      <SEOMeta
        title="FAQ — Fleshlab Studios | Common Questions Answered"
        description="Find answers to common questions about Fleshlab Studios — content, performers, fanclubs, becoming a creator, safety standards, and account support."
        canonical="https://fleshlab.online/faq"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        ogType="website"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border bg-card/30 py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-4">Help Center</p>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-6 leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Common questions about Fleshlab Studios — for fans, performers, creators, and anyone curious about how we operate.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-16 space-y-14">
          {FAQ_CATEGORIES.map((cat) => (
            <section key={cat.category}>
              <h2 className="text-lg font-bold text-foreground mb-5 pb-3 border-b border-border">
                {cat.category}
              </h2>
              <div className="space-y-3">
                {cat.faqs.map((faq) => (
                  <details key={faq.q} className="group bg-card border border-border rounded-xl">
                    <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-semibold text-foreground text-sm list-none gap-4">
                      <span>{faq.q}</span>
                      <span className="text-muted-foreground group-open:rotate-180 transition-transform shrink-0 text-lg leading-none">↓</span>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          {/* CTA */}
          <section className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
            <h3 className="font-bold text-foreground mb-2">Still have questions?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Learn more about how we operate or apply to become a performer.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="/how-it-works" className="bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
                How It Works
              </a>
              <a href="/become-performer" className="border border-border text-foreground font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-muted transition-colors">
                Become a Performer
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}