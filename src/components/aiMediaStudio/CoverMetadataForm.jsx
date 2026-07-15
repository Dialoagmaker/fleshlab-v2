import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fields = [
  ["performerName", "Performer name"],
  ["videoTitle", "Video title"],
  ["optionalSubtitle", "Optional subtitle"],
  ["contentType", "Content type"],
  ["campaignName", "Campaign name"],
];

export default function CoverMetadataForm({ metadata, onChange }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {fields.map(([key, label]) => (
        <div key={key} className="space-y-1">
          <Label className="text-xs">{label}</Label>
          <Input value={metadata[key] || ""} onChange={event => onChange({ ...metadata, [key]: event.target.value })} placeholder={label} />
        </div>
      ))}
    </div>
  );
}