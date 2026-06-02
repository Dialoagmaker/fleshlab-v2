import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { appParams } from "@/lib/app-params";
import VideoCard from "@/components/public/VideoCard";
import VideoFilters from "@/components/public/VideoFilters";
import { Button } from "@/components/ui/button";
import { Film, Loader2, Play, AlertCircle } from "lucide-react";

const VIDEOS_PER_PAGE = 12;

async function fetchPublicVideos() {
  const url = `/api/apps/${appParams.appId}/entities/Video?sort=-release_date&limit=200`;
  const resp = await fetch(url, { headers: { 'X-App-Id': appParams.appId } });
  if (!resp.ok) throw new Error(`Video fetch failed: ${resp.status}`);
  const data = await resp.json();
  return Array.isArray(data) ? data : (data.results ?? data.items ?? []);
}

async function fetchPublicBrands() {
  const url = `/api/apps/${appParams.appId}/entities/Brand?limit=100`;
  const resp = await fetch(url, { headers: { 'X-App-Id': appParams.appId } });
  if (!resp.ok) return [];
  const data = await resp.json();
  return Array.isArray(data) ? data : (data.results ?? data.items ?? []);
}

export default function Videos() {
  console.log('PUBLIC_VIDEOS_RENDER_START', window.location.pathname);
  const [filters, setFilters] = useState({
    search: "",
    brand: "all",
    sort: "newest",
  });
  const [page, setPage] = useState(1);

  const { data: videos = [], isLoading: videosLoading, error: videosError } = useQuery({
    queryKey: ['public-videos-direct'],
    queryFn: fetchPublicVideos,
    retry: 0,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['public-brands-direct'],
    queryFn: fetchPublicBrands,
    retry: 0,
  });

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(v => 
        v.title.toLowerCase().includes(searchLower) ||
        (v.short_summary && v.short_summary.toLowerCase().includes(searchLower))
      );
    }

    // Brand filter
    if (filters.brand !== "all") {
      result = result.filter(v => v.brand_id === filters.brand);
    }

    // Sort
    switch (filters.sort) {
      case "newest":
        result.sort((a, b) => new Date(b.release_date || b.created_date) - new Date(a.release_date || a.created_date));
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.release_date || a.created_date) - new Date(b.release_date || b.created_date));
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "views":
        result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      default:
        break;
    }

    return result;
  }, [videos, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);
  const paginatedVideos = filteredVideos.slice(0, page * VIDEOS_PER_PAGE);

  const hasMore = paginatedVideos.length < filteredVideos.length;

  const handleClearFilters = () => {
    setFilters({
      search: "",
      brand: "all",
      sort: "newest",
    });
    setPage(1);
  };

  if (videosLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (videosError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Could not load videos</h2>
        <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
        <button onClick={() => window.location.reload()} className="text-sm text-primary underline">Reload</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero - Tube-style */}
      <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-background border-b border-border py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-primary fill-current" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Video Library</h1>
              <p className="text-muted-foreground text-sm">
                {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'} • Browse all Asian twink content
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <VideoFilters
          brands={brands}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1);
          }}
          onClear={handleClearFilters}
        />

        {/* Video Grid */}
        {paginatedVideos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedVideos.map(video => (
                <VideoCard key={video.id} video={video} brands={brands} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-8 pb-4">
                <Button
                  onClick={() => setPage(p => p + 1)}
                  className="px-8 bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  Load More Videos
                  <span className="ml-2 text-xs opacity-80">
                    ({filteredVideos.length - paginatedVideos.length} remaining)
                  </span>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-card/50 rounded-xl border border-border">
            <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">No videos found</h2>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}