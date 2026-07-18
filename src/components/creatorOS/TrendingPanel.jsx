import { Flame } from "lucide-react";

const images = ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80", "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=240&q=80", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80"];
export default function TrendingPanel() {
  const labels = ["Shower Scenes", "Hotel Mornings", "Mirror Angles"];
  return <section id="fans" className="flos-panel flos-trending"><h3><Flame /> Trending with your fans</h3><div>{labels.map((label,i) => <article key={label}><img src={images[i]} alt={label} /><i>#{i+1}</i><b>{label}</b><span>{i===0?"High demand":"Very high demand"}</span></article>)}</div><button>View all fan requests →</button></section>;
}