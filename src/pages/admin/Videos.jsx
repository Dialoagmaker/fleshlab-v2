import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Eye, EyeOff, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_COLORS = {
  published: "bg-green-500/10 text-green-400 border-green-500/20",
  draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  unlisted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

export default function Videos() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: () => base44.entities.Video.list("-created_date", 200),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.Video.update(id, {
        status: status === "published" ? "draft" : "published",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-videos"] }),
  });

  const filtered = videos.filter(v =>
    v.title?.toLowerCase().includes(search.toLowerCase()) ||
    v.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Videos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {videos.length} total{videos.length >= 200 && <span className="ml-2 text-xs text-yellow-400">(showing first 200 records)</span>}
          </p>
        </div>
        <Link to="/admin/videos/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Video
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search videos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          {search ? "No videos match your search." : "No videos yet. Create your first video."}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-muted-foreground font-medium px-4 py-3">Title</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3 hidden sm:table-cell">Slug</th>
                <th className="text-left text-muted-foreground font-medium px-4 py-3">Status</th>
                <th className="text-right text-muted-foreground font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(video => (
                <tr key={video.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground line-clamp-1">{video.title}</div>
                    {video.release_date && (
                      <div className="text-xs text-muted-foreground mt-0.5">{video.release_date}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs text-muted-foreground">{video.slug}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[video.status] || STATUS_COLORS.draft}`}>
                      {video.status || "draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleStatus.mutate({ id: video.id, status: video.status })}
                        title={video.status === "published" ? "Unpublish" : "Publish"}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {video.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <Link to={`/admin/videos/${video.id}`} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}