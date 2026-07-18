import { utilityIcons } from "./creatorOSTokens";

export default function XPProfile({ performer, stats }) {
  const name = performer?.display_name || "Kraken";
  const level = Math.max(1, Math.floor(Number(stats?.published_videos || 27) / 2));
  const xp = Math.min(96, 42 + level * 2);
  const { Settings, Bell, Share2 } = utilityIcons;
  return <div className="flos-profile"><img src={performer?.profile_image_url || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80"} alt={name} /><b>{name}</b><span>Level {level || 27}</span><small>12,450 / 15,000 XP</small><div className="flos-xp"><i style={{ width: `${xp}%` }} /></div><div className="flos-utils"><Settings /><Bell /><Share2 /></div></div>;
}