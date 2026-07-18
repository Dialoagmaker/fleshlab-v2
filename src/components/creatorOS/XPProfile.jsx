import { utilityIcons } from "./creatorOSTokens";

export default function XPProfile({ performer, stats, onAction }) {
  const name = performer?.display_name || "Creator";
  const level = Math.max(1, Math.floor(Number(stats?.published_videos || stats?.total_videos || 0) / 2));
  const xp = Math.min(96, Math.max(8, level * 6));
  const { Settings, Bell, Share2 } = utilityIcons;
  return <div id="me" className="flos-profile">{performer?.profile_image_url ? <img src={performer.profile_image_url} alt={name} /> : <div className="flos-profile-mark">{name.slice(0,2)}</div>}<b>{name}</b><span>Level {level}</span><small>{stats?.published_videos || 0} published signals</small><div className="flos-xp"><i style={{ width: `${xp}%` }} /></div><div className="flos-utils"><button type="button" aria-label="Open creator settings" onClick={() => onAction?.("settings")}><Settings /></button><button type="button" aria-label="Open notifications" onClick={() => onAction?.("notifications")}><Bell /></button><button type="button" aria-label="Open share profile tools" onClick={() => onAction?.("share")}><Share2 /></button></div></div>;
}