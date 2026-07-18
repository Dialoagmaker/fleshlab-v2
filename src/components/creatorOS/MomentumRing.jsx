export default function MomentumRing({ icon: Icon, label, value, tone, reason }) {
  const display = value === null || value === undefined ? 0 : value;
  return <div className="flos-ring" title={reason} style={{ "--value": `${display}%`, "--tone": tone }}><div><Icon /><small>{label}</small></div><b>{value === null || value === undefined ? "—" : `${value}%`}</b></div>;
}