import BrandLogo from "@/components/BrandLogo";
import { ArrowRight, Facebook, Instagram, Send, ShieldCheck, Twitter, UsersRound } from "lucide-react";
import rtaBadgeUrl from "@/assets/compliance/rta-120x60-black.gif";

const navGroups = [
  { title: "Creators", links: [{ href: "/become-performer", label: "Become a Creator" }, { href: "/gay-performer-recruitment-philippines", label: "Join in Asia" }, { href: "/how-it-works", label: "How It Works" }, { href: "/faq", label: "Creator FAQ" }] },
  { title: "Fans", links: [{ href: "/videos", label: "Watch" }, { href: "/performers", label: "Creators" }, { href: "/fan-productions", label: "Fan Productions" }, { href: "/fanclub", label: "Fanclub" }] },
  { title: "Studio", links: [{ href: "/brands", label: "Brands" }, { href: "/news", label: "Studio Notes" }, { href: "/live", label: "Live" }, { href: "/guest-production", label: "Guest Production" }] },
  { title: "Company", links: [{ href: "/compliance", label: "Compliance" }, { href: "/dmca", label: "DMCA" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }, { href: "/imprint", label: "Imprint" }] },
];

const socials = [
  { href: "https://x.com/fleshlabstudios", label: "X", Icon: Twitter },
  { href: "https://www.instagram.com/fleshlabstudios/", label: "Instagram", Icon: Instagram },
  { href: "https://www.facebook.com/fleshlab/", label: "Facebook", Icon: Facebook },
  { href: "#", label: "Telegram coming soon", Icon: Send, future: true },
  { href: "#", label: "Discord coming soon", Icon: UsersRound, future: true },
];

function FooterLink({ href, children }) {
  return <a href={href} className="group/link relative inline-flex w-fit py-1.5 text-sm text-white/52 transition duration-300 hover:translate-x-1 hover:text-white"><span>{children}</span><span className="absolute bottom-1 left-0 h-px w-0 bg-[#E51D2A] transition-all duration-300 group-hover/link:w-full" /></a>;
}

export default function FinalBrandFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-[#050506] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(229,29,42,0.22),transparent_30%),radial-gradient(circle_at_8%_58%,rgba(255,255,255,0.07),transparent_24%),linear-gradient(180deg,#050506_0%,#09090b_52%,#030304_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

      <section className="relative mx-auto max-w-[1480px] px-5 py-20 md:px-10 md:py-28 lg:px-14 lg:py-36">
        <div className="max-w-6xl">
          <p className="mb-7 text-[11px] font-black uppercase tracking-[0.34em] text-[#E51D2A]">The final cut</p>
          <h2 className="max-w-5xl text-[clamp(4rem,10vw,10.5rem)] font-black uppercase leading-[0.78] tracking-[-0.085em] text-white">
            REAL PEOPLE.<br />REAL HEAT.<br />REAL CHANCE.
          </h2>
          <p className="mt-9 max-w-2xl text-lg leading-8 text-white/62 md:text-2xl md:leading-9">Join the studio built around amateur authenticity, creator ambition and fans who want something that feels alive.</p>
          <a href="/become-performer" className="group mt-11 inline-flex items-center gap-4 rounded-full bg-[#E51D2A] px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_24px_80px_rgba(229,29,42,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-[#ff3340] hover:shadow-[0_30px_100px_rgba(229,29,42,0.42)]">
            Become a Creator <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      <section className="relative border-y border-white/10">
        <div className="mx-auto grid max-w-[1480px] gap-14 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.86fr_1.14fr] lg:px-14">
          <div>
            <a href="/" aria-label="FLESHLAB home" className="inline-flex transition duration-300 hover:opacity-80"><BrandLogo className="h-[92px] w-[320px] max-w-full md:h-[112px] md:w-[420px]" /></a>
            <p className="mt-8 text-4xl font-black uppercase leading-none tracking-[-0.06em] md:text-6xl">AMATEUR WINS.</p>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/58 md:text-lg">Premium amateur productions. Built for creators. Built for fans. Made to feel less polished, more human, and impossible to fake.</p>
            <div className="mt-9 flex items-center gap-3">
              {socials.map(({ href, label, Icon, future }) => <a key={label} href={href} target={future ? undefined : "_blank"} rel={future ? undefined : "noopener noreferrer"} aria-label={label} title={label} className={`grid h-11 w-11 place-items-center rounded-full border border-white/12 text-white/52 transition duration-300 hover:-translate-y-1 hover:border-[#E51D2A]/70 hover:text-white hover:shadow-[0_0_30px_rgba(229,29,42,0.24)] ${future ? "opacity-45" : ""}`}><Icon className="h-4 w-4" /></a>)}
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4" aria-label="Footer navigation">
            {navGroups.map((group) => <div key={group.title}><h3 className="mb-5 text-[11px] font-black uppercase tracking-[0.28em] text-white">{group.title}</h3><div className="flex flex-col">{group.links.map((link) => <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>)}</div></div>)}
          </nav>
        </div>
      </section>

      <section className="relative mx-auto flex max-w-[1480px] flex-col gap-6 px-5 py-7 text-[10px] font-black uppercase tracking-[0.16em] text-white/46 md:px-10 lg:px-14 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className="text-white">18+</span>
          <a href="https://www.rtalabel.org/" target="_blank" rel="noopener noreferrer" aria-label="RTA Restricted to Adults" className="inline-flex items-center gap-2 transition hover:text-white"><img src={rtaBadgeUrl} alt="RTA" width="42" height="21" loading="lazy" className="h-[21px] w-[42px] object-contain opacity-75" /> RTA</a>
          <a href="/dmca" className="inline-flex items-center gap-2 transition hover:text-white"><ShieldCheck className="h-3.5 w-3.5 text-[#E51D2A]" /> DMCA Protected</a>
          <a href="/privacy" className="transition hover:text-white">Privacy</a>
          <a href="/terms" className="transition hover:text-white">Terms</a>
          <a href="/client/dashboard?tab=wallet" className="transition hover:text-white">Secure Payments</a>
        </div>
        <p className="text-white/34">Copyright © {year} FLESHLAB Studios. All performers are 18+.</p>
      </section>
    </footer>
  );
}