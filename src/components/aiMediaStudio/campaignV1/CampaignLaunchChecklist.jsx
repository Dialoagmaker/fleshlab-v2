import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CampaignLaunchChecklist({ items = [] }) {
  if (!items.length) return null;
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Launch Checklist</CardTitle></CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        {items.map(row => (
          <div key={row.item} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 p-3 text-sm">
            <span className="text-foreground">{row.item}</span>
            <Badge variant={row.done ? "outline" : "secondary"}>{row.done ? "Ready" : "Review"}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}