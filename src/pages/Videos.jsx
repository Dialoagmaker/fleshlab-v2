import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VideoCard from "@/components/public/VideoCard";
import VideoFilters from "@/components/public/VideoFilters";
import { Button } from "@/components/ui/button";
import { Film, Loader2 } from "lucide-react";

const VIDEOS_PER_PAGE = 12;

export default function Videos() {
  const [filters, setFilters] = useState({
    search: "",
    brand: "all",
    sort: "newest",
  });
  const [page, setPage] = useState(1);

  // Fetch videos and brands
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['public-videos'],
    queryFn: () => base44.entities.Video.list(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['public-brands'],
    queryFn: () => base44.entities.Brand.list(),
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Film className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-2">Video Library</h1>
          <p className="text-muted-foreground">
            {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'} available
          </p>
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
              <div className="text-center pt-8">
                <Button
                  onClick={() => setPage(p => p + 1)}
                  className="px-8"
                >
                  Load More ({filteredVideos.length - paginatedVideos.length} remaining)
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No videos found</h2>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}