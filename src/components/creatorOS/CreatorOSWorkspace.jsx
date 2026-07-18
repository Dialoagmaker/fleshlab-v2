import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import CreatorOSNav from "./CreatorOSNav";
import CreatorOSHero from "./CreatorOSHero";
import AIStudioDirector from "./AIStudioDirector";
import TodayMission from "./TodayMission";
import CreatorFeed from "./CreatorFeed";
import LibraryIntelligence from "./LibraryIntelligence";
import FanMoneyIntelligence from "./FanMoneyIntelligence";
import AchievementsPanel from "./AchievementsPanel";
import FloatingAIAssistant from "./FloatingAIAssistant";

export default function CreatorOSWorkspace({ performer, careerStats, performerToken, onLogout }) {
  const performerId = performer?.id;
  const { data, isLoading } = useQuery({
    queryKey: ["creator-os-workspace", performerId],
    enabled: !!performerId && !!performerToken,
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [os, payout, videos] = await Promise.all([
        base44.functions.invoke("creatorOSService", { action: "get_creator_os", performer_id: performerId, performer_token: performerToken, auto_generate: true }),
        base44.functions.invoke("performerDashboardService", { action: "get_payout_summary", performer_id: performerId, performer_token: performerToken }),
        base44.functions.invoke("performerDashboardService", { action: "get_videos", performer_id: performerId, performer_token: performerToken, period_month: currentMonth })
      ]);
      return { os: os.data, payout: payout.data, videos: videos.data?.videos || [] };
    }
  });
  const os = data?.os || {};
  return <main className="cos-shell"><CreatorOSNav onLogout={onLogout} />{isLoading && <div className="cos-loading">Building your Creator OS…</div>}<div className="cos-canvas"><CreatorOSHero performer={performer} briefing={os.briefing} mission={os.mission} payout={data?.payout} /><AIStudioDirector briefing={os.briefing} recommendations={os.recommendations} /><TodayMission mission={os.mission} briefing={os.briefing} /><CreatorFeed recommendations={os.recommendations} videos={data?.videos} payout={data?.payout} /><LibraryIntelligence library={os.library} stats={careerStats} /><FanMoneyIntelligence briefing={os.briefing} stats={careerStats} payout={data?.payout} /><AchievementsPanel stats={careerStats} /><section id="profile" className="cos-profile"><h2>Profile</h2><p>{performer?.display_name} · {performer?.revenue_model || "Studio Managed"} · {performer?.revenue_share_pct || 40}% creator share</p></section></div><FloatingAIAssistant /></main>;
}