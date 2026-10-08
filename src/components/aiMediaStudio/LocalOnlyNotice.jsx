import { ShieldCheck, HardDrive, WifiOff } from "lucide-react";

const guarantees = [
  { icon: ShieldCheck, label: "No cloud upload" },
  { icon: HardDrive, label: "Original files stay local" },
  { icon: WifiOff, label: "No remote inference" },
];

export default function LocalOnlyNotice() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Offline-first requirement</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">Videos never leave this computer.</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            This module only reads local files selected by the user. It does not upload videos, call external AI APIs, or duplicate originals.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 md:min-w-[420px]">
          {guarantees.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-xs font-semibold text-foreground">
                <Icon className="h-4 w-4 text-primary" />
                {item.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}