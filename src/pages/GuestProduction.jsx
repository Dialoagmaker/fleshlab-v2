import { Link } from "react-router-dom";
import { Users, Film, FileText, CheckCircle, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAccessControl, PRICING } from "@/lib/useAccessControl";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";

export default function GuestProduction() {
  const { isAuthenticated } = useAuth();
  const { requireSignup } = useAccessControl();
  
  const handleApply = () => {
    requireSignup('/guest-production');
  };
  return (
    <>
      <SEOMeta
        title="Gay Adult Guest Production | FLESHLAB Studios"
        description="Professional 18+ guest performer participation in FLESHLAB Studios productions. Verified applicants, compatibility review, contracts, and studio-controlled filming."
        canonical="/guest-production"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "FLESHLAB Studios Guest Production",
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
              <Button size="lg" onClick={handleApply} className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-8 py-6 rounded-full text-base h-auto shadow-xl shadow-rose-600/50">
                {isAuthenticated ? 'Request Guest Production Quote' : 'Create Account to Apply'}
              </Button>
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

        {/* Pricing */}
        <section className="py-20 px-4 bg-[#0f0f0f] border-y border-white/8">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-4">
              PRODUCTION <span className="text-rose-500">PRICING</span>
            </h2>
            <p className="text-xl text-white/60 text-center mb-12 max-w-3xl mx-auto">
              Professional studio productions with full compliance, safety protocols, and performer coordination
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Starting Price Card */}
              <div className="bg-[#0a0a0a] border border-rose-600/30 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-rose-600/20 rounded-xl flex items-center justify-center">
                    <Film className="w-6 h-6 text-rose-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Guest Production</h3>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-black text-white">$999</span>
                    <span className="text-white/60 text-lg">starting</span>
                  </div>
                  <p className="text-white/60 text-sm">
                    Final quote depends on production scope, compliance, filming time, performer compatibility and post-production.
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {['Studio-controlled filming', '18+ verification required', 'Performer compatibility review', 'Legal contracts & releases', 'Safety protocols', 'Professional post-production'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-rose-600/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-white/80 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/become-performer">
                  <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl">
                    Request Quote
                  </Button>
                </Link>
              </div>
              
              {/* What's Included Card */}
              <div className="bg-[#0a0a0a] border border-white/8 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">What's Included</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Pre-production consultation', desc: 'Scope review and planning' },
                    { label: 'Performer coordination', desc: 'Compatibility matching' },
                    { label: 'Legal documentation', desc: 'Contracts and releases' },
                    { label: 'Professional filming', desc: 'Studio or location' },
                    { label: 'Post-production', desc: 'Editing and finishing' },
                    { label: 'Compliance verification', desc: '2257 and age verification' }
                  ].map((item, idx) => (
                    <div key={idx} className="border-b border-white/5 pb-3 last:border-0">
                      <p className="text-white font-semibold text-sm mb-1">{item.label}</p>
                      <p className="text-white/50 text-xs">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Important Notice */}
            <div className="mt-12 bg-amber-600/10 border border-amber-600/30 rounded-xl p-6 max-w-3xl mx-auto">
              <p className="text-amber-200 text-sm leading-relaxed">
                <strong className="font-bold">Important:</strong> Guest Production inquiries start from $999. Application, 18+ verification, studio approval and performer approval required. Final quote depends on production scope, compliance, filming time, performer compatibility and post-production. This is a professional studio program — not a dating, hookup, or escort service.
              </p>
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
            <Button size="lg" onClick={handleApply} className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-10 py-6 rounded-full text-lg h-auto shadow-xl shadow-rose-600/50">
              {isAuthenticated ? 'Submit Application' : 'Create Account to Apply'}
            </Button>
            {!isAuthenticated && (
              <p className="text-white/50 text-sm mt-4">
                Account required before application
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}