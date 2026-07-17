import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Camera, Clapperboard, CloudUpload, ExternalLink, HeartHandshake, Play, Radio, Send, ShieldCheck, Smartphone, Sparkles, Users, Wifi } from "lucide-react";
import MediaImage from "@/components/homeTube/MediaImage";
import AnimatedCounter from "@/components/landingV2/AnimatedCounter";

const fanImage = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/4ecf7441b_generated_image.png";

const nodes = [
  { key: "CREATE", icon: Smartphone, detail: "Studio & homemade starts" },
  { key: "UPLOAD", icon: CloudUpload, detail: "Secure media pipeline" },
  { key: "FLESHLAB", icon: ShieldCheck, detail: "Review, rights and trust" },
  { key: "VIDEOS", icon: Play, detail: "300+ published releases" },
  { key: "LIVE", icon: Radio, detail: "Scheduled live earning" },
  { key: "COMMUNITY", icon: Users, detail: "Creator-fan signals" },
  { key: "FAN PRODUCTIONS", icon: HeartHandshake, detail: "Fans join the story" }
];

const createSources = [[Smartphone, "Homemade Productions", "Start with a phone and a room."], [Camera, "Studio Productions", "Upgrade into crew-supported 4K shoots."], [Radio, "Live Cam", "Build daily interaction and income."]];
const platforms = [["xHamster", "Global discovery channel for selected FLESHLAB releases."], ["FapHouse", "Premium distribution for creator-led fan experiences."], ["LoyalFans", "Direct fan monetization and creator community access."], ["Clip4Sale", "Niche clip distribution for future premium collections."]];
const livePlatforms = ["FLESHLIVE", "BongaCams", "xHamster Live", "Future Live Platforms"];
const schedule = [["Kraken", "20:00"], ["Alex", "22:00"], ["Kevin", "23:30"]];
const community = [["Instagram", "Behind-the-scenes hotel story posted", "24.8K"], ["Facebook", "Studio update and creator feature", "12.4K"], ["X", "Tonight's live schedule preview", "18.1K"], ["TikTok", "Creator journey teaser", "41.6K"], ["YouTube", "Production diary trailer", "8.9K"]];
const fanSteps = ["Connect", "Apply", "Meet", "Production", "Published"];

function Wordmark({ children }) {
  return <div className="fl-condensed text-[30px] uppercase leading-none tracking-[-0.015em] text-white">{children}</div>;
}

function SectionTitle({ eyebrow, title, body }) {
  return <div className="max-w-xl"><p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">{eyebrow}</p><h3 className="fl-condensed mt-3 text-[48px] uppercase leading-none tracking-[-0.02em] text-white">{title}</h3>{body && <p className="mt-3 text-sm leading-6 text-white/60">{body}</p>}</div>;
}

function FlowNode({ node, index, active, setActive }) {
  const Icon = node.icon;
  const isActive = active === node.key;

  return (
    <motion.button type="button" onMouseEnter={() => setActive(node.key)} onFocus={() => setActive(node.key)} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.52, delay: index * 0.05 }} className={`group relative rounded-2xl border p-4 text-left transition duration-500 ${isActive ? "border-[#f0183d] bg-[#17070c] shadow-[0_0_42px_rgba(240,24,61,0.2)]" : "border-white/12 bg-white/[0.035] hover:border-[#f0183d]/65"}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${isActive ? "border-[#f0183d] bg-[#f0183d]/12 text-[#f0183d]" : "border-white/14 text-white/62"}`}><Icon className="h-5 w-5" /></span>
        <span className="text-[9px] font-black text-white/30">0{index + 1}</span>
      </div>
      <div className="fl-condensed text-[27px] uppercase leading-none">{node.key}</div>
      <p className="mt-3 min-h-[40px] text-[11px] leading-5 text-white/50">{node.detail}</p>
      {index < nodes.length - 1 && <div className="absolute -right-4 top-1/2 hidden h-px w-8 overflow-hidden bg-[#f0183d]/35 lg:block"><motion.span animate={{ x: ["-100%", "140%"] }} transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut", delay: index * 0.16 }} className="block h-px w-5 bg-[#f0183d] shadow-[0_0_12px_rgba(240,24,61,0.9)]" /></div>}
    </motion.button>
  );
}

export default function FleshlabEcosystem() {
  const [active, setActive] = useState("FLESHLAB");

  return (
    <section id="ecosystem" className="relative overflow-hidden border-y border-white/8 bg-[#040709] px-5 py-20 text-white lg:px-7">
      <motion.div animate={{ x: [0, 32, 0], y: [0, -18, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} className="absolute left-[8%] top-20 h-48 w-48 rounded-full bg-[#f0183d]/10 blur-3xl" />
      <motion.div animate={{ x: [0, -28, 0], y: [0, 20, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-28 right-[10%] h-56 w-56 rounded-full bg-white/8 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(240,24,61,0.18),transparent_34%),radial-gradient(circle_at_78%_68%,rgba(255,136,64,0.08),transparent_30%)]" />
      <div className="absolute inset-0 bg-kinetic-grid opacity-25" />

      <div className="relative mx-auto max-w-[1360px]">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#f0183d]">THE FLESHLAB ECOSYSTEM</p>
          <h2 className="fl-condensed mt-4 text-[70px] uppercase leading-[0.9] tracking-[-0.025em] md:text-[88px]">A CREATOR NETWORK THAT MOVES.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/62">Create, upload, review, publish, go live, build community and unlock fan productions — one connected system around real people.</p>
        </div>

        <div className="relative mb-14 rounded-[2rem] border border-white/12 bg-black/30 p-5 shadow-[0_0_90px_rgba(240,24,61,0.1)] backdrop-blur md:p-8">
          <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_45%,rgba(240,24,61,0.12),transparent_36%)]" />
          <motion.div initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.75 }} className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-full border border-[#f0183d]/50 bg-[#12060a] shadow-[0_0_70px_rgba(240,24,61,0.28)]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }} className="absolute inset-[-12px] rounded-full border border-dashed border-[#f0183d]/24" />
            <div className="absolute inset-3 rounded-full border border-white/10" />
            <div className="text-center"><div className="text-[23px] font-black tracking-[-0.06em]">FLESH<span className="text-[#f0183d]">LAB</span></div><div className="mt-1 text-[7px] font-black uppercase tracking-[0.42em] text-white/55">network core</div></div>
          </motion.div>
          <div className="relative mb-7 hidden overflow-hidden rounded-full border border-white/10 bg-black/24 px-5 py-3 lg:block">
            <div className="absolute left-6 right-6 top-1/2 h-px -translate-y-1/2 bg-white/10" />
            <motion.div animate={{ x: ["-20%", "120%"] }} transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/2 h-px w-1/3 -translate-y-1/2 bg-[#f0183d] shadow-[0_0_18px_rgba(240,24,61,0.95)]" />
            <div className="relative flex items-center justify-between">
              {nodes.map((node) => <span key={node.key} className="rounded-full border border-white/10 bg-[#05090c] px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/72">{node.key}</span>)}
            </div>
          </div>
          <div className="relative grid gap-3 lg:grid-cols-7">
            {nodes.map((node, index) => <FlowNode key={node.key} node={node} index={index} active={active} setActive={setActive} />)}
          </div>
          <div className="relative mt-7 grid gap-4 md:grid-cols-3">
            <AnimatedCounter value={300} suffix="+" label="videos" note="A growing library of published stories." className="rounded-2xl border border-white/10 bg-black/24 p-5" />
            <div className="rounded-2xl border border-white/10 bg-black/24 p-5"><div className="fl-condensed text-[38px] uppercase leading-none tracking-[-0.02em] text-white">4K</div><div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#f0183d]">productions</div><p className="mt-2 text-xs leading-5 text-white/48">Premium presentation without losing authenticity.</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/24 p-5"><div className="fl-condensed text-[38px] uppercase leading-none tracking-[-0.02em] text-white">Weekly</div><div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#f0183d]">payouts</div><p className="mt-2 text-xs leading-5 text-white/48">Clear earning rhythm for creators.</p></div>
          </div>
        </div>

        <div className="grid gap-8">
          <motion.div onMouseEnter={() => setActive("CREATE")} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#070b0e] p-7 md:p-9">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]"><SectionTitle eyebrow="01 / Create + Upload" title="From phone-first to studio-supported" body="Creators can begin with homemade uploads, step into studio production and expand into live earning without leaving the FLESHLAB network." />
              <div className="relative min-h-[250px] rounded-2xl border border-white/10 bg-black/24 p-6">
                <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f0183d]/45 bg-[#12060a] shadow-[0_0_48px_rgba(240,24,61,0.18)]"><div className="flex h-full items-center justify-center text-center text-[13px] font-black uppercase leading-4">FLESHLAB<br /><span className="text-[#f0183d]">Platform</span></div></div>
                <div className="grid gap-4 md:grid-cols-3">{createSources.map(([Icon, title, body], index) => <div key={title} className="relative rounded-xl border border-white/12 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-[#f0183d]/60"><Icon className="mb-5 h-8 w-8 text-[#f0183d]" /><h4 className="text-sm font-black uppercase leading-tight">{title}</h4><p className="mt-2 text-xs leading-5 text-white/52">{body}</p><span className={`fl-flow-dot fl-flow-dot-${index + 1}`} /></div>)}</div>
              </div></div>
          </motion.div>

          <motion.div onMouseEnter={() => setActive("VIDEOS")} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="rounded-[2rem] border border-white/12 bg-[#05090c] p-7 md:p-9">
            <SectionTitle eyebrow="02 / Videos + Distribution" title="A premium library with global reach" body="FLESHLAB turns creator uploads into releases, then connects them to controlled distribution surfaces where the story can keep growing." />
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{platforms.map(([name, description], index) => <motion.a key={name} href="#" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.46, delay: index * 0.06 }} className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-[#f0183d]/70"><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#f0183d]/10 blur-2xl" /><Wordmark>{name}</Wordmark><p className="mt-4 min-h-[66px] text-xs leading-5 text-white/56">{description}</p><span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#f0183d]/60 px-4 py-2 text-[9px] font-black uppercase text-[#f0183d] transition group-hover:bg-[#f0183d] group-hover:text-white">Watch Here <ExternalLink className="h-3.5 w-3.5" /></span></motion.a>)}</div>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div onMouseEnter={() => setActive("LIVE")} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-[2rem] border border-[#f0183d]/30 bg-[#13060a] p-7 md:p-9">
              <div className="absolute right-7 top-7 flex items-center gap-2 rounded-full border border-[#f0183d]/40 bg-black/28 px-4 py-2"><span className="fl-live-pulse" /><span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#f0183d]">Live ecosystem</span></div>
              <SectionTitle eyebrow="03 / Live" title="Daily energy, real interaction" body="Live is its own branch of the network — scheduled, direct and built for creator-fan trust." />
              <div className="mt-8 flex flex-wrap gap-3">{livePlatforms.map((name) => <span key={name} className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-[10px] font-black uppercase text-white/72">{name}</span>)}</div>
              <div className="mt-8 rounded-2xl border border-white/12 bg-black/24 p-5"><div className="mb-4 flex items-center justify-between"><h4 className="text-sm font-black uppercase">Tonight</h4><Wifi className="h-5 w-5 text-[#f0183d]" /></div>{schedule.map(([name, time]) => <div key={name} className="flex items-center justify-between border-t border-white/8 py-4"><span className="text-base font-black uppercase">{name}</span><span className="font-mono text-lg text-[#f0183d]">{time}</span></div>)}</div>
            </motion.div>

            <motion.div onMouseEnter={() => setActive("COMMUNITY")} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="rounded-[2rem] border border-white/12 bg-[#070b0e] p-7 md:p-9">
              <SectionTitle eyebrow="04 / Community" title="A social hub, not an icon row" body="Every channel becomes a living surface for updates, previews, creator moments and future API-driven activity." />
              <div className="mt-7 space-y-3">{community.map(([name, activity, followers]) => <div key={name} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#f0183d]/55"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0183d]/12 text-[11px] font-black uppercase text-[#f0183d]">{name.slice(0, 2)}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-3"><h4 className="text-sm font-black uppercase">{name}</h4><span className="text-[10px] text-white/38">{followers} followers</span></div><p className="truncate text-xs text-white/54">{activity}</p></div><button className="rounded-full border border-white/14 px-4 py-2 text-[9px] font-black uppercase text-white/72 transition group-hover:border-[#f0183d] group-hover:text-[#f0183d]">Follow</button></div>)}</div>
            </motion.div>
          </div>

          <motion.div onMouseEnter={() => setActive("FAN PRODUCTIONS")} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-[2rem] border border-[#f0183d]/30 bg-[#110509]">
            <MediaImage src={fanImage} alt="Fan production ecosystem" className="absolute inset-y-0 right-0 hidden h-full w-[54%] object-cover object-[center_38%] opacity-76 lg:block" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#110509] via-[#110509]/88 to-[#110509]/25" />
            <div className="relative max-w-3xl p-7 md:p-10"><SectionTitle eyebrow="05 / Fan Productions" title="Fans can become part of the story" body="Fans are not only watching. They can apply, connect with the studio, meet the performer, film a real production and see the project published." />
              <div className="mt-9 grid gap-3 sm:grid-cols-5">{fanSteps.map((step, index) => <div key={step} className="relative rounded-xl border border-white/12 bg-black/24 p-4 transition hover:-translate-y-1 hover:border-[#f0183d]/60"><div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#f0183d]/70 text-[10px] font-black text-[#f0183d]">{index + 1}</div><h4 className="text-[10px] font-black uppercase leading-4">{step}</h4>{index < fanSteps.length - 1 && <Send className="absolute -right-3 top-7 hidden h-5 w-5 text-[#f0183d] sm:block" />}</div>)}</div>
              <a href="/fan-productions" className="mt-9 inline-flex items-center gap-10 rounded bg-[#f0183d] px-7 py-3 text-[10px] font-black uppercase tracking-wide transition hover:-translate-y-0.5 hover:bg-[#ff3152]">Explore Fan Productions <ArrowRight className="h-4 w-4" /></a></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}