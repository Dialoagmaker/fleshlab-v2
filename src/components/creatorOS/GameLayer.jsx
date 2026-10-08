import { Award, Crown, Flame, Trophy } from "lucide-react";

export default function GameLayer({ stats }) {
  const videos = Number(stats?.published_videos || stats?.total_productions || 0);
  const level = Math.max(1, Math.floor(videos / 4) + 1);
  return <section id="progress" className="cos2-game"><div><Crown /><p>CREATOR EVOLUTION</p><h2>Season Rank {level}</h2><span>{videos} releases logged. Next unlock: Production Streak badge.</span></div><div className="cos2-rewards">{[[Flame,"Daily Mission"],[Trophy,"Weekly Challenge"],[Award,"Season Reward"]].map(([Icon,label])=><button key={label}><Icon />{label}</button>)}</div></section>;
}