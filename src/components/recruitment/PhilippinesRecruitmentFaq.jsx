import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

export const PHILIPPINES_RECRUITMENT_FAQ = [
  {
    q: "Do I need previous experience?",
    a: "No. The current FLESHLAB creator paths include beginners starting with a phone, as well as existing creators, cam models, couple creators and fanclub creators. Every applicant is reviewed individually."
  },
  {
    q: "Who can apply?",
    a: "Verified 18+ applicants in the Philippines may apply for review. The page describes beginner, existing creator, cam model, couple creator and fanclub creator paths. All participants must complete 18+ verification before any content is approved."
  },
  {
    q: "Can I create from home?",
    a: "Yes. The Philippines page supports starting from home with a phone, private room, good lighting and stable internet where appropriate for review and remote creator work."
  },
  {
    q: "Is this remote, on-location, or both?",
    a: "The current Philippines page supports remote/from-home creator work and setup. Production planning can be discussed later, but the page does not promise one fixed location format for every applicant."
  },
  {
    q: "What happens after I apply?",
    a: "The visible process is: apply, verify 18+, choose a creator model, set up a profile, then publish and grow only after review, contract and approval. Not all applicants are accepted."
  },
  {
    q: "What information is required during verification?",
    a: "The visible application asks for basic profile details, contact details, country and city, creator interests, role, preferred model, review photos and videos, a government ID document, a selfie holding ID, and consent confirmations."
  },
  {
    q: "How is privacy handled?",
    a: "The page states that applications are private, uploads are confidential, boundaries matter, and nothing is published without direct approval, contract and consent."
  },
  {
    q: "How do payouts work?",
    a: "The Philippines page says payout methods are confirmed during onboarding and may include local options such as GCash, Maya, bank options or crypto where available. Earnings vary and are not guaranteed."
  },
  {
    q: "Can I ask questions before applying?",
    a: "Yes. The page provides WhatsApp contact options so applicants can ask questions first with no pressure."
  }
];

export default function PhilippinesRecruitmentFaq({ onWhatsAppClick }) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #03120b 0%, #07030d 100%)" }}>
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-black uppercase tracking-widest text-rose-400" style={{ background: "rgba(255,45,111,0.1)", border: "1px solid rgba(255,45,111,0.35)" }}>
            Questions before applying
          </div>
          <h2 className="font-black text-white mb-3 leading-tight" style={{ fontSize: "clamp(30px, 5vw, 46px)" }}>
            Clear answers for Filipino creator applicants
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The application is private, reviewed by the team, and built around verified 18+ creators only.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {PHILIPPINES_RECRUITMENT_FAQ.map((item) => (
            <article key={item.q} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 className="text-white font-black text-base mb-2">{item.q}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" style={{ background: "rgba(255,45,111,0.08)", border: "1px solid rgba(255,45,111,0.22)" }}>
          <div>
            <p className="text-white font-bold">Want to read the rules first?</p>
            <p className="text-gray-400 text-sm mt-1">
              Review the <Link to="/privacy" className="text-rose-300 hover:text-white">privacy policy</Link>, <Link to="/2257" className="text-rose-300 hover:text-white">2257 compliance</Link>, <Link to="/compliance" className="text-rose-300 hover:text-white">compliance center</Link> and <Link to="/faq" className="text-rose-300 hover:text-white">FAQ</Link>.
            </p>
          </div>
          <button type="button" onClick={() => onWhatsAppClick?.("faq_ask_first")} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5" style={{ background: "#25D366", boxShadow: "0 0 20px rgba(37,211,102,0.35)" }}>
            <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
}