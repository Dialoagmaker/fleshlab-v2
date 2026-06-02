import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { appParams } from "@/lib/app-params";
import NewsCard from "@/components/public/NewsCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Newspaper, Search, X, AlertCircle } from "lucide-react";
import SEOMeta from "@/components/SEOMeta";

const ARTICLES_PER_PAGE = 12;

// Calls a backend function (service role) — never touches User/me or any entity endpoint directly.
async function fetchPublicNews(page = 1) {
  const cacheKey = `publicNews_page_${page}_limit_${ARTICLES_PER_PAGE}`;
  const cacheTTL = 60 * 1000; // 60 seconds
  
  // Check sessionStorage cache
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
  
  // Fetch from API
  const url = `/api/apps/${appParams.appId}/functions/getPublicNews`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page, limit: ARTICLES_PER_PAGE }),
  });
  if (!resp.ok) throw new Error(`News fetch failed: ${resp.status}`);
  const data = await resp.json();
  
  // Cache the response
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    // Ignore cache errors
  }
  
  return data;
}

export default function News() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-news-fn', page],
    queryFn: () => fetchPublicNews(page),
    retry: 0,
  });



  const articles = data?.articles || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  const filteredArticles = useMemo(() => {
    let result = [...articles];
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(a =>
        a.title?.toLowerCase().includes(searchLower) ||
        (a.excerpt && a.excerpt.toLowerCase().includes(searchLower))
      );
    }
    return result;
  }, [articles, search]);

  const handleClear = () => setSearch("");

  // Show page shell immediately with skeleton while loading
  return (
    <>
      <SEOMeta
        title="News — FLESHLAB | Studio Updates & Announcements"
        description="Latest news, announcements, and behind-the-scenes updates from FLESHLAB studio."
        canonical="/news"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "FLESHLAB News",
          "description": "Studio news and updates"
        }}
      />
      <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Newspaper className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-2">News</h1>
          <p className="text-muted-foreground">
            {isLoading ? 'Loading articles...' : `${total} ${total === 1 ? 'article' : 'articles'} total • Showing page ${page}`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search news..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          {search && !isLoading && (
            <Button variant="outline" size="icon" onClick={handleClear}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl bg-[#111] border border-white/[0.05] overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-white/[0.04]" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-card/50 rounded-xl border border-border">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">Could not load news</h2>
            <p className="text-muted-foreground mb-4">{error?.message || 'Check console for NEWS_FETCH_ERROR'}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        ) : filteredArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map(article => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center pt-8 pb-4">
                <Button
                  onClick={() => setPage(p => p + 1)}
                  className="px-8 bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  Load More Articles
                  <span className="ml-2 text-xs opacity-80">
                    ({total - page * ARTICLES_PER_PAGE} remaining)
                  </span>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-card/50 rounded-xl border border-border">
            <Newspaper className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">No articles found</h2>
            <p className="text-muted-foreground mb-4">
              {search ? 'Try adjusting your search' : 'Check back soon for updates'}
            </p>
          </div>
        )}
      </div>
      </div>
    </>
  );
}