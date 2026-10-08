import { BadgeDollarSign, BatteryCharging, Heart, Video } from "lucide-react";
import MomentumRing from "./MomentumRing";

export default function MomentumPanel({ momentum = [], onOpen }) {
  const icons = { Production: Video, Fans: Heart, Revenue: BadgeDollarSign, Consistency: BatteryCharging };
  const tones = { Production: "#ff2433", Fans: "#ff5d66", Revenue: "#ff9f1a", Consistency: "#8b5cf6" };
  return <section className="flos-momentum"><h3>Momentum</h3><div>{momentum.map(item => <MomentumRing key={item.label} icon={icons[item.label]} label={item.label} value={item.value} tone={tones[item.label]} reason={item.reason} onOpen={() => onOpen?.(item)} />)}</div></section>;
}