import { Users, ShieldCheck, CreditCard, Headphones, Globe2, Wallet, Play, Clapperboard, Handshake, UserPlus, Lock, CloudUpload, CheckCircle2, DollarSign, Lightbulb, Camera, Crown, BadgeCheck, ChevronRight } from "lucide-react";
import LanguageSwitcher from "@/components/public/LanguageSwitcher";
import MediaImage from "@/components/homeTube/MediaImage";
import { buildPublicAssetUrl, getVideoThumbnailUrl } from "@/lib/videoAssetResolver";

const HOTEL_SESSIONS_VIDEO_ID = "6a453b0ebaf1c19754ebf1fa";
const FITMASTER_BRAND_ID = "6a1ca4cdc29d96ab4c624c98";

const FALLBACK_HERO = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=80";
const WORLD_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
];

const navItems = ["WHO WE ARE", "HOW IT WORKS", "EARN MONEY", "VIDEOS", "FAN PRODUCTIONS", "BLOG", "TRUST CENTER"];
const trustItems = [
  [Users, "100% AMATEUR", "Real people. No actors."],
  [ShieldCheck, "SAFE & PRIVATE", "Your privacy is 100% protected."],
  [CreditCard, "FAIR PAY", "Weekly payouts. Always on time."],
  [Headphones, "FULL SUPPORT", "We guide you from day one."],
  [Globe2, "GLOBAL COMMUNITY", "Fans from over 120 countries."],
];
const paths = [
  [Wallet, "EARN MONEY", "Turn your life into income. We show you how.", "/become-performer"],
  [Play, "WATCH VIDEOS", "Real amateur content. Updated daily. No fakes.", "/videos"],
  [Clapperboard, "JOIN A PRODUCTION", "Be part of a story. We handle the rest.", "/fan-productions"],
  [Handshake, "PARTNER WITH US", "Distribute. Collaborate. Monetize premium amateur content.", "#partners"],
];
const journey = [
  [UserPlus, "JOIN", "Create your account in minutes."],
  [Lock, "VERIFY", "We protect your identity."],
  [CloudUpload, "UPLOAD", "Use your smartphone. We accept all content."],
  [CheckCircle2, "APPROVAL", "Our team reviews within 24–48h."],
  [Clapperboard, "PUBLISHED", "Your content goes live on the platform."],
  [DollarSign, "EARN", "Get paid weekly. Keep growing."],
];
const worlds = ["HOTEL SESSIONS", "BEACH ESCAPE", "GYM & FITNESS", "MASSAGE ROOMS", "STUDENT LIFE", "HOME MADE"];
const trustCenter = [
  [ShieldCheck, "IDENTITY PROTECTION", "We verify all performers. Your privacy is guaranteed."],
  [Wallet, "SECURE PAYMENTS", "Encrypted & secure payment system."],
  [CreditCard, "LEGAL CONTRACTS", "Fair contracts. Clear rights."],
  [BadgeCheck, "CONTENT PROTECTION", "We protect your content and your rights."],
  [Users, "18+ ONLY", "All performers are 18+ verified."],
];

function Logo() {
  return <a href="/" className="leading-none"><div className="text-[28px] font-black tracking-[-0.04em] text-white">FLESH<span className="text-[#e31538]">LAB</span></div><div className="mt-1 text-[9px] font-black uppercase tracking-[0.48em] text-white/72">Amateur wins.</div></a>;
}

function ThumbStack({ performers }) {
  const visible = performers.slice(0, 5);
  return <div className="flex items-center gap-4">{visible.length > 0 && <div className="flex -space-x-2">{visible.map((p) => <img key={p.id || p.slug} src={buildPublicAssetUrl(p.profile_image_url || p.cover_image_url)} alt={p.display_name} className="h-9 w-9 rounded-full border-2 border-[#080b0d] object-cover" loading="lazy" />)}</div>}<p className="text-[10px] leading-4 text-white/62">Join creators from<br /><span className="text-white">120+ countries.</span></p></div>;
}

export default function FleshlabLandingV2({ videos = [], performers = [] }) {
  const featured = videos.find((video) => video.id === HOTEL_SESSIONS_VIDEO_ID) || videos.find((video) => video.brand_id === FITMASTER_BRAND_ID) || videos.find((video) => video.featured) || videos[0];
  const heroImage = getVideoThumbnailUrl(featured) || buildPublicAssetUrl(performers[0]?.cover_image_url || performers[0]?.profile_image_url) || FALLBACK_HERO;
  const portrait = buildPublicAssetUrl(performers[0]?.profile_image_url || performers[0]?.cover_image_url) || heroImage;
  const coupleImage = getVideoThumbnailUrl(videos[1]) || buildPublicAssetUrl(performers[1]?.cover_image_url || performers[1]?.profile_image_url) || heroImage;

  return (
    <div className="min-h-screen bg-[#05080a] text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#05080a]/78 backdrop-blur-xl">
        <div className="mx-auto flex h-[62px] max-w-[1160px] items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-6 lg:flex">{navItems.map((item) => <a key={item} href="#" className="text-[10px] font-black uppercase tracking-[0.08em] text-white/82 hover:text-[#e31538]">{item}</a>)}</nav>
          <div className="flex items-center gap-3"><LanguageSwitcher /><a href="/become-performer" className="rounded bg-[#e31538] px-5 py-2.5 text-[10px] font-black uppercase tracking-wide text-white hover:bg-[#ff3152]">JOIN NOW</a></div>
        </div>
      </header>

      <main className="pt-[62px]">
        <section className="relative overflow-hidden border-b border-white/8 bg-black">
          <div className="absolute inset-0"><MediaImage src={heroImage} alt="FLESHLAB hotel creator" className="h-full w-full object-cover object-[68%_center] opacity-72 brightness-[0.62] saturate-[0.9]" /><div className="absolute inset-0 bg-[linear-gradient(90deg,#05080a_0%,rgba(5,8,10,0.9)_29%,rgba(5,8,10,0.28)_63%,rgba(5,8,10,0.82)_100%)]" /></div>
          <div className="relative mx-auto grid min-h-[445px] max-w-[1160px] grid-cols-1 px-5 py-10 lg:grid-cols-[1fr_330px]">
            <div className="flex max-w-[520px] flex-col justify-center">
              <h1 className="text-[58px] font-black uppercase leading-[0.9] tracking-[-0.055em] md:text-[70px]">YOUR STORY.<br />YOUR BODY.<br /><span className="text-[#e31538]">YOUR INCOME.</span></h1>
              <p className="mt-5 max-w-sm text-[15px] leading-6 text-white/82">The #1 platform for Asian amateur performers. Safe. Fair. Profitable.</p>
              <div className="mt-6 flex gap-3"><a href="/become-performer" className="w-[170px] rounded bg-[#e31538] py-3 text-center text-[11px] font-black uppercase tracking-wide">I WANT TO EARN</a><a href="/videos" className="w-[170px] rounded border border-white/35 bg-black/25 py-3 text-center text-[11px] font-black uppercase tracking-wide">I WANT TO WATCH</a></div>
              <div className="mt-12"><ThumbStack performers={performers} /></div>
            </div>
            <aside className="hidden items-center justify-end lg:flex"><div className="w-[210px] space-y-4 rounded border border-white/12 bg-black/38 p-6 backdrop-blur-sm">{[[Users, "17+", "ACTIVE PERFORMERS"], [Play, "300+", "VIDEOS ONLINE"], [Users, "50K+", "REGISTERED FANS"], [Globe2, "120+", "COUNTRIES"]].map(([Icon, value, label]) => <div key={label} className="flex items-center gap-4"><Icon className="h-7 w-7 text-[#e31538]" /><div><div className="text-2xl font-black text-[#e31538]">{value}</div><div className="text-[10px] font-black uppercase text-white/78">{label}</div></div></div>)}</div></aside>
          </div>
        </section>

        <section className="border-b border-white/8 bg-[#091014]"><div className="mx-auto grid max-w-[1160px] gap-4 px-5 py-5 md:grid-cols-5">{trustItems.map(([Icon, title, body]) => <div key={title} className="flex gap-3"><Icon className="h-7 w-7 shrink-0 text-[#e31538]" /><div><h3 className="text-[11px] font-black uppercase">{title}</h3><p className="mt-1 text-[10px] leading-4 text-white/54">{body}</p></div></div>)}</div></section>

        <section className="mx-auto max-w-[1160px] px-5 py-7"><div className="mb-4 text-center"><h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white/88">CHOOSE <span className="text-[#e31538]">YOUR</span> PATH</h2><p className="text-[10px] text-white/48">What brings you here?</p></div><div className="grid gap-4 md:grid-cols-4">{paths.map(([Icon, title, body, href], index) => <a key={title} href={href} className="group relative min-h-[180px] overflow-hidden rounded border border-white/13 bg-[#0a1115] p-5"><MediaImage src={getVideoThumbnailUrl(videos[index]) || WORLD_IMAGES[index]} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-35 transition group-hover:scale-105 group-hover:opacity-48" /><div className="relative"><div className="mb-9 flex h-14 w-14 items-center justify-center rounded-full border border-[#e31538] text-[#e31538]"><Icon className="h-7 w-7" /></div><h3 className="text-2xl font-black uppercase tracking-[-0.04em]">{title}</h3><p className="mt-1 max-w-[190px] text-[11px] leading-4 text-white/70">{body}</p><ChevronRight className="absolute bottom-0 right-0 h-5 w-5 transition group-hover:translate-x-1" /></div></a>)}</div></section>

        <section className="relative border-t border-white/8 bg-[#060b0e]"><div className="mx-auto grid max-w-[1160px] gap-8 px-5 py-9 lg:grid-cols-[1fr_315px]"><div><h2 className="text-3xl font-black uppercase tracking-[-0.045em] text-white/88">YOUR <span className="text-[#e31538]">JOURNEY</span> AS A CREATOR</h2><p className="mb-7 text-[11px] text-white/48">Simple steps. Real support. Real income.</p><div className="grid gap-3 md:grid-cols-6">{journey.map(([Icon, title, body], index) => <div key={title} className="relative text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#e31538] text-[#e31538]"><Icon className="h-7 w-7" /></div><div className="mt-3 text-[11px] font-black text-[#e31538]">{index + 1}</div><h3 className="text-[12px] font-black uppercase">{title}</h3><p className="mx-auto mt-1 max-w-[105px] text-[9px] leading-4 text-white/50">{body}</p></div>)}</div><a href="/become-performer" className="mx-auto mt-7 flex w-fit items-center gap-8 rounded border border-[#e31538] px-7 py-2 text-[10px] font-black uppercase text-white/84">LEARN MORE ABOUT BECOMING A PERFORMER <ChevronRight className="h-4 w-4" /></a></div><div className="flex items-center gap-5"><MediaImage src={portrait} alt="Creator testimonial" className="h-56 w-40 rounded object-cover object-top" /><blockquote className="text-sm leading-6 text-white/82"><span className="text-5xl leading-none text-[#e31538]">“</span><br />FLESHLAB changed my life. I film when I want, where I want — and I earn more than I ever did.<br /><br /><span className="font-black text-[#e31538]">– KAI, 23</span><br /><span className="text-white/45">Performer</span></blockquote></div></div></section>

        <section className="border-t border-white/8 bg-[#070b0e]"><div className="mx-auto max-w-[1160px] px-5 py-8"><h2 className="text-3xl font-black uppercase tracking-[-0.045em] text-white/88">EXPLORE <span className="text-[#e31538]">THEIR</span> WORLDS</h2><p className="mb-4 text-[11px] text-white/48">Different places. Different stories. Same authenticity.</p><div className="grid grid-cols-2 gap-3 md:grid-cols-6">{worlds.map((world, index) => <a key={world} href="/videos" className="group relative h-[118px] overflow-hidden rounded border border-white/12 bg-[#111]"><MediaImage src={getVideoThumbnailUrl(videos[index]) || WORLD_IMAGES[index]} alt={world} className="absolute inset-0 h-full w-full object-cover opacity-62 transition group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/28 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-3 text-center"><h3 className="text-[14px] font-black uppercase leading-tight">{world}</h3></div></a>)}</div></div></section>

        <section className="border-y border-[#e31538]/25 bg-[radial-gradient(circle_at_75%_50%,rgba(227,21,56,0.24),transparent_35%),#12070b]"><div className="mx-auto grid max-w-[1160px] gap-8 px-5 py-7 md:grid-cols-[330px_1fr_290px]"><div><h2 className="text-3xl font-black uppercase tracking-[-0.045em]">FAN PRODUCTIONS</h2><p className="text-lg font-black uppercase text-white/78">Ideas become reality.</p><p className="mt-1 text-[11px] text-white/58">You bring the idea. We help you make it happen.</p><a href="/fan-productions" className="mt-6 inline-flex items-center gap-10 rounded bg-[#e31538] px-6 py-2.5 text-[10px] font-black uppercase">START YOUR PROJECT <ChevronRight className="h-4 w-4" /></a></div><div className="grid grid-cols-3 gap-5 text-center">{[[Lightbulb, "YOUR IDEA", "You imagine it."], [Camera, "WE PRODUCE", "We bring it to life."], [Crown, "YOU OWN IT", "Rights stay with you."]].map(([Icon, title, body]) => <div key={title}><Icon className="mx-auto mb-4 h-9 w-9 text-[#e31538]" /><h3 className="text-[11px] font-black uppercase">{title}</h3><p className="mt-1 text-[10px] text-white/54">{body}</p></div>)}</div><MediaImage src={coupleImage} alt="Fan production" className="hidden h-36 w-full rounded object-cover object-top md:block" /></div></section>

        <section className="border-b border-white/8 bg-[#080d10]"><div className="mx-auto grid max-w-[1160px] gap-4 px-5 py-5 md:grid-cols-5">{trustCenter.map(([Icon, title, body]) => <div key={title} className="flex gap-3"><Icon className="h-8 w-8 shrink-0 text-[#e31538]" /><div><h3 className="text-[11px] font-black uppercase">{title}</h3><p className="mt-1 text-[10px] leading-4 text-white/54">{body}</p></div></div>)}</div></section>

        <footer id="partners" className="bg-[#05080a]"><div className="mx-auto max-w-[1160px] px-5 py-7"><div className="mb-6 flex flex-wrap items-center gap-7"><h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-white/76">OUR TRUSTED <span className="text-[#e31538]">PARTNERS</span></h2>{["xHamster", "FapHouse", "Clip4Sale", "LoyalFans", "ManyVids"].map((p) => <span key={p} className="text-lg font-black text-white/45">{p}</span>)}<a href="#" className="rounded border border-[#e31538] px-4 py-1.5 text-[9px] font-black uppercase text-[#e31538]">SEE ALL PARTNERS</a></div><div className="grid gap-8 border-t border-white/8 pt-6 md:grid-cols-[1fr_1fr_1fr_1fr_1.1fr]"><div><h3 className="text-sm font-black uppercase text-white/70">JOIN THE FLESHLAB FAMILY</h3><p className="mt-2 text-[10px] leading-4 text-white/45">Get updates, new releases and exclusive offers.</p><button className="mt-4 rounded bg-[#e31538] px-7 py-2 text-[10px] font-black uppercase">SUBSCRIBE</button></div>{[["FOR PERFORMERS", ["How it works", "Requirements", "Payouts", "FAQ", "Support"]], ["FOR FANS", ["Videos", "Categories", "Fan Productions", "Membership", "FAQ"]], ["COMPANY", ["About us", "Blog", "Careers", "Press", "Contact"]], ["LEGAL", ["Terms of Service", "Privacy Policy", "DMCA", "Content Policy"]]].map(([title, items]) => <div key={title}><h3 className="mb-3 text-[10px] font-black uppercase text-white/72">{title}</h3>{items.map((item) => <a key={item} href="#" className="block text-[10px] leading-5 text-white/42 hover:text-white">{item}</a>)}</div>)}<div className="text-right"><Logo /><p className="mt-4 text-[10px] text-white/42">© 2025 FLESHLAB Studios.<br />All rights reserved.</p></div></div></div></footer>
      </main>
    </div>
  );
}