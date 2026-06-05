import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, RefreshCw, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DuplicateVideoManager() {
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: analysis, refetch } = useQuery({
    queryKey: ["video-duplicates-analysis"],
    queryFn: () => base44.functions.invoke("findDuplicateVideos", {}),
  });

  const deleteMutation = useMutation({
    mutationFn: (video_ids_to_delete) => 
      base44.functions.invoke("deleteDuplicateVideos", { video_ids: video_ids_to_delete }),
    onSuccess: (result) => {
      toast.success(`Deleted ${result.data.summary.successful} duplicate videos`);
      setSelectedForDeletion([]);
      setConfirmDelete(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    },
    onError: (error) => {
      toast.error(`Failed to delete duplicates: ${error.message}`);
    },
  });

  const queryClient = useQueryClient();

  const toggleSelection = (videoId) => {
    setSelectedForDeletion(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const selectAllInGroup = (groupVideos, keepId) => {
    const toSelect = groupVideos
      .filter(v => v.id !== keepId)
      .map(v => v.id);
    
    setSelectedForDeletion(prev => {
      const allSelected = toSelect.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !toSelect.includes(id));
      } else {
        return [...new Set([...prev, ...toSelect])];
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedForDeletion.length === 0) return;
    deleteMutation.mutate(selectedForDeletion);
  };

  if (!analysis?.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Duplicate Video Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading analysis...
          </div>
        </CardContent>
      </Card>
    );
  }

  const { summary, duplicate_source_files } = analysis.data;

  if (summary.total_duplicate_videos_to_delete === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            No Duplicate Videos Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All {summary.total_videos} videos are unique. No duplicates detected.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Duplicate Video Manager
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={deleteMutation.isPending}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              Found <strong>{summary.total_duplicate_videos_to_delete}</strong> duplicate videos 
              across <strong>{summary.duplicate_source_file_groups}</strong> groups.
              Select duplicates to delete (keeping the oldest video in each group).
            </AlertDescription>
          </Alert>

          {selectedForDeletion.length > 0 && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-destructive">
                  <strong>{selectedForDeletion.length}</strong> videos selected for deletion
                </p>
                {!confirmDelete ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmDelete(true)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDeleteSelected}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                      ) : (
                        <><Trash2 className="w-4 h-4 mr-2" /> Confirm Delete</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleteMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duplicate Groups */}
      {duplicate_source_files.map((group, idx) => {
        const keepVideo = group.videos[group.videos.length - 1]; // Oldest
        const duplicates = group.videos.filter(v => v.id !== keepVideo.id);
        
        return (
          <Card key={idx} className="border-yellow-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Duplicate Group {idx + 1} - {group.count} videos
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {group.filename}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Keep this video (oldest) */}
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{keepVideo.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Slug: {keepVideo.slug} • Created: {new Date(keepVideo.created_date).toLocaleDateString()}
                      </p>
                      <Badge className="mt-1 bg-green-500/10 text-green-500">KEEP (Oldest)</Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllInGroup(group.videos, keepVideo.id)}
                  >
                    Select Others
                  </Button>
                </div>
              </div>

              {/* Duplicates to delete */}
              {duplicates.map(video => (
                <div
                  key={video.id}
                  className={`p-3 border rounded-lg transition-colors ${
                    selectedForDeletion.includes(video.id)
                      ? "bg-destructive/10 border-destructive/20"
                      : "bg-red-500/5 border-red-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedForDeletion.includes(video.id)}
                        onChange={() => toggleSelection(video.id)}
                        className="w-4 h-4 accent-destructive"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{video.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Slug: {video.slug} • Created: {new Date(video.created_date).toLocaleDateString()}
                        </p>
                        <Badge className="mt-1 bg-red-500/10 text-red-500">
                          {video.status === 'published' ? 'PUBLISHED' : video.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}