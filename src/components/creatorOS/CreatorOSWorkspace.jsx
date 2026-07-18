import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CreatorOSSidebar from "./CreatorOSSidebar";
import CreatorOSHeader from "./CreatorOSHeader";
import MissionFocusCard from "./MissionFocusCard";
import MomentumPanel from "./MomentumPanel";
import TodaysPlan from "./TodaysPlan";
import TrendingPanel from "./TrendingPanel";
import SeriesPanel from "./SeriesPanel";
import RevenueOutlook from "./RevenueOutlook";
import ProducerPanel from "./ProducerPanel";
import CreatorOSDetailWorkspace from "./CreatorOSDetailWorkspace";
import { useCreatorOSData } from "./useCreatorOSData";

export default function CreatorOSWorkspace({ performer, careerStats, performerToken }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeSpace = params.get("space") || "today";
  const { data, isLoading, refetch } = useCreatorOSData(performer?.id, performerToken);
  const live = data?.live || { plan: [], momentum: [], recommendations: [], library: [], series: [], trends: [], revenue: {} };
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);
  const [detail, setDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [producerHidden, setProducerHidden] = useState(false);

  const go = (space, selected = null) => {
    setDetail(selected);
    const next = new URLSearchParams(location.search);
    next.set("space", space);
    navigate(`${location.pathname}?${next.toString()}`);
  };

  const callCreatorOS = async (payload, successText) => {
    setBusy(payload.plan_item_id || payload.mission_id || payload.recommendation_id || payload.action);
    setToast(null);
    const res = await base44.functions.invoke("creatorOSService", { ...payload, performer_id: performer.id, performer_token: performerToken });
    if (res.data?.error) throw new Error(res.data.error);
    setToast(successText);
    await refetch();
    setBusy(null);
    return res.data;
  };

  const safeAction = async (payload, successText) => {
    try { await callCreatorOS(payload, successText); }
    catch (error) { setBusy(null); setToast(error.message || "Action failed. Please retry."); }
  };

  const missionAction = (mission_action) => safeAction({ action: "mission_action", mission_id: live.mission?.id, mission_action }, mission_action === "complete" ? "Mission completed. Creator OS refreshed." : "Mission updated.").then(() => { if (["start","resume"].includes(mission_action)) go("create"); });

  const planAction = (row, plan_action, time) => safeAction({ action: "plan_item_action", plan_item_id: row.id, plan_action, time }, "Plan updated.");

  const recommendationAction = (recommendation_action, rec) => safeAction({ action: "recommendation_action", recommendation_id: rec.id, recommendation_action }, "Recommendation updated.");

  const askAI = async (message) => {
    setMessages(prev => [...prev, { role: "user", text: message }]);
    setAiBusy(true);
    try {
      const res = await base44.functions.invoke("creatorOSService", { action: "ask_ai", performer_id: performer.id, performer_token: performerToken, message });
      if (res.data?.error) throw new Error(res.data.error);
      setMessages(prev => [...prev, { role: "assistant", text: res.data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", text: error.message || "AI Producer could not answer. Retry after refreshing Creator OS." }]);
    }
    setAiBusy(false);
  };

  const selectedMomentum = useMemo(() => live.momentum.find(x => x.label === detail?.label), [live.momentum, detail]);

  return <main className="flos-app"><CreatorOSSidebar performer={performer} stats={careerStats} activeSpace={activeSpace} onNavigate={go} onProfileAction={(action) => go(action)} /><section className="flos-main"><CreatorOSHeader performer={performer} briefing={live.briefing} />{isLoading && <div className="flos-loading">Reading creator signals…</div>}{toast && <div className="flos-toast">{toast}</div>}<MissionFocusCard mission={live.mission} busy={!!busy} onMissionAction={missionAction} onOpenMission={() => go("create")} /><div className="flos-mid"><MomentumPanel momentum={live.momentum} onOpen={(item) => go(item.label === "Revenue" ? "money" : item.label === "Fans" ? "fans" : "create", item)} /><TodaysPlan plan={live.plan} busyId={busy} onPlanAction={planAction} onOpen={(item) => go("calendar", item)} /></div><div className="flos-bottom"><TrendingPanel trends={live.trends} onOpenFans={() => go("fans")} onOpenTrend={(item) => go("fans", item)} /><SeriesPanel series={live.series} onOpenLibrary={() => go("library")} onOpenSeries={(item) => go("library", item)} /><RevenueOutlook revenue={live.revenue} onOpen={() => go("money", live.revenue.details)} /></div>{selectedMomentum && <div className="flos-momentum-detail"><b>{selectedMomentum.label} momentum</b><p>{selectedMomentum.reason}</p>{selectedMomentum.breakdown?.map(x => <span key={x}>{x}</span>)}</div>}<CreatorOSDetailWorkspace space={activeSpace} detail={detail} live={live} performer={performer} onNavigate={go} onMissionAction={missionAction} onRecommendationAction={recommendationAction} /></section><ProducerPanel hidden={producerHidden} recommendations={live.recommendations} briefing={live.briefing} mission={live.mission} library={live.library} messages={messages} busy={aiBusy} onAsk={askAI} onAction={recommendationAction} onExpand={() => { setProducerHidden(false); go("ai"); }} onClose={() => setProducerHidden(true)} /></main>;
}