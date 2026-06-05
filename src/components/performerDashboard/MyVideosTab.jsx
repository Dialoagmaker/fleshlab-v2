import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MyVideosTab({ performerId }) {
  const { data: videos, isLoading } = useQuery({
    queryKey: ["performer-videos-list", performerId],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_videos",
        performer_id: performerId
      });
      return res.data.videos || [];
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Videos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Videos where you are credited. Showing all videos regardless of status.
        </p>
      </CardHeader>
      <CardContent>
        {!videos || videos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No videos found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(video => (
              <div key={video.id} className="border rounded-lg overflow-hidden">
                {video.primary_thumbnail_url ? (
                  <img 
                    src={video.primary_thumbnail_url} 
                    alt={video.title}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted"></div>
                )}
                <div className="p-3 space-y-2">
                  <h4 className="text-sm font-medium line-clamp-2">{video.title}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        video.status === 'published' ? 'border-green-500 text-green-500' :
                        video.status === 'draft' ? 'border-yellow-500 text-yellow-500' :
                        'border-gray-500 text-gray-500'
                      }`}
                    >
                      {video.status}
                    </Badge>
                    {video.view_count > 0 && (
                      <span className="text-xs text-muted-foreground">{video.view_count} views</span>
                    )}
                  </div>
                  {video.published_at && (
                    <p className="text-xs text-muted-foreground">
                      Published: {new Date(video.published_at).toLocaleDateString()}
                    </p>
                  )}
                  {video.release_date && (
                    <p className="text-xs text-muted-foreground">
                      Release: {new Date(video.release_date).toLocaleDateString()}
                    </p>
                  )}
                  {video.role && (
                    <p className="text-xs text-muted-foreground capitalize">Role: {video.role}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}