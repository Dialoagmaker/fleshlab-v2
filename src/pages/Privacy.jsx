import SEOMeta from "@/components/SEOMeta";

export default function Privacy() {
  return (
    <>
      <SEOMeta
        title="Privacy Policy - FLESHLAB"
        description="Privacy Policy for FLESHLAB studio. How we collect, use, and protect your personal information."
        canonical="/privacy"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "FLESHLAB Privacy Policy"
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
        <section className="py-20 px-4 border-b border-white/8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
              PRIVACY <span className="text-rose-500">POLICY</span>
            </h1>
            <p className="text-white/60 text-sm">Last updated: June 2, 2026</p>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto space-y-8 text-white/70 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              <p>We collect information you provide directly: email address, payment information, account preferences, and communication history. We also collect usage data such as pages viewed and content accessed.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Information</h2>
              <p>We use collected information to: provide services, process payments, send account notifications, improve user experience, prevent fraud, and comply with legal obligations.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Information Sharing</h2>
              <p>We do not sell personal information. We share data only with: payment processors for transactions, service providers for site operation, and as required by law.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect personal information. However, no internet transmission is completely secure.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Cookies</h2>
              <p>We use cookies and similar technologies to enhance user experience, analyze site traffic, and personalize content. You can control cookie settings through your browser.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Third-Party Links</h2>
              <p>Our Site may contain links to external sites. We are not responsible for privacy practices of third parties. Review their privacy policies separately.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
              <p>We retain personal information as long as necessary to provide services, comply with legal obligations, and resolve disputes. You may request deletion subject to legal requirements.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">8. Your Rights</h2>
              <p>Depending on your location, you may have rights to: access personal data, correct inaccuracies, delete data, restrict processing, and data portability. Contact info@fleshlab.online to exercise rights.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">9. Age Verification</h2>
              <p>We verify all users are 18+ before providing access to adult content. This may require collecting age verification information from performers and in certain jurisdictions, viewers.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">10. International Transfers</h2>
              <p>Personal information may be transferred to and processed in countries other than your residence. We ensure appropriate safeguards for such transfers.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Policy</h2>
              <p>We may update this Privacy Policy. Material changes will be notified via Site notice or email. Continued use after changes constitutes acceptance.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
              <p>For privacy questions or concerns, contact us at info@fleshlab.online</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}