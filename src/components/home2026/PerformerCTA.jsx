import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function PerformerCTA() {
  return (
    <section className="bg-[#070707] px-6 md:px-10 lg:px-16 py-24 md:py-32">
      <div className="max-w-[1600px] mx-auto rounded-[28px] bg-[#121212] border border-white/[0.08] p-8 md:p-14 lg:p-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div>
          <p className="text-[#D81F26] text-sm font-black uppercase tracking-[0.3em] mb-5">Become Performer</p>
          <h2 className="text-white text-5xl md:text-7xl font-black uppercase tracking-[-0.06em] leading-[0.9]">
            Make money.<br />Be yourself.
          </h2>
        </div>
        <div className="space-y-7">
          <p className="text-[#B0B0B0] text-lg md:text-xl leading-relaxed">
            Join a studio built for authentic amateur productions, simple onboarding and real performer-first visibility.
          </p>
          <Link to="/become-performer" className="h-[52px] px-6 rounded-[14px] bg-[#D81F26] text-white text-lg font-black inline-flex items-center justify-center gap-2 hover:bg-[#b91b21] transition-colors duration-200">
            Apply Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}