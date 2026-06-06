import { Link } from "react-router-dom";
import { Check } from "lucide-react";

export default function BPSuccessScreen({ firstName, lastName, email }) {
  const fullName = `${firstName} ${lastName}`.trim();
  const waText = `Hi, this is ${fullName}. I submitted my FLESHLAB performer application. My email is ${email}. Please confirm my application.`;
  const waUrl = `https://wa.me/886958679186?text=${encodeURIComponent(waText)}`;

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center space-y-7">

        {/* Check */}
        <div className="w-20 h-20 rounded-full bg-rose-600/12 border-2 border-rose-600/30 flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-rose-400" />
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">Application submitted successfully.</h1>
          <p className="text-white/55 text-base leading-relaxed">
            Thank you for applying to become a FLESHLAB performer. Your application has been received and will be reviewed by our team within <strong className="text-white">48 business hours</strong>.
          </p>
        </div>

        {/* What happens next */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-left space-y-3">
          <div className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-4">What happens next</div>
          {[
            "We review your profile and uploaded media",
            "If approved, we contact you with next steps",
            "You receive a contract for review and signature",
            "After signing, you receive performer dashboard access",
            "Your public profile goes live after approval and publishing consent",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-rose-600/20 border border-rose-600/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-rose-400 text-[10px] font-black">{i + 1}</span>
              </div>
              <span className="text-white/55 text-sm">{step}</span>
            </div>
          ))}
        </div>

        {/* WhatsApp */}
        <div className="bg-gradient-to-br from-[#0d1a0d] to-[#0a0f0a] border border-emerald-700/30 rounded-2xl p-6 text-left space-y-4">
          <div className="text-white/30 text-[10px] font-black uppercase tracking-widest">To speed up your review</div>
          <p className="text-white/55 text-sm leading-relaxed">
            Contact our management team directly on WhatsApp to confirm your application.
          </p>
          <div className="text-white/40 text-xs">
            <div className="font-bold text-white/60 mb-0.5">Eric Roennau</div>
            <div>Head of Management · +886 958 679 186</div>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.122 1.524 5.855L.057 23.428a.75.75 0 0 0 .914.914l5.573-1.467A11.948 11.948 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.67-.497-5.207-1.368l-.372-.215-3.862 1.016 1.016-3.724-.234-.383A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Message Eric on WhatsApp
          </a>
          <p className="text-white/20 text-xs leading-relaxed">
            Please mention your name or the email address used in your application. Clicking WhatsApp does not replace the formal application — all applicants must still complete age verification, identity verification and compliance checks before production work is approved.
          </p>
        </div>

        <Link to="/" className="inline-block text-white/30 hover:text-white/60 text-sm transition-colors">
          ← Back to FLESHLAB
        </Link>
      </div>
    </div>
  );
}