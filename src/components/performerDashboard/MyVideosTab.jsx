import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import DetailedVideoCard from "./DetailedVideoCard";

export default function MyVideosTab({ performerId, performerToken }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["performer-videos-list", performerId],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_videos",
        performer_id: performerId,
        performer_token: performerToken
      });
      return res.data;
    },
    enabled: !!performerId && !!performerToken
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const safeVideos = Array.isArray(data?.videos) ? data.videos : [];
  const revenueShare = data?.revenue_share || 40;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">My Videos</h2>
        <p className="text-sm text-muted-foreground">
          Detailed view of all productions you're credited in. Click expand on any video to see complete details.
        </p>
      </div>

      {!safeVideos || safeVideos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No videos found for your profile.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {safeVideos.map((video) => (
            <DetailedVideoCard key={video.video_id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}