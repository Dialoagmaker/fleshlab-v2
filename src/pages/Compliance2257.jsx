import SEOMeta from "@/components/SEOMeta";

export default function Compliance2257() {
  return (
    <>
      <SEOMeta
        title="18 U.S.C. 2257 Compliance - FLESHLAB"
        description="18 U.S.C. 2257 compliance statement for FLESHLAB. All performers verified 18+ at time of production with records maintained as required by law."
        canonical="/2257"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "FLESHLAB 2257 Compliance"
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
        <section className="py-20 px-4 border-b border-white/8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
              18 U.S.C. <span className="text-rose-500">2257</span>
            </h1>
            <p className="text-white/60 text-sm">Compliance Statement</p>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto space-y-8 text-white/70 leading-relaxed">
            <div className="bg-[#0f0f0f] border border-white/8 p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-4">Compliance Notice</h2>
              <p className="text-lg text-white/80 mb-4">
                All performers depicted on this website were at least 18 years of age at the time of production.
              </p>
              <p className="text-white/70">
                FLESHLAB maintains 18 U.S.C. 2257 compliance records for all performers as required by law. These records include verified government-issued identification and age documentation.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Record Custodian</h2>
              <p>Records required by 18 U.S.C. 2257 are maintained by FLESHLAB and available for inspection by the Attorney General or authorized representatives.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Verification Process</h2>
              <p>All performers undergo rigorous age verification including:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Government-issued photo identification</li>
                <li>Age verification through approved third-party services</li>
                <li>Contract documentation with legal name verification</li>
                <li>Compliance records maintained per 18 U.S.C. 2257 requirements</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Performer Documentation</h2>
              <p>For each performer, FLESHLAB maintains:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Copy of government-issued ID showing date of birth</li>
                <li>Verification of legal name and any aliases used</li>
                <li>Dated records of all content production</li>
                <li>Signed contracts and release forms</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Legal Requirements</h2>
              <p>FLESHLAB complies with:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>18 U.S.C. 2257 - Record keeping requirements</li>
                <li>18 U.S.C. 2257A - Additional protections for sexually explicit content</li>
                <li>28 C.F.R. Part 75 - Implementing regulations</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
              <p>For 2257 compliance inquiries, contact: info@fleshlab.online</p>
              <p className="text-sm text-white/60 mt-4">
                This statement is provided in compliance with 18 U.S.C. 2257 and applicable regulations.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}