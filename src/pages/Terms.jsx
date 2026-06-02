import SEOMeta from "@/components/SEOMeta";

export default function Terms() {
  return (
    <>
      <SEOMeta
        title="Terms of Service - FLESHLAB"
        description="Terms of Service for FLESHLAB studio. Rules and guidelines for using FLESHLAB website and services."
        canonical="/terms"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "FLESHLAB Terms of Service"
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
        <section className="py-20 px-4 border-b border-white/8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
              TERMS OF <span className="text-rose-500">SERVICE</span>
            </h1>
            <p className="text-white/60 text-sm">Last updated: June 2, 2026</p>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto space-y-8 text-white/70 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>By accessing and using FLESHLAB (the "Site"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, do not use this Site.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Age Restriction</h2>
              <p>This Site contains adult content intended for viewers 18 years of age or older. By using this Site, you confirm that you are at least 18 years old or the age of majority in your jurisdiction. All performers depicted are verified 18+ at time of production.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Account Registration</h2>
              <p>To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Content Access</h2>
              <p>Public previews are available free. Full-length videos, exclusive content, and premium features require Fanclub membership, PPV purchase, or subscription. Access rights are non-transferable and for personal viewing only.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Prohibited Conduct</h2>
              <p>You agree not to: (a) redistribute, sell, or commercially exploit Site content; (b) attempt to circumvent access restrictions; (c) use automated systems to access content; (d) share account credentials; (e) record, download, or distribute content without authorization.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Payment Terms</h2>
              <p>All payments are processed securely. Fanclub memberships and PPV purchases are non-refundable except as required by law. Prices may change with notice. You authorize recurring charges for subscription services until cancelled.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
              <p>All content on this Site is owned by FLESHLAB or licensed to us. You may not copy, modify, distribute, or create derivative works without express written permission.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">8. Termination</h2>
              <p>We reserve the right to terminate or suspend accounts for violations of these terms, fraudulent activity, or other misconduct at our sole discretion.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">9. Disclaimer</h2>
              <p>The Site is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access or error-free operation.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">10. Limitation of Liability</h2>
              <p>FLESHLAB shall not be liable for any indirect, incidental, or consequential damages arising from use of the Site to the maximum extent permitted by law.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
              <p>We may update these terms at any time. Continued use after changes constitutes acceptance of modified terms.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">12. Contact</h2>
              <p>For questions about these terms, contact us at info@fleshlab.online</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}