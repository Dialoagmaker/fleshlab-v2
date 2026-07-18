import { creatorNav } from "./creatorOSTokens";
import XPProfile from "./XPProfile";

export default function CreatorOSSidebar({ performer, stats, activeSpace, onNavigate, onProfileAction }) {
  return <aside className="flos-sidebar"><div className="flos-mark">⌁</div><div className="flos-logo">FLESH<span>LAB</span><small>CREATOR OS</small></div><nav>{creatorNav.map(([Icon,label,id]) => <button key={label} type="button" aria-current={activeSpace === id ? "page" : undefined} className={activeSpace === id ? "active" : ""} onClick={() => onNavigate(id)} title={`Open ${label}`}><Icon />{label}</button>)}</nav><XPProfile performer={performer} stats={stats} onAction={onProfileAction} /></aside>;
}