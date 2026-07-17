import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import SEOMeta from "@/components/SEOMeta";
import NewsCard from "@/components/public/NewsCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Newspaper, RadioTower, Search } from "lucide-react";

export default function News() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const limit = 12;

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-news', page, searchQuery, category],
    queryFn: async () => callPublicFunction('getPublicNews', {
      page,
      limit,
      search: searchQuery,
      category: category !== 'all' ? category : ''
    }),
    retry: 1,
    staleTime: 60000,
  });

  const articles = data?.articles || [];
  const orderedArticles = [...articles].sort((a, b) => new Date(b.published_at || b.created_date || 0) - new Date(a.published_at || a.created_date || 0));
  const featuredArticle = orderedArticles[0] || null;
  const regularArticles = orderedArticles.slice(1);
  const hasMore = data?.hasMore;

  const categories = [
    { value: 'all', label: 'All Updates' },
    { value: 'studioUpdates', label: 'Platform Update' },
    { value: 'behindTheScenes', label: 'Studio News' },
    { value: 'production', label: 'New Release' },
    { value: 'creatorStories', label: 'Creator Announcement' },
    { value: 'fanclub', label: 'Community Update' },
    { value: 'platformNews', label: 'Feature Rollout' },
    { value: 'casting', label: 'Press Release' },
  ];

  return (
    <>
      <SEOMeta
        title="FLESHLAB News Center | Official Updates"
        description="Official FLESHLAB News Center for platform updates, studio news, new releases, creator announcements, feature rollouts and press releases."
        canonical="/news"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "FLESHLAB News Center",
          "description": "Official updates, announcements and platform news from FLESHLAB."
        }}
      />

      <div className="min-h-screen bg-[#040608] text-white">
        <section className="border-b border-white/10 bg-[#05080a]">
          <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f0183d]/30 bg-[#12060a] px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f0183d]">
                <RadioTower className="h-3.5 w-3.5" /> Official News Center
              </div>
              <h1 className="mt-7 text-5xl font-black leading-[0.9] tracking-[-0.055em] md:text-7xl">FLESHLAB News Center</h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-white/58 md:text-lg">
                Official updates, platform improvements, creator announcements, production releases, community news and company milestones.
              </p>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.32em] text-white/36">AMATEUR WINS.</p>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:p-5">
              <div className="relative max-w-lg">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/36" />
                <Input
                  placeholder="Search News Center"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="border-white/10 bg-black/40 pl-10 text-white placeholder:text-white/34"
                />
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map((cat) => (
                  <Button
                    key={cat.value}
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setCategory(cat.value);
                      setPage(1);
                    }}
                    className={`shrink-0 rounded-full text-[10px] font-black uppercase tracking-wide ${category === cat.value ? "bg-[#f0183d] text-white hover:bg-[#ff3152]" : "bg-white/[0.06] text-white/58 hover:bg-white/[0.1] hover:text-white"}`}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-12">
          {isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center text-white/50">
              <Loader2 className="h-8 w-8 animate-spin text-[#f0183d]" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-10 text-center text-white/56">News Center updates could not be loaded.</div>
          ) : orderedArticles.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-12 text-center text-white/56">
              <Newspaper className="mx-auto mb-4 h-14 w-14 opacity-20" />
              <h2 className="text-2xl font-black text-white">No updates found</h2>
              <p className="mt-2">{searchQuery ? "Try adjusting your search." : "Check back soon for official FLESHLAB updates."}</p>
            </div>
          ) : (
            <div className="space-y-12">
              {featuredArticle && (
                <section className="space-y-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f0183d]">Featured Update</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">Most important announcement</h2>
                  </div>
                  <NewsCard article={featuredArticle} featured />
                </section>
              )}

              <section className="space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f0183d]">Latest News</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">Chronological updates</h2>
                </div>
                <div className="grid gap-4">
                  {regularArticles.map((article) => <NewsCard key={article.id} article={article} />)}
                </div>
              </section>

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button onClick={() => setPage((p) => p + 1)} className="bg-[#f0183d] px-8 text-white hover:bg-[#ff3152]" size="lg">
                    Load More Updates
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}