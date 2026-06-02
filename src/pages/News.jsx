import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { appParams } from "@/lib/app-params";
import NewsCard from "@/components/public/NewsCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Newspaper, Search, X, Loader2, AlertCircle } from "lucide-react";

// Direct fetch — bypasses the Base44 SDK entirely so no User/me interceptor fires.
async function fetchPublicNews() {
  const url = `/api/apps/${appParams.appId}/entities/NewsArticle?sort=-published_at&limit=100`;
  const resp = await fetch(url, { headers: { 'X-App-Id': appParams.appId } });
  if (!resp.ok) throw new Error(`News fetch failed: ${resp.status}`);
  const data = await resp.json();
  return Array.isArray(data) ? data : (data.results ?? data.items ?? []);
}

export default function News() {
  console.log('PUBLIC_NEWS_RENDER_START', window.location.pathname);
  const [search, setSearch] = useState("");

  const { data: articles = [], isLoading, error } = useQuery({
    queryKey: ['public-news-direct'],
    queryFn: fetchPublicNews,
    retry: 0,
  });

  // Filter and sort articles (published only, newest first)
  const filteredArticles = useMemo(() => {
    let result = articles.filter(a => a.status === 'published');
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(searchLower) ||
        (a.excerpt && a.excerpt.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by published_at (newest first)
    result.sort((a, b) => new Date(b.published_at || b.created_date) - new Date(a.published_at || a.created_date));
    
    return result;
  }, [articles, search]);

  const handleClear = () => setSearch("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Could not load news</h2>
        <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
        <button onClick={() => window.location.reload()} className="text-sm text-primary underline">Reload</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Newspaper className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-2">News</h1>
          <p className="text-muted-foreground">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
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
            />
          </div>
          {search && (
            <Button variant="outline" size="icon" onClick={handleClear}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No articles found</h2>
            <p className="text-muted-foreground">
              {search ? 'Try adjusting your search' : 'Check back soon for updates'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}