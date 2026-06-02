import { Link } from "react-router-dom";
import { Play, Users, FileText, HelpCircle } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";

export default function HowItWorks() {
  return (
    <>
      <SEOMeta
        title="How FLESHLAB Works"
        description="Learn how FLESHLAB studio operates. Browse public previews, join fanclub, apply as performer, or participate in guest productions. Verified 18+ content."
        canonical="/how-it-works"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "How FLESHLAB Works",
          "description": "Studio operations and access guide"
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
              HOW <span className="text-rose-500">FLESHLAB</span> WORKS
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Your complete guide to accessing FLESHLAB content, becoming a performer, and understanding our studio operations.
            </p>
          </div>
        </section>

        {/* Main Sections */}
        <section className="py-20 px-4">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Browse Content */}
              <div className="bg-[#0f0f0f] border border-white/8 p-8 rounded-2xl">
                <Play className="w-12 h-12 text-rose-500 mb-4" />
                <h2 className="text-2xl font-black text-white mb-4">Browse Public Content</h2>
                <p className="text-white/70 mb-6">
                  Watch free public previews of all studio content. No account required. Browse by videos, performers, or categories.
                </p>
                <ul className="space-y-2 mb-6 text-white/60">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Free public previews
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    No registration needed
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    HD quality trailers
                  </li>
                </ul>
                <Link to="/videos">
                  <Button className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600">
                    Browse Videos
                  </Button>
                </Link>
              </div>

              {/* Fanclub Access */}
              <div className="bg-[#0f0f0f] border border-white/8 p-8 rounded-2xl">
                <Users className="w-12 h-12 text-rose-500 mb-4" />
                <h2 className="text-2xl font-black text-white mb-4">Join Fanclub</h2>
                <p className="text-white/70 mb-6">
                  Unlock full-length scenes, exclusive content, and member-only productions with Fanclub membership.
                </p>
                <ul className="space-y-2 mb-6 text-white/60">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Full-length HD videos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Exclusive behind-the-scenes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Member-only productions
                  </li>
                </ul>
                <Link to="/fanclub">
                  <Button className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600">
                    Learn About Fanclub
                  </Button>
                </Link>
              </div>

              {/* Become Performer */}
              <div className="bg-[#0f0f0f] border border-white/8 p-8 rounded-2xl">
                <Users className="w-12 h-12 text-rose-500 mb-4" />
                <h2 className="text-2xl font-black text-white mb-4">Become a Performer</h2>
                <p className="text-white/70 mb-6">
                  Asian gay/bi/queer creators wanted. Build your brand, create content, and earn revenue with FLESHLAB.
                </p>
                <ul className="space-y-2 mb-6 text-white/60">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Professional productions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Revenue sharing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Verified 18+ only
                  </li>
                </ul>
                <Link to="/become-performer">
                  <Button className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600">
                    Apply Now
                  </Button>
                </Link>
              </div>

              {/* Guest Production */}
              <div className="bg-[#0f0f0f] border border-white/8 p-8 rounded-2xl">
                <FileText className="w-12 h-12 text-rose-500 mb-4" />
                <h2 className="text-2xl font-black text-white mb-4">Guest Production</h2>
                <p className="text-white/70 mb-6">
                  Professional 18+ guest performer participation in studio productions with full consent and safety protocols.
                </p>
                <ul className="space-y-2 mb-6 text-white/60">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Studio-controlled filming
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Legal documentation required
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    Compatibility review
                  </li>
                </ul>
                <Link to="/guest-production">
                  <Button className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Process Flow */}
        <section className="py-20 px-4 bg-[#0f0f0f] border-y border-white/8">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-12">
              STUDIO <span className="text-rose-500">PROCESS</span>
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "01", title: "Application", desc: "Submit application with verification" },
                { step: "02", title: "Review", desc: "Studio reviews compatibility" },
                { step: "03", title: "Contracts", desc: "Legal documentation completed" },
                { step: "04", title: "Production", desc: "Professional studio filming" }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="text-6xl font-black text-rose-500/20 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              HAVE <span className="text-rose-500">QUESTIONS</span>?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Check our FAQ for answers to common questions about FLESHLAB.
            </p>
            <Link to="/faq">
              <Button size="lg" variant="outline" className="border-2 border-white/40 text-white hover:bg-white/15 font-bold px-8 py-6 rounded-full text-base h-auto backdrop-blur-sm">
                View FAQ
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}