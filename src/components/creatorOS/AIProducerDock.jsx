import { Bot, Command, Send, Sparkles } from "lucide-react";

export default function AIProducerDock({ briefing }) {
  const prompts = ["What should I create next?", "Simulate my week", "Write fan replies"];
  return <aside className="cos2-ai"><div><Bot /><b>AI Producer</b><small>Always on</small></div><p>{briefing?.headline || "Ready to direct your next move."}</p>{prompts.map(p=><button key={p}><Command />{p}</button>)}<label><Sparkles /> Ask anything<input placeholder="Plan my next 4 hours…" /></label><button className="cos2-send"><Send /> Send</button></aside>;
}