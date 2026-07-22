import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DirectionAssetColumn from "./DirectionAssetColumn";
import ArtDirectionComparisonMatrix from "./ArtDirectionComparisonMatrix";

export default function ArtDirectionVariationComparison({ comparison }) {
  if (!comparison?.directions?.length) return null;
  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader><CardTitle className="text-sm">Three Creative Directors / One Hero Photograph</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">All campaigns reuse the same selected Hero Photography frame and only change Art Direction decisions.</p>
        </CardContent>
      </Card>
      <ArtDirectionComparisonMatrix report={comparison.report} />
      <div className="grid gap-4 xl:grid-cols-3">
        {comparison.directions.map(direction => <DirectionAssetColumn key={direction.key} direction={direction} />)}
      </div>
    </div>
  );
}