import SEOMeta from "@/components/SEOMeta";

export default function Imprint() {
  return (
    <>
      <SEOMeta
        title="Imprint / Legal Notice | FLESHLAB"
        description="Legal notice and imprint for FLESHLAB, operated by Dialogmakers International Ltd., Taiwan."
        canonical="/imprint"
        noIndex={true}
      />
      <div className="min-h-screen bg-[#080808] text-white">
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Imprint / Legal Notice</h1>
          <p className="text-white/40 text-sm mb-12 border-b border-white/8 pb-8">
            Information according to applicable legal disclosure requirements
          </p>

          <div className="space-y-10 text-sm leading-relaxed">

            <Section title="Operator of this website">
              <p className="font-semibold text-white">Dialogmakers International Ltd.</p>
              <p className="text-white/60">2F, No. 2-1, Lane 23, Wenhua St.</p>
              <p className="text-white/60">Taoyuan City, Taoyuan, 324010</p>
              <p className="text-white/60">Taiwan</p>
            </Section>

            <Section title="Company No.">
              <p className="text-white/75">83273694</p>
            </Section>

            <Section title="Registered in">
              <p className="text-white/75">Taiwan</p>
            </Section>

            <Section title="Authorized Management">
              <p className="text-white/75">Chao Ching Hsu — Director</p>
              <p className="text-white/75">Eric Rönnau — Managing Director</p>
            </Section>

            <Section title="Contact">
              <p className="text-white/75">
                Email:{" "}
                <a href="mailto:studiosupport@fleshlab.online" className="text-rose-400 hover:text-rose-300 underline underline-offset-2">
                  studiosupport@fleshlab.online
                </a>
              </p>
              <p className="text-white/75">
                Website:{" "}
                <a href="https://www.fleshlab.online" className="text-rose-400 hover:text-rose-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                  https://www.fleshlab.online
                </a>
              </p>
            </Section>

            <Section title="Platform / Brand">
              <p className="text-white/60">
                FLESHLAB is an online adult digital media and entertainment platform operated by Dialogmakers International Ltd.
              </p>
            </Section>

            <Section title="Adult Content Notice">
              <p className="text-white/60">
                This website contains adult-oriented content and is intended only for users who are at least 18 years old or the age of majority in their jurisdiction.
              </p>
            </Section>

            <Section title="Compliance">
              <p className="text-white/60">
                All performers appearing in FLESHLAB productions are required to be verified adults. Performer consent, production documentation, release forms and applicable compliance records are maintained by the operator.
              </p>
            </Section>

            <Section title="Copyright / Rights">
              <p className="text-white/60">
                All content, trademarks, images, videos and media published on this website are owned by or licensed to Dialogmakers International Ltd. / FLESHLAB unless otherwise stated. Unauthorized copying, redistribution, uploading or commercial use is prohibited.
              </p>
            </Section>

            <Section title="Abuse / Takedown Contact">
              <p className="text-white/60">
                For copyright, abuse, privacy or takedown requests, please contact:{" "}
                <a href="mailto:studiosupport@fleshlab.online" className="text-rose-400 hover:text-rose-300 underline underline-offset-2">
                  studiosupport@fleshlab.online
                </a>
              </p>
            </Section>

            <Section title="Dispute Resolution">
              <p className="text-white/60">
                We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board, unless legally required.
              </p>
            </Section>

          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-b border-white/6 pb-8">
      <h2 className="text-xs font-bold tracking-widest text-white/30 uppercase mb-3">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}