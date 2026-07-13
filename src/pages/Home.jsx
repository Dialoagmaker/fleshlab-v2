import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import SEOMeta from "@/components/SEOMeta";
import HomeHero from "@/components/home2026/HomeHero";
import FeatureCards from "@/components/home2026/FeatureCards";
import VideoRail from "@/components/home2026/VideoRail";
import CategoryGrid from "@/components/home2026/CategoryGrid";
import WhyFleshlab from "@/components/home2026/WhyFleshlab";
import PerformerCTA from "@/components/home2026/PerformerCTA";

export default function Home() {
  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ["public-videos-fn"],
    queryFn: () => callPublicFunction("getPublicVideos"),
    retry: 1,
    staleTime: 30000,
  });
  const videos = videosData?.videos || [];
  const brands = videosData?.brands || [];
  const featuredVideo = videos.find((video) => video.featured) || videos[0];
  const trendingVideos = videos.slice(0, 12);
  const newVideos = [...videos]
    .sort((a, b) => new Date(b.published_at || b.release_date || b.created_date || 0) - new Date(a.published_at || a.release_date || a.created_date || 0))
    .slice(0, 12);

  const { data: performersData } = useQuery({
    queryKey: ["public-performers-fn"],
    queryFn: () => callPublicFunction("getPublicPerformers"),
    retry: 0,
    staleTime: 30000,
  });
  const performers = performersData?.performers || [];

  useQuery({
    queryKey: ["public-news-fn-home"],
    queryFn: () => callPublicFunction("getPublicNews", { page: 1, limit: 6 }),
    retry: 0,
    staleTime: 60000,
  });

  return (
    <>
      <SEOMeta
        title="FLESHLAB Studios – Homemade Asian Twink Gay Videos & Fanclub"
        description="Watch homemade Asian twink gay videos, Filipino performers, fanclub updates, amateur studio productions and verified 18+ creator content by FLESHLAB Studios."
        canonical="/"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "FLESHLAB Studios",
          "url": "https://fleshlab.online",
          "description": "Homemade Asian twink gay videos, Filipino performers, fanclub updates and verified 18+ creator content by FLESHLAB Studios."
        }}
      />

      <div className="bg-[#050505] text-white">
        <HomeHero video={featuredVideo} />
        <FeatureCards videos={videos} performers={performers} />
        <VideoRail
          eyebrow="Trending"
          title="TRENDING"
          text="Current FLESHLAB productions selected from the real video library."
          videos={trendingVideos}
          brands={brands}
          loading={videosLoading}
        />
        <VideoRail
          eyebrow="New Releases"
          title="NEW RELEASES"
          text="Latest published productions from the existing FLESHLAB catalog."
          videos={newVideos}
          brands={brands}
          loading={videosLoading}
        />
        <CategoryGrid videos={videos} />
        <WhyFleshlab />
        <PerformerCTA performer={performers[0]} video={featuredVideo} />
      </div>
    </>
  );
}