import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fields = [
  ["performerName", "Performer name"],
  ["videoTitle", "Video title"],
  ["optionalSubtitle", "Optional subtitle"],
  ["contentType", "Content type"],
  ["campaignName", "Campaign name"],
];

export default function CoverMetadataForm({ metadata, onChange, lockUserText = true, onLockUserTextChange }) {
  return (
    <div className="space-y-3">
      <label className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs font-bold text-foreground">
        <input type="checkbox" checked={lockUserText} onChange={event => onLockUserTextChange?.(event.target.checked)} />
        Lock User Text
      </label>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {fields.map(([key, label]) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input value={metadata[key] || ""} onChange={event => onChange({ ...metadata, [key]: event.target.value })} placeholder={label} />
          </div>
        ))}
      </div>
    </div>
  );
}