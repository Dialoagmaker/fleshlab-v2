import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GeoBlockingPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Geo Blocking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Badge variant="outline" className="text-orange-500 border-orange-500">Not Implemented</Badge>
          <p className="text-sm text-muted-foreground">
            Performer-level Geo Blocking is <strong>not implemented</strong> in this version.
          </p>
          <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">What's missing:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Geo-blocking settings (enabled/disabled)</li>
              <li>Country selection (block/allow lists)</li>
              <li>Geo-blocking mode configuration</li>
              <li>Integration with video/brand geo-policies</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground italic">
            For now, geo-blocking is managed at the platform/brand level only.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}