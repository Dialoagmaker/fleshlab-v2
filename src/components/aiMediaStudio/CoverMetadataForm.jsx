import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fields = [
  ["videoTitle", "Video Title", "Required"],
  ["optionalSubtitle", "Subtitle / Tagline", "Optional"],
  ["performerName", "Performer", "Optional"],
  ["seriesName", "Series", "Optional"],
  ["contentType", "Content Type", "Optional"],
  ["campaignName", "Campaign", "Optional"],
];

export default function CoverMetadataForm({ metadata, onChange }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {fields.map(([key, label, hint]) => (
        <div key={key} className="space-y-1.5">
          <Label className="flex items-center justify-between text-xs font-bold">
            <span>{label}</span>
            <span className="text-[10px] font-medium text-muted-foreground">{hint}</span>
          </Label>
          <Input
            value={metadata[key] || ""}
            onChange={event => onChange({ ...metadata, [key]: event.target.value })}
            placeholder={label}
          />
        </div>
      ))}
    </div>
  );
}