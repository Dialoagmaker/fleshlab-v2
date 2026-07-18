import { BadgeDollarSign } from "lucide-react";

export default function RevenueOutlook({ briefing, payout }) {
  const amount = Number(briefing?.revenue_last_7d_usd || payout?.summary?.current_month_earned_usd || 1280);
  return <section id="money" className="flos-panel flos-revenue"><h3><BadgeDollarSign /> Revenue Outlook</h3><span>This week (forecast)</span><b>${amount.toLocaleString()}</b><em>+23%</em><small>vs last week</small><svg viewBox="0 0 210 80" aria-hidden="true"><path d="M2 62 C28 42 34 61 52 45 S82 54 98 30 S126 58 145 28 S176 18 208 8" /><circle cx="170" cy="22" r="4" /></svg><button>View revenue planner →</button></section>;
}