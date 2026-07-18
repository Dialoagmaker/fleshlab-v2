import { Crosshair, MoreHorizontal, Pause, Play, RotateCcw, SquareCheckBig, SkipForward, TrendingUp } from "lucide-react";

function MissionArtwork({ mission }) {
  if (mission?.mediaUrl) return <img src={mission.mediaUrl} alt={mission.sourceTitle || mission.title} />;
  return <div className="flos-focus-art"><span>{mission?.type || "CREATOR OS"}</span><b>{mission?.title || "Collecting signals"}</b></div>;
}

export default function MissionFocusCard({ mission, busy, onMissionAction, onOpenMission }) {
  const empty = !mission;
  const status = mission?.status || "active";
  const primaryLabel = empty ? "MISSION PENDING" : status === "in_progress" ? "OPEN MISSION" : status === "paused" ? "RESUME MISSION" : "BEGIN MISSION";
  const primaryTitle = empty ? "Creator OS needs an active mission before this can start." : "Open the persisted production mission workflow.";
  const primaryAction = () => {
    if (empty) return;
    if (status === "in_progress") onOpenMission?.();
    else onMissionAction?.(status === "paused" ? "resume" : "start");
  };
  return <section id="today" className="flos-focus"><MissionArtwork mission={mission} /><div className="flos-focus-copy"><p><Crosshair /> TODAY’S FOCUS</p><h2>{mission?.title || "Collecting production mission"}</h2><small>{mission?.minutes ? `${mission.minutes} MINUTE SHOOT` : "Creator OS is analysing your library"}</small><div className="flos-impact"><span>Estimated impact</span><b>{mission?.revenue ? `+$${Math.round(mission.revenue)}` : "Not enough data yet"}</b><em><TrendingUp /> {mission?.priority ? `${mission.priority} priority` : "Waiting for live signals"}</em></div><div className="flos-tags"><i>{mission?.difficulty || "DATA"}</i><i>{mission?.type || "ANALYSIS"}</i><i>{status}</i></div><div className="flos-mission-reason">{mission?.reason || "Upload history, fan behaviour and revenue patterns are still being collected."}</div><div className="flos-actions flos-actions-wide"><button type="button" title={primaryTitle} disabled={empty || busy} onClick={primaryAction}><Play /> {busy ? "WORKING…" : primaryLabel}</button><button type="button" title="Open mission workspace" disabled={empty || busy} aria-label="Open mission workspace" onClick={onOpenMission}><MoreHorizontal /></button></div>{mission && <div className="flos-mission-controls"><button type="button" disabled={busy || status !== "in_progress"} onClick={() => onMissionAction?.("pause")} title={status === "in_progress" ? "Pause this mission" : "Start the mission before pausing"}><Pause /> Pause</button><button type="button" disabled={busy || status !== "paused"} onClick={() => onMissionAction?.("resume")} title={status === "paused" ? "Resume this mission" : "Only paused missions can resume"}><RotateCcw /> Resume</button><button type="button" disabled={busy || !["in_progress","paused"].includes(status)} onClick={() => onMissionAction?.("complete")} title={["in_progress","paused"].includes(status) ? "Complete this mission" : "Start the mission before completing"}><SquareCheckBig /> Complete</button><button type="button" disabled={busy || status === "completed"} onClick={() => onMissionAction?.("skip")} title="Skip this mission and return to Today"><SkipForward /> Skip</button></div>}</div></section>;
}