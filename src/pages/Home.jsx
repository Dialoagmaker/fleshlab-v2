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
  const totalVideoCount = videosData?.published_total || videosData?.total || videos.length;
  const performers = performersData?.performers || [];
  const articles = newsData?.articles || newsData?.news || [];

  return (
    <>
      <SEOMeta
        title="FLESHLAB Amateur Wins – Real Men. Real Lust. Real Amateurs."
        description="Enter FLESHLAB: a dark, premium amateur studio world where ordinary guys become unforgettable real-life fantasies."
        canonical="/"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "FLESHLAB Amateur Wins",
          "url": "https://fleshlab.online",
          "description": "A premium amateur studio for real verified 18+ creators, private fantasies and authentic productions."
        }}
      />
      <HomeTubePage videos={videos} totalVideoCount={totalVideoCount} performers={performers} articles={articles} />
    </>
  );
}