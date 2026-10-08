import FleshlabLandingV2 from "@/components/landingV2/FleshlabLandingV2";

export default function HomeTubePage({ videos = [], performers = [] }) {
  return <FleshlabLandingV2 videos={videos} performers={performers} />;
}