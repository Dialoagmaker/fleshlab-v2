import { TrendingUp, Wallet, Zap } from "lucide-react";
import { useState } from "react";

export default function MoneyWorkspace({ briefing, payout }) {
  const [uploads, setUploads] = useState(3);
  const estimate = Math.round((briefing?.revenue_potential_usd || 60) * uploads);
  return <section id="money" className="cos2-workspace cos2-money"><div className="cos2-work-head"><p>MONEY WORKSPACE</p><h2>Money should feel like momentum, not accounting.</h2></div><div className="cos2-money-stage"><div><Wallet /><b>${Number(payout?.summary?.available_balance_usd || 0).toFixed(0)}</b><span>available now</span></div><div><TrendingUp /><b>${estimate}</b><span>if you upload {uploads} scenes this week</span></div></div><label className="cos2-sim"><span>Weekly production intensity</span><input type="range" min="1" max="7" value={uploads} onChange={(e)=>setUploads(Number(e.target.value))} /></label><button className="cos2-ghost"><Zap /> Build my highest ROI week</button></section>;
}