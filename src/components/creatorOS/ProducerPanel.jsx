import { Maximize2, Rocket, Target, Users, X } from "lucide-react";
import { producerImage } from "./creatorOSTokens";

export default function ProducerPanel({ recommendations = [] }) {
  const fallback = ["Hotel content is performing 48% better this month. Focus on this vibe.", "Fans are asking for more intimate bathroom scenes. Perfect time to deliver.", "Your rhythm is slowing down. Shoot today to stay in your optimal zone."];
  const icons = [Target, Users, Rocket];
  const items = recommendations.length ? recommendations.slice(0,3).map(r => r.recommendation || r.title) : fallback;
  return <aside id="ai" className="flos-producer"><header><b>AI PRODUCER</b><span><Maximize2 /><X /></span></header><div className="flos-ai-avatar"><img src={producerImage} alt="AI Producer" /></div><p>Your AI Producer is online.<br />Here’s what I recommend:</p><div className="flos-ai-list">{items.map((text,i) => { const Icon = icons[i] || Target; return <article key={text}><Icon /><span>{text}</span></article>; })}</div><div className="flos-prompts"><small>Ask me anything...</small>{["What should I shoot today?", "Summarize my fan messages", "How can I earn more this week?", "Give me content ideas"].map(x => <button key={x}>{x}</button>)}</div><label><input placeholder="Message your producer..." /><button>›</button></label></aside>;
}