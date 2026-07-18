export default function MomentumRing({ icon: Icon, label, value, tone }) {
  return <div className="flos-ring" style={{ "--value": `${value}%`, "--tone": tone }}><div><Icon /><small>{label}</small></div><b>{value}%</b></div>;
}