import { ArrowUpRight, Play, Sparkles } from "lucide-react";

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

export default function CreatorOSHero({ performer, briefing, mission, payout }) {
  const name = performer?.display_name || "Kraken";
  const earned = briefing?.revenue_last_24h_usd || payout?.summary?.current_month_earned_usd || 0;
  return (
    <section id="top" className="cos-hero">
      <div className="cos-orb cos-orb-one" /><div className="cos-orb cos-orb-two" />
      <div className="cos-hero-copy">
        <p className="cos-eyebrow"><Sparkles /> AI Creator Headquarters</p>
        <h1>Welcome back,<br /><span>{name}.</span></h1>
        <p className="cos-hero-sub">Your studio director has prepared today’s highest-impact move.</p>
        <div className="cos-hero-actions"><button><Play /> Start Mission</button><a href="#ai">Ask AI Director <ArrowUpRight /></a></div>
      </div>
      <div className="cos-hero-panel">
        <p>Today’s Earnings</p><strong>{money(earned)}</strong><span>{briefing?.headline || "Creator OS is preparing your next move."}</span>
        <div><small>MISSION</small><h3>{mission?.title || briefing?.today_mission || "Produce today’s best opportunity"}</h3></div>
      </div>
    </section>
  );
}