import { useI18n } from "@/i18n/i18n.jsx";
import { useLandingText } from "./landingCopy";
import LandingNav from "./LandingNav";
import CinematicHero from "./CinematicHero";
import JourneyChoices from "./JourneyChoices";
import CreatorJourneyFlow from "./CreatorJourneyFlow";
import EarningsModels from "./EarningsModels";
import EarningsSimulator from "./EarningsSimulator";
import ProductionWorlds from "./ProductionWorlds";
import FeaturedPerformersV2 from "./FeaturedPerformersV2";
import FanProductionFeature from "./FanProductionFeature";
import TrustCenter from "./TrustCenter";
import LandingFooterV2 from "./LandingFooterV2";

const HOTEL_SESSIONS_VIDEO_ID = "6a453b0ebaf1c19754ebf1fa";
const FITMASTER_BRAND_ID = "6a1ca4cdc29d96ab4c624c98";

export default function FleshlabLandingV2({ videos = [], performers = [] }) {
  const { locale } = useI18n();
  const text = useLandingText(locale);
  const featured = videos.find((video) => video.id === HOTEL_SESSIONS_VIDEO_ID) || videos.find((video) => video.brand_id === FITMASTER_BRAND_ID) || videos.find((video) => video.featured) || videos[0];

  return (
    <div className="min-h-screen bg-[#080807] text-white selection:bg-[#d97d52] selection:text-white">
      <LandingNav text={text} />
      <CinematicHero video={featured} text={text} />
      <JourneyChoices text={text} />
      <CreatorJourneyFlow text={text} />
      <EarningsModels text={text} />
      <EarningsSimulator text={text} />
      <ProductionWorlds videos={videos} text={text} />
      <FeaturedPerformersV2 performers={performers} text={text} />
      <FanProductionFeature text={text} />
      <TrustCenter text={text} />
      <LandingFooterV2 text={text} />
    </div>
  );
}