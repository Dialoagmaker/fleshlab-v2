import CreatorOSSidebar from "./CreatorOSSidebar";
import CreatorOSHeader from "./CreatorOSHeader";
import MissionFocusCard from "./MissionFocusCard";
import MomentumPanel from "./MomentumPanel";
import TodaysPlan from "./TodaysPlan";
import TrendingPanel from "./TrendingPanel";
import SeriesPanel from "./SeriesPanel";
import RevenueOutlook from "./RevenueOutlook";
import ProducerPanel from "./ProducerPanel";
import { useCreatorOSData } from "./useCreatorOSData";

export default function CreatorOSWorkspace({ performer, careerStats, performerToken }) {
  const { data, isLoading } = useCreatorOSData(performer?.id, performerToken);
  const os = data?.os || {};
  return <main className="flos-app"><CreatorOSSidebar performer={performer} stats={careerStats} /><section className="flos-main"><CreatorOSHeader performer={performer} />{isLoading && <div className="flos-loading">Preparing today’s studio…</div>}<MissionFocusCard mission={os.mission} briefing={os.briefing} /><div className="flos-mid"><MomentumPanel /><TodaysPlan /></div><div className="flos-bottom"><TrendingPanel /><SeriesPanel /><RevenueOutlook briefing={os.briefing} payout={data?.payout} /></div></section><ProducerPanel recommendations={os.recommendations} /></main>;
}