import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import SEOMeta from "@/components/SEOMeta";
import NewsCard from "@/components/public/NewsCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Newspaper, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n/i18n.jsx";

export default function News() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const limit = 12;

  // Fetch news articles
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-news', page, searchQuery, category],
    queryFn: async () => {
      const response = await callPublicFunction('getPublicNews', {
        page,
        limit,
        search: searchQuery,
        category: category !== 'all' ? category : ''
      });
      return response;
    },
    retry: 1,
    staleTime: 60000,
  });

  const articles = data?.articles || [];
  const hasMore = data?.hasMore;
  
  // Featured article = first article (newest)
  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const regularArticles = articles.length > 1 ? articles.slice(1) : [];

  const categories = [
    { value: 'all', label: 'All News' },
    { value: 'studioUpdates', label: 'Studio Update' },
    { value: 'creatorStories', label: 'Performer Story' },
    { value: 'fanclub', label: 'Fanclub' },
    { value: 'guestProduction', label: 'Guest Production' },
    { value: 'behindTheScenes', label: 'Behind the Scenes' },
    { value: 'production', label: 'Production' },
    { value: 'casting', label: 'Casting' },
  ];

  return (
    <>
      <SEOMeta
        title="FLESHLAB Studios News & Creator Updates"
        description="Behind-the-scenes updates, performer stories, production news, fanclub releases and creator announcements from FLESHLAB Studios."
        canonical="/news"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "FLESHLAB Studios News",
          "description": "Latest news, updates, and announcements from FLESHLAB Studios."
        }}
      />
      <div className="min-h-screen bg-background">
        {/* Enhanced Hero */}
        <div className="relative bg-gradient-to-b from-card to-background border-b border-border overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:20px_20px] opacity-20" />
          
          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20">
            <div className="space-y-6 max-w-4xl">
              {/* Icon + Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Studio updates • Performer stories • Fanclub releases • Production news
                  </span>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  FLESHLAB Studios
                  <br />
                  <span className="text-primary">News & Creator Updates</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
                  Behind-the-scenes updates, performer stories, production news, fanclub releases 
                  and creator announcements from FLESHLAB Studios.
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-10 space-y-4">
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('news.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 bg-background/50 border-border backdrop-blur-sm"
                />
              </div>

              {/* Category Chips - Improved */}
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-2 pb-2 min-w-max">
                  {categories.map(cat => (
                    <Button
                      key={cat.value}
                      variant={category === cat.value ? "default" : "secondary"}
                      size="sm"
                      onClick={() => {
                        setCategory(cat.value);
                        setPage(1);
                      }}
                      className={`whitespace-nowrap transition-all ${
                        category === cat.value 
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" 
                          : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      }`}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden border border-border animate-pulse">
                  <div className="aspect-[16/10] bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('news.errorLoading')}</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h2 className="text-2xl font-semibold mb-2 text-foreground">{t('news.noResults')}</h2>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Check back soon for updates'}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Article */}
              {featuredArticle && (
                <section className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-white">Latest Featured Update</h2>
                  </div>
                  <NewsCard article={featuredArticle} featured />
                </section>
              )}

              {/* Regular Articles Grid */}
              {regularArticles.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-white">More Updates</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularArticles.map(article => (
                      <NewsCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              )}
              
              {/* Pagination */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => setPage(p => p + 1)}
                    className="px-8 bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}