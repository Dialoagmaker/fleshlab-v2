import { Crosshair, MoreHorizontal, Play, TrendingUp } from "lucide-react";
import { focusImage } from "./creatorOSTokens";

export default function MissionFocusCard({ mission, briefing }) {
  return <section id="today" className="flos-focus"><img src={focusImage} alt="Today focus" /><div className="flos-focus-copy"><p><Crosshair /> TODAY’S FOCUS</p><h2>{mission?.title || "Hotel Morning Session"}</h2><small>45 MINUTE SHOOT</small><div className="flos-impact"><span>Estimated impact</span><b>+ ${mission?.expected_revenue_usd || 180}</b><em><TrendingUp /> High opportunity</em></div><div className="flos-tags"><i>HOTEL SERIES</i><i>HIGH ENGAGEMENT</i><i>FAN REQUESTED</i></div><div className="flos-actions"><button><Play /> BEGIN MISSION</button><button><MoreHorizontal /></button></div></div></section>;
}