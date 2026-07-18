import { Brain, Home, Sparkles, Users, Wallet, UserRound, LogOut } from "lucide-react";

const items = [[Home,"HOME","top"],[Sparkles,"CREATE","create"],[Users,"FANS","fans"],[Wallet,"MONEY","money"],[Brain,"AI","ai"],[UserRound,"PROFILE","profile"]];

export default function CreatorOSNav({ onLogout }) {
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <>
      <nav className="cos-nav hidden lg:flex">
        <div className="cos-brand">FLESH<span>LAB</span><small>Creator OS</small></div>
        <div className="cos-nav-items">{items.map(([Icon,label,id]) => <button key={label} onClick={() => jump(id)}><Icon />{label}</button>)}</div>
        <button className="cos-logout" onClick={onLogout}><LogOut />Logout</button>
      </nav>
      <nav className="cos-mobile-nav lg:hidden">{items.map(([Icon,label,id]) => <button key={label} onClick={() => jump(id)}><Icon /><span>{label}</span></button>)}</nav>
    </>
  );
}