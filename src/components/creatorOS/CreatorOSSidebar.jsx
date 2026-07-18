import { creatorNav } from "./creatorOSTokens";
import XPProfile from "./XPProfile";

export default function CreatorOSSidebar({ performer, stats }) {
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return <aside className="flos-sidebar"><div className="flos-mark">⌁</div><div className="flos-logo">FLESH<span>LAB</span><small>CREATOR OS</small></div><nav>{creatorNav.map(([Icon,label,id], index) => <button key={label} className={index === 0 ? "active" : ""} onClick={() => jump(id)}><Icon />{label}</button>)}</nav><XPProfile performer={performer} stats={stats} /></aside>;
}