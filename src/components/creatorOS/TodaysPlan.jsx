import { CheckCircle2 } from "lucide-react";

export default function TodaysPlan({ plan = [] }) {
  return <section className="flos-plan"><h3>Today’s Plan</h3>{plan.length ? plan.map((row,i) => <div key={`${row.time}-${row.label}`} className="flos-plan-row"><i className={i===0?"hot":""} /><span>{row.time}</span><b>{row.label}</b>{row.done ? <CheckCircle2 /> : <em />}</div>) : <p className="flos-empty">Plan pending while Creator OS collects today’s production signals.</p>}</section>;
}