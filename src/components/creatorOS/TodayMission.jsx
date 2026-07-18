import { CheckCircle2, Clock, Flame, Smartphone, Sun } from "lucide-react";

const money = (v) => v > 0 ? `$${Number(v).toFixed(0)}` : "$$$$";

export default function TodayMission({ mission, briefing }) {
  const tools = ["Smartphone", "Natural Light", "Clean Location", "Strong Opening"];
  return (
    <section id="create" className="cos-section">
      <div className="cos-mission">
        <div><p className="cos-eyebrow"><Flame /> Today’s Mission</p><h2>{mission?.title || briefing?.today_mission || "Film your next high-converting scene"}</h2><p>{mission?.description || "Follow the AI director’s production plan and publish with better hooks, cleaner thumbnails and stronger fan appeal."}</p></div>
        <div className="cos-mission-grid">
          <span>Priority <b>{mission?.priority || "HIGH"}</b></span><span>Expected <b>{money(mission?.expected_revenue_usd || briefing?.revenue_potential_usd)}</b></span><span><Clock /> {mission?.production_time_hours || 1}h</span><span><Smartphone /> Mobile ready</span>
        </div>
        <div className="cos-tools">{tools.map((tool,i) => <small key={tool}>{i % 2 ? <Sun /> : <CheckCircle2 />}{tool}</small>)}</div>
        <button className="cos-start">START MISSION</button>
      </div>
    </section>
  );
}