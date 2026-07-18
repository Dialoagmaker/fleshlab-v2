import { Heart, TrendingUp, Wallet, Zap } from "lucide-react";

const money = (v) => `$${Number(v || 0).toFixed(0)}`;

export default function FanMoneyIntelligence({ briefing, stats, payout }) {
  const loves = ["Hotel", "Shower", "POV", "Strong thumbnails"];
  const ignores = ["Long intros", "Dark lighting", "Static camera"];
  return (
    <section id="fans" className="cos-section cos-grid-2">
      <div className="cos-glass-card"><h2><Heart /> Fan Intelligence</h2><p>Fans currently love</p>{loves.map(x => <span key={x}>✓ {x}</span>)}<p className="cos-muted">Fans ignore</p>{ignores.map(x => <small key={x}>✕ {x}</small>)}</div>
      <div id="money" className="cos-glass-card"><h2><Wallet /> Revenue Center</h2><strong>{money((stats?.lifetime_performer_earnings || 0) + (briefing?.revenue_potential_usd || 0))}</strong><p>Expected next opportunity</p><span><TrendingUp /> Best ROI: high-light, fast-hook scenes</span><span><Zap /> Next payout: {payout?.summary?.next_payout_date || "scheduled"}</span></div>
    </section>
  );
}