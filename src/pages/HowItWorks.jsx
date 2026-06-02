import SEOMeta from "@/components/SEOMeta";

const FAQS = [
  {
    q: "Is Fleshlab Studios free to watch?",
    a: "Selected preview content and trailers are available free. Full scenes, exclusive studio productions, and fanclub content require access. We offer fanclub memberships and PPV options depending on the performer and content type.",
  },
  {
    q: "How are Fleshlab Studios performers verified?",
    a: "Every performer on Fleshlab Studios is 18+ verified through identity and age verification before any content is published. Performers provide government-issued ID and sign professional model release agreements. No content is published without verified consent.",
  },
  {
    q: "What is a Fleshlab Studios fanclub?",
    a: "A fanclub is a performer's private content subscription. Members get early access to new releases, exclusive scenes not published publicly, behind-the-scenes content, and sometimes direct messaging access to the performer.",
  },
  {
    q: "How does content production work at Fleshlab Studios?",
    a: "Fleshlab Studios operates as both a production studio and a creator management network. We work with verified performers on studio productions, solo creator content, and managed amateur series. Every production follows professional safety, consent, and compliance standards.",
  },
  {
    q: "What safety and consent standards does Fleshlab Studios enforce?",
    a: "All performers are age and identity verified, sign model release agreements, and can withdraw consent at any time. Medical compliance is required for partner content. Fleshlab Studios does not publish content without documented performer consent.",
  },
  {
    q: "How is Fleshlab Studios different from user-generated tube sites?",
    a: "Fleshlab Studios is a curated, verified production network — not a tube site. Every piece of content is produced by verified performers with documented consent, professional compliance standards, and studio support. We are not a content aggregator.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fleshlab.online/" },
      { "@type": "ListItem", "position": 2, "name": "How It Works", "item": "https://fleshlab.online/how-it-works" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  },
];

export default function HowItWorks() {
  return (
    <>
      <SEOMeta
        title="How Fleshlab Studios Works | Premium Gay Creator Network"
        description="Learn how Fleshlab Studios works — for fans, performers, and creators. Premium Asian twink content, verified performers, fanclub access, and professional production standards."
        canonical="https://fleshlab.online/how-it-works"
        ogImage="https://fleshlab.online/og-default.jpg"
        ogType="website"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border bg-card/30 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-4">About the Studio</p>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-6 leading-tight">
              How Fleshlab Studios Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Fleshlab Studios is a premium gay creator network built around verified Asian male performers,
              professional studio productions, and direct creator-to-fan access through fanclubs and exclusive content.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-16 space-y-20">

          {/* For Fans */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-primary/15 text-primary rounded-lg flex items-center justify-center text-sm font-black">01</span>
              For Fans and Viewers
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Free previews", body: "Browse trailers and preview clips from our video library without an account. Get a feel for the content and performers before committing to access." },
                { title: "Full scene access", body: "Full-length scenes are available through fanclub memberships or individual PPV. No hidden paywalls — every content tier is clearly labeled." },
                { title: "Fanclub subscriptions", body: "Subscribe directly to a performer's fanclub for recurring access to exclusive content, early releases, and behind-the-scenes material." },
                { title: "Direct performer access", body: "Select performers offer messaging and direct interaction through their fanclub. Real connections, not bots." },
              ].map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* For Performers */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-primary/15 text-primary rounded-lg flex items-center justify-center text-sm font-black">02</span>
              For Performers and Creators
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Professional management", body: "Fleshlab Studios provides full creator management — content strategy, branding, platform setup, promotion, and ongoing performance support." },
                { title: "Revenue sharing", body: "Performers earn a transparent split of all revenue generated from their content — fanclub subscriptions, scene sales, PPV, and platform deals." },
                { title: "Studio productions", body: "Qualified performers are selected for original studio productions — professionally shot, produced, and distributed across Fleshlab's network and partner platforms." },
                { title: "Fanclub infrastructure", body: "We build and manage your fanclub so you can focus on creating. Subscriber management, pricing, content scheduling, and analytics are handled for you." },
              ].map((item) => (
                <div key={item.title} className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Content Production */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-primary/15 text-primary rounded-lg flex items-center justify-center text-sm font-black">03</span>
              Content Production and Publishing
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Fleshlab Studios produces original content across three tiers: solo creator series (selfie-style or remotely directed),
              studio-directed productions (professionally shot with crew), and partner/guest productions (verified fans filming with performers under studio supervision).
              All content is reviewed, processed, and published with consistent quality standards before reaching the library.
            </p>
            <div className="bg-card border border-border rounded-xl p-6 grid sm:grid-cols-3 gap-6 text-center">
              {[
                { label: "Solo Creator Series", desc: "Performer-led, remotely directed with studio quality control" },
                { label: "Studio Productions", desc: "Professionally shot originals for the main Fleshlab library" },
                { label: "Guest Productions", desc: "Verified fans filming with performers under full studio compliance" },
              ].map((t) => (
                <div key={t.label}>
                  <p className="font-bold text-foreground mb-1 text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Fanclub model */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-primary/15 text-primary rounded-lg flex items-center justify-center text-sm font-black">04</span>
              Fanclub and Creator Access Model
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Each verified Fleshlab performer has the option to operate a private fanclub. Fanclub members access content
              that is never publicly available — private series, longer cuts, messaging access, and first-look releases.
              Fanclubs are priced per performer and renew monthly. Performers receive a direct share of all fanclub revenue.
              This model creates sustainable recurring income for creators and consistent exclusive access for fans.
            </p>
          </section>

          {/* Safety */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-primary/15 text-primary rounded-lg flex items-center justify-center text-sm font-black">05</span>
              Safety, Consent and Compliance
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Fleshlab Studios operates under strict age verification, consent documentation, and compliance standards.
              Every performer must:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              {[
                "Provide government-issued identification for age and identity verification",
                "Sign a model release agreement before any content is produced",
                "Complete medical compliance requirements for partner productions",
                "Confirm ongoing consent before each production",
                "Have the right to withdraw consent and request content removal at any time",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-primary mt-0.5">✓</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Why different */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-primary/15 text-primary rounded-lg flex items-center justify-center text-sm font-black">06</span>
              Why Fleshlab Studios Is Different
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "Verified performers only", body: "No unverified user submissions. Every performer is identity and age confirmed before a single frame is published." },
                { title: "Premium production focus", body: "We produce content with studio-level quality standards, not amateur uploads. Technical quality and performer presentation are both curated." },
                { title: "Direct creator economy", body: "Performers earn directly from their audience through fanclubs, PPV, and revenue shares — not opaque algorithmic payouts." },
              ].map((item) => (
                <div key={item.title} className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <h3 className="font-bold text-foreground mb-2 text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group bg-card border border-border rounded-xl">
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-foreground text-sm list-none">
                    {faq.q}
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform text-lg leading-none">↓</span>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}