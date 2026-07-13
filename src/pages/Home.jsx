import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import SEOMeta from "@/components/SEOMeta";
import HomeTubePage from "@/components/homeTube/HomeTubePage";

export default function Home() {
  const { data: videosData } = useQuery({
    queryKey: ["public-videos-fn"],
    queryFn: () => callPublicFunction("getPublicVideos"),
    retry: 1,
    staleTime: 30000,
  });

  const { data: performersData } = useQuery({
    queryKey: ["public-performers-fn"],
    queryFn: () => callPublicFunction("getPublicPerformers"),
    retry: 0,
    staleTime: 30000,
  });

  const { data: newsData } = useQuery({
    queryKey: ["public-news-fn-home"],
    queryFn: () => callPublicFunction("getPublicNews", { page: 1, limit: 6 }),
    retry: 0,
    staleTime: 60000,
  });

  const videos = videosData?.videos || [];
  const performers = performersData?.performers || [];
  const articles = newsData?.articles || newsData?.news || [];

  return (
    <>
      <SEOMeta
        title="FLESHLAB Amateur Wins – Real Asian Amateur Videos & Models"
        description="Watch real FLESHLAB videos, Asian amateur performers, featured collections, community updates and verified 18+ studio productions."
        canonical="/"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "FLESHLAB Amateur Wins",
          "url": "https://fleshlab.online",
          "description": "Real Asian amateur videos, performers and FLESHLAB studio updates."
        }}
      />
      <HomeTubePage videos={videos} performers={performers} articles={articles} />
    </>
  );
}