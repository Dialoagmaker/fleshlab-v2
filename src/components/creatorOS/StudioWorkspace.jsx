import { Flame, Radio, Sparkles, Zap } from "lucide-react";

export default function StudioWorkspace({ performer, briefing, mission }) {
  const name = performer?.display_name || "Creator";
  const signals = ["fans asking for intimacy", "library needs fresh locations", "upload rhythm can accelerate"];
  return <section id="studio" className="cos2-stage"><div className="cos2-noise" /><div className="cos2-stage-copy"><p><Radio /> LIVE STUDIO SIGNAL</p><h1>{name}, your next scene is already forming.</h1><span>{briefing?.summary || "The OS is reading your content universe and shaping today’s best creative move."}</span><button><Flame /> Launch today’s mission</button></div><div className="cos2-orbit"><div className="cos2-core"><Sparkles /><b>{mission?.title || "Create the next hit"}</b><small>{mission?.reason || briefing?.headline || "Highest creative opportunity today"}</small></div>{signals.map((s,i)=><i key={s} className={`cos2-signal cos2-signal-${i}`}>{s}<Zap /></i>)}</div></section>;
}