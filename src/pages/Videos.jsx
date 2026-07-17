import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { appParams } from "@/lib/app-params";
import VideoCard from "@/components/public/VideoCard";
import { Button } from "@/components/ui/button";
import { Film, Play, AlertCircle } from "lucide-react";
import CinematicFeaturedProduction from "@/components/platform/CinematicFeaturedProduction";
import CollectionRail from "@/components/platform/CollectionRail";
import CreatorHeroRail from "@/components/platform/CreatorHeroRail";
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

async function fetchPublicPerformers() {
  const resp = await fetch(`/api/apps/${appParams.appId}/functions/getPublicPerformers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!resp.ok) throw new Error(`Performers fetch failed: ${resp.status}`);
  return resp.json();
}

const collectionSpecs = [
  { title: "Hotel Sessions", subtitle: "Private rooms, warm light, first-night tension.", terms: ["hotel", "room"] },
  { title: "Beach Escape", subtitle: "Travel heat and vacation stories.", terms: ["beach", "escape", "travel"] },
  { title: "Student Life", subtitle: "Young adult city energy and ambition.", terms: ["student", "campus"] },
  { title: "Massage Stories", subtitle: "Slow atmosphere and cinematic intimacy.", terms: ["massage"] },
  { title: "Gym Sessions", subtitle: "Fitness confidence and after-hours energy.", terms: ["gym", "fitness"] },
];

function videoMatches(video, terms) {
  const text = [video.title, video.description, video.short_summary, ...(video.categories || []), ...(video.tags || [])].join(" ").toLowerCase();
  return terms.some((term) => text.includes(term));
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

  const { data: performerData } = useQuery({
    queryKey: ['public-performers-platform'],
    queryFn: fetchPublicPerformers,
    retry: 0,
  });

  const videos = data?.videos || [];
  const brands = data?.brands || [];
  const performers = performerData?.performers || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  const featuredVideo = useMemo(() => videos.find((video) => video.featured) || videos[0], [videos]);
  const collections = useMemo(() => {
    const worldCollections = collectionSpecs.map((collection) => ({
      ...collection,
      videos: videos.filter((video) => videoMatches(video, collection.terms)),
    })).filter((collection) => collection.videos.length > 0);

    return [
      ...worldCollections,
      { title: "New Releases", subtitle: "The latest productions entering the FLESHLAB world.", videos: videos.slice(0, 10) },
      { title: "Editor's Picks", subtitle: "Curated productions with stronger story energy.", videos: videos.filter((video) => video.featured || video.is_exclusive).slice(0, 10) },
      { title: "Most Watched", subtitle: "Audience momentum this week.", videos: [...videos].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 10) },
    ].filter((collection) => collection.videos.length > 0);
  }, [videos]);

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
                <h1 className="text-4xl font-bold text-white">{t('videos.title')}</h1>
                <p className="text-white/60 text-sm">{t('videos.errorLoading')}</p>
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
      <div className="min-h-screen bg-[#040608] px-4 py-8 text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(240,24,61,0.12),transparent_30%),radial-gradient(circle_at_85%_22%,rgba(255,255,255,0.06),transparent_24%)]" />
        <div className="relative mx-auto max-w-[1440px] space-y-12">
          {filters.search && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f0183d]">Search results</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-white/62">Showing productions matching “{filters.search}”.</p>
                <Button variant="outline" onClick={handleClearFilters} className="border-white/20 text-white hover:bg-white/10">Clear Search</Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-8">
              <div className="h-[560px] animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.035]" />
              <div className="grid gap-5 md:grid-cols-3">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-video animate-pulse rounded-2xl bg-white/[0.035]" />)}
              </div>
            </div>
          ) : videos.length > 0 ? (
            <>
              <CinematicFeaturedProduction video={featuredVideo} />

              <div id="collections" className="space-y-10">
                <div className="max-w-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">Browse by world</p>
                  <h2 className="fl-condensed mt-2 text-[58px] uppercase leading-none tracking-[-0.02em]">Collections, not categories.</h2>
                  <p className="mt-3 text-base leading-7 text-white/52">Each rail is built like a series: fewer choices, stronger artwork and a clearer reason to watch.</p>
                </div>
                {collections.map((collection) => <CollectionRail key={collection.title} {...collection} />)}
              </div>

              <CreatorHeroRail performers={performers} />

              <section className="space-y-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#f0183d]">All productions</p>
                    <h2 className="fl-condensed mt-2 text-[52px] uppercase leading-none tracking-[-0.02em]">Let the artwork breathe.</h2>
                  </div>
                  <p className="text-sm text-white/46"><span className="font-semibold text-white">{total}</span> productions available</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {videos.map((video) => <VideoCard key={video.id} video={video} brands={brands} performers={performers} />)}
                </div>
                {hasMore && (
                  <div className="text-center pt-5 pb-3">
                    <Button onClick={() => setPage(p => p + 1)} className="rounded bg-[#f0183d] px-8 py-3 text-[10px] font-black uppercase tracking-wide text-white shadow-lg shadow-[#f0183d]/25 transition hover:-translate-y-0.5 hover:bg-[#ff3152]" size="lg">
                      {t('videos.loadMore')}
                      {total - page * VIDEOS_PER_PAGE > 0 && <span className="ml-2 text-xs opacity-70">({total - page * VIDEOS_PER_PAGE} left)</span>}
                    </Button>
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="text-center py-20 bg-[#121212] rounded-xl border border-white/10">
              <Film className="w-16 h-16 mx-auto mb-4 text-white/40 opacity-50" />
              <h2 className="text-xl font-semibold mb-2 text-white">{t('videos.noResults')}</h2>
              <p className="text-white/60 mb-4">Try another search term or clear filters.</p>
              <Button variant="outline" onClick={handleClearFilters} className="border-white/20 text-white hover:bg-white/10">Clear Search</Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}