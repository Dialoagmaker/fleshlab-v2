import { BadgeDollarSign, BatteryCharging, Heart, Video } from "lucide-react";
import MomentumRing from "./MomentumRing";

export default function MomentumPanel() {
  const items = [[Video,"Production",80,"#ff2433"],[Heart,"Fans",72,"#ff5d66"],[BadgeDollarSign,"Revenue",90,"#ff9f1a"],[BatteryCharging,"Consistency",60,"#8b5cf6"]];
  return <section className="flos-momentum"><h3>Momentum</h3><div>{items.map(([Icon,label,value,tone]) => <MomentumRing key={label} icon={Icon} label={label} value={value} tone={tone} />)}</div></section>;
}