import { Bot, MessageCircle } from "lucide-react";

export default function FloatingAIAssistant() {
  const jump = () => document.getElementById("ai")?.scrollIntoView({ behavior: "smooth" });
  return <button className="cos-floating-ai" onClick={jump}><Bot /><span><b>AI Producer</b><small>Ask what to film next</small></span><MessageCircle /></button>;
}