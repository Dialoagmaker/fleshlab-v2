import { Link } from "react-router-dom";
import { Users, Film, FileText, CheckCircle } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";

export default function GuestProduction() {
  return (
    <>
      <SEOMeta
        title="FLESHLAB Guest Production Program"
        description="Professional 18+ guest performer participation in FLESHLAB studio productions. Verified applicants, compatibility review, contracts, and studio-controlled filming."
        canonical="/guest-production"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "FLESHLAB Guest Production",
          "description": "Guest performer production program"
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
        {/* Hero */}
        <section className="relative py-20 px-4 border-b border-white/8">
          <div className="max-w-[1280px] mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/50">
              <Film className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
              GUEST <span className="text-rose-500">PRODUCTION</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
              Professional 18+ guest performer participation in FLESHLAB studio productions. Studio-controlled filming with full consent and safety protocols.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/become-performer">
                <Button size="lg" className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-6 rounded-full text-base h-auto shadow-xl shadow-rose-600/50">
                  Apply for Guest Production
                </Button>
              </Link>
              <Link to="/faq">
                <Button size="lg" variant="outline" className="border-2 border-white/40 text-white hover:bg-white/15 font-bold px-8 py-6 rounded-full text-base h-auto backdrop-blur-sm">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 px-4">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-12">
              PRODUCTION <span className="text-rose-500">PROCESS</span>
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  icon: FileText,
                  title: "Application",
                  desc: "Submit guest production application with ID verification."
                },
                {
                  icon: CheckCircle,
                  title: "Compatibility Review",
                  desc: "Studio reviews compatibility with existing performers and productions."
                },
                {
                  icon: FileText,
                  title: "Contracts & Releases",
                  desc: "Legal contracts, model releases, and consent forms completed."
                },
                {
                  icon: Film,
                  title: "Studio Production",
                  desc: "Professional filming under studio supervision and safety protocols."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#0f0f0f] border border-white/8 p-6 rounded-2xl">
                  <item.icon className="w-10 h-10 text-rose-500 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-white/60 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-20 px-4 bg-[#0f0f0f] border-y border-white/8">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-12">
              REQUIREMENTS
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Verified 18+ Age</h4>
                    <p className="text-white/60 text-sm">Government ID and age verification required.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Compatibility Review</h4>
                    <p className="text-white/60 text-sm">Must be compatible with studio performers and production styles.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Legal Documentation</h4>
                    <p className="text-white/60 text-sm">Contracts, releases, and consent forms must be completed.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Studio Approval</h4>
                    <p className="text-white/60 text-sm">Final approval by studio management required.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Production Scope</h4>
                    <p className="text-white/60 text-sm">Studio-controlled productions only. No independent services.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Safety Protocols</h4>
                    <p className="text-white/60 text-sm">All safety and consent requirements must be met.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-[#0f0f0f] border border-white/8 p-8 rounded-2xl">
              <h2 className="text-3xl font-black text-white mb-4">
                IMPORTANT NOTICE
              </h2>
              <p className="text-white/70 leading-relaxed mb-4">
                FLESHLAB Guest Production is a professional studio program for verified 18+ performers to participate in studio-controlled productions. This is not a dating, hookup, or escort service. All productions are professionally filmed under studio supervision with full consent documentation and safety protocols.
              </p>
              <p className="text-white/70 leading-relaxed">
                Pricing is for production services only. All participants must complete legal documentation and receive studio approval before any filming.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              INTERESTED IN <span className="text-rose-500">PARTICIPATING</span>?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Submit your application for guest production consideration.
            </p>
            <Link to="/become-performer">
              <Button size="lg" className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-6 rounded-full text-lg h-auto shadow-xl shadow-rose-600/50">
                Submit Application
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}