import { Clapperboard } from "lucide-react";

export default function SeriesPanel({ series = [] }) {
  return <section id="library" className="flos-panel flos-series"><h3><Clapperboard /> Series in progress</h3>{series.length ? series.map(row => <article key={row.name}><div className="flos-series-mark">{row.episodes}</div><span><b>{row.name}</b><small>{row.missing ? `Episode ${row.missing} ready to produce` : `${row.episodes} episodes detected`}</small><i><em style={{ width: `${row.progress}%` }} /></i></span><strong>{row.progress}%</strong></article>) : <p className="flos-empty">No recurring series detected yet. Creator OS will surface series opportunities after more uploads are analysed.</p>}<button>View library intelligence →</button></section>;
}