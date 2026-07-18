export default function CreatorOSHeader({ performer }) {
  const name = performer?.display_name || "Kraken";
  return <header className="flos-header"><div><h1>Good morning, <span>{name}.</span></h1><p>You’ve got momentum. Let’s keep it going.</p></div><strong>TODAY</strong><time>SATURDAY<br />18 JULY 2025</time></header>;
}