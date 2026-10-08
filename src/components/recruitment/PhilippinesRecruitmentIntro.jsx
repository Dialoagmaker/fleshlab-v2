import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, FileText, Shield, Users } from "lucide-react";

const creatorExamples = [
  { name: "Benvao", href: "/performers/benvao" },
  { name: "Josh", href: "/performers/josh" },
];

export default function PhilippinesRecruitmentIntro() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ paddingTop: "72px", paddingBottom: "56px", background: "#050505" }}>
      <div className="max-w-[1120px] mx-auto grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <div className="rounded-[28px] p-7 md:p-9" style={{ background: "linear-gradient(135deg, rgba(255,45,111,0.12), rgba(255,255,255,0.035))", border: "1px solid rgba(255,45,111,0.25)" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-black uppercase tracking-widest text-rose-400" style={{ background: "rgba(255,45,111,0.1)", border: "1px solid rgba(255,45,111,0.3)" }}>
            What is FLESHLAB?
          </div>
          <h2 className="text-white font-black leading-tight mb-4" style={{ fontSize: "clamp(30px, 5vw, 48px)" }}>
            A studio path for verified 18+ gay creators and performers.
          </h2>
          <p className="text-gray-300 leading-relaxed text-base md:text-lg">
            FLESHLAB works with verified 18+ adult creators and performers, including applicants in the Philippines. The studio supports creator paths across production, publishing, fanclub setup, promotion, distribution and monetization — with private review before anything is approved for public release.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              [Shield, "Verified 18+ review", "ID and consent checks protect creators and the platform."],
              [Users, "Beginner-friendly paths", "The current creator models include beginners with a phone and existing creators."],
              [BadgeCheck, "Remote-first intake", "Applicants can start from home with phone-shot review materials where appropriate."],
              [FileText, "Contracts before publishing", "No content goes live without approval, contract and consent."],
            ].map(([Icon, title, body]) => (
              <div key={title} className="rounded-2xl p-4" style={{ background: "rgba(0,0,0,0.26)", border: "1px solid rgba(255,255,255,0.09)" }}>
                <Icon className="h-5 w-5 text-rose-400 mb-3" />
                <h3 className="text-white font-bold text-sm mb-1">{title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] p-7 md:p-9 flex flex-col justify-between" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div>
            <p className="text-rose-400 text-xs font-black uppercase tracking-widest mb-4">Trust links</p>
            <div className="grid gap-3">
              {[
                ["Global performer application", "/become-performer"],
                ["Creator FAQ", "/faq"],
                ["2257 compliance", "/2257"],
                ["Privacy policy", "/privacy"],
                ["Compliance center", "/compliance"],
              ].map(([label, href]) => (
                <Link key={href} to={href} className="group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold text-white/78 transition hover:text-white" style={{ background: "rgba(0,0,0,0.24)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {label}
                  <ArrowRight className="h-4 w-4 text-rose-400 transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-gray-500 text-xs leading-relaxed mb-3">Creator examples are public profiles only and do not imply the same deal, work type or earnings for applicants.</p>
            <div className="flex flex-wrap gap-2">
              {creatorExamples.map((creator) => (
                <Link key={creator.href} to={creator.href} className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide text-rose-300 transition hover:text-white" style={{ background: "rgba(255,45,111,0.1)", border: "1px solid rgba(255,45,111,0.26)" }}>
                  {creator.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}