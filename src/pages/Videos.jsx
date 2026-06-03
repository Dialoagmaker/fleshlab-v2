import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { appParams } from "@/lib/app-params";
import VideoCard from "@/components/public/VideoCard";
import VideoFilters from "@/components/public/VideoFilters";
import { Button } from "@/components/ui/button";
import { Film, Play, AlertCircle } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { useI18n } from "@/i18n/i18n";

const VIDEOS_PER_PAGE = 24;

async function fetchPublicVideosAndBrands(page = 1, filters = {}) {
  const cacheKey = `publicVideos_page_${page}_filters_${JSON.stringify(filters)}`;
  const cacheTTL = 60 * 1000;
  
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheTTL) {
        return data;
      }
    }
  } catch (e) {
    // Ignore cache errors
  }
  
  const url = `/api/apps/${appParams.appId}/functions/getPublicVideos`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page, limit: VIDEOS_PER_PAGE, ...filters }),
  });
  if (!resp.ok) throw new Error(`Videos fetch failed: ${resp.status}`);
  const data = await resp.json();
  
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    // Ignore cache errors
  }
  
  return data;
}

export default function Videos() {
  const { t } = useI18n();
  const [filters, setFilters] = useState({
    search: "",
    category: null,
    access_tier: null,
    brand: null,
    duration: null,
    sort: "newest",
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-videos-fn', page, filters],
    queryFn: () => fetchPublicVideosAndBrands(page, filters),
    retry: 0,
  });

  const videos = data?.videos || [];
  const brands = data?.brands || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  // Reset page when filters change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleClearFilters = () => {
    setFilters({
      search: "",
      category: null,
      access_tier: null,
      brand: null,
      duration: null,
      sort: "newest",
    });
    setPage(1);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-[#0a0a0a] border-b border-rose-600/20 py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rose-600/20 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-rose-500 fill-current" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Video Library</h1>
                <p className="text-white/60 text-sm">Error loading videos</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20 bg-[#121212] rounded-xl border border-white/10">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2 text-white">Could not load videos</h2>
            <p className="text-white/60 mb-4">{error?.message || 'Check console for error'}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title="Asian Gay Videos, Filipino Twink Scenes & Gay Solo Content | FLESHLAB Studios"
        description="Watch Asian gay videos, Filipino twink videos, gay solo scenes, shower solo, outdoor solo, gay blowjob, gay anal, gay bareback, and full-length gay adult videos from verified 18+ performers at FLESHLAB Studios."
        canonical="/videos"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "FLESHLAB Studios Video Library",
          "description": "Asian gay videos, Filipino twink scenes, gay solo content and full-length gay adult videos"
        }}
      />
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Hero */}
        <div className="bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-[#0a0a0a] border-b border-rose-600/20 py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rose-600/20 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-rose-500 fill-current" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Asian Gay Videos, Filipino Twinks & Full-Length Studio Scenes</h1>
                <p className="text-white/60 text-sm">
                  Browse verified 18+ Asian and Filipino gay adult videos including solo scenes, shower videos, outdoor shoots, bareback scenes, oral and anal content, full-length gay fucking and sucking scenes, studio-produced gay porn and exclusive fanclub releases.
                </p>
                {isLoading ? (
                  <p className="text-white/40 text-xs mt-1">Loading videos...</p>
                ) : (
                  <p className="text-white/40 text-xs mt-1">
                    {total} {total === 1 ? 'video' : 'videos'} total · Showing page {page} {hasMore ? `(1-${page * VIDEOS_PER_PAGE})` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Filters */}
          <VideoFilters onFilterChange={handleFilterChange} brands={brands} />

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="aspect-video bg-[#121212] rounded-xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : videos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                {videos.map(video => (
                  <VideoCard key={video.id} video={video} brands={brands} />
                ))}
              </div>

              {hasMore && (
                <div className="text-center pt-8 pb-4">
                  <Button
                    onClick={() => setPage(p => p + 1)}
                    className="px-8 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold shadow-lg shadow-rose-600/30"
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
            <div className="text-center py-20 bg-[#121212] rounded-xl border border-white/10">
              <Film className="w-16 h-16 mx-auto mb-4 text-white/40 opacity-50" />
              <h2 className="text-xl font-semibold mb-2 text-white">No videos found</h2>
              <p className="text-white/60 mb-4">
                Try another search term or clear filters.
              </p>
              <Button variant="outline" onClick={handleClearFilters} className="border-white/20 text-white hover:bg-white/10">
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}