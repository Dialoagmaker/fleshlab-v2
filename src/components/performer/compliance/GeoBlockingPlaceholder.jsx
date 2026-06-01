import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GeoBlockingPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Geo Blocking</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Performer-level Geo Blocking will be managed here in a later phase.
        </p>
      </CardContent>
    </Card>
  );
}