import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { appParams } from "@/lib/app-params";
import VideoCard from "@/components/public/VideoCard";
import VideoFilters from "@/components/public/VideoFilters";
import { Button } from "@/components/ui/button";
import { Film, Play, AlertCircle } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

const VIDEOS_PER_PAGE = 24;

// Calls a backend function (service role) — never touches User/me or any entity endpoint directly.
async function fetchPublicVideosAndBrands(page = 1) {
  const url = `/api/apps/${appParams.appId}/functions/getPublicVideos`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page, limit: VIDEOS_PER_PAGE }),
  });
  if (!resp.ok) throw new Error(`Videos fetch failed: ${resp.status}`);
  return resp.json();
}

export default function Videos() {
  const [filters, setFilters] = useState({
    search: "",
    brand: "all",
    sort: "newest",
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-videos-fn', page],
    queryFn: () => fetchPublicVideosAndBrands(page),
    retry: 0,
  });

  const videos = data?.videos || [];
  const brands = data?.brands || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  // Filter and sort videos (client-side filtering on current page)
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(v =>
        v.title?.toLowerCase().includes(searchLower) ||
        (v.short_summary && v.short_summary.toLowerCase().includes(searchLower))
      );
    }

    if (filters.brand !== "all") {
      result = result.filter(v => v.brand_id === filters.brand);
    }

    switch (filters.sort) {
      case "newest":
        // Already sorted by backend
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

  const handleClearFilters = () => {
    setFilters({ search: "", brand: "all", sort: "newest" });
    setPage(1);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontSize: 16, fontFamily: 'Arial' }}>Loading videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
        <AlertCircle style={{ width: 48, height: 48, color: '#e53e3e' }} />
        <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>Could not load videos</h2>
        <p style={{ color: '#a0a0a0', fontSize: 14 }}>{error?.message || 'Check console for VIDEOS_FETCH_ERROR'}</p>
        <button onClick={() => window.location.reload()} style={{ color: '#e63946', textDecoration: 'underline', fontSize: 14, cursor: 'pointer' }}>Reload</button>
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title="Video Library — FLESHLAB | Asian Twink Videos"
        description="Browse our collection of premium Asian twink videos. Exclusive studio productions, verified performers, new releases weekly."
        canonical="/videos"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "FLESHLAB Video Library",
          "description": "Premium Asian twink video collection"
        }}
      />
      <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-background border-b border-border py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-primary fill-current" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Video Library</h1>
              <p className="text-muted-foreground text-sm">
                {total} {total === 1 ? 'video' : 'videos'} total • Showing page {page} {hasMore ? `(1-${page * VIDEOS_PER_PAGE})` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <VideoFilters
          brands={brands}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1);
          }}
          onClear={handleClearFilters}
        />

        {filteredVideos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map(video => (
                <VideoCard key={video.id} video={video} brands={brands} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center pt-8 pb-4">
                <Button
                  onClick={() => setPage(p => p + 1)}
                  className="px-8 bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  Load More Videos
                  <span className="ml-2 text-xs opacity-80">
                    ({total - page * VIDEOS_PER_PAGE} remaining)
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
    </>
  );
}