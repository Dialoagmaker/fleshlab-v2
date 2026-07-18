import { Crosshair, MoreHorizontal, Pause, Play, RotateCcw, SquareCheckBig, TrendingUp } from "lucide-react";

function MissionArtwork({ mission }) {
  if (mission?.mediaUrl) return <img src={mission.mediaUrl} alt={mission.sourceTitle || mission.title} />;
  return <div className="flos-focus-art"><span>{mission?.type || "CREATOR OS"}</span><b>{mission?.title || "Collecting signals"}</b></div>;
}

export default function MissionFocusCard({ mission, busy, onMissionAction, onOpenMission }) {
  const empty = !mission;
  const status = mission?.status || "active";
  const primaryLabel = empty ? "MISSION PENDING" : status === "in_progress" ? "OPEN MISSION" : status === "paused" ? "RESUME MISSION" : "BEGIN MISSION";
  const primaryAction = () => {
    if (empty) return;
    if (status === "in_progress") onOpenMission?.();
    else onMissionAction?.(status === "paused" ? "resume" : "start");
  };
  return <section id="today" className="flos-focus"><MissionArtwork mission={mission} /><div className="flos-focus-copy"><p><Crosshair /> TODAY’S FOCUS</p><h2>{mission?.title || "Collecting production mission"}</h2><small>{mission?.minutes ? `${mission.minutes} MINUTE SHOOT` : "Creator OS is analysing your library"}</small><div className="flos-impact"><span>Estimated impact</span><b>{mission?.revenue ? `+$${Math.round(mission.revenue)}` : "Not enough data yet"}</b><em><TrendingUp /> {mission?.priority ? `${mission.priority} priority` : "Waiting for live signals"}</em></div><div className="flos-tags"><i>{mission?.difficulty || "DATA"}</i><i>{mission?.type || "ANALYSIS"}</i><i>{status}</i></div><div className="flos-mission-reason">{mission?.reason || "Upload history, fan behaviour and revenue patterns are still being collected."}</div><div className="flos-actions flos-actions-wide"><button type="button" disabled={empty || busy} onClick={primaryAction}><Play /> {busy ? "WORKING…" : primaryLabel}</button><button type="button" disabled={empty || busy} aria-label="Open mission workspace" onClick={onOpenMission}><MoreHorizontal /></button></div>{mission && <div className="flos-mission-controls"><button type="button" disabled={busy || status !== "in_progress"} onClick={() => onMissionAction?.("pause")}><Pause /> Pause</button><button type="button" disabled={busy || status !== "paused"} onClick={() => onMissionAction?.("resume")}><RotateCcw /> Resume</button><button type="button" disabled={busy || !["in_progress","paused"].includes(status)} onClick={() => onMissionAction?.("complete")}><SquareCheckBig /> Complete</button></div>}</div></section>;
}