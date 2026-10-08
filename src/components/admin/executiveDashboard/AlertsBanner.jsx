import { AlertTriangle, ShieldAlert } from "lucide-react";

export default function AlertsBanner({ alerts = [] }) {
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm ${
            a.level === "critical"
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
          }`}
        >
          {a.level === "critical" ? <ShieldAlert className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  );
}