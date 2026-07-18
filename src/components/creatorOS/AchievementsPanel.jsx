import { Award, Crown, Flame, Star } from "lucide-react";

export default function AchievementsPanel({ stats }) {
  const productions = Number(stats?.total_productions || 0);
  const level = Math.max(1, Math.floor(productions / 5) + 1);
  const progress = Math.min(100, (productions % 5) * 20 || 12);
  const badges = [[Crown,"Creator Level " + level],[Flame,"Upload Streak"],[Award,"Top Performer"],[Star,"First $1,000"]];
  return (
    <section className="cos-section cos-achievements">
      <div className="cos-section-head"><p>Achievements</p><h2>Level up your creator career</h2></div>
      <div className="cos-level"><strong>LVL {level}</strong><div><span style={{ width: `${progress}%` }} /></div><p>{productions} productions completed</p></div>
      <div className="cos-badges">{badges.map(([Icon,label]) => <div key={label}><Icon /><span>{label}</span></div>)}</div>
    </section>
  );
}