import SEOMeta from "@/components/SEOMeta";

const COOKIE_CATEGORIES = [
  {
    title: "Essential Cookies",
    badge: "Always Active",
    badgeColor: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
    desc: "These cookies are strictly necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as logging in, setting preferences, or filling in forms.",
    examples: [
      { name: "session_token", purpose: "Keeps you logged in during your visit", duration: "Session" },
      { name: "auth_token", purpose: "Authentication and access control for registered members", duration: "30 days" },
      { name: "performer_session", purpose: "Performer dashboard session management", duration: "Session" },
      { name: "csrf_token", purpose: "Security token to prevent cross-site request forgery", duration: "Session" },
      { name: "age_gate", purpose: "Records that you have confirmed you are 18+ and accepted the age gate", duration: "1 year" },
    ],
  },
  {
    title: "Functionality Cookies",
    badge: "Consent Required",
    badgeColor: "bg-amber-600/20 text-amber-400 border-amber-600/30",
    desc: "These cookies allow the website to remember choices you make and provide enhanced, personalised features. They may be set by us or by third-party providers whose services we use.",
    examples: [
      { name: "language_pref", purpose: "Remembers your selected language", duration: "1 year" },
      { name: "video_quality", purpose: "Remembers your preferred video quality settings", duration: "1 year" },
      { name: "fanclub_intent", purpose: "Remembers your fanclub checkout intent for seamless return flows", duration: "30 minutes" },
      { name: "payment_intent_ref", purpose: "Temporarily stores payment intent reference for checkout continuity", duration: "1 hour" },
    ],
  },
  {
    title: "Analytics Cookies",
    badge: "Consent Required",
    badgeColor: "bg-amber-600/20 text-amber-400 border-amber-600/30",
    desc: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. All information these cookies collect is aggregated and anonymous. If analytics services are enabled, data may be sent to Google Analytics or similar providers.",
    examples: [
      { name: "_ga / _ga_*", purpose: "Google Analytics — tracks pages visited and session duration (if enabled)", duration: "2 years" },
      { name: "_gid", purpose: "Google Analytics — distinguishes users (if enabled)", duration: "24 hours" },
      { name: "page_view_ref", purpose: "Internal FLESHLAB page view tracking for content performance", duration: "Session" },
    ],
  },
  {
    title: "Payment & Fraud Prevention",
    badge: "Essential / Provider",
    badgeColor: "bg-rose-600/20 text-rose-400 border-rose-600/30",
    desc: "When you initiate a payment, third-party payment providers such as NOWPayments may set cookies or use browser storage for transaction integrity, fraud prevention, and checkout flow continuity. These are set by the provider's domain and are subject to their own privacy policies.",
    examples: [
      { name: "nowpayments_*", purpose: "NOWPayments checkout session and fraud prevention (set by NOWPayments domain)", duration: "Session / varies" },
      { name: "checkout_state", purpose: "Stores payment type and plan reference during active checkout", duration: "1 hour" },
    ],
  },
  {
    title: "Marketing & Third-Party Cookies",
    badge: "Consent Required",
    badgeColor: "bg-amber-600/20 text-amber-400 border-amber-600/30",
    desc: "FLESHLAB does not currently use third-party advertising networks, affiliate tracking cookies or retargeting pixels. If marketing or affiliate cookies are introduced in the future, this policy will be updated and your consent will be requested before any such cookies are set.",
    examples: [
      { name: "(none currently active)", purpose: "No active marketing or affiliate cookies at this time", duration: "N/A" },
    ],
  },
];

function CategoryCard({ cat }) {
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden mb-6">
      <div className="bg-white/3 px-6 py-4 flex items-center justify-between gap-4 flex-wrap border-b border-white/6">
        <h3 className="text-white font-bold text-base">{cat.title}</h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cat.badgeColor}`}>{cat.badge}</span>
      </div>
      <div className="px-6 py-5">
        <p className="text-white/55 text-sm leading-relaxed mb-5">{cat.desc}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/30 border-b border-white/6">
                <th className="text-left pb-2 pr-4 font-semibold">Cookie / Key</th>
                <th className="text-left pb-2 pr-4 font-semibold">Purpose</th>
                <th className="text-left pb-2 font-semibold whitespace-nowrap">Duration</th>
              </tr>
            </thead>
            <tbody>
              {cat.examples.map((ex, i) => (
                <tr key={i} className="border-b border-white/4 last:border-0">
                  <td className="py-2.5 pr-4 text-rose-300/80 font-mono whitespace-nowrap">{ex.name}</td>
                  <td className="py-2.5 pr-4 text-white/50 leading-relaxed">{ex.purpose}</td>
                  <td className="py-2.5 text-white/40 whitespace-nowrap">{ex.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-b border-white/6 pb-8 mb-8">
      <h2 className="text-xs font-bold tracking-widest text-white/30 uppercase mb-3">{title}</h2>
      {children}
    </div>
  );
}

export default function CookiePolicy() {
  return (
    <>
      <SEOMeta
        title="Cookie Policy | FLESHLAB"
        description="Cookie policy for FLESHLAB, operated by Dialogmakers International Ltd. Learn how we use cookies, local storage and third-party services."
        canonical="/cookie-policy"
        noIndex={true}
      />
      <div className="min-h-screen bg-[#080808] text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">

          <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Cookie Policy</h1>
          <p className="text-white/40 text-sm mb-12 border-b border-white/8 pb-8">
            Last updated: June 2026 — Dialogmakers International Ltd. / FLESHLAB
          </p>

          <div className="space-y-0">

            <Section title="About this Policy">
              <p className="text-white/60 text-sm leading-relaxed">
                This Cookie Policy explains how <strong className="text-white">FLESHLAB</strong>, operated by <strong className="text-white">Dialogmakers International Ltd.</strong> (Company No. 83273694, registered in Taiwan), uses cookies, local storage and similar technologies when you visit <a href="https://www.fleshlab.online" className="text-rose-400 hover:text-rose-300 underline underline-offset-2">https://www.fleshlab.online</a>.
              </p>
            </Section>

            <Section title="What are Cookies?">
              <div className="space-y-3 text-white/60 text-sm leading-relaxed">
                <p>Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work efficiently, remember your preferences, and provide information to website operators.</p>
                <p>Cookies can be <strong className="text-white/80">session cookies</strong> (deleted when you close your browser) or <strong className="text-white/80">persistent cookies</strong> (stored on your device for a set period or until you delete them).</p>
                <p>Cookies can be set by the website you are visiting (<strong className="text-white/80">first-party cookies</strong>) or by third-party services embedded in the website (<strong className="text-white/80">third-party cookies</strong>).</p>
              </div>
            </Section>

            <Section title="Local Storage and Similar Technologies">
              <p className="text-white/60 text-sm leading-relaxed">
                In addition to cookies, FLESHLAB may use <strong className="text-white/80">browser local storage</strong> and <strong className="text-white/80">session storage</strong> to store small pieces of data on your device. This data functions similarly to cookies but is stored differently and does not expire unless manually cleared. We use local storage for authentication tokens, user preferences, checkout state continuity and fanclub access context. You can clear local storage at any time through your browser's developer tools or privacy settings.
              </p>
            </Section>

            <Section title="Why FLESHLAB Uses Cookies">
              <ul className="space-y-2 text-white/60 text-sm leading-relaxed">
                {[
                  "To keep you logged in and maintain your session securely",
                  "To remember your age gate confirmation (18+ verification)",
                  "To maintain fanclub access and PPV unlock entitlements",
                  "To remember your language and display preferences",
                  "To support secure payment checkout flows with third-party providers",
                  "To measure how the site is used so we can improve it (analytics, if enabled)",
                  "To protect the website and users against fraud and abuse",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-rose-500/60 mt-1 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Cookie Categories">
              <p className="text-white/50 text-sm mb-6">
                FLESHLAB uses the following categories of cookies. Essential cookies are required for the site to function and are set automatically. All other categories require your consent where applicable law mandates it.
              </p>
              {COOKIE_CATEGORIES.map((cat, i) => (
                <CategoryCard key={i} cat={cat} />
              ))}
            </Section>

            <Section title="Third-Party Services">
              <div className="space-y-4 text-white/60 text-sm leading-relaxed">
                <p>FLESHLAB may use the following third-party services, each of which may set their own cookies or use storage on your device:</p>
                <ul className="space-y-3">
                  {[
                    { name: "Cloudflare", desc: "Used for CDN, DDoS protection and security. Cloudflare may set security cookies for bot protection and threat detection." },
                    { name: "Google Analytics", desc: "If enabled, used to analyse traffic and usage patterns in aggregated, anonymous form. Requires consent where applicable." },
                    { name: "NOWPayments", desc: "Cryptocurrency payment gateway. Sets session and security cookies during the checkout flow on its own domain." },
                    { name: "Video / CDN providers", desc: "Content delivery for video thumbnails and media assets may use storage headers or caching mechanisms. These do not track users." },
                  ].map((svc, i) => (
                    <li key={i} className="border border-white/6 rounded-xl px-5 py-4">
                      <div className="font-bold text-white/80 mb-1">{svc.name}</div>
                      <div className="text-white/50">{svc.desc}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>

            <Section title="Age Verification and Adult Content Access">
              <p className="text-white/60 text-sm leading-relaxed">
                FLESHLAB displays an age gate requiring users to confirm they are 18 years or older before accessing adult content. Your confirmation is stored in a cookie or local storage entry (<code className="text-rose-300/80 font-mono text-xs bg-white/5 px-1 py-0.5 rounded">age_gate</code>) so you are not prompted on every visit. This is an essential operational cookie and cannot be disabled without limiting access to the platform.
              </p>
            </Section>

            <Section title="Cookie Consent">
              <div className="space-y-3 text-white/60 text-sm leading-relaxed">
                <p>Essential cookies are set automatically as they are required for the website to function. For all other cookie categories — including analytics, functionality and any future marketing cookies — we will request your consent where required by applicable law.</p>
                <p>A cookie consent notice may be displayed on your first visit, offering the following options:</p>
                <div className="grid sm:grid-cols-3 gap-3 my-4">
                  {[
                    { label: "Accept All", desc: "Enables all cookie categories including analytics and functionality cookies." },
                    { label: "Reject Non-Essential", desc: "Only essential cookies are set. Analytics and functionality cookies are disabled." },
                    { label: "Manage Settings", desc: "Choose which categories of cookies you consent to on a granular basis." },
                  ].map((opt, i) => (
                    <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-4">
                      <div className="font-bold text-white/80 text-xs mb-1.5">{opt.label}</div>
                      <div className="text-white/45 text-xs leading-relaxed">{opt.desc}</div>
                    </div>
                  ))}
                </div>
                <p>You can change or withdraw your consent at any time by clearing your cookies and local storage through your browser settings and revisiting the site, or by contacting us at the address below.</p>
              </div>
            </Section>

            <Section title="Managing Cookies in Your Browser">
              <div className="space-y-3 text-white/60 text-sm leading-relaxed">
                <p>Most web browsers allow you to control cookies through your browser settings. You can:</p>
                <ul className="space-y-1.5">
                  {[
                    "Block all cookies",
                    "Delete existing cookies",
                    "Allow cookies only from specific websites",
                    "Set your browser to notify you before a cookie is set",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-rose-500/60 mt-1 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-white/40 text-xs">
                  Please note that disabling essential cookies will affect the functionality of the website. You may not be able to log in, access fanclub content, or complete checkout if essential cookies are blocked.
                </p>
              </div>
            </Section>

            <Section title="Changes to This Policy">
              <p className="text-white/60 text-sm leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or applicable law. The updated policy will be posted on this page with a revised date. We recommend checking this page periodically.
              </p>
            </Section>

            <Section title="Contact">
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-white">Dialogmakers International Ltd.</p>
                <p className="text-white/60">2F, No. 2-1, Lane 23, Wenhua St.</p>
                <p className="text-white/60">Taoyuan City, Taoyuan, 324010, Taiwan</p>
                <p className="text-white/60 mt-2">
                  Email:{" "}
                  <a href="mailto:studiosupport@fleshlab.online" className="text-rose-400 hover:text-rose-300 underline underline-offset-2">
                    studiosupport@fleshlab.online
                  </a>
                </p>
                <p className="text-white/60">
                  Website:{" "}
                  <a href="https://www.fleshlab.online" className="text-rose-400 hover:text-rose-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                    https://www.fleshlab.online
                  </a>
                </p>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </>
  );
}