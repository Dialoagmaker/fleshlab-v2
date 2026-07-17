import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, X, Loader2, Sparkles, CheckCircle2, Star } from "lucide-react";
import PerformerDiscoverySection from "@/components/public/PerformerDiscoverySection";
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

  const featuredPerformers = useMemo(() => {
    const priority = performers.filter((performer) => {
      const nameLower = performer.display_name.toLowerCase().replace(/[_\s-]/g, '');
      const slugLower = performer.slug.toLowerCase().replace(/[_\s-]/g, '');
      return nameLower.includes('fitmaster') || slugLower.includes('fitmaster') || nameLower.includes('jameson') || slugLower.includes('jameson') || performer.featured;
    });
    return (priority.length ? priority : performers).slice(0, 1);
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

  const trendingPerformers = useMemo(() => {
    const featuredIds = new Set(featuredPerformers.map((performer) => performer.id));
    return performers
      .filter((performer) => !featuredIds.has(performer.id) && (performer.video_count || 0) > 0)
      .sort((a, b) => (b.video_count || 0) - (a.video_count || 0))
      .slice(0, 4);
  }, [performers, featuredPerformers]);

  const newPerformers = useMemo(() => {
    const usedIds = new Set([...featuredPerformers, ...trendingPerformers].map((performer) => performer.id));
    return performers
      .filter((performer) => !usedIds.has(performer.id))
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
      .slice(0, 4);
  }, [performers, featuredPerformers, trendingPerformers]);

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
      <div className="min-h-screen bg-[#040608] px-4 py-8 text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(240,24,61,0.14),transparent_30%),radial-gradient(circle_at_84%_18%,rgba(255,255,255,0.06),transparent_24%)]" />
        <div className="relative mx-auto max-w-[1440px] space-y-10">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b0e] p-6 md:p-10">
            <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(120deg,transparent,rgba(240,24,61,0.13))] md:block" />
            <div className="relative max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#f0183d]">Creator Directory</p>
              <h1 className="fl-condensed mt-3 text-[66px] uppercase leading-[0.9] tracking-[-0.025em] text-white md:text-[88px]">Discover people, not profiles.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/62">Meet verified FLESHLAB creators through production worlds, personality cues and cinematic portraits designed to make the next click feel natural.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"><p className="text-2xl font-black text-white">{performers.length}</p><p className="text-[10px] font-black uppercase tracking-wide text-white/42">Creators</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"><p className="text-2xl font-black text-white">{performers.filter(p => p.fanclub_enabled).length}</p><p className="text-[10px] font-black uppercase tracking-wide text-white/42">Fanclubs</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"><p className="text-2xl font-black text-white">{performers.filter(p => p.verified).length}</p><p className="text-[10px] font-black uppercase tracking-wide text-white/42">Verified</p></div>
              </div>
            </div>
          </section>

          <div className="relative max-w-2xl">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <Input
              placeholder={t('performers.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-full border border-white/10 bg-white/[0.045] pl-14 pr-12 text-white placeholder:text-white/38 focus:border-[#f0183d]/45 focus:ring-2 focus:ring-[#f0183d]/15"
            />
            {search && <button onClick={handleClear} className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/10"><X className="h-4 w-4 text-white/60" /></button>}
          </div>

          {filteredPerformers.length > 0 ? (
            search ? (
              <PerformerDiscoverySection eyebrow="Search Results" title="Matching creators" subtitle={`${filteredPerformers.length} creators found.`} performers={filteredPerformers} />
            ) : (
              <>
                <PerformerDiscoverySection eyebrow="Featured Creator" title="Start with a story." subtitle="A larger cinematic profile gives one creator room to feel memorable before the full roster appears." performers={featuredPerformers} featured />
                <PerformerDiscoverySection eyebrow="Trending Creators" title="Audience momentum." subtitle="Creators with the strongest current production footprint." performers={trendingPerformers} badge="trending" />
                <PerformerDiscoverySection eyebrow="New Creators" title="Fresh faces, new worlds." subtitle="Recently added creators and emerging personalities to watch next." performers={newPerformers} badge="new" />
                <PerformerDiscoverySection eyebrow="Browse All" title="The full creator roster." subtitle="A calmer grid with personality, country, production world and video count visible at a glance." performers={filteredPerformers} />
              </>
            )
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] py-20 text-center">
              <Users className="mx-auto mb-4 h-16 w-16 text-white/28" />
              <h2 className="text-xl font-semibold text-white">{t('performers.noResults')}</h2>
              <p className="mb-4 mt-2 text-white/60">{search ? 'Try adjusting your search' : 'No performers available'}</p>
              {search && <Button variant="outline" onClick={handleClear} className="border-white/20 text-white hover:bg-white/10">Clear Search</Button>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}