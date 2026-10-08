import { Heart, MessageCircle, Star, Users } from "lucide-react";

export default function FansWorkspace({ briefing }) {
  const requests = ["more shower scenes", "behind-the-scenes clips", "hotel solo storyline", "voice notes for VIPs"];
  return <section id="fans" className="cos2-workspace cos2-fans"><div className="cos2-work-head"><p>FANS WORKSPACE</p><h2>Discord energy. Instagram emotion. AI summaries.</h2></div><div className="cos2-fan-wall"><div className="cos2-vip"><Star /><b>VIP mood</b><span>Fans are warmer when you post personal context before the scene.</span></div>{requests.map((r,i)=><div key={r} className="cos2-bubble"><Heart /> “{r}”<small>{i+3} fans mentioned this</small></div>)}<div className="cos2-vip"><Users /><b>Today’s fan move</b><span>{briefing?.new_fans_count || 0} new fans need a welcome message.</span></div></div><button className="cos2-ghost"><MessageCircle /> Generate fan reply plan</button></section>;
}