import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function FanclubTab({ performerId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["performer-fanclub", performerId],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_fanclub",
        performer_id: performerId
      });
      return res.data;
    },
    enabled: !!performerId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.fanclub) {
    return (
      <Card>
        <CardHeader><CardTitle>Fanclub Status</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fanclub is not active yet. Management will notify you when it is ready.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fanclub Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={data.active ? "default" : "secondary"}>
              {data.fanclub.status}
            </Badge>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Monthly Price</p>
            <p className="text-lg font-semibold">${data.fanclub.monthly_price_usd?.toFixed(2) || "0.00"}</p>
          </div>

          {data.fanclub.subscriber_count !== undefined && (
            <div>
              <p className="text-sm text-muted-foreground">Subscribers</p>
              <p className="text-lg font-semibold">{data.fanclub.subscriber_count}</p>
            </div>
          )}

          {data.fanclub.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-sm">{data.fanclub.description}</p>
            </div>
          )}

          {data.fanclub.perks && data.fanclub.perks.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Perks</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {data.fanclub.perks.map((perk, idx) => (
                  <li key={idx}>{perk}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Changes to fanclub settings must be requested through management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}