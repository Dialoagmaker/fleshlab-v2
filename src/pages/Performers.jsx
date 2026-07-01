import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import PerformerCard from "@/components/public/PerformerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, X, Loader2, Sparkles, CheckCircle2, Star, Film } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";
import { useI18n } from "@/i18n/i18n.jsx";

export default function Performers() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const { data: publicData, isLoading } = useQuery({
    queryKey: ['public-performers-fn'],
    queryFn: () => callPublicFunction('getPublicPerformers'),
    retry: 0,
  });
  const performers = publicData?.performers || [];
  const brands = publicData?.brands || [];

  // Featured Talent selection: ONLY The_Fitmaker and Jameson
  const featuredPerformers = useMemo(() => {
    const priority = [];
    
    for (const performer of performers) {
      const nameLower = performer.display_name.toLowerCase().replace(/[_\s-]/g, '');
      const slugLower = performer.slug.toLowerCase().replace(/[_\s-]/g, '');
      
      // Match Fitmaster variants (with/without "the")
      const isFitmaster = nameLower.includes('fitmaster') || slugLower.includes('fitmaster');
      // Match Jameson
      const isJameson = nameLower.includes('jameson') || slugLower.includes('jameson');
      
      if (isFitmaster || isJameson) {
        priority.push(performer);
      }
    }
    
    // ONLY show priority performers (max 2), NO fallbacks
    return priority.slice(0, 2);
  }, [performers]);

  // Filter performers
  const filteredPerformers = useMemo(() => {
    if (!search) return performers;
    
    const searchLower = search.toLowerCase();
    return performers.filter(p => 
      p.display_name.toLowerCase().includes(searchLower) ||
      (p.nationality && p.nationality.toLowerCase().includes(searchLower))
    );
  }, [performers, search]);

  const handleClear = () => setSearch("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title="Asian Gay Performers, Filipino Twinks & Verified 18+ Creators | FLESHLAB Studios"
        description="Meet verified 18+ Asian gay performers, Filipino twink talent, Pinoy performers, bisexual performers, top/bottom/versatile creators, and femboy performers at FLESHLAB Studios. Professional profiles with fanclub access."
        canonical="/performers"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "FLESHLAB Studios Performers",
            "url": "https://fleshlab.online/performers",
            "description": "Verified 18+ Asian gay performers, Filipino twinks, Pinoy talent and bisexual creators",
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fleshlab.online/" },
                { "@type": "ListItem", "position": 2, "name": "Performers", "item": "https://fleshlab.online/performers" }
              ]
            }
          },
          ...(performers.length > 0 ? [{
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "FLESHLAB Studios Performer Roster",
            "url": "https://fleshlab.online/performers",
            "numberOfItems": performers.length,
            "itemListElement": performers.filter(p => p.slug).slice(0, 50).map((p, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "name": p.display_name,
              "url": `https://fleshlab.online/performers/${p.slug}`
            }))
          }] : [])
        ]}
      />
      <div className="min-h-screen bg-background">
        {/* Cinematic Hero */}
        <div className="relative bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-background border-b border-rose-600/20 pb-8 pt-12 px-4 overflow-hidden">
          {/* Subtle rose glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rose-600/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-[1600px] mx-auto relative z-10">
            {/* Icon + Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl flex items-center justify-center shadow-lg shadow-rose-600/25 flex-shrink-0">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-2">
                  FLESHLAB Studios Performer Roster
                </h1>
                <p className="text-white/60 text-sm leading-relaxed max-w-3xl">
                  Verified 18+ Asian gay performers, Filipino twink talent, and exclusive studio artists. 
                  Discover professional profiles, fanclub access, and premium gay adult content.
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="w-8 h-8 bg-rose-600/15 rounded-md flex items-center justify-center">
                  <Users className="w-4 h-4 text-rose-500" />
                </div>
                <div className="leading-tight">
                  <p className="text-white font-semibold text-xs">{performers.length}</p>
                  <p className="text-white/40 text-[10px]">Performers</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="w-8 h-8 bg-purple-600/15 rounded-md flex items-center justify-center">
                  <Star className="w-4 h-4 text-purple-500" />
                </div>
                <div className="leading-tight">
                  <p className="text-white font-semibold text-xs">{performers.filter(p => p.fanclub_enabled).length}</p>
                  <p className="text-white/40 text-[10px]">Fanclub</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="w-8 h-8 bg-emerald-600/15 rounded-md flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="leading-tight">
                  <p className="text-white font-semibold text-xs">{performers.filter(p => p.verified).length}</p>
                  <p className="text-white/40 text-[10px]">Verified</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="w-8 h-8 bg-amber-600/15 rounded-md flex items-center justify-center">
                  <Film className="w-4 h-4 text-amber-500" />
                </div>
                <div className="leading-tight">
                  <p className="text-white font-semibold text-xs">100%</p>
                  <p className="text-white/40 text-[10px]">Exclusive</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-6">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-rose-500 transition-colors" />
            <Input
              placeholder={t('performers.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/8 text-white placeholder:text-white/40 h-12 pl-14 pr-12 rounded-lg focus:outline-none focus:border-rose-600/40 focus:ring-2 focus:ring-rose-600/15 transition-all"
            />
            {search && (
              <button
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            )}
          </div>

          {/* Featured Performers Row */}
          {featuredPerformers.length > 0 && (
            <div className="mb-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white/90 mb-0.5">Featured Talent</h2>
                <p className="text-white/50 text-xs">Top verified performers and fanclub exclusives</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {featuredPerformers.map(performer => (
                  <PerformerCard 
                    key={performer.id} 
                    performer={performer} 
                    brands={brands}
                    videoCount={performer.video_count || 0}
                    featured
                  />
                ))}
              </div>
            </div>
          )}

          {/* Main Grid */}
          {filteredPerformers.length > 0 ? (
            <div>
              <div className="mb-4 pb-3 border-b border-white/5">
                <h2 className="text-lg font-bold text-white/90 mb-0.5">All Performers</h2>
                <p className="text-white/50 text-xs">Browse complete roster ({filteredPerformers.length} performers)</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                {filteredPerformers.map(performer => (
                  <PerformerCard 
                    key={performer.id} 
                    performer={performer} 
                    brands={brands}
                    videoCount={performer.video_count || 0}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-[#121212] rounded-xl border border-white/10">
              <Users className="w-16 h-16 mx-auto mb-4 text-white/40 opacity-50" />
              <h2 className="text-xl font-semibold mb-2 text-white">{t('performers.noResults')}</h2>
              <p className="text-white/60 mb-4">
                {search ? 'Try adjusting your search' : 'No performers available'}
              </p>
              {search && (
                <Button variant="outline" onClick={handleClear} className="border-white/20 text-white hover:bg-white/10">
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}