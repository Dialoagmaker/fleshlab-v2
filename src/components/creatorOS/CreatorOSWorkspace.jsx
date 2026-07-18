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
  const live = data?.live || {};
  return <main className="flos-app"><CreatorOSSidebar performer={performer} stats={careerStats} /><section className="flos-main"><CreatorOSHeader performer={performer} briefing={live.briefing} />{isLoading && <div className="flos-loading">Reading creator signals…</div>}<MissionFocusCard mission={live.mission} /><div className="flos-mid"><MomentumPanel momentum={live.momentum} /><TodaysPlan plan={live.plan} /></div><div className="flos-bottom"><TrendingPanel trends={live.trends} /><SeriesPanel series={live.series} /><RevenueOutlook revenue={live.revenue} /></div></section><ProducerPanel recommendations={live.recommendations} briefing={live.briefing} mission={live.mission} library={live.library} /></main>;
}