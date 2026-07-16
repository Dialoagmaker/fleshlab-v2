import DocumentaryHero from "@/components/homeDocumentary/DocumentaryHero";
import BrandPhilosophy from "@/components/homeDocumentary/BrandPhilosophy";
import DocumentaryRail from "@/components/homeDocumentary/DocumentaryRail";
import DocumentaryMosaic from "@/components/homeDocumentary/DocumentaryMosaic";
import CreatorJourney from "@/components/homeDocumentary/CreatorJourney";
import CreatorStories from "@/components/homeDocumentary/CreatorStories";
import DocumentaryArchive from "@/components/homeDocumentary/DocumentaryArchive";

const HOTEL_SESSIONS_VIDEO_ID = "6a453b0ebaf1c19754ebf1fa";
const FITMASTER_BRAND_ID = "6a1ca4cdc29d96ab4c624c98";

export default function HomeTubePage({ videos = [], performers = [], articles = [] }) {
  const featured =
    videos.find((video) => video.id === HOTEL_SESSIONS_VIDEO_ID) ||
    videos.find((video) => video.brand_id === FITMASTER_BRAND_ID && video.categories?.includes("hotel")) ||
    videos.find((video) => video.featured) ||
    videos[0];

  return (
    <div className="bg-[#050505] text-white">
      <DocumentaryHero video={featured} />
      <BrandPhilosophy />
      <DocumentaryRail videos={videos} performers={performers} />
      <DocumentaryMosaic videos={videos} performers={performers} />
      <CreatorJourney />
      <CreatorStories videos={videos} performers={performers} />
      <DocumentaryArchive videos={videos} performers={performers} articles={articles} />
    </div>
  );
}