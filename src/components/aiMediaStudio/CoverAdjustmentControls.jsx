import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const sliders = [
  ["zoom", "Zoom", 0.7, 2.2, 0.01], ["x", "Horizontal position", -100, 100, 1], ["y", "Vertical position", -100, 100, 1],
  ["brightness", "Brightness", 60, 150, 1], ["contrast", "Contrast", 60, 170, 1], ["saturation", "Saturation", 0, 180, 1],
  ["titleSize", "Title font size", 50, 260, 1], ["subtitleSize", "Subtitle font size", 28, 180, 1], ["titleY", "Title vertical position", 18, 78, 1],
  ["gradientStrength", "Gradient strength", 20, 95, 1], ["borderTexture", "Border texture", 0, 100, 1], ["safeMargin", "Platform-safe margin", 3, 14, 1],
];

export default function CoverAdjustmentControls({ settings, onChange, onReset }) {
  const patch = data => onChange(data);
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button type="button" onClick={onReset} className="text-xs font-semibold text-primary hover:underline">Reset all to Auto</button></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sliders.map(([key, label, min, max, step]) => (
          <div key={key} className="space-y-1"><Label className="text-xs">{label}: {settings[key]}</Label><input className="w-full accent-primary" type="range" min={min} max={max} step={step} value={settings[key]} onChange={event => patch({ [key]: Number(event.target.value) })} /></div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border p-3"><Label className="text-xs">Logo placement</Label><p className="mt-1 text-sm text-muted-foreground">Adaptive: secondary to performer, title and composition.</p></div>
        <div className="flex items-center gap-3 rounded-lg border border-border p-3"><Switch checked={settings.showSafeMargins} onCheckedChange={value => patch({ showSafeMargins: value })} /><span className="text-sm text-muted-foreground">Show safe-margin guide</span></div>
        <div className="space-y-1 md:col-span-1"><Label className="text-xs">Selling points</Label><Textarea value={settings.sellingPoints} onChange={event => patch({ sellingPoints: event.target.value })} rows={3} /></div>
      </div>
    </div>
  );
}