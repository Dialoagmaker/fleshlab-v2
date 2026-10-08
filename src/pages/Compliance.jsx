import SEOMeta from "@/components/SEOMeta";

const items = [
  ["Adults-only access", "FLESHLAB is intended exclusively for adults aged 18 or older."],
  ["RTA labeling", "The site uses the Restricted to Adults technical label and visible RTA badge for adult-site identification."],
  ["Performer verification", "Performers depicted on FLESHLAB are documented as adults at the time of production."],
  ["Consent documentation", "Production records include performer documentation and release records maintained for compliance review."],
  ["Content reporting", "Reports about content, privacy, or legal concerns are reviewed through the published takedown process."],
  ["DMCA process", "Copyright owners can submit DMCA notices through the published DMCA policy."],
  ["Privacy and security", "FLESHLAB publishes privacy and security practices for account, payment, and platform data."],
];

export default function Compliance() {
  return (
    <>
      <SEOMeta title="Compliance - FLESHLAB" description="FLESHLAB adult access, RTA labeling, performer verification, consent documentation, DMCA, privacy and security compliance overview." canonical="/compliance" />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
        <section className="border-b border-white/8 px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">Trust & Compliance</p>
            <h1 className="text-5xl font-black text-white md:text-6xl">RESTRICTED <span className="text-rose-500">TO ADULTS</span></h1>
            <p className="mt-6 max-w-2xl text-white/64">FLESHLAB is an adults-only platform. This page summarizes the public policies and compliance notices that support responsible access and content governance.</p>
          </div>
        </section>
        <section className="px-4 py-20">
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            {items.map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-white/8 bg-[#0f0f0f] p-6">
                <h2 className="text-lg font-black uppercase text-white">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/64">{body}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-white/8 bg-black/30 p-6 text-sm leading-6 text-white/60">
            <p>Related policies: <a href="/2257" className="text-white underline underline-offset-4 hover:text-[#E51D2A]">2257 Compliance</a>, <a href="/dmca" className="text-white underline underline-offset-4 hover:text-[#E51D2A]">DMCA Policy</a>, and <a href="/privacy" className="text-white underline underline-offset-4 hover:text-[#E51D2A]">Privacy Policy</a>.</p>
          </div>
        </section>
      </div>
    </>
  );
}