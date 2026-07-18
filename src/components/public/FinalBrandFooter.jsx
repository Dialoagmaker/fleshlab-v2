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
  return <a href={href} className="group/link relative inline-flex w-fit py-0.5 text-[11px] leading-5 text-white/54 transition duration-300 hover:translate-x-1 hover:text-white"><span>{children}</span><span className="absolute bottom-0.5 left-0 h-px w-0 bg-[#E51D2A] transition-all duration-300 group-hover/link:w-full" /></a>;
}

export default function FinalBrandFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-[#040506] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(229,29,42,0.20),transparent_30%),radial-gradient(circle_at_8%_58%,rgba(255,255,255,0.06),transparent_24%),linear-gradient(180deg,#040506_0%,#08090a_52%,#030304_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

      <section className="relative mx-auto max-w-[1360px] px-5 py-6 lg:px-7 lg:py-8">
        <div className="max-w-4xl">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.32em] text-[#E51D2A]">The final scene</p>
          <h2 className="fl-condensed text-[38px] uppercase leading-[0.86] tracking-[-0.03em] md:text-[54px] lg:text-[68px]">
            REAL PEOPLE.<br />REAL DESIRE.<br /><span className="text-[#E51D2A]">REAL STORIES.</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/64 md:text-base md:leading-7">Meet the creators behind authentic amateur productions — real people building real stories, one release at a time.</p>
          <a href="/performers" className="group mt-4 inline-flex items-center gap-3 rounded-full bg-[#E51D2A] px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_45px_rgba(229,29,42,0.22)] transition duration-300 hover:-translate-y-1 hover:bg-[#ff3340] hover:shadow-[0_20px_70px_rgba(229,29,42,0.34)]">
            Meet the Creators <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      <section className="relative border-y border-white/10">
        <div className="mx-auto grid max-w-[1360px] gap-7 px-5 py-4 md:py-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:px-7">
          <div className="max-w-lg">
            <a href="/" aria-label="FLESHLAB home" className="inline-flex transition duration-300 hover:opacity-80"><BrandLogo className="h-[36px] w-[132px] max-w-full md:h-[42px] md:w-[156px]" /></a>
            <p className="mt-2 text-[24px] font-black uppercase leading-none tracking-[-0.06em] md:text-[32px]">AMATEUR WINS.</p>
            <p className="mt-1.5 max-w-lg text-xs leading-5 text-white/56 md:text-sm">Built around real creators, independent productions and moments that feel less polished, more human and impossible to fake.</p>
            <div className="mt-3 flex items-center gap-2.5">
              {socials.map(({ href, label, Icon, future }) => <a key={label} href={href} target={future ? undefined : "_blank"} rel={future ? undefined : "noopener noreferrer"} aria-label={label} title={label} className={`grid h-8 w-8 place-items-center rounded-full border border-white/12 text-white/52 transition duration-300 hover:-translate-y-1 hover:border-[#E51D2A]/70 hover:text-white hover:shadow-[0_0_22px_rgba(229,29,42,0.22)] ${future ? "opacity-45" : ""}`}><Icon className="h-3.5 w-3.5" /></a>)}
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2 md:grid-cols-4 lg:pt-3" aria-label="Footer navigation">
            {navGroups.map((group) => <div key={group.title}><h3 className="mb-2 text-[8px] font-black uppercase tracking-[0.24em] text-white">{group.title}</h3><div className="flex flex-col">{group.links.map((link) => <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>)}</div></div>)}
          </nav>
        </div>
      </section>

      <section className="relative mx-auto flex max-w-[1360px] flex-col gap-2 px-5 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-white/46 lg:min-h-[30px] lg:flex-row lg:items-center lg:justify-between lg:px-7 lg:py-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
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