import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MyVideosTab({ performerId, performerToken }) {
  const { data: videos, isLoading, error } = useQuery({
    queryKey: ["performer-videos-list", performerId],
    queryFn: async () => {
      console.log('[MyVideosTab] Fetching videos for performer:', performerId);
      const res = await base44.functions.invoke("performerDashboardService", {
        action: "get_videos",
        performer_id: performerId,
        performer_token: performerToken
      });
      console.log('[MyVideosTab] Raw response:', res.data);
      const videosArray = Array.isArray(res.data?.videos) ? res.data.videos : [];
      console.log('[MyVideosTab] Normalized videos:', videosArray, 'Count:', videosArray.length);
      return videosArray;
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

  // Safe array handling
  const safeVideos = Array.isArray(videos) ? videos : [];

  console.log('[MyVideosTab] Render - performerId:', performerId, 'videos:', safeVideos, 'count:', safeVideos.length, 'error:', error);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Videos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Videos where you are credited. Showing all videos regardless of status.
        </p>
      </CardHeader>
      <CardContent>
        {!safeVideos || safeVideos.length === 0 ? (
          <div className="bg-muted rounded-lg p-6 space-y-2">
            <p className="text-sm text-muted-foreground">No videos found.</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Performer ID: {performerId}</p>
              <p>Response keys: {videos ? Object.keys(videos).join(', ') : 'N/A'}</p>
              <p>Is Array: {Array.isArray(videos)}</p>
              <p>Error: {error?.message || 'none'}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeVideos.map(video => (
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