import { CheckCircle2 } from "lucide-react";

export default function TodaysPlan() {
  const rows = [["09:00","Shoot",true],["11:00","Upload & Edit",false],["14:00","Publish",false],["19:00","Fanclub Post",false]];
  return <section className="flos-plan"><h3>Today’s Plan</h3>{rows.map(([time,label,done],i) => <div key={label} className="flos-plan-row"><i className={i===0?"hot":""} /><span>{time}</span><b>{label}</b>{done ? <CheckCircle2 /> : <em />}</div>)}</section>;
}