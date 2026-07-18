import { Clapperboard } from "lucide-react";

export default function SeriesPanel() {
  const rows = [["Hotel Series","Episode 3",60],["Bathroom Diaries","Episode 1",20]];
  return <section id="library" className="flos-panel flos-series"><h3><Clapperboard /> Series in progress</h3>{rows.map(([title,ep,p]) => <article key={title}><div /><span><b>{title}</b><small>{ep}</small><i><em style={{ width: `${p}%` }} /></i></span><strong>{p}%</strong></article>)}<button>View all series →</button></section>;
}