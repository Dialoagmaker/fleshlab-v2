import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CampaignConsensusCard({ campaign }) {
  if (!campaign) return null;
  const rows = [
    ["Territory", campaign.consensus.campaignTerritory],
    ["Promise", campaign.consensus.commercialPromise],
    ["Fantasy", campaign.consensus.primaryFantasy],
    ["Creative idea", campaign.consensus.creativeIdea],
    ["Hero", campaign.consensus.heroStrategy],
    ["Brand", campaign.consensus.brandLanguage],
  ];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-sm">Locked Campaign Consensus</CardTitle>
        <Badge variant="outline">Hotel Sessions V1</Badge>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm text-foreground">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}