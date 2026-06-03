import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { appParams } from "@/lib/app-params";
import VideoCard from "@/components/public/VideoCard";
import VideoFilters from "@/components/public/VideoFilters";
import { Button } from "@/components/ui/button";
import { Film, Play, AlertCircle, Users, Clock, Crown, Sparkles } from "lucide-react";
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
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: "",
    category: null,
    access_tier: null,
    brand: null,
    duration: null,
    sort: "newest",
  });
  const [page, setPage] = useState(1);

  // Read search query from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch.trim()) {
      setFilters(prev => ({ ...prev, search: urlSearch.trim() }));
    }
  }, [searchParams]);

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
        {/* Enhanced Hero Section */}
        <div className="relative bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-[#0a0a0a] border-b border-rose-600/30 pb-8 pt-12 px-4 overflow-hidden">
          {/* Subtle animated glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rose-600/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            {/* Icon + Title */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-600/30 flex-shrink-0">
                <Play className="w-7 h-7 text-white fill-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">
                  Premium Asian Gay Videos & Filipino Twink Scenes
                </h1>
                <p className="text-white/70 text-base leading-relaxed max-w-4xl">
                  Browse verified 18+ Asian and Filipino gay adult videos including solo scenes, shower videos, outdoor shoots, bareback scenes, oral and anal content, full-length gay adult scenes including solo, oral, anal, bareback, shower and studio productions, and exclusive fanclub releases.
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Verified 18+</p>
                  <p className="text-white/50 text-xs">Performers</p>
                </div>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Full-Length</p>
                  <p className="text-white/50 text-xs">Studio Scenes</p>
                </div>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Fanclub</p>
                  <p className="text-white/50 text-xs">Exclusives</p>
                </div>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Updated</p>
                  <p className="text-white/50 text-xs">Weekly</p>
                </div>
              </div>
            </div>

            {/* Live counter */}
            {isLoading ? (
              <p className="text-white/40 text-xs">Loading videos...</p>
            ) : (
              <p className="text-white/50 text-sm">
                <span className="font-semibold text-white">{total}</span> {total === 1 ? 'video' : 'videos'} available
                {hasMore && <span className="mx-1">·</span>}
                {hasMore && <span>Showing page {page} (1-{page * VIDEOS_PER_PAGE})</span>}
              </p>
            )}
          </div>
        </div>

        {/* Content - Reduced padding to bring videos higher */}
        <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">
          {/* Filters */}
          <VideoFilters onFilterChange={handleFilterChange} brands={brands} />

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="aspect-video bg-[#121212] rounded-xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : videos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {videos.map(video => (
                  <VideoCard key={video.id} video={video} brands={brands} />
                ))}
              </div>

              {hasMore && (
                <div className="text-center pt-6 pb-4">
                  <Button
                    onClick={() => setPage(p => p + 1)}
                    className="px-10 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm rounded-xl shadow-xl shadow-rose-600/40 transition-all hover:scale-105"
                    size="lg"
                  >
                    Load More Videos
                    <span className="ml-2 text-xs opacity-80 font-medium">
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