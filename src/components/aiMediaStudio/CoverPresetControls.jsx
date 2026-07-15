import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COVER_FORMATS, COVER_PRESETS } from "@/lib/aiMediaStudio/coverRenderer";

export default function CoverPresetControls({ settings, onChange }) {
  const patch = data => onChange({ ...settings, ...data });
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-1"><Label className="text-xs">Template preset</Label><Select value={settings.presetId} onValueChange={value => patch({ presetId: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COVER_PRESETS.map(preset => <SelectItem key={preset.id} value={preset.id}>{preset.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1"><Label className="text-xs">Cover format</Label><Select value={settings.formatId} onValueChange={value => patch({ formatId: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COVER_FORMATS.map(format => <SelectItem key={format.id} value={format.id}>{format.label}</SelectItem>)}</SelectContent></Select></div>
      {settings.formatId === "custom" && <div className="space-y-1"><Label className="text-xs">Custom width</Label><Input type="number" value={settings.customWidth} onChange={event => patch({ customWidth: event.target.value })} /></div>}
      {settings.formatId === "custom" && <div className="space-y-1"><Label className="text-xs">Custom height</Label><Input type="number" value={settings.customHeight} onChange={event => patch({ customHeight: event.target.value })} /></div>}
    </div>
  );
}