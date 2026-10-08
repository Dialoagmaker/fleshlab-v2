const STEPS = [
  { num: "01", title: "Apply privately", desc: "Tell us who you are and how we can contact you." },
  { num: "02", title: "Show us something of you", desc: "Upload photos and short explicit review videos so we can see your look, body, confidence and sexual energy." },
  { num: "03", title: "Verify you are real", desc: "Upload valid ID and a selfie with ID so we can confirm age and identity." },
  { num: "04", title: "We review your application", desc: "Our team checks your profile, uploads, potential and fit for FLESHLAB." },
  { num: "05", title: "We discuss your model", desc: "Managed Performer or Network Performer, depending on your experience, content and goals." },
  { num: "06", title: "Contract and consent", desc: "No publishing without agreement, release and consent." },
  { num: "07", title: "First production", desc: "We plan your first content, publish it and start building your catalog." },
  { num: "08", title: "Earnings tracking", desc: "Your revenue sources are tracked through videos, fanclub, PPV, livecam and platform performance." },
];

export default function BPHowItWorks({ onApplyClick }) {
  return (
    <section className="py-24 px-6 border-t border-white/6">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black mb-3 text-white">
            READY TO TURN YOUR SEX APPEAL<br />
            <span className="text-rose-500">INTO INCOME?</span>
          </h2>
          <p className="text-white/40 text-base">Here's what happens next.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {STEPS.map((step, i) => (
            <div key={i} className="bg-[#111] border border-white/8 rounded-2xl p-5 hover:border-rose-600/25 transition-colors">
              <div className="text-rose-600/40 font-black text-3xl mb-3">{step.num}</div>
              <div className="text-white font-bold text-base mb-2">{step.title}</div>
              <div className="text-white/40 text-sm leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onApplyClick}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-12 py-5 rounded-xl shadow-xl shadow-rose-700/40 text-lg uppercase tracking-wide transition-all"
          >
            Apply as Performer
          </button>
          <p className="text-white/25 text-xs mt-3">Private application · Reviewed within 48 hours · No obligation</p>
        </div>
      </div>
    </section>
  );
}