import { motion } from "framer-motion";
import { Users, ShieldCheck, CreditCard, Headphones, Globe2, Wallet, Play, Clapperboard, Handshake, UserPlus, Lock, CloudUpload, CheckCircle2, DollarSign, Camera, Crown, BadgeCheck, ChevronRight, Dumbbell, BedDouble, Plane, GraduationCap, Home, Sparkles, FileText, EyeOff, RotateCcw } from "lucide-react";
import LanguageSwitcher from "@/components/public/LanguageSwitcher";
import MediaImage from "@/components/homeTube/MediaImage";
import FleshlabEcosystem from "@/components/landingV2/FleshlabEcosystem";
import AnimatedCounter from "@/components/landingV2/AnimatedCounter";
import HumanMomentsSection from "@/components/landingV2/HumanMomentsSection";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";

const HERO_IMAGE = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/0e3cd6784_generated_image.png";
const SELFIE_IMAGE = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a3babcb65_generated_image.png";
const PRODUCTION_IMAGE = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b2a370cb_generated_image.png";
const FAN_IMAGE = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4ecf7441b_generated_image.png";
const WORLD_IMAGES = ["https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/d35df4180_generated_image.png", "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/5b2120e6a_generated_image.png", "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/fcaf5cd40_generated_image.png", "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/5dcc0f51a_generated_image.png", "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/b8b8e17cc_generated_image.png", "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/cdc27160e_generated_image.png"];

const navItems = [["WHO WE ARE", "#who"], ["HOW IT WORKS", "#journey"], ["EARN MONEY", "#paths"], ["VIDEOS", "/videos"], ["FAN PRODUCTIONS", "#fan-productions"], ["BLOG", "/news"], ["TRUST CENTER", "#trust"]];
const trustItems = [[Users, "100% AMATEUR", "Real people. No actors."], [ShieldCheck, "SAFE & PRIVATE", "Your privacy is protected."], [CreditCard, "FAIR PAY", "Clear payouts and records."], [Headphones, "FULL SUPPORT", "Guidance from day one."], [Globe2, "GLOBAL COMMUNITY", "Fans across 120+ countries."]];
const paths = [[Wallet, "Earn Money", "Start from your phone. Build a real creator income.", "/become-performer", SELFIE_IMAGE], [Play, "Watch Videos", "Explore real amateur stories with studio-quality curation.", "/videos", HERO_IMAGE], [Clapperboard, "Fan Productions", "Apply to film a real production with a favourite performer.", "/fan-productions", FAN_IMAGE], [Handshake, "Partner Network", "Distribution, studio alliances and creator monetization.", "#partners", PRODUCTION_IMAGE]];
const journey = [[UserPlus, "Join", "Create your performer account."], [Lock, "Verify", "Age, identity and consent are confirmed."], [CloudUpload, "Upload", "Files go directly to Cloudflare R2."], [CheckCircle2, "Admin Review", "Every upload is manually checked."], [Clapperboard, "Published", "Approved content becomes a FLESHLAB release."], [DollarSign, "Earn", "Track income and grow over time."]];
const worlds = [[BedDouble, "Hotel Sessions", "A private room. A phone. The first night."], [Plane, "Beach Escape", "Travel, heat and vacation freedom."], [Sparkles, "Massage", "Warm rooms and slow cinematic tension."], [Dumbbell, "Gym", "Fitness energy and after-hours confidence."], [GraduationCap, "Student Life", "Young adult city life, privacy and ambition."], [Home, "Home Made", "Personal, direct and authentically lived-in."]];
const trustQuestions = [[EyeOff, "Identity Protection", "Your legal identity, documents and public creator presence are handled separately so you stay in control of what appears on screen."], [BadgeCheck, "Verification Process", "Every creator is confirmed 18+, consent is documented and nothing goes live before review."], [FileText, "Contracts", "Clear agreements explain usage, rights and revenue before production begins."], [Wallet, "Transparent Payouts", "Know exactly when and how you get paid through a clear monthly payout workflow."], [Lock, "Privacy", "Private information stays private, with creator-facing support before and after publication."], [CloudUpload, "Content Ownership", "Uploads, approvals and release decisions stay documented so creators understand what they are approving."], [CreditCard, "Secure Payments", "Payments and platform records are structured for clean, auditable creator income."], [RotateCcw, "Can I stop anytime?", "Creators can pause, ask questions and contact the studio about future work, privacy or content status."]];

const reveal = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

function Logo({ small = false }) {
  return <a href="/" className="leading-none"><div className={`${small ? "text-[22px]" : "text-[34px]"} font-black tracking-[-0.065em] text-white`}>FLESH<span className="text-[#f0183d]">LAB</span></div><div className="mt-0.5 text-[8px] font-black uppercase tracking-[0.55em] text-white/80">Amateur wins.</div></a>;
}

function SectionReveal({ children, className = "", ...props }) {
  return <motion.section {...props} variants={reveal} initial="visible" whileInView="visible" viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }} className={className}>{children}</motion.section>;
}

function ThumbStack({ performers }) {
  const fallback = [SELFIE_IMAGE, HERO_IMAGE, PRODUCTION_IMAGE, FAN_IMAGE, WORLD_IMAGES[0]];
  const visible = performers.slice(0, 5);
  const thumbs = visible.length ? visible.map((p) => buildPublicAssetUrl(p.profile_image_url || p.cover_image_url)) : fallback;
  return <div className="flex items-center gap-4"><div className="flex -space-x-2">{thumbs.map((src, index) => <img key={src || index} src={src} alt="FLESHLAB creator" className="h-8 w-8 rounded-full border-2 border-[#06090b] object-cover" loading="lazy" />)}</div><p className="text-[9px] leading-4 text-white/62">Creators begin here.<br /><span className="text-white">One phone. One room.</span></p></div>;
}

export default function FleshlabLandingV2({ performers = [] }) {
  return (
    <div className="min-h-screen bg-[#030608] text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#030608]/86 backdrop-blur-xl">
        <div className="mx-auto flex h-[52px] max-w-[1360px] items-center justify-between px-5 lg:px-7">
          <Logo small />
          <nav className="hidden items-center gap-7 lg:flex">{navItems.map(([item, href]) => <a key={item} href={href} className="text-[9px] font-black uppercase tracking-[0.09em] text-white/86 hover:text-[#f0183d]">{item}</a>)}</nav>
          <div className="flex items-center gap-3"><LanguageSwitcher /><a href="/become-performer" className="rounded bg-[#f0183d] px-5 py-2.5 text-[9px] font-black uppercase tracking-wide text-white transition hover:bg-[#ff3152]">JOIN NOW</a></div>
        </div>
      </header>

      <main className="pt-[52px]">
        <section id="who" className="relative overflow-hidden border-b border-white/8 bg-black">
          <div className="absolute inset-0"><MediaImage src={HERO_IMAGE} alt="Creator beginning in a hotel room" className="fl-hero-motion h-full w-full object-cover object-[64%_center] opacity-95 brightness-[0.82] saturate-[0.95]" /><div className="absolute inset-0 bg-[linear-gradient(90deg,#040709_0%,rgba(4,7,9,0.94)_31%,rgba(4,7,9,0.18)_62%,rgba(4,7,9,0.72)_100%)]" /><div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#040709] to-transparent" /></div>
          <div className="relative mx-auto grid min-h-[650px] max-w-[1360px] grid-cols-1 px-5 py-12 lg:grid-cols-[1fr_280px] lg:px-7">
            <div className="flex max-w-[520px] flex-col justify-center">
              <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-4 text-[10px] font-black uppercase tracking-[0.36em] text-[#f0183d]">THIS IS WHERE CREATORS BEGIN</motion.p>
              <motion.h1 initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.86, delay: 0.08 }} className="fl-condensed text-[66px] uppercase leading-[0.85] tracking-[-0.035em] md:text-[88px] lg:text-[104px]">YOUR STORY.<br /><span className="text-[#f0183d]">YOUR INCOME.</span></motion.h1>
              <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.2 }} className="mt-6 max-w-[360px] text-[18px] font-semibold leading-7 text-white/88">Start earning with your smartphone.<br />Safe.<br />Private.<br />Professional.</motion.p>
              <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.32 }} className="mt-8 flex gap-3"><a href="/become-performer" className="w-[182px] rounded bg-[#f0183d] py-3.5 text-center text-[10px] font-black uppercase tracking-wide transition hover:-translate-y-0.5 hover:bg-[#ff3152]">BECOME PERFORMER</a><a href="/videos" className="w-[182px] rounded border border-white/45 bg-black/25 py-3.5 text-center text-[10px] font-black uppercase tracking-wide transition hover:-translate-y-0.5 hover:border-[#f0183d]">EXPLORE VIDEOS</a></motion.div>
              <div className="mt-16"><ThumbStack performers={performers} /></div>
              <div className="mt-7 grid max-w-[360px] grid-cols-2 gap-3">
                <AnimatedCounter value={17} label="performers" className="rounded-xl border border-white/12 bg-black/26 p-4 backdrop-blur" />
                <div className="rounded-xl border border-white/12 bg-black/26 p-4 backdrop-blur">
                  <div className="fl-condensed text-[38px] uppercase leading-none tracking-[-0.02em] text-white">Monthly</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#f0183d]">transparent payouts</div>
                </div>
              </div>
              <div className="mt-4 max-w-[360px] rounded-xl border border-white/12 bg-black/28 p-4 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f0183d]">Creator note</p>
                <p className="mt-2 text-sm leading-6 text-white/72">“I started with nothing more than my smartphone.”</p>
              </div>
            </div>
            <aside className="hidden items-center justify-end lg:flex"><div className="w-[220px] space-y-5 rounded border border-white/14 bg-black/38 p-6 backdrop-blur-md">{[[Camera, "PHONE READY"], [Clapperboard, "STUDIO REVIEW"], [ShieldCheck, "PRIVATE & SAFE"], [DollarSign, "CREATOR INCOME"]].map(([Icon, label]) => <div key={label} className="flex items-center gap-4"><Icon className="h-6 w-6 text-[#f0183d]" /><div className="text-[10px] font-black uppercase leading-4 text-white/86">{label}</div></div>)}</div></aside>
          </div>
        </section>

        <section className="border-b border-white/8 bg-[#080e11]"><div className="mx-auto grid max-w-[1360px] gap-4 px-5 py-4 md:grid-cols-5 lg:px-7">{trustItems.map(([Icon, title, body], index) => <div key={title} className="flex gap-3"><Icon className="h-6 w-6 shrink-0 text-[#f0183d]" /><div><h3 className="text-[10px] font-black uppercase">{title}</h3><p className="mt-1 text-[9px] leading-4 text-white/54">{body}</p>{index === 0 && <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-white/82">300+ videos</p>}{index === 2 && <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-white/82">4K productions</p>}{index === 4 && <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-white/82">5 countries</p>}</div></div>)}</div></section>

        <SectionReveal id="paths" className="mx-auto max-w-[1360px] px-5 py-14 lg:px-7">
          <div className="mb-8 max-w-xl"><h2 className="fl-condensed text-[48px] uppercase leading-none tracking-[-0.02em] text-white/90">CHOOSE <span className="text-[#f0183d]">YOUR</span> PATH</h2><p className="mt-2 text-sm text-white/50">Four entrances into the FLESHLAB creator ecosystem.</p></div>
          <div className="grid gap-5 md:grid-cols-2">{paths.map(([Icon, title, body, href, image], index) => <motion.a key={title} href={href} initial={{ opacity: 1, y: 0 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.62, delay: index * 0.08 }} className="group relative min-h-[330px] overflow-hidden rounded-xl border border-white/12 bg-[#0a1115] p-7"><MediaImage src={image} alt={title} className="absolute inset-0 h-full w-full object-cover object-[center_38%] opacity-66 transition duration-700 group-hover:scale-105 group-hover:opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/42 to-black/8" /><div className="relative flex h-full flex-col justify-between"><Icon className="h-10 w-10 text-[#f0183d]" /><div><h3 className="fl-condensed text-[56px] uppercase leading-none tracking-[-0.02em]">{title}</h3><p className="mt-3 max-w-[360px] text-sm leading-6 text-white/74">{body}</p></div><ChevronRight className="absolute bottom-0 right-0 h-6 w-6 transition group-hover:translate-x-1" /></div></motion.a>)}</div>
        </SectionReveal>

        <HumanMomentsSection />

        <SectionReveal id="journey" className="relative border-y border-white/8 bg-[#05090c] px-5 py-18 lg:px-7">
          <div className="mx-auto max-w-[1180px]"><div className="mb-10 max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">CREATOR JOURNEY</p><h2 className="fl-condensed mt-3 text-[58px] uppercase leading-none tracking-[-0.02em] text-white/92">FROM HOTEL ROOM TO PUBLISHED RELEASE.</h2><p className="mt-4 text-base leading-7 text-white/60">A simple path designed for real amateur performers: upload securely, get reviewed by the studio, publish only when approved, then grow your income.</p></div>
            <div className="grid gap-10 lg:grid-cols-[1fr_360px]"><div className="relative space-y-5 before:absolute before:left-8 before:top-10 before:h-[calc(100%-5rem)] before:w-px before:bg-gradient-to-b before:from-[#f0183d] before:via-[#f0183d]/50 before:to-transparent">{journey.map(([Icon, title, body], index) => <motion.div key={title} initial={{ opacity: 1, x: 0 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ duration: 0.56, delay: index * 0.06 }} className="relative grid gap-5 rounded-xl border border-white/10 bg-black/24 p-5 pl-24 backdrop-blur md:grid-cols-[180px_1fr]"><div className="absolute left-0 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-[#f0183d] bg-[#07090b] text-[#f0183d]"><Icon className="h-7 w-7" /></div><div><div className="text-[10px] font-black text-[#f0183d]">0{index + 1}</div><h3 className="fl-condensed text-[32px] uppercase leading-none">{title}</h3></div><p className="text-sm leading-6 text-white/62">{body}</p></motion.div>)}</div><div className="space-y-5"><div className="rounded-2xl border border-[#f0183d]/35 bg-[#12060a] p-6"><CloudUpload className="mb-5 h-9 w-9 text-[#f0183d]" /><h3 className="text-lg font-black uppercase">Direct to Cloudflare R2</h3><p className="mt-3 text-sm leading-6 text-white/62">Creator uploads are routed to secure object storage, built for scale and reliable media handling.</p></div><div className="rounded-2xl border border-white/12 bg-white/[0.035] p-6"><CheckCircle2 className="mb-5 h-9 w-9 text-[#f0183d]" /><h3 className="text-lg font-black uppercase">Manual review before publishing</h3><p className="mt-3 text-sm leading-6 text-white/62">FLESHLAB reviews every upload before it becomes public, protecting performers, fans and the platform.</p></div><div className="rounded-2xl border border-white/12 bg-black/26 p-6"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f0183d]">What creators tell us</p><p className="mt-3 text-lg font-semibold leading-7 text-white/78">“The verification process was much easier than expected.”</p></div></div></div></div>
        </SectionReveal>

        <FleshlabEcosystem />

        <SectionReveal className="bg-[#05090c] px-5 py-16 lg:px-7">
          <div className="mx-auto max-w-[1360px]"><div className="mb-8 max-w-2xl"><h2 className="fl-condensed text-[58px] uppercase leading-none tracking-[-0.02em] text-white/92">PRODUCTION <span className="text-[#f0183d]">WORLDS</span></h2><p className="mt-2 text-sm text-white/52">Each world should read like a different movie before a visitor sees the title.</p></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{worlds.map(([Icon, title, body], index) => <motion.a key={title} href="/videos" initial={{ opacity: 1, y: 0 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.22 }} transition={{ duration: 0.62, delay: index * 0.06 }} className="group relative h-[470px] overflow-hidden rounded-xl border border-white/12 bg-[#111] shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition duration-500 hover:-translate-y-1 hover:border-[#f0183d]/60"><MediaImage src={WORLD_IMAGES[index]} alt={title} className="absolute inset-0 h-full w-full object-cover object-[center_38%] opacity-88 transition duration-[1200ms] group-hover:scale-110 group-hover:opacity-95" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent,rgba(0,0,0,0.38))]" /><div className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/28 backdrop-blur"><Icon className="h-6 w-6 text-white" /></div><div className="absolute inset-x-0 bottom-0 p-7"><h3 className="fl-condensed text-[46px] uppercase leading-none">{title}</h3><p className="mt-3 text-sm leading-6 text-white/68">{body}</p></div></motion.a>)}</div></div>
        </SectionReveal>

        <SectionReveal id="trust" className="relative overflow-hidden border-y border-white/8 bg-[#080d10] px-5 py-20 lg:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(240,24,61,0.18),transparent_34%),radial-gradient(circle_at_82%_70%,rgba(255,255,255,0.07),transparent_28%)]" />
          <div className="relative mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="flex flex-col justify-center rounded-[2rem] border border-white/12 bg-black/24 p-8 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#f0183d]">TRUST CENTER</p>
              <h2 className="fl-condensed mt-3 text-[62px] uppercase leading-none tracking-[-0.02em]">CAN I TRUST THIS PLATFORM?</h2>
              <p className="mt-5 text-base leading-7 text-white/66">For new performers, trust comes before content. FLESHLAB is built to make privacy, verification, contracts and payouts feel clear from the first conversation.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <AnimatedCounter value={17} label="verified performers" note="Real adults, documented before publication." className="rounded-2xl border border-white/10 bg-white/[0.035] p-5" />
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><div className="fl-condensed text-[38px] uppercase leading-none tracking-[-0.02em] text-white">Monthly</div><div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#f0183d]">transparent payouts</div><p className="mt-2 text-xs leading-5 text-white/48">Know exactly when and how you get paid.</p></div>
              </div>
              <div className="mt-6 rounded-2xl border border-[#f0183d]/28 bg-[#16070b] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f0183d]">Creator note</p>
                <p className="mt-3 text-lg font-semibold leading-7 text-white/78">“The team helped me throughout my first production.”</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {trustQuestions.map(([Icon, question, answer], index) => <motion.div key={question} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: index * 0.04 }} className="rounded-2xl border border-white/12 bg-black/26 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#f0183d]/55 hover:bg-black/36"><Icon className="mb-5 h-8 w-8 text-[#f0183d]" /><h3 className="text-base font-black uppercase leading-tight">{question}</h3><p className="mt-3 text-sm leading-6 text-white/62">{answer}</p></motion.div>)}
            </div>
          </div>
        </SectionReveal>

        <SectionReveal id="fan-productions" className="relative overflow-hidden border-y border-[#f0183d]/28 bg-[#110509] px-5 py-18 lg:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_40%,rgba(240,24,61,0.28),transparent_38%)]" />
          <div className="relative mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[0.95fr_1.15fr]"><div className="flex flex-col justify-center"><p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#f0183d]">PREMIUM SERVICE</p><h2 className="fl-condensed mt-4 text-[72px] uppercase leading-[0.9] tracking-[-0.02em]">BRING YOUR FANTASY TO LIFE.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-white/72">Apply to film together with your favourite performer. Our studio handles the production. Your idea becomes a real FLESHLAB project.</p><div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">{[[Sparkles, "YOUR IDEA"], [Camera, "OUR STUDIO"], [Crown, "REAL PRODUCTION"]].map(([Icon, label]) => <div key={label} className="rounded-xl border border-white/12 bg-black/24 p-5"><Icon className="mb-4 h-8 w-8 text-[#f0183d]" /><h3 className="text-[11px] font-black uppercase">{label}</h3></div>)}</div><a href="/fan-productions" className="mt-9 inline-flex w-fit items-center gap-10 rounded bg-[#f0183d] px-7 py-3 text-[10px] font-black uppercase tracking-wide transition hover:-translate-y-0.5 hover:bg-[#ff3152]">START YOUR PROJECT <ChevronRight className="h-4 w-4" /></a></div><div className="relative min-h-[440px] overflow-hidden rounded-2xl border border-white/12"><MediaImage src={FAN_IMAGE} alt="Premium fan production planning" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" /><div className="absolute bottom-7 left-7 right-7 rounded-xl border border-white/14 bg-black/38 p-5 backdrop-blur-md"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f0183d]">A REAL PRODUCTION</p><p className="mt-2 text-xl font-black uppercase leading-tight">Your concept, consent verified, studio produced.</p></div></div></div>
        </SectionReveal>

        <footer id="partners" className="bg-[#05080a]"><div className="mx-auto max-w-[1360px] px-5 py-6 lg:px-7"><div className="mb-5 flex flex-wrap items-center gap-7"><h2 className="fl-condensed text-[27px] uppercase tracking-[-0.02em] text-white/76">OUR TRUSTED <span className="text-[#f0183d]">PARTNERS</span></h2>{["xHamster", "FapHouse", "Clip4Sale", "LoyalFans", "ManyVids"].map((p) => <span key={p} className="text-lg font-black text-white/45">{p}</span>)}<a href="#" className="rounded border border-[#f0183d] px-4 py-1.5 text-[8px] font-black uppercase text-[#f0183d]">SEE ALL PARTNERS</a></div><div className="grid gap-8 border-t border-white/8 pt-5 md:grid-cols-[1fr_1fr_1fr_1fr_1.1fr]"><div><h3 className="text-sm font-black uppercase text-white/70">JOIN THE FLESHLAB FAMILY</h3><p className="mt-2 text-[10px] leading-4 text-white/45">Get updates, new releases and exclusive offers.</p><button className="mt-4 rounded bg-[#f0183d] px-7 py-2 text-[9px] font-black uppercase">SUBSCRIBE</button></div>{[["FOR PERFORMERS", ["How it works", "Requirements", "Payouts", "FAQ", "Support"]], ["FOR FANS", ["Videos", "Categories", "Fan Productions", "Membership", "FAQ"]], ["COMPANY", ["About us", "Blog", "Careers", "Press", "Contact"]], ["LEGAL", ["Terms of Service", "Privacy Policy", "DMCA", "Content Policy"]]].map(([title, items]) => <div key={title}><h3 className="mb-3 text-[9px] font-black uppercase text-white/72">{title}</h3>{items.map((item) => <a key={item} href="#" className="block text-[9px] leading-5 text-white/42 hover:text-white">{item}</a>)}</div>)}<div className="text-right"><Logo small /><p className="mt-4 text-[9px] text-white/42">© 2025 FLESHLAB Studios.<br />All rights reserved.</p></div></div></div></footer>
      </main>
    </div>
  );
}