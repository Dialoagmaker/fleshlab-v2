import { Flame } from "lucide-react";

function TrendMedia({ item }) {
  if (item.mediaUrl) return <img src={item.mediaUrl} alt={item.title} />;
  return <div className="flos-abstract-thumb"><span>{item.title?.slice(0, 2) || "OS"}</span></div>;
}

export default function TrendingPanel({ trends = [] }) {
  return <section id="fans" className="flos-panel flos-trending"><h3><Flame /> Trending with your fans</h3>{trends.length ? <div>{trends.map(item => <article key={item.title}><TrendMedia item={item} /><i>#{item.rank}</i><b>{item.title}</b><span>{item.metric}</span></article>)}</div> : <p className="flos-empty">Collecting engagement, purchase and request data from your creator library.</p>}<button>View fan intelligence →</button></section>;
}