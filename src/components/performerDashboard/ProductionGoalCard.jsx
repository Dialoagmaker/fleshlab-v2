import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function ProductionGoalCard({ performerId }) {
  // Placeholder - in production this would fetch actual production data
  const [videosThisMonth] = useState(3);
  const [target] = useState(20);
  const progress = (videosThisMonth / target) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Production Goal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Delivered this month</span>
          <span className="text-sm font-semibold">{videosThisMonth} / {target}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Recommended to maintain full performance eligibility.
          </p>
          <p className="text-xs text-muted-foreground">
            Minimum video length: 20 minutes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}