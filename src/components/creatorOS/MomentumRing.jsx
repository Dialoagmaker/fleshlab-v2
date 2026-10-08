export default function MomentumRing({ icon: Icon, label, value, tone, reason, onOpen }) {
  const display = value === null || value === undefined ? 0 : value;
  return <button type="button" className="flos-ring" title={reason} aria-label={`Open ${label} momentum breakdown`} onClick={onOpen} style={{ "--value": `${display}%`, "--tone": tone }}><div><Icon /><small>{label}</small></div><b>{value === null || value === undefined ? "—" : `${value}%`}</b></button>;
}