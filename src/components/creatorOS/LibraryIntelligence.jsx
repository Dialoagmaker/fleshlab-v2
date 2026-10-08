import { CircleGauge, Film, Sparkles, X } from "lucide-react";

const list = (value) => { try { return value ? JSON.parse(value) : []; } catch { return []; } };

export default function LibraryIntelligence({ library, stats }) {
  const missing = list(library?.missing_categories_json).slice(0, 5);
  const overused = list(library?.overused_locations_json).slice(0, 4);
  const health = Math.min(98, 68 + Number(stats?.published_videos || 0) * 3);
  return (
    <section className="cos-section cos-library">
      <div className="cos-section-head"><p>Library Intelligence</p><h2>Your content health</h2></div>
      <div className="cos-health"><CircleGauge /><strong>{health}%</strong><span>{library?.library_diversity || "Balanced library in progress"}</span></div>
      <div className="cos-two-col"><div><h3><Sparkles /> Missing categories</h3>{missing.length ? missing.map(x => <p key={x}>✓ {x}</p>) : <p>✓ Vacation</p>}</div><div><h3><X /> Overused</h3>{overused.length ? overused.map(x => <p key={x}>✕ {x}</p>) : <p>✕ Static camera</p>}</div></div>
      <div className="cos-mini-note"><Film /> {library?.library_freshness || "Keep releasing short, high-intent concepts."}</div>
    </section>
  );
}