import { Aperture, Film, Map, Sparkles } from "lucide-react";

const parse = (v) => { try { return v ? JSON.parse(v) : []; } catch { return []; } };
export default function LibraryUniverse({ library }) {
  const missing = parse(library?.missing_categories_json).slice(0,4);
  const worlds = missing.length ? missing : ["Vacation", "Massage", "Gym", "Story series"];
  return <section id="library" className="cos2-workspace cos2-library"><div className="cos2-work-head"><p>LIBRARY UNIVERSE</p><h2>Your content is not a folder. It is a world map.</h2></div><div className="cos2-universe"><div className="cos2-planet"><Aperture /><b>Content DNA</b><span>{library?.genre_balance || "strong intimacy, needs more scene variety"}</span></div>{worlds.map((w,i)=><div key={w} className={`cos2-world cos2-world-${i}`}><Sparkles />{w}</div>)}</div><div className="cos2-library-note"><Film /> {library?.series_progress || "A repeatable series can turn one good idea into a season."}<Map /></div></section>;
}