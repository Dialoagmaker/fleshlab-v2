export default function CreatorOSHeader({ performer, briefing }) {
  const name = performer?.display_name || "Creator";
  const date = new Date();
  return <header className="flos-header"><div><h1>{briefing?.greeting || `Good morning, ${name}.`}</h1><p>{briefing?.headline || "Creator OS is building today’s operating picture."}</p></div><strong>TODAY</strong><time>{date.toLocaleDateString(undefined,{ weekday:"long" }).toUpperCase()}<br />{date.toLocaleDateString(undefined,{ day:"2-digit", month:"long", year:"numeric" }).toUpperCase()}</time></header>;
}