import { ArrowRight, ChevronRight, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import HomeTubeHero from "@/components/homeTube/HomeTubeHero";
import VideoTile from "@/components/homeTube/VideoTile";
import PerformerPill from "@/components/homeTube/PerformerPill";
import CollectionCard from "@/components/homeTube/CollectionCard";
import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

const collectionNames = ["Asian Twinks", "Massage Series", "First Time", "Real Couples", "Fan Favorites"];
const performerFeatures = [
  { icon: ShieldCheck, title: "Safe Studio", text: "Clear boundaries, verified production and respectful sets." },
  { icon: CreditCard, title: "Weekly Payments", text: "Transparent payout process and creator-first growth." },
  { icon: Sparkles, title: "Professional Production", text: "Cinematic lighting, editing and brand support." },
];

function Section({ eyebrow, title, href, children }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 lg:px-14 lg:py-16">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-[#E51D2A]">{eyebrow}</p>
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">{title}</h2>
        </div>
        <a href={href} className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-black uppercase tracking-wide text-white/60 transition-all hover:-translate-y-0.5 hover:text-white md:inline-flex">View All <ChevronRight className="h-4 w-4" /></a>
      </div>
      {children}
    </section>
  );
}

function CommunityFeature({ article, video }) {
  const image = article?.cover_image_url || getVideoThumbnailUrl(video);
  return (
    <a href={article?.slug ? `/news/${article.slug}` : "/news"} className="group relative min-h-[420px] overflow-hidden rounded-[34px] bg-[#111] shadow-2xl shadow-black/30">
      <MediaImage src={image} alt={article?.title} className="absolute inset-0 h-full w-full opacity-75 transition-transform duration-500 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#E51D2A]">Behind The Scenes</p>
        <h3 className="mt-3 max-w-xl text-4xl font-black leading-none tracking-[-0.05em] text-white">{article?.title || video?.title || "Inside the FLESHLAB Studio"}</h3>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70">{article?.excerpt || "Studio life, creator stories and production notes from the FLESHLAB team."}</p>
      </div>
    </a>
  );
}

function CommunitySmall({ article, video, label }) {
  return (
    <a href={article?.slug ? `/news/${article.slug}` : "/news"} className="group rounded-[26px] border border-white/10 bg-[#111]/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#E51D2A]/40">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#E51D2A]">{label}</p>
      <h3 className="mt-3 line-clamp-2 text-xl font-black leading-tight text-white">{article?.title || video?.title || "Production Diary"}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/55">{article?.excerpt || "A closer look at real creators, studio culture and new performer tips."}</p>
    </a>
  );
}

export default function HomeTubePage({ videos = [], performers = [], articles = [] }) {
  const featured = videos.find((video) => video.featured) || videos[0];
  const featuredVideos = videos.slice(0, 5);
  const trendingModels = performers.slice(0, 4);

  return (
    <div className="bg-[#050505] text-white">
      <HomeTubeHero video={featured} videoCount={videos.length} performerCount={performers.length} />

      <Section eyebrow="Curated Releases" title="Featured Videos" href="/videos">
        <div className="grid grid-flow-col auto-cols-[82%] gap-5 overflow-x-auto pb-4 [scrollbar-width:none] sm:auto-cols-[45%] lg:grid-flow-row lg:grid-cols-5 lg:overflow-visible">
          {featuredVideos.map((video, index) => <VideoTile key={video.id || index} video={video} label={index === 0 ? "Premiere" : "Featured"} />)}
        </div>
      </Section>

      <Section eyebrow="Real Creators" title="Trending Models" href="/performers">
        <div className="grid grid-flow-col auto-cols-[76%] gap-5 overflow-x-auto pb-4 [scrollbar-width:none] sm:auto-cols-[42%] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">
          {trendingModels.map((performer, index) => <PerformerPill key={performer.id || index} performer={performer} />)}
        </div>
      </Section>

      <Section eyebrow="Cinematic Worlds" title="Collections" href="/videos">
        <div className="grid grid-flow-col auto-cols-[86%] gap-5 overflow-x-auto pb-4 [scrollbar-width:none] md:auto-cols-[44%] lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible">
          {collectionNames.map((name, index) => <CollectionCard key={name} title={name} count={(index + 4) * 18 + 5} video={videos[index % Math.max(videos.length, 1)]} />)}
        </div>
      </Section>

      <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 lg:px-14 lg:py-20">
        <div className="relative overflow-hidden rounded-[42px] border border-white/10 bg-[#110708] p-7 shadow-[0_40px_120px_rgba(0,0,0,0.55)] md:p-12">
          <MediaImage src={getVideoThumbnailUrl(featured)} alt="Become performer" className="absolute inset-0 h-full w-full opacity-20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(229,29,42,0.25),transparent_34%),linear-gradient(90deg,#090606_0%,rgba(9,6,6,0.92)_58%,rgba(9,6,6,0.55)_100%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.28em] text-[#E51D2A]">Become a Performer</p>
              <h2 className="max-w-3xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">Make money with your body.</h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/68">Become a FLESHLAB performer with safe studio support, premium production and a creator-first growth system.</p>
              <a href="/become-performer" className="mt-9 inline-flex h-14 items-center gap-3 rounded-full bg-[#E51D2A] px-8 text-sm font-black uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#c91822]">Apply Now <ArrowRight className="h-4 w-4" /></a>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {performerFeatures.map((feature) => <div key={feature.title} className="rounded-[26px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"><feature.icon className="mb-4 h-7 w-7 text-[#E51D2A]" /><h3 className="text-lg font-black text-white">{feature.title}</h3><p className="mt-2 text-sm leading-relaxed text-white/58">{feature.text}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow="Editorial" title="From The Community" href="/news">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <CommunityFeature article={articles[0]} video={videos[0]} />
          <div className="grid gap-5">
            <CommunitySmall article={articles[1]} video={videos[1]} label="Studio Life" />
            <CommunitySmall article={articles[2]} video={videos[2]} label="Creator Stories" />
            <CommunitySmall article={articles[3]} video={videos[3]} label="Tips for New Performers" />
          </div>
        </div>
      </Section>
    </div>
  );
}