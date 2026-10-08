import { Bot, Send, WandSparkles } from "lucide-react";

export default function AIStudioDirector({ briefing, recommendations = [] }) {
  const lead = recommendations[0];
  return (
    <section id="ai" className="cos-section cos-ai-director">
      <div className="cos-section-head"><p>AI Studio Director</p><h2>What should I do next?</h2></div>
      <div className="cos-chat-card">
        <div className="cos-ai-avatar"><Bot /></div>
        <div className="cos-message-stack">
          <p className="cos-message-main">{briefing?.summary || "I’m analyzing your library, revenue and fan signals to prepare your next production move."}</p>
          {lead && <div className="cos-suggestion"><WandSparkles /><span>{lead.recommendation}</span></div>}
          <div className="cos-prompt"><span>Ask: “What should I film today?”</span><Send /></div>
        </div>
      </div>
    </section>
  );
}