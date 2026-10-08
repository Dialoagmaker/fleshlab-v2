import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LatestVideosCard({ performerId }) {
  const { data: videos, isLoading } = useQuery({
    queryKey: ["performer-latest-videos", performerId],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_videos",
        performer_id: performerId
      });
      return (res.data.videos || []).slice(0, 3);
    },
    enabled: !!performerId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Latest Videos</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Latest Videos</CardTitle>
      </CardHeader>
      <CardContent>
        {!videos || videos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No videos published yet.</p>
        ) : (
          <div className="space-y-3">
            {videos.map(video => (
              <div key={video.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                {video.primary_thumbnail_url ? (
                  <img 
                    src={video.primary_thumbnail_url} 
                    alt={video.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-12 bg-muted rounded"></div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{video.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{video.status}</Badge>
                    {video.view_count > 0 && (
                      <span className="text-xs text-muted-foreground">{video.view_count} views</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}