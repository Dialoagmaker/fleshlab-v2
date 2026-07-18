import { Activity, BadgeCheck, Clapperboard, DollarSign, Sparkles, Trophy } from "lucide-react";

export default function CreatorFeed({ recommendations = [], videos = [], payout }) {
  const feed = [
    [DollarSign, payout?.summary?.available_balance_usd > 0 ? "New payout value available" : "Revenue system synced"],
    [Sparkles, "AI prepared today’s production mission"],
    [Clapperboard, videos?.[0]?.title ? `Latest upload analyzed: ${videos[0].title}` : "Library scan completed"],
    [Trophy, recommendations?.[0]?.title || "New growth opportunity detected"],
    [BadgeCheck, "Creator profile signals are healthy"]
  ];
  return (
    <section className="cos-section cos-feed">
      <div className="cos-section-head"><p>Creator Feed</p><h2>Live studio activity</h2></div>
      <div className="cos-feed-list">{feed.map(([Icon,text],i) => <div key={text} className="cos-feed-row"><Icon /><span>{text}</span><small>{i === 0 ? "now" : `${i + 2}m`}</small></div>)}</div>
    </section>
  );
}