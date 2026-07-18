import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import CreatorOSNav from "./CreatorOSNav";
import StudioWorkspace from "./StudioWorkspace";
import CreateWorkspace from "./CreateWorkspace";
import FansWorkspace from "./FansWorkspace";
import LibraryUniverse from "./LibraryUniverse";
import MoneyWorkspace from "./MoneyWorkspace";
import GameLayer from "./GameLayer";
import AIProducerDock from "./AIProducerDock";

export default function CreatorOSWorkspace({ performer, careerStats, performerToken, onLogout }) {
  const performerId = performer?.id;
  const { data, isLoading } = useQuery({ queryKey: ["creator-os-v2", performerId], enabled: !!performerId && !!performerToken, queryFn: async () => {
    const [os, payout] = await Promise.all([
      base44.functions.invoke("creatorOSService", { action: "get_creator_os", performer_id: performerId, performer_token: performerToken, auto_generate: true }),
      base44.functions.invoke("performerDashboardService", { action: "get_payout_summary", performer_id: performerId, performer_token: performerToken })
    ]);
    return { os: os.data || {}, payout: payout.data || {} };
  }});
  const os = data?.os || {};
  return <main className="cos2-shell"><CreatorOSNav onLogout={onLogout} />{isLoading && <div className="cos-loading">Waking up your studio…</div>}<div className="cos2-layout"><div className="cos2-main"><StudioWorkspace performer={performer} briefing={os.briefing} mission={os.mission} /><CreateWorkspace mission={os.mission} /><FansWorkspace briefing={os.briefing} /><LibraryUniverse library={os.library} /><MoneyWorkspace briefing={os.briefing} payout={data?.payout} /><GameLayer stats={careerStats} /><section id="profile" className="cos2-profile"><b>{performer?.display_name}</b><span>{performer?.revenue_model || "studio managed"} · {performer?.revenue_share_pct || 40}% creator share</span></section></div><AIProducerDock briefing={os.briefing} /></div></main>;
}