import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, ShieldCheck, CreditCard, Headphones, Globe2, Wallet, Play, Clapperboard, Handshake, UserPlus, Lock, CloudUpload, CheckCircle2, DollarSign, Camera, Crown, BadgeCheck, ChevronRight, Dumbbell, BedDouble, Plane, GraduationCap, Home, Sparkles, FileText, EyeOff, RotateCcw, ArrowRight, Instagram, Facebook, Twitter, Send, UsersRound } from "lucide-react";
import LanguageSwitcher from "@/components/public/LanguageSwitcher";
import MediaImage from "@/components/homeTube/MediaImage";
import AudienceExpansion from "@/components/landingV2/AudienceExpansion";
import PartnerDistribution from "@/components/landingV2/PartnerDistribution";
import AnimatedCounter from "@/components/landingV2/AnimatedCounter";
import HumanMomentsSection from "@/components/landingV2/HumanMomentsSection";
import CreatorStoriesSection from "@/components/landingV2/CreatorStoriesSection";
import FinalBrandFooter from "@/components/public/FinalBrandFooter";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";
import rtaBadgeUrl from "@/assets/compliance/rta-120x60-black.gif";

const HERO_IMAGE = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/96230e13e_generated_image.png";
const SELFIE_IMAGE = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a3babcb65_generated_image.png";
const PRODUCTION_IMAGE = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b2a370cb_generated_image.png";
const FAN_IMAGE = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/ee7e890ef_generated_image.png";
const WORLD_IMAGES = ["https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/d35df4180_generated_image.png", "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/5b2120e6a_generated_image.png", "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/fcaf5cd40_generated_image.png", "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/5dcc0f51a_generated_image.png", "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/b8b8e17cc_generated_image.png", "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/cdc27160e_generated_image.png"];

const navItems = [["WHO WE ARE", "#who"], ["HOW IT WORKS", "#journey"], ["EARN MONEY", "#paths"], ["VIDEOS", "/videos"], ["FAN PRODUCTIONS", "#fan-productions"], ["BLOG", "/news"], ["TRUST CENTER", "#trust"]];
const trustItems = [[Users, "100% AMATEUR", "Real people. No actors."], [ShieldCheck, "SAFE & PRIVATE", "Your privacy is protected."], [CreditCard, "FAIR PAY", "Clear payouts and records."], [Headphones, "FULL SUPPORT", "Guidance from day one."], [Globe2, "GLOBAL COMMUNITY", "Fans across 120+ countries."]];
const paths = [[Wallet, "Earn Money", "Start from your phone. Build a real creator income.", "/become-performer", SELFIE_IMAGE], [Play, "Watch Videos", "Explore real amateur stories with studio-quality curation.", "/videos", HERO_IMAGE], [Clapperboard, "Fan Productions", "Apply to film a real production with a favourite performer.", "/fan-productions", FAN_IMAGE], [Handshake, "Partner Network", "Distribution, studio alliances and creator monetization.", "#partners", PRODUCTION_IMAGE]];
const journey = [[UserPlus, "Join", "Create your free performer account and take the first step toward earning from your own content."], [Lock, "Verify", "Confirm your age and identity safely. Verification protects you, your viewers and the trust behind every FLESHLAB release."], [CloudUpload, "Upload", "Add your first photos or videos in a simple, private and secure space built for new creators."], [CheckCircle2, "Team Review", "Our team personally reviews every submission for quality, authenticity and compliance, so you can publish with confidence."], [Clapperboard, "Go Live", "Your content becomes available across FLESHLAB and selected partner channels, helping more fans discover and support you."], [DollarSign, "Earn", "Track your earnings from your Creator Dashboard and receive regular payouts according to the current payout schedule."]];
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
  const journeyStepRefs = useRef([]);
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);

  useEffect(() => {
    const updateActiveStep = () => {
      const targetY = window.innerHeight * 0.46;
      let nextIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      journeyStepRefs.current.forEach((node, index) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - targetY);
        if (distance < closestDistance) {
          closestDistance = distance;
          nextIndex = index;
        }
      });

      setActiveJourneyStep(nextIndex);
    };

    updateActiveStep();
    window.addEventListener("scroll", updateActiveStep, { passive: true });
    window.addEventListener("resize", updateActiveStep);
    return () => {
      window.removeEventListener("scroll", updateActiveStep);
      window.removeEventListener("resize", updateActiveStep);
    };
  }, []);

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
              <motion.h1 initial={{ opacity: 1, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.86, delay: 0.08 }} className="fl-condensed text-[66px] uppercase leading-[0.85] tracking-[-0.035em] md:text-[88px] lg:text-[104px]">REAL PEOPLE.<br /><span className="text-[#f0183d]">REAL DESIRE.</span></motion.h1>
              <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.2 }} className="mt-6 max-w-[390px] text-[18px] font-semibold leading-7 text-white/88">Every creator has a story. Every production starts with a real person. Meet the people behind authentic amateur productions.</motion.p>
              <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.32 }} className="mt-8 flex gap-3"><a href="#creator-stories" className="w-[182px] rounded bg-[#f0183d] py-3.5 text-center text-[10px] font-black uppercase tracking-wide transition hover:-translate-y-0.5 hover:bg-[#ff3152]">MEET CREATORS</a><a href="/become-performer" className="w-[182px] rounded border border-white/45 bg-black/25 py-3.5 text-center text-[10px] font-black uppercase tracking-wide transition hover:-translate-y-0.5 hover:border-[#f0183d]">BECOME CREATOR</a></motion.div>
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
                <p className="mt-2 text-sm leading-6 text-white/72">“I filmed my first production using only my phone.”</p>
              </div>
            </div>
            <aside className="hidden items-center justify-end lg:flex"><div className="w-[220px] space-y-5 rounded border border-white/14 bg-black/38 p-6 backdrop-blur-md">{[[Camera, "PHONE READY"], [Clapperboard, "STUDIO REVIEW"], [ShieldCheck, "PRIVATE & SAFE"], [DollarSign, "CREATOR INCOME"]].map(([Icon, label]) => <div key={label} className="flex items-center gap-4"><Icon className="h-6 w-6 text-[#f0183d]" /><div className="text-[10px] font-black uppercase leading-4 text-white/86">{label}</div></div>)}</div></aside>
          </div>
        </section>

        <section className="border-b border-white/8 bg-[#080e11]"><div className="mx-auto grid max-w-[1360px] gap-4 px-5 py-4 md:grid-cols-5 lg:px-7">{trustItems.map(([Icon, title, body], index) => <div key={title} className="flex gap-3"><Icon className="h-6 w-6 shrink-0 text-[#f0183d]" /><div><h3 className="text-[10px] font-black uppercase">{title}</h3><p className="mt-1 text-[9px] leading-4 text-white/54">{body}</p>{index === 0 && <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-white/82">300+ videos</p>}{index === 2 && <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-white/82">4K productions</p>}{index === 4 && <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-white/82">5 countries</p>}</div></div>)}</div></section>

        <CreatorStoriesSection performers={performers} />

        <SectionReveal id="paths" className="mx-auto max-w-[1360px] px-5 py-14 lg:px-7">
          <div className="mb-8 max-w-xl"><h2 className="fl-condensed text-[48px] uppercase leading-none tracking-[-0.02em] text-white/90">CHOOSE <span className="text-[#f0183d]">YOUR</span> PATH</h2><p className="mt-2 text-sm text-white/50">Four entrances into the FLESHLAB creator ecosystem.</p></div>
          <div className="grid gap-5 md:grid-cols-2">{paths.map(([Icon, title, body, href, image], index) => <motion.a key={title} href={href} initial={{ opacity: 1, y: 0 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.62, delay: index * 0.08 }} className="group relative min-h-[330px] overflow-hidden rounded-xl border border-white/12 bg-[#0a1115] p-7"><MediaImage src={image} alt={title} className="absolute inset-0 h-full w-full object-cover object-[center_38%] opacity-66 transition duration-700 group-hover:scale-105 group-hover:opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/42 to-black/8" /><div className="relative flex h-full flex-col justify-between"><Icon className="h-10 w-10 text-[#f0183d]" /><div><h3 className="fl-condensed text-[56px] uppercase leading-none tracking-[-0.02em]">{title}</h3><p className="mt-3 max-w-[360px] text-sm leading-6 text-white/74">{body}</p></div><ChevronRight className="absolute bottom-0 right-0 h-6 w-6 transition group-hover:translate-x-1" /></div></motion.a>)}</div>
        </SectionReveal>

        <HumanMomentsSection />

        <SectionReveal id="journey" className="relative overflow-hidden border-y border-white/8 bg-[#05090c] px-5 pb-24 pt-20 lg:px-7">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-10 max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">CREATOR JOURNEY</p>
              <h2 className="fl-condensed mt-3 text-[58px] uppercase leading-none tracking-[-0.02em] text-white/92">YOUR FIRST STEPS AS A CREATOR.</h2>
              <p className="mt-4 text-base leading-7 text-white/60">A simple, guided path from joining FLESHLAB to publishing your first work, growing your audience and getting paid.</p>
            </div>
            <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
              <div className="relative space-y-6 pb-3">
                <div className="absolute bottom-12 left-8 top-10 w-px bg-white/10" />
                <motion.div animate={{ height: `${Math.min(100, ((activeJourneyStep + 1) / journey.length) * 100)}%` }} transition={{ duration: 0.45, ease: "easeOut" }} className="absolute left-8 top-10 max-h-[calc(100%-5.5rem)] w-px bg-gradient-to-b from-[#f0183d] via-[#f0183d] to-[#f0183d]/20 shadow-[0_0_18px_rgba(240,24,61,0.65)]" />
                {journey.map(([Icon, title, body], index) => {
                  const isActive = activeJourneyStep === index;
                  return (
                    <motion.div key={title} ref={(node) => { journeyStepRefs.current[index] = node; }} initial={{ opacity: 0.45, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.55 }} transition={{ duration: 0.5, delay: index * 0.03 }} className={`relative grid min-h-[112px] gap-5 rounded-xl border p-5 pl-24 backdrop-blur transition duration-500 md:grid-cols-[180px_1fr] ${isActive ? "border-[#f0183d]/80 bg-[#16070b] shadow-[0_0_42px_rgba(240,24,61,0.16)]" : "border-white/10 bg-black/24"}`}>
                      <motion.div animate={isActive ? { scale: [1, 1.1, 1], rotate: [0, -3, 3, 0] } : { scale: 1, rotate: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} className={`absolute left-0 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border bg-[#07090b] transition duration-500 ${isActive ? "border-[#f0183d] text-[#f0183d] shadow-[0_0_26px_rgba(240,24,61,0.38)]" : "border-white/18 text-white/42"}`}>
                        <Icon className="h-7 w-7" />
                      </motion.div>
                      <div>
                        <div className={`text-[10px] font-black transition ${isActive ? "text-[#f0183d]" : "text-white/35"}`}>0{index + 1}</div>
                        <h3 className="fl-condensed text-[32px] uppercase leading-none">{title}</h3>
                      </div>
                      <p className={`text-sm leading-6 transition ${isActive ? "text-white/82" : "text-white/56"}`}>{body}</p>
                    </motion.div>
                  );
                })}
              </div>
              <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-2xl border border-[#f0183d]/35 bg-[#12060a] p-6">
                  <Sparkles className="mb-5 h-9 w-9 text-[#f0183d]" />
                  <h3 className="text-lg font-black uppercase">Start with confidence</h3>
                  <p className="mt-3 text-sm leading-6 text-white/62">You do not need to have everything figured out. FLESHLAB guides you from your first account to your first audience.</p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/[0.035] p-6">
                  <CheckCircle2 className="mb-5 h-9 w-9 text-[#f0183d]" />
                  <h3 className="text-lg font-black uppercase">Real people review your work</h3>
                  <p className="mt-3 text-sm leading-6 text-white/62">Personal review helps protect your reputation, keeps the platform trusted and gives every release a stronger chance to succeed.</p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-black/26 p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f0183d]">What creators tell us</p>
                  <p className="mt-3 text-lg font-semibold leading-7 text-white/78">“I knew what would happen next at every step.”</p>
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>

        <AudienceExpansion performers={performers} />


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
                <p className="mt-3 text-lg font-semibold leading-7 text-white/78">“The team helped me through every step.”</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {trustQuestions.map(([Icon, question, answer], index) => <motion.div key={question} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: index * 0.04 }} className="rounded-2xl border border-white/12 bg-black/26 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#f0183d]/55 hover:bg-black/36"><Icon className="mb-5 h-8 w-8 text-[#f0183d]" /><h3 className="text-base font-black uppercase leading-tight">{question}</h3><p className="mt-3 text-sm leading-6 text-white/62">{answer}</p></motion.div>)}
            </div>
          </div>
        </SectionReveal>


        <div id="partners">
          <FinalBrandFooter />
        </div>
      </main>
    </div>
  );
}