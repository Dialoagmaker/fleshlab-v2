import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Clapperboard, ExternalLink, Radio, Send, ShieldCheck, Smartphone, Sparkles, Users, Wifi } from "lucide-react";
import MediaImage from "@/components/homeTube/MediaImage";

const fanImage = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/21f88df13_generated_image.png";

const nodes = ["CREATE", "DISTRIBUTE", "GO LIVE", "COMMUNITY", "FAN PRODUCTIONS"];
const createSources = [[Smartphone, "Homemade Productions", "Phone-first uploads"], [Camera, "Studio Productions", "Crew-supported shoots"], [Radio, "Live Cam", "Daily live earning"]];
const platforms = [["xHamster", "Global discovery channel for selected FLESHLAB releases."], ["FapHouse", "Premium distribution for creator-led fan experiences."], ["LoyalFans", "Direct fan monetization and creator community access."], ["Clip4Sale", "Niche clip distribution for future premium collections."]];
const livePlatforms = ["FLESHLIVE", "BongaCams", "xHamster Live", "Future Live Platforms"];
const schedule = [["Kraken", "20:00"], ["Alex", "22:00"], ["Kevin", "23:30"]];
const community = [["Instagram", "Behind-the-scenes hotel story posted", "24.8K"], ["Facebook", "Studio update and performer feature", "12.4K"], ["X", "Tonight's live schedule preview", "18.1K"], ["TikTok", "Creator journey teaser", "41.6K"], ["YouTube", "Production diary trailer", "8.9K"]];
const fanSteps = ["Connect", "Apply", "Meet Performer", "Production", "Published"];

function Wordmark({ children }) {
  return <div className="fl-condensed text-[30px] uppercase leading-none tracking-[-0.015em] text-white">{children}</div>;
}

function SectionTitle({ eyebrow, title, body }) {
  return <div className="max-w-xl"><p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">{eyebrow}</p><h3 className="fl-condensed mt-3 text-[48px] uppercase leading-none tracking-[-0.02em] text-white">{title}</h3>{body && <p className="mt-3 text-sm leading-6 text-white/60">{body}</p>}</div>;
}

export default function FleshlabEcosystem() {
  const [active, setActive] = useState("CREATE");

  return (
    <section id="ecosystem" className="relative overflow-hidden border-y border-white/8 bg-[#040709] px-5 py-20 text-white lg:px-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(240,24,61,0.18),transparent_34%),radial-gradient(circle_at_78%_68%,rgba(255,136,64,0.08),transparent_30%)]" />
      <div className="absolute inset-0 bg-kinetic-grid opacity-25" />

      <div className="relative mx-auto max-w-[1360px]">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#f0183d]">THE FLESHLAB ECOSYSTEM</p>
          <h2 className="fl-condensed mt-4 text-[70px] uppercase leading-[0.9] tracking-[-0.025em] md:text-[88px]">ONE PLATFORM. MANY WAYS TO GROW.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/62">FLESHLAB connects creation, distribution, live shows, community and fan productions into one premium creator ecosystem.</p>
        </div>

        <div className="relative mb-14 rounded-[2rem] border border-white/12 bg-black/28 p-5 shadow-[0_0_80px_rgba(240,24,61,0.08)] backdrop-blur md:p-8">
          <div className="absolute left-1/2 top-8 hidden h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#f0183d]/45 to-transparent lg:block" />
          <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7 }} className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full border border-[#f0183d]/50 bg-[#12060a] shadow-[0_0_60px_rgba(240,24,61,0.25)]">
            <div className="absolute inset-3 rounded-full border border-white/10" />
            <div className="text-center"><div className="text-[22px] font-black tracking-[-0.06em]">FLESH<span className="text-[#f0183d]">LAB</span></div><div className="mt-1 text-[7px] font-black uppercase tracking-[0.42em] text-white/55">ecosystem</div></div>
          </motion.div>
          <div className="grid gap-3 lg:grid-cols-5">
            {nodes.map((node, index) => <motion.button key={node} type="button" onMouseEnter={() => setActive(node)} onFocus={() => setActive(node)} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: index * 0.06 }} className={`group relative rounded-2xl border p-5 text-left transition ${active === node ? "border-[#f0183d] bg-[#16070c] shadow-[0_0_34px_rgba(240,24,61,0.16)]" : "border-white/12 bg-white/[0.035] hover:border-[#f0183d]/60"}`}>
              <div className="mb-5 flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#f0183d]/60 text-[10px] font-black text-[#f0183d]">0{index + 1}</span><span className="h-2 w-2 rounded-full bg-[#f0183d] shadow-[0_0_18px_rgba(240,24,61,0.9)]" /></div>
              <div className="fl-condensed text-[30px] uppercase leading-none">{node}</div>
              {index < nodes.length - 1 && <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-[#f0183d]/55 lg:block" />}
            </motion.button>)}
          </div>
        </div>

        <div className="grid gap-8">
          <motion.div onMouseEnter={() => setActive("CREATE")} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#070b0e] p-7 md:p-9">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]"><SectionTitle eyebrow="01 / Create" title="Multiple ways to earn" body="Creators can start from homemade uploads, move into studio productions and expand into live cam earning without leaving the FLESHLAB ecosystem." />
              <div className="relative min-h-[250px] rounded-2xl border border-white/10 bg-black/24 p-6">
                <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f0183d]/45 bg-[#12060a] shadow-[0_0_48px_rgba(240,24,61,0.18)]"><div className="flex h-full items-center justify-center text-center text-[13px] font-black uppercase leading-4">FLESHLAB<br /><span className="text-[#f0183d]">Platform</span></div></div>
                <div className="grid gap-4 md:grid-cols-3">{createSources.map(([Icon, title, body], index) => <div key={title} className="relative rounded-xl border border-white/12 bg-white/[0.035] p-5"><Icon className="mb-5 h-8 w-8 text-[#f0183d]" /><h4 className="text-sm font-black uppercase leading-tight">{title}</h4><p className="mt-2 text-xs leading-5 text-white/52">{body}</p><span className={`fl-flow-dot fl-flow-dot-${index + 1}`} /></div>)}</div>
              </div></div>
          </motion.div>

          <motion.div onMouseEnter={() => setActive("DISTRIBUTE")} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="rounded-[2rem] border border-white/12 bg-[#05090c] p-7 md:p-9">
            <SectionTitle eyebrow="02 / Distribute" title="Available across premium platforms" body="FLESHLAB content is built for controlled distribution. Future platforms can be added without changing the ecosystem model." />
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{platforms.map(([name, description], index) => <motion.a key={name} href="#" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.46, delay: index * 0.06 }} className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-[#f0183d]/70"><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#f0183d]/10 blur-2xl" /><Wordmark>{name}</Wordmark><p className="mt-4 min-h-[66px] text-xs leading-5 text-white/56">{description}</p><span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#f0183d]/60 px-4 py-2 text-[9px] font-black uppercase text-[#f0183d] transition group-hover:bg-[#f0183d] group-hover:text-white">Watch Here <ExternalLink className="h-3.5 w-3.5" /></span></motion.a>)}</div>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div onMouseEnter={() => setActive("GO LIVE")} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-[2rem] border border-[#f0183d]/30 bg-[#13060a] p-7 md:p-9">
              <div className="absolute right-7 top-7 flex items-center gap-2 rounded-full border border-[#f0183d]/40 bg-black/28 px-4 py-2"><span className="fl-live-pulse" /><span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#f0183d]">Live ecosystem</span></div>
              <SectionTitle eyebrow="03 / Go Live" title="Daily energy, real shows" body="Live cam is its own branch of the ecosystem — fast-moving, scheduled and built for daily fan interaction." />
              <div className="mt-8 flex flex-wrap gap-3">{livePlatforms.map((name) => <span key={name} className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-[10px] font-black uppercase text-white/72">{name}</span>)}</div>
              <div className="mt-8 rounded-2xl border border-white/12 bg-black/24 p-5"><div className="mb-4 flex items-center justify-between"><h4 className="text-sm font-black uppercase">Tonight</h4><Wifi className="h-5 w-5 text-[#f0183d]" /></div>{schedule.map(([name, time]) => <div key={name} className="flex items-center justify-between border-t border-white/8 py-4"><span className="text-base font-black uppercase">{name}</span><span className="font-mono text-lg text-[#f0183d]">{time}</span></div>)}</div>
            </motion.div>

            <motion.div onMouseEnter={() => setActive("COMMUNITY")} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="rounded-[2rem] border border-white/12 bg-[#070b0e] p-7 md:p-9">
              <SectionTitle eyebrow="04 / Community" title="A social hub, not an icon row" body="Every channel becomes a living surface for updates, previews, creator moments and future API-driven activity." />
              <div className="mt-7 space-y-3">{community.map(([name, activity, followers]) => <div key={name} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#f0183d]/55"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0183d]/12 text-[11px] font-black uppercase text-[#f0183d]">{name.slice(0, 2)}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-3"><h4 className="text-sm font-black uppercase">{name}</h4><span className="text-[10px] text-white/38">{followers} followers</span></div><p className="truncate text-xs text-white/54">{activity}</p></div><button className="rounded-full border border-white/14 px-4 py-2 text-[9px] font-black uppercase text-white/72 transition group-hover:border-[#f0183d] group-hover:text-[#f0183d]">Follow</button></div>)}</div>
            </motion.div>
          </div>

          <motion.div onMouseEnter={() => setActive("FAN PRODUCTIONS")} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-[2rem] border border-[#f0183d]/30 bg-[#110509]">
            <MediaImage src={fanImage} alt="Fan production ecosystem" className="absolute inset-y-0 right-0 hidden h-full w-[54%] object-cover opacity-76 lg:block" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#110509] via-[#110509]/88 to-[#110509]/25" />
            <div className="relative max-w-3xl p-7 md:p-10"><SectionTitle eyebrow="05 / Fan Productions" title="Fans can become part of the story" body="Fans are not only watching. They can apply, connect with the studio, meet the performer, film a real production and see the project published." />
              <div className="mt-9 grid gap-3 sm:grid-cols-5">{fanSteps.map((step, index) => <div key={step} className="relative rounded-xl border border-white/12 bg-black/24 p-4"><div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#f0183d]/70 text-[10px] font-black text-[#f0183d]">{index + 1}</div><h4 className="text-[10px] font-black uppercase leading-4">{step}</h4>{index < fanSteps.length - 1 && <Send className="absolute -right-3 top-7 hidden h-5 w-5 text-[#f0183d] sm:block" />}</div>)}</div>
              <a href="/fan-productions" className="mt-9 inline-flex items-center gap-10 rounded bg-[#f0183d] px-7 py-3 text-[10px] font-black uppercase tracking-wide transition hover:-translate-y-0.5 hover:bg-[#ff3152]">Explore Fan Productions <ExternalLink className="h-4 w-4" /></a></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}