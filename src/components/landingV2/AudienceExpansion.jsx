import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Camera, Clapperboard, Crown, DollarSign, Film, Globe2, Handshake, HeartHandshake, Play, Radio, ShieldCheck, Smartphone, Sparkles, Star, Users, Video, Wallet } from "lucide-react";
import MediaImage from "@/components/homeTube/MediaImage";
import AnimatedCounter from "@/components/landingV2/AnimatedCounter";
import { buildPublicAssetUrl } from "@/lib/videoAssetResolver";

const images = {
  hotel: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/d35df4180_generated_image.png",
  beach: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/5b2120e6a_generated_image.png",
  massage: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/fcaf5cd40_generated_image.png",
  student: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/b8b8e17cc_generated_image.png",
  gym: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/5dcc0f51a_generated_image.png",
  home: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/cdc27160e_generated_image.png",
  fan: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/ee7e890ef_generated_image.png",
  creator: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a3babcb65_generated_image.png",
  partner: "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4b2a370cb_generated_image.png"
};

const productions = [
  ["Hotel Sessions", "Private rooms, first nights and real creator energy.", images.hotel],
  ["Beach Escape", "Travel heat, vacation freedom and intimate stories.", images.beach],
  ["Massage Stories", "Warm rooms, slow tension and premium atmosphere.", images.massage],
  ["Student Life", "Adult city life, privacy and ambition on screen.", images.student],
  ["Gym Sessions", "Fitness confidence with after-hours cinematic energy.", images.gym],
  ["Home Made", "Personal, direct and authentically lived-in moments.", images.home]
];

const featuredCreators = [
  ["jameson", "Jameson", "Philippines", "Hi, I'm Jameson. I started with simple, real moments and turned them into my first FLESHLAB releases.", "https://video.fleshlab.online/performers/jameson/profile.png"],
  ["the-fitmaster", "TheFitmaster", "Filipino", "Hi, I'm TheFitmaster. Fitness, confidence and real personality are what I bring on camera.", "https://video.fleshlab.online/performers/the-fitmaster/profile.jpg"],
  ["zed", "ZED", "Manila, Philippines", "Hi, I'm ZED. I like when a production feels honest, direct and close to real life.", "https://video.fleshlab.online/performers/zed/profile.jpg"]
];

function Title({ eyebrow, title, body }) {
  return <div className="max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#f0183d]">{eyebrow}</p><h2 className="fl-condensed mt-3 text-[58px] uppercase leading-[0.92] tracking-[-0.02em] text-white/94 md:text-[76px]">{title}</h2>{body && <p className="mt-4 text-base leading-7 text-white/60">{body}</p>}</div>;
}

function WhyFleshlab() {
  const reasons = [[Users, "REAL AMATEURS", "Real people instead of professional performers."], [Film, "AUTHENTIC STORIES", "Productions built around lived experiences."], [Crown, "EXCLUSIVE RELEASES", "Original FLESHLAB productions you cannot find everywhere."], [HeartHandshake, "SUPPORT CREATORS", "Your attention helps real creators grow."]];
  return <section className="relative overflow-hidden border-y border-white/8 bg-[#05080a] px-5 py-20 lg:px-7"><MediaImage src={images.hotel} alt="FLESHLAB authentic production" className="absolute inset-0 h-full w-full object-cover opacity-34" /><div className="absolute inset-0 bg-gradient-to-r from-black via-black/76 to-black/28" /><div className="relative mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[0.8fr_1.2fr]"><Title eyebrow="WHY FLESHLAB?" title="WHY WATCH HERE?" body="Because amateur should feel real, premium and worth following." /><div className="grid gap-4 sm:grid-cols-2">{reasons.map(([Icon, title, body], index) => <motion.div key={title} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: index * 0.06 }} className="rounded-2xl border border-white/12 bg-black/38 p-6 backdrop-blur"><Icon className="mb-5 h-9 w-9 text-[#f0183d]" /><h3 className="text-lg font-black uppercase">{title}</h3><p className="mt-3 text-sm leading-6 text-white/62">{body}</p></motion.div>)}</div></div></section>;
}

function FeaturedProductions() {
  return <section className="bg-[#040709] px-5 py-20 lg:px-7"><div className="mx-auto max-w-[1360px]"><Title eyebrow="FEATURED PRODUCTIONS" title="ENTER A MOVIE, NOT A THUMBNAIL." body="Original worlds built around creators, locations and real chemistry." /><div className="mt-10 grid gap-5 lg:grid-cols-3">{productions.map(([title, body, image], index) => <motion.a key={title} href="/videos" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.22 }} transition={{ duration: 0.55, delay: index * 0.05 }} className="group relative h-[520px] overflow-hidden rounded-[1.5rem] border border-white/12 bg-black shadow-[0_28px_90px_rgba(0,0,0,0.38)]"><MediaImage src={image} alt={title} className="absolute inset-0 h-full w-full object-cover object-[center_38%] opacity-86 transition duration-[1200ms] group-hover:scale-110 group-hover:opacity-100" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-7"><p className="mb-3 text-[9px] font-black uppercase tracking-[0.24em] text-[#f0183d]">FLESHLAB ORIGINAL</p><h3 className="fl-condensed text-[50px] uppercase leading-none">{title}</h3><p className="mt-3 min-h-[48px] text-sm leading-6 text-white/68">{body}</p><span className="mt-5 inline-flex items-center gap-3 rounded-full border border-white/18 bg-black/30 px-5 py-2 text-[10px] font-black uppercase transition group-hover:border-[#f0183d] group-hover:text-[#f0183d]">Explore <ArrowRight className="h-4 w-4" /></span></div></motion.a>)}</div></div></section>;
}

function MeetCreators({ performers }) {
  const creators = featuredCreators.map(([slug, name, country, intro, image]) => {
    const match = performers?.find((p) => String(p.slug || p.display_name || "").toLowerCase().replace(/[_\s]/g, "-").includes(slug));
    return [name, match?.nationality || country, intro, buildPublicAssetUrl(match?.profile_image_url || match?.cover_image_url) || image];
  });
  return <section className="border-y border-white/8 bg-[#080d10] px-5 py-20 lg:px-7"><div className="mx-auto max-w-[1360px]"><Title eyebrow="MEET THE CREATORS" title="REAL PEOPLE. REAL FIRST STEPS." body="Friendly portraits, personal stories and creators you can actually follow." /><div className="mt-10 grid gap-5 md:grid-cols-3">{creators.map(([name, country, intro, image], index) => <motion.div key={name} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.5, delay: index * 0.08 }} className="overflow-hidden rounded-[1.5rem] border border-white/12 bg-black/28"><MediaImage src={image} alt={name} className="h-[360px] w-full object-cover object-[center_35%]" /><div className="p-6"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f0183d]">{country}</p><h3 className="fl-condensed mt-2 text-[42px] uppercase leading-none">{name}</h3><p className="mt-4 text-sm leading-6 text-white/68">“{intro}”</p></div></motion.div>)}</div></div></section>;
}

function FanProductionsPremium() {
  const steps = [[Play, "Watch"], [Sparkles, "Apply"], [Users, "Meet Creator"], [Camera, "Production"], [Clapperboard, "Release"]];
  return <section id="fan-productions" className="relative overflow-hidden border-y border-[#f0183d]/28 bg-[#110509] px-5 py-24 lg:px-7"><MediaImage src={images.fan} alt="Premium fan production" className="absolute inset-y-0 right-0 hidden h-full w-[54%] object-cover opacity-78 lg:block" /><div className="absolute inset-0 bg-gradient-to-r from-[#110509] via-[#110509]/92 to-[#110509]/30" /><div className="relative mx-auto max-w-[1360px]"><Title eyebrow="FAN PRODUCTIONS" title="WATCH IT. APPLY. BECOME PART OF THE STORY." body="A premium experience where fans can apply to join a real FLESHLAB production with a creator." /><div className="mt-10 grid gap-4 lg:grid-cols-5">{steps.map(([Icon, label], index) => <motion.div key={label} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.45, delay: index * 0.08 }} className="relative rounded-2xl border border-white/12 bg-black/34 p-6 backdrop-blur"><div className="mb-7 flex h-12 w-12 items-center justify-center rounded-full border border-[#f0183d]/70 text-[#f0183d]"><Icon className="h-6 w-6" /></div><p className="text-[10px] font-black text-[#f0183d]">0{index + 1}</p><h3 className="fl-condensed mt-1 text-[34px] uppercase leading-none">{label}</h3>{index < steps.length - 1 && <ArrowRight className="absolute -right-4 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-[#f0183d] lg:block" />}</motion.div>)}</div><a href="/fan-productions" className="mt-10 inline-flex items-center gap-8 rounded bg-[#f0183d] px-8 py-3 text-[10px] font-black uppercase tracking-wide transition hover:-translate-y-0.5 hover:bg-[#ff3152]">Start your project <ArrowRight className="h-4 w-4" /></a></div></section>;
}

function LiveExperiences() {
  const schedule = [["Kraken", "20:00", "FLESHLAB Live"], ["Alex", "22:00", "BongaCams"], ["Kevin", "23:30", "xHamster Live"]];
  return <section className="bg-[#05090c] px-5 py-20 lg:px-7"><div className="mx-auto grid max-w-[1360px] gap-8 lg:grid-cols-[0.85fr_1.15fr]"><Title eyebrow="LIVE EXPERIENCES" title="CREATORS ARE LIVE, TOO." body="Follow scheduled streams, featured creators and future live partners from one connected FLESHLAB world." /><div className="rounded-[1.5rem] border border-white/12 bg-white/[0.035] p-6"><div className="mb-5 flex items-center gap-3"><span className="fl-live-pulse" /><h3 className="text-sm font-black uppercase">Upcoming streams</h3></div>{schedule.map(([name, time, platform]) => <div key={name} className="flex items-center justify-between border-t border-white/8 py-5"><div><p className="text-lg font-black uppercase">{name}</p><p className="text-xs text-white/45">{platform}</p></div><span className="font-mono text-xl text-[#f0183d]">{time}</span></div>)}<div className="mt-5 flex flex-wrap gap-3">{["FLESHLAB Live", "BongaCams", "xHamster Live", "Future Live Partners"].map((p) => <span key={p} className="rounded-full border border-white/12 px-4 py-2 text-[10px] font-black uppercase text-white/64">{p}</span>)}</div></div></div></section>;
}

function PartnerWithFleshlab() {
  const items = [[Video, "Premium amateur niche"], [BadgeCheck, "Reliable creator verification"], [Camera, "4K productions"], [Globe2, "Multi-platform distribution"], [ShieldCheck, "Professional rights management"], [Handshake, "Clear communication"]];
  return <section id="partners" className="relative overflow-hidden border-y border-white/8 bg-[#04070a] px-5 py-20 lg:px-7"><div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(240,24,61,0.18),transparent_30%),radial-gradient(circle_at_78%_30%,rgba(215,181,109,0.10),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_45%)]" /><svg className="absolute inset-0 h-full w-full opacity-35" viewBox="0 0 1200 360" preserveAspectRatio="none" aria-hidden="true"><path d="M90 210 C260 80 420 125 565 185 S850 300 1110 115" fill="none" stroke="rgba(240,24,61,0.62)" strokeWidth="1.2" /><path d="M150 285 C330 180 475 245 625 160 S910 80 1070 235" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />{[150, 330, 535, 720, 925, 1070].map((x, index) => <circle key={x} cx={x} cy={[205, 150, 190, 250, 135, 220][index]} r={index === 2 ? "6" : "4"} fill={index === 2 ? "#f0183d" : "rgba(255,255,255,0.56)"} />)}</svg><motion.div animate={{ x: ["-10%", "10%", "-10%"], opacity: [0.16, 0.28, 0.16] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute left-1/4 top-14 h-px w-1/2 bg-gradient-to-r from-transparent via-[#f0183d] to-transparent" /><div className="relative mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[0.9fr_1.1fr]"><Title eyebrow="PARTNER WITH FLESHLAB" title="A PROFESSIONAL HOME FOR PREMIUM AMATEUR CONTENT." body="For platforms, studios, agencies, affiliates and distribution partners who value verified creators and clean communication." /><div className="grid gap-4 sm:grid-cols-2">{items.map(([Icon, label]) => <div key={label} className="rounded-2xl border border-white/12 bg-black/34 p-5 backdrop-blur"><Icon className="mb-4 h-7 w-7 text-[#f0183d]" /><h3 className="text-sm font-black uppercase leading-tight">{label}</h3></div>)}</div></div></section>;
}

function NetworkExpansion() {
  const nodes = [[Smartphone, "CREATE"], [Camera, "PRODUCE"], [ShieldCheck, "FLESHLAB"], [Play, "WATCH"], [Radio, "LIVE"], [Users, "COMMUNITY"], [HeartHandshake, "FAN EXPERIENCES"], [Handshake, "PARTNERS"]];
  return <section className="relative overflow-hidden bg-[#040709] px-5 py-20 lg:px-7"><div className="absolute inset-0 bg-kinetic-grid opacity-20" /><div className="relative mx-auto max-w-[1360px]"><Title eyebrow="THE FLESHLAB NETWORK" title="ONE ECOSYSTEM AROUND REAL CREATORS." body="Creation, productions, fans, live experiences and partners all connect back to the same verified creator network." /><div className="mt-10 grid gap-3 lg:grid-cols-8">{nodes.map(([Icon, label], index) => <motion.div key={label} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.45, delay: index * 0.05 }} className="relative rounded-2xl border border-white/12 bg-white/[0.035] p-5"><Icon className="mb-5 h-7 w-7 text-[#f0183d]" /><h3 className="fl-condensed text-[28px] uppercase leading-none">{label}</h3>{index < nodes.length - 1 && <span className="absolute -right-2 top-1/2 hidden h-px w-4 bg-[#f0183d] lg:block" />}</motion.div>)}</div></div></section>;
}

function PartnerStrengths() {
  const stats = [[17, "performers", "Verified adults across active markets."], [300, "videos", "A growing original content library."], [5, "countries", "Regional stories with global audience appeal."]];
  const strengths = ["4K Productions", "Studio + Homemade", "Growing Creator Network", "Verified Performers", "Professional Review Process"];
  return <section className="border-y border-white/8 bg-[#080d10] px-5 py-20 lg:px-7"><div className="mx-auto max-w-[1360px]"><Title eyebrow="WHY PARTNERS CHOOSE FLESHLAB" title="REAL BUSINESS STRENGTHS, NOT EMPTY HYPE." body="A focused amateur platform with creator verification, production standards and room to grow." /><div className="mt-10 grid gap-4 md:grid-cols-3">{stats.map(([value, label, note]) => <AnimatedCounter key={label} value={value} suffix={label === "videos" ? "+" : ""} label={label} note={note} className="rounded-2xl border border-white/12 bg-black/26 p-6" />)}</div><div className="mt-6 flex flex-wrap gap-3">{strengths.map((item) => <span key={item} className="rounded-full border border-[#f0183d]/40 bg-[#12060a] px-5 py-2 text-[10px] font-black uppercase tracking-wide text-white/74">{item}</span>)}</div></div></section>;
}

export default function AudienceExpansion({ performers = [] }) {
  return <><WhyFleshlab /><FeaturedProductions /><MeetCreators performers={performers} /><FanProductionsPremium /><LiveExperiences /><PartnerWithFleshlab /><NetworkExpansion /><PartnerStrengths /></>;
}