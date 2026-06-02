import SEOMeta from "@/components/SEOMeta";

export default function DMCA() {
  return (
    <>
      <SEOMeta
        title="DMCA & Takedown Requests - FLESHLAB"
        description="DMCA takedown process and copyright information for FLESHLAB. How to report copyright infringement or request content removal."
        canonical="/dmca"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "FLESHLAB DMCA Policy"
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
        <section className="py-20 px-4 border-b border-white/8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
              DMCA & <span className="text-rose-500">TAKEDOWN</span>
            </h1>
            <p className="text-white/60 text-sm">Digital Millennium Copyright Act Policy</p>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto space-y-8 text-white/70 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. DMCA Notice and Takedown Procedure</h2>
              <p>FLESHLAB respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). If you believe your copyrighted work has been infringed, please submit a DMCA notice.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. How to Submit a DMCA Notice</h2>
              <p>Send your DMCA notice to info@fleshlab.online with the following information:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Identification of the copyrighted work you claim is infringed</li>
                <li>Description of where the infringing material is located on our Site (provide URLs)</li>
                <li>Your full name, address, telephone number, and email address</li>
                <li>Statement that you have good faith belief the use is not authorized by the copyright owner</li>
                <li>Statement that information in the notice is accurate and you are authorized to act on behalf of the copyright owner</li>
                <li>Your physical or electronic signature</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Counter-Notice Procedure</h2>
              <p>If you believe content was removed in error, you may submit a counter-notice with: identification of removed material, statement under penalty of perjury of good faith belief in mistaken removal, your contact information, and consent to local federal court jurisdiction.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Repeat Infringers</h2>
              <p>FLESHLAB will terminate accounts of users who repeatedly infringe copyright in appropriate circumstances.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Other Takedown Requests</h2>
              <p>For non-copyright takedown requests (privacy concerns, performer requests, legal requirements), contact info@fleshlab.online with details. We review all requests and respond within 48 hours.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Processing Time</h2>
              <p>We process valid DMCA notices promptly. You will receive confirmation once your notice is received and action is taken.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">7. Contact</h2>
              <p>DMCA Agent: info@fleshlab.online</p>
              <p>For urgent matters, include "DMCA URGENT" in your subject line.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}