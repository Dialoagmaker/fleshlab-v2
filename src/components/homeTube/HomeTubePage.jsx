import DocumentaryHero from "@/components/homeDocumentary/DocumentaryHero";
import FeaturedReleasePanels from "@/components/homeKraken/FeaturedReleasePanels";
import PerformerSpotlight from "@/components/homeKraken/PerformerSpotlight";
import FantasyCollections from "@/components/homeKraken/FantasyCollections";
import LatestFromFleshlab from "@/components/homeKraken/LatestFromFleshlab";
import CreatorManagementCampaign from "@/components/homeKraken/CreatorManagementCampaign";
import StudioServicesStrip from "@/components/homeKraken/StudioServicesStrip";
import StudioNotes from "@/components/homeKraken/StudioNotes";

const HOTEL_SESSIONS_VIDEO_ID = "6a453b0ebaf1c19754ebf1fa";
const FITMASTER_BRAND_ID = "6a1ca4cdc29d96ab4c624c98";
const FITMASTER_PERFORMER_SLUG = "the-fitmaster";

export default function HomeTubePage({ videos = [], performers = [], articles = [] }) {
  const featured =
    videos.find((video) => video.id === HOTEL_SESSIONS_VIDEO_ID) ||
    videos.find((video) => video.brand_id === FITMASTER_BRAND_ID && video.categories?.includes("hotel")) ||
    videos.find((video) => video.featured) ||
    videos[0];
  const heroPerformer =
    performers.find((performer) => performer.slug === FITMASTER_PERFORMER_SLUG) ||
    performers.find((performer) => performer.featured) ||
    performers[0];

  return (
    <div className="bg-[#050505] text-white">
      <DocumentaryHero video={featured} performer={heroPerformer} />
      <FeaturedReleasePanels videos={videos} heroVideo={featured} heroPerformer={heroPerformer} />
      <PerformerSpotlight performers={performers} heroPerformer={heroPerformer} />
      <FantasyCollections videos={videos} />
      <LatestFromFleshlab videos={videos} />
      <CreatorManagementCampaign performer={heroPerformer} />
      <StudioServicesStrip />
      <StudioNotes articles={articles} />
    </div>
  );
}