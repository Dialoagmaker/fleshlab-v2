import { Crosshair, MoreHorizontal, Play, TrendingUp } from "lucide-react";

function MissionArtwork({ mission }) {
  if (mission?.mediaUrl) return <img src={mission.mediaUrl} alt={mission.sourceTitle || mission.title} />;
  return <div className="flos-focus-art"><span>{mission?.type || "CREATOR OS"}</span><b>{mission?.title || "Collecting signals"}</b></div>;
}

export default function MissionFocusCard({ mission }) {
  const empty = !mission;
  return <section id="today" className="flos-focus"><MissionArtwork mission={mission} /><div className="flos-focus-copy"><p><Crosshair /> TODAY’S FOCUS</p><h2>{mission?.title || "Collecting production mission"}</h2><small>{mission?.minutes ? `${mission.minutes} MINUTE SHOOT` : "Creator OS is analysing your library"}</small><div className="flos-impact"><span>Estimated impact</span><b>{mission?.revenue ? `+$${Math.round(mission.revenue)}` : "Not enough data yet"}</b><em><TrendingUp /> {mission?.priority ? `${mission.priority} priority` : "Waiting for live signals"}</em></div><div className="flos-tags"><i>{mission?.difficulty || "DATA"}</i><i>{mission?.type || "ANALYSIS"}</i><i>{mission?.sourceTitle || "CREATOR MEDIA ONLY"}</i></div><div className="flos-mission-reason">{mission?.reason || "Upload history, fan behaviour and revenue patterns are still being collected."}</div><div className="flos-actions"><button disabled={empty}><Play /> {empty ? "MISSION PENDING" : "BEGIN MISSION"}</button><button><MoreHorizontal /></button></div></div></section>;
}