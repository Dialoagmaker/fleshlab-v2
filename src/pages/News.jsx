import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import { appParams } from "@/lib/app-params";
import SEOMeta from "@/components/SEOMeta";
import NewsCard from "@/components/public/NewsCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Newspaper, RadioTower, Rss, Search } from "lucide-react";

const categories = [
  { value: "all", label: "All Updates", slug: "all" },
  { value: "studioUpdates", label: "Platform Updates", slug: "platform-updates" },
  { value: "behindTheScenes", label: "Studio News", slug: "studio-news" },
  { value: "creatorStories", label: "Creator Announcements", slug: "creator-announcements" },
  { value: "production", label: "New Releases", slug: "new-releases" },
  { value: "fanclub", label: "Community Updates", slug: "community-updates" },
  { value: "pressRelease", label: "Press Releases", slug: "press-releases" },
  { value: "partnerships", label: "Partnerships", slug: "partnerships" },
  { value: "events", label: "Events", slug: "events" },
];

export default function News({ initialCategory = "all", archiveLabel = "" }) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [year, setYear] = useState("all");
  const [creator, setCreator] = useState("");
  const [collection, setCollection] = useState("");
  const [sort, setSort] = useState("newest");
  const limit = 12;
  const rssBase = `/api/apps/${appParams.appId}/functions/newsRssFeed`;

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-news", page, searchQuery, category, year, creator, collection, sort],
    queryFn: async () => callPublicFunction("getPublicNews", {
      page,
      limit,
      search: searchQuery,
      category: category !== "all" ? category : "",
      year: year !== "all" ? year : "",
      creator,
      collection,
      sort,
    }),
    retry: 1,
    staleTime: 60000,
  });

  const articles = data?.articles || [];
  const orderedArticles = [...articles].sort((a, b) => new Date(b.published_at || b.created_date || 0) - new Date(a.published_at || a.created_date || 0));
  const featuredArticle = orderedArticles[0] || null;
  const regularArticles = orderedArticles.slice(1);
  const years = data?.filters?.years || [];
  const hasMore = data?.hasMore;
  const activeLabel = archiveLabel || categories.find((item) => item.value === category)?.label || "All Updates";

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <>
      <SEOMeta
        title={`${activeLabel} | FLESHLAB News Center`}
        description="Official FLESHLAB News Center for platform updates, studio news, creator announcements, production releases, community updates and press releases."
        canonical={archiveLabel ? `/news/category/${categories.find((item) => item.value === category)?.slug || "all"}` : "/news"}
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
              <p className="mt-6 max-w-3xl text-base leading-7 text-white/58 md:text-lg">Official source for platform updates, creator announcements, new productions, partnerships and press releases.</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/36">
                <span>AMATEUR WINS.</span>
                <a href={rssBase} className="inline-flex items-center gap-1.5 text-white/44 transition hover:text-[#f0183d]"><Rss className="h-3.5 w-3.5" /> RSS</a>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:p-5">
              <div className="grid gap-3 md:grid-cols-[1.3fr_0.6fr_0.6fr]">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/36" />
                  <Input placeholder="Search by keyword" value={searchQuery} onChange={(e) => resetPage(setSearchQuery)(e.target.value)} className="border-white/10 bg-black/40 pl-10 text-white placeholder:text-white/34" />
                </div>
                <Input placeholder="Creator" value={creator} onChange={(e) => resetPage(setCreator)(e.target.value)} className="border-white/10 bg-black/40 text-white placeholder:text-white/34" />
                <Input placeholder="Collection" value={collection} onChange={(e) => resetPage(setCollection)(e.target.value)} className="border-white/10 bg-black/40 text-white placeholder:text-white/34" />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_160px]">
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {categories.map((cat) => <Button key={cat.value} variant="secondary" size="sm" onClick={() => resetPage(setCategory)(cat.value)} className={`shrink-0 rounded-full text-[10px] font-black uppercase tracking-wide ${category === cat.value ? "bg-[#f0183d] text-white hover:bg-[#ff3152]" : "bg-white/[0.06] text-white/58 hover:bg-white/[0.1] hover:text-white"}`}>{cat.label}</Button>)}
                </div>
                <select value={year} onChange={(e) => resetPage(setYear)(e.target.value)} className="h-9 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white">
                  <option value="all">All Years</option>
                  {years.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select value={sort} onChange={(e) => resetPage(setSort)(e.target.value)} className="h-9 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-12">
          {isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#f0183d]" /></div>
          ) : error ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-10 text-center text-white/56">News Center updates could not be loaded.</div>
          ) : orderedArticles.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-12 text-center text-white/56"><Newspaper className="mx-auto mb-4 h-14 w-14 opacity-20" /><h2 className="text-2xl font-black text-white">No updates found</h2><p className="mt-2">Try adjusting your filters.</p></div>
          ) : (
            <div className="space-y-12">
              {featuredArticle && <section className="space-y-5"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f0183d]">Featured Update</p><h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">Most important announcement</h2></div><NewsCard article={featuredArticle} featured /></section>}
              <section className="space-y-5"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f0183d]">Latest News</p><h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">Chronological updates</h2></div><div className="grid gap-4">{regularArticles.map((article) => <NewsCard key={article.id} article={article} />)}</div></section>
              {hasMore && <div className="flex justify-center pt-2"><Button onClick={() => setPage((p) => p + 1)} className="bg-[#f0183d] px-8 text-white hover:bg-[#ff3152]" size="lg">Load More Updates</Button></div>}
            </div>
          )}
        </main>

        <section className="border-t border-white/10 bg-[#05080a]">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 md:flex-row md:items-center md:justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f0183d]">Follow Updates</p><p className="mt-2 text-sm text-white/52">Newsletter, RSS and social channels for official FLESHLAB announcements.</p></div>
            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide"><a href={rssBase} className="rounded-full border border-white/10 px-4 py-2 text-white/60 hover:text-[#f0183d]">All News RSS</a><a href={`${rssBase}?feed=platform-updates`} className="rounded-full border border-white/10 px-4 py-2 text-white/60 hover:text-[#f0183d]">Platform RSS</a><a href={`${rssBase}?feed=new-releases`} className="rounded-full border border-white/10 px-4 py-2 text-white/60 hover:text-[#f0183d]">Releases RSS</a><a href={`${rssBase}?feed=creator-news`} className="rounded-full border border-white/10 px-4 py-2 text-white/60 hover:text-[#f0183d]">Creator RSS</a><a href={`${rssBase}?feed=press-releases`} className="rounded-full border border-white/10 px-4 py-2 text-white/60 hover:text-[#f0183d]">Press RSS</a><a href="#" className="rounded-full border border-white/10 px-4 py-2 text-white/60 hover:text-[#f0183d]">X</a><a href="#" className="rounded-full border border-white/10 px-4 py-2 text-white/60 hover:text-[#f0183d]">Facebook</a><a href="#" className="rounded-full border border-white/10 px-4 py-2 text-white/60 hover:text-[#f0183d]">Telegram</a></div>
          </div>
        </section>
      </div>
    </>
  );
}