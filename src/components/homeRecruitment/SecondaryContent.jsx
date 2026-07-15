import { ChevronRight } from "lucide-react";
import VideoTile from "@/components/homeTube/VideoTile";
import PerformerPill from "@/components/homeTube/PerformerPill";
import CollectionCard from "@/components/homeTube/CollectionCard";

const collectionNames = ["Asian Twinks", "Massage Series", "First Time", "Real Couples", "Fan Favorites"];

function getCollectionVideos(name, videos) {
  const words = name.toLowerCase().split(/\s+/).filter(Boolean);
  return videos.filter((video) => [video?.title, video?.description, video?.short_summary, ...(video?.categories || []), ...(video?.tags || [])].filter(Boolean).join(" ").toLowerCase().split(/\s+/).some(word => words.includes(word)));
}

function Section({ eyebrow, title, href, children }) {
  return <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 lg:px-14"><div className="mb-8 flex items-end justify-between gap-6"><div><p className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-[#E51D2A]">{eyebrow}</p><h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">{title}</h2></div><a href={href} className="hidden items-center gap-2 text-xs font-black uppercase tracking-wide text-white/55 hover:text-white md:inline-flex">View All <ChevronRight className="h-4 w-4" /></a></div>{children}</section>;
}

export default function SecondaryContent({ videos = [], performers = [], articles = [] }) {
  const featuredVideos = videos.slice(0, 5);
  const trendingModels = performers.slice(0, 4);
  return (
    <div className="border-t border-white/10 pt-8">
      <Section eyebrow="Secondary: watch" title="Featured Videos" href="/videos"><div className="grid grid-flow-col auto-cols-[82%] gap-5 overflow-x-auto pb-4 [scrollbar-width:none] sm:auto-cols-[45%] lg:grid-flow-row lg:grid-cols-5 lg:overflow-visible">{featuredVideos.map((video, index) => <VideoTile key={video.id || index} video={video} label={index === 0 ? "Premiere" : "Featured"} />)}</div></Section>
      <Section eyebrow="Collections" title="Browse worlds" href="/videos"><div className="grid grid-flow-col auto-cols-[86%] gap-5 overflow-x-auto pb-4 [scrollbar-width:none] md:auto-cols-[44%] lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible">{collectionNames.slice(0, 3).map((name, index) => <CollectionCard key={name} title={name} count={getCollectionVideos(name, videos).length} video={videos[index % Math.max(videos.length, 1)]} />)}</div></Section>
      <Section eyebrow="Models" title="Creator profiles" href="/performers"><div className="grid grid-flow-col auto-cols-[76%] gap-5 overflow-x-auto pb-4 [scrollbar-width:none] sm:auto-cols-[42%] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">{trendingModels.map((performer, index) => <PerformerPill key={performer.id || index} performer={performer} />)}</div></Section>
      <Section eyebrow="News" title="Studio journal" href="/news"><div className="grid gap-4 md:grid-cols-3">{articles.slice(0, 3).map((article) => <a key={article.id || article.slug} href={`/news/${article.slug}`} className="border border-white/10 bg-[#0d0d0d] p-6"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#E51D2A]">Journal</p><h3 className="mt-3 text-xl font-black leading-tight text-white">{article.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/55">{article.excerpt}</p></a>)}</div></Section>
    </div>
  );
}