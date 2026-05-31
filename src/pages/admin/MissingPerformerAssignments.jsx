import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import { Video, Users, AlertCircle, Check, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function MissingPerformerAssignments() {
  const queryClient = useQueryClient();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedPerformers, setSelectedPerformers] = useState([]);
  const [search, setSearch] = useState("");

  // Fetch missing assignments
  const { data: missingData = [], isLoading: isMissingLoading } = useQuery({
    queryKey: ["missing-assignments"],
    queryFn: () => base44.functions.invoke("listMissingVideoAssignments", {}),
    select: (res) => res.data || [],
  });

  // Fetch all videos and performers
  const { data: videos = [] } = useQuery({
    queryKey: ["admin-videos-full"],
    queryFn: () => base44.entities.Video.list("-created_date", 500),
  });

  const { data: performers = [] } = useQuery({
    queryKey: ["admin-performers-full"],
    queryFn: () => base44.entities.Performer.list("-created_date", 500),
  });

  // Find unassigned videos
  const unassignedVideos = useMemo(() => {
    return videos.filter(v => missingData.includes(v.id));
  }, [videos, missingData]);

  const filteredVideos = useMemo(() => {
    return unassignedVideos.filter(v =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [unassignedVideos, search]);

  const totalVideos = videos.length;
  const unassignedCount = unassignedVideos.length;
  const assignedCount = totalVideos - unassignedCount;
  const percentageAssigned = totalVideos > 0 ? Math.round((assignedCount / totalVideos) * 100) : 0;

  // Mutation for assigning performers
  const assignPerformers = useMutation({
    mutationFn: async (assignments) => {
      const results = [];
      for (const [videoId, performerIds] of Object.entries(assignments)) {
        for (const performerId of performerIds) {
          const result = await base44.entities.VideoPerformer.create({
            video_id: videoId,
            performer_id: performerId,
            order: 0,
            featured: false,
          });
          results.push(result);
        }
      }
      return results;
    },
    onSuccess: () => {
      toast.success("Performers assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["missing-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-videos-full"] });
      setSelectedVideo(null);
      setSelectedPerformers([]);
    },
    onError: (error) => {
      toast.error("Failed to assign performers: " + error.message);
    },
  });

  const handleAssign = () => {
    if (!selectedVideo || selectedPerformers.length === 0) {
      toast.error("Select a video and at least one performer");
      return;
    }
    assignPerformers.mutate({
      [selectedVideo.id]: selectedPerformers,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Missing Performer Assignments</h1>
        <p className="text-muted-foreground text-sm mt-1">Videos without performer credits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Videos</div>
          <div className="text-3xl font-bold text-foreground">{totalVideos}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-1">Assigned</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-green-500">{assignedCount}</div>
            <Badge variant="secondary">{percentageAssigned}%</Badge>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-1">Unassigned</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-red-500">{unassignedCount}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video List */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <Input
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm"
            />

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {isMissingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="text-center py-8">
                  <Check className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">All videos assigned!</p>
                </div>
              ) : (
                filteredVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedVideo?.id === video.id
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/30 border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="text-sm font-medium text-foreground line-clamp-2">
                      {video.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{video.slug}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Assignment Panel */}
        <div className="lg:col-span-2">
          {selectedVideo ? (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <div className="text-xs text-muted-foreground mb-2">SELECTED VIDEO</div>
                <h3 className="text-lg font-bold text-foreground">{selectedVideo.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedVideo.description}</p>
              </div>

              <div className="border-t border-border pt-6">
                <div className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Assign Performers
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {performers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No performers available</p>
                  ) : (
                    performers.map((performer) => (
                      <button
                        key={performer.id}
                        onClick={() =>
                          setSelectedPerformers((prev) =>
                            prev.includes(performer.id)
                              ? prev.filter((id) => id !== performer.id)
                              : [...prev, performer.id]
                          )
                        }
                        className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                          selectedPerformers.includes(performer.id)
                            ? "bg-primary/10 border-primary"
                            : "bg-muted/30 border-border hover:border-muted-foreground"
                        }`}
                      >
                        {selectedPerformers.includes(performer.id) && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            {performer.display_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {performer.video_count} videos
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4 flex gap-2">
                <Button
                  onClick={handleAssign}
                  disabled={selectedPerformers.length === 0 || assignPerformers.isPending}
                  className="flex-1"
                >
                  {assignPerformers.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Assign {selectedPerformers.length} Performer{selectedPerformers.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedVideo(null);
                    setSelectedPerformers([]);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center h-full min-h-[400px]">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground text-center">
                Select a video from the list to assign performers
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}