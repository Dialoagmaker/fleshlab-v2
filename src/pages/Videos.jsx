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
        {/* Always render hero section immediately for SEO and UX */}
        <div className="relative bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-[#0a0a0a] border-b border-rose-600/20 pb-6 pt-10 px-4 overflow-hidden">
          {/* Subtle rose glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-600/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            {/* Icon + Title */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl flex items-center justify-center shadow-lg shadow-rose-600/25 flex-shrink-0">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-2.5">
                  Premium Asian Gay Videos & Filipino Twink Scenes
                </h1>
                <p className="text-white/60 text-sm leading-relaxed max-w-4xl">
                  Browse verified 18+ Asian and Filipino gay adult videos including solo scenes, shower videos, outdoor shoots, bareback scenes, oral and anal content, full-length gay adult scenes including solo, oral, anal, bareback, shower and studio productions, and exclusive fanclub releases.
                </p>
              </div>
            </div>

            {/* Stats Row - Sleeker */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center gap-2.5">
                <div className="w-9 h-9 bg-rose-600/15 rounded-md flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <p className="text-white font-semibold text-xs">Verified 18+</p>
                  <p className="text-white/40 text-[10px]">Performers</p>
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center gap-2.5">
                <div className="w-9 h-9 bg-purple-600/15 rounded-md flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-white font-semibold text-xs">Full-Length</p>
                  <p className="text-white/40 text-[10px]">Scenes</p>
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center gap-2.5">
                <div className="w-9 h-9 bg-amber-600/15 rounded-md flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-white font-semibold text-xs">Fanclub</p>
                  <p className="text-white/40 text-[10px]">Exclusives</p>
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-600/15 rounded-md flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-white font-semibold text-xs">Updated</p>
                  <p className="text-white/40 text-[10px]">Weekly</p>
                </div>
              </div>
            </div>

            {/* Live counter - always render immediately */}
            <p className="text-white/50 text-xs">
              {isLoading ? (
                <>Loading {total > 0 ? total : 'videos'}...</>
              ) : (
                <>
                  <span className="font-semibold text-white">{total}</span> {total === 1 ? 'video' : 'videos'} available
                  {hasMore && <span className="mx-1">·</span>}
                  {hasMore && <span>Page {page}</span>}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1400px] mx-auto px-4 py-5 space-y-4">
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
              {/* First row emphasis */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                {videos.map((video, idx) => (
                  <div key={video.id} className={idx < 6 ? "ring-1 ring-white/5 rounded-2xl" : ""}>
                    <VideoCard video={video} brands={brands} />
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className="text-center pt-5 pb-3">
                  <Button
                    onClick={() => setPage(p => p + 1)}
                    className="px-8 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-sm rounded-lg shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02]"
                    size="lg"
                  >
                    Load More Videos
                    {total - page * VIDEOS_PER_PAGE > 0 && (
                      <span className="ml-2 text-xs opacity-70">
                        ({total - page * VIDEOS_PER_PAGE} left)
                      </span>
                    )}
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