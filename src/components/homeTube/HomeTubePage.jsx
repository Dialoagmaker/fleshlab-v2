import { ArrowRight, ChevronRight, Star } from "lucide-react";
import HomeTubeHero from "@/components/homeTube/HomeTubeHero";
import VideoTile from "@/components/homeTube/VideoTile";
import PerformerPill from "@/components/homeTube/PerformerPill";
import CollectionCard from "@/components/homeTube/CollectionCard";
import { getVideoThumbnailUrl } from "@/lib/videoAssetResolver";
import MediaImage from "@/components/homeTube/MediaImage";

const collectionNames = ["Asian Twinks", "Massage Rooms", "First Time", "Bareback", "College Boys", "Fan Favorites"];

function Section({ title, href, children }) {
  return <section className="mx-auto max-w-[1440px] px-5 py-2 md:px-10 lg:px-14"><div className="mb-2 flex items-center justify-between"><h2 className="text-base font-black uppercase text-white">{title}</h2><a href={href} className="text-[10px] font-black uppercase text-white/60 hover:text-white">View All <ChevronRight className="inline w-3 h-3" /></a></div>{children}</section>;
}

function CommunityCard({ article, video, index }) {
  const image = article?.cover_image_url || getVideoThumbnailUrl(video);
  return <a href={article?.slug ? `/news/${article.slug}` : "/news"} className="grid min-w-[270px] grid-cols-[92px_1fr] gap-3 rounded border border-white/10 bg-[#111] p-2 hover:border-[#E51D2A]/70"><MediaImage src={image} alt={article?.title} className="h-[62px] w-full rounded-sm" /><div><p className="text-[9px] font-black uppercase text-[#E51D2A]">{index === 0 ? "Studio Life" : index === 1 ? "Tips" : "Story"}</p><h3 className="line-clamp-2 text-[12px] font-black leading-tight text-white">{article?.title || video?.title || "Inside FLESHLAB Asia"}</h3><p className="mt-1 line-clamp-2 text-[9px] text-white/55">{article?.excerpt || "Our latest update from the studio and performer community."}</p></div></a>;
}

export default function HomeTubePage({ videos, performers, articles }) {
  const featured = videos.find((video) => video.featured) || videos[0];
  const featuredVideos = videos.slice(0, 7);
  const trendingModels = performers.slice(0, 6);

  return <div className="bg-[#050505] text-white"><HomeTubeHero video={featured} videoCount={videos.length} performerCount={performers.length} /><Section title="Featured Videos" href="/videos"><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">{featuredVideos.map((video, index) => <VideoTile key={video.id || index} video={video} label={index % 3 === 0 ? "HOT" : "NEW"} />)}</div></Section><Section title="Trending Models" href="/performers"><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">{trendingModels.map((performer, index) => <PerformerPill key={performer.id || index} performer={performer} />)}</div></Section><Section title="Collections" href="/videos"><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">{collectionNames.map((name, index) => <CollectionCard key={name} title={name} count={(index + 4) * 18 + 5} video={videos[index % Math.max(videos.length, 1)]} />)}</div></Section><div className="mx-auto max-w-[1440px] px-5 py-3 md:px-10 lg:px-14"><a href="/become-performer" className="flex flex-col gap-4 rounded border border-[#E51D2A] bg-[#170607] px-5 py-4 shadow-[0_0_22px_rgba(229,29,42,0.35)] md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-5"><Star className="w-12 h-12 text-[#E51D2A]" /><div><h2 className="text-2xl font-black uppercase text-white">Become a <span className="text-[#E51D2A]">FLESHLAB</span> Performer</h2><p className="text-xs font-bold text-white/75">Make money with your body. We help you grow.</p></div></div><div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase text-white/75"><span>100% Amateur</span><span>High Payouts</span><span>Safe & Private</span><span className="inline-flex h-11 items-center gap-2 rounded-sm bg-[#E51D2A] px-8 text-white">Apply Now <ArrowRight className="w-4 h-4" /></span></div></a></div><Section title="From The Community" href="/news"><div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">{[0, 1, 2, 3].map((slot) => <CommunityCard key={slot} article={articles[slot]} video={videos[slot]} index={slot} />)}</div></Section></div>;
}