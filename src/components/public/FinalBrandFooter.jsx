import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { ArrowRight, Facebook, Instagram, Twitter } from "lucide-react";
import rtaBadgeUrl from "@/assets/compliance/rta-120x60-black.gif";

const linkGroups = [
  { title: "Explore", links: [{ href: "/videos", label: "Videos" }, { href: "/performers", label: "Creators" }, { href: "/videos", label: "Collections" }, { href: "/news", label: "News" }] },
  { title: "Performers", links: [{ href: "/become-performer", label: "Become a Performer" }, { href: "/faq", label: "Requirements" }, { href: "/client/dashboard?tab=wallet", label: "Payments" }, { href: "/faq", label: "Support" }] },
  { title: "Company", links: [{ href: "/how-it-works", label: "About" }, { href: "/become-performer", label: "Careers" }, { href: "/news/category/press-releases", label: "Press" }, { href: "/imprint", label: "Contact" }] },
  { title: "Legal", links: [{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }, { href: "/dmca", label: "DMCA" }, { href: "/2257", label: "2257" }] },
];

const socials = [
  { href: "https://x.com/fleshlabstudios", label: "X", Icon: Twitter },
  { href: "https://www.instagram.com/fleshlabstudios/", label: "Instagram", Icon: Instagram },
  { href: "https://www.facebook.com/fleshlab/", label: "Facebook", Icon: Facebook },
];

export default function FinalBrandFooter() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#030303] px-5 py-16 text-white md:px-10 lg:px-14 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(229,29,42,0.16),transparent_30%),radial-gradient(circle_at_88%_62%,rgba(255,255,255,0.055),transparent_28%)]" />
      <div className="relative mx-auto max-w-[1440px]">
        <section className="grid gap-10 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/40 md:p-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <a href="/" aria-label="FLESHLAB home" className="inline-flex"><BrandLogo className="h-[92px] w-[330px] md:h-[116px] md:w-[430px]" /></a>
            <p className="mt-8 text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] md:text-6xl">AMATEUR WINS.</p>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62 md:text-xl">Real creators. Real chemistry. Real opportunities — built for authentic amateur creators and long-term careers.</p>
          </div>
          <div className="flex flex-col gap-5 rounded-[1.5rem] border border-white/10 bg-black/35 p-5 md:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#E51D2A]">Next chapter</p>
            <h3 className="text-2xl font-black leading-tight tracking-[-0.035em] text-white md:text-3xl">Ready to step into the FLESHLAB world?</h3>
            <a href="/become-performer" className="inline-flex w-fit items-center gap-4 rounded-full bg-[#E51D2A] px-6 py-3 text-[11px] font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-[#ff3340]">Become a Performer <ArrowRight className="h-4 w-4" /></a>
          </div>
        </section>

        <section className="grid gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">Studio dispatch</p>
            <h3 className="mt-4 text-2xl font-black tracking-[-0.035em] text-white md:text-3xl">Never miss new productions, creator stories and platform updates.</h3>
            <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} className="mt-7 flex overflow-hidden rounded-full border border-white/10 bg-black/45 p-1 focus-within:border-[#E51D2A]/60">
              <input type="email" required placeholder="Your email address" className="min-w-0 flex-1 bg-transparent px-5 text-sm text-white outline-none placeholder:text-white/32" />
              <button className="rounded-full bg-white px-5 py-3 text-[10px] font-black uppercase tracking-wide text-black transition hover:bg-[#E51D2A] hover:text-white">Notify me</button>
            </form>
            {submitted && <p className="mt-3 text-xs text-white/44">Thanks — you’re on the update list.</p>}
          </div>
          <nav className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {linkGroups.map((group) => <div key={group.title}><h4 className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-white">{group.title}</h4>{group.links.map((link) => <a key={link.label} href={link.href} className="block py-2 text-sm text-white/48 transition hover:translate-x-1 hover:text-white">{link.label}</a>)}</div>)}
          </nav>
        </section>

        <section className="border-t border-white/10 py-8">
          <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-6 md:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E51D2A]">Trust & Compliance</p>
            <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <a href="https://www.rtalabel.org/" target="_blank" rel="noopener noreferrer" aria-label="FLESHLAB is labeled Restricted to Adults by RTA" className="inline-flex min-h-11 w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E51D2A] focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                  <img src={rtaBadgeUrl} alt="RTA Restricted to Adults" width="120" height="60" loading="lazy" className="h-auto max-h-[60px] w-[120px] max-w-full object-contain" />
                </a>
                <div>
                  <a href="/compliance" className="text-sm font-black uppercase tracking-wide text-white transition hover:text-[#E51D2A]">Restricted to Adults</a>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/54">FLESHLAB is intended exclusively for adults aged 18 or older.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide text-white/54">
                {['Adults Only · 18+', 'Verified Creators', 'Consent Documentation', 'DMCA Policy', 'Privacy & Security'].map((item) => <span key={item} className="rounded-full border border-white/10 px-3 py-2">{item}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-8 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">{socials.map(({ href, label, Icon }) => <a key={label} href={href} target={href === "#" ? undefined : "_blank"} rel={href === "#" ? undefined : "noopener noreferrer"} aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/46 transition hover:-translate-y-1 hover:border-[#E51D2A]/60 hover:text-white"><Icon className="h-4 w-4" /></a>)}</div>
          <p className="max-w-3xl text-xs leading-relaxed text-white/32">18 U.S.C. 2257: All performers depicted on this website were 18 years of age or older at the time of production. © 2026 FLESHLAB. All rights reserved.</p>
        </section>
      </div>
    </footer>
  );
}