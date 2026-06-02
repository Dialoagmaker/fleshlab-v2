import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import SEOMeta from "@/components/SEOMeta";
import NewsCard from "@/components/public/NewsCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Newspaper } from "lucide-react";
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

  const categories = [
    { value: 'all', label: t('news.categories.all') },
    { value: 'studio', label: t('news.categories.studioUpdates') },
    { value: 'creator', label: t('news.categories.creatorStories') },
    { value: 'fanclub', label: t('news.categories.fanclub') },
    { value: 'guest', label: t('news.categories.guestProduction') },
    { value: 'behind', label: t('news.categories.behindTheScenes') },
  ];

  return (
    <>
      <SEOMeta
        title="FLESHLAB News & Studio Journal"
        description="Read FLESHLAB studio updates, Asian gay creator stories, fanclub news, guest production updates and behind-the-scenes articles."
        canonical="/news"
        ogImage="https://pub-5ace3b335273433f8258995325cf09c1.r2.dev/studios/fleshlabasia/thumbnails/jam05.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "FLESHLAB News",
          "description": "Latest news, updates, and announcements from FLESHLAB studio."
        }}
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center gap-3 mb-4">
              <Newspaper className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-white">News</h1>
            </div>
            <p className="text-muted-foreground max-w-3xl">
              Studio updates, creator stories and FLESHLAB announcements.
            </p>

            {/* Search and Filters */}
            <div className="mt-8 space-y-4">
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 bg-background border-border"
                />
              </div>

              {/* Category Chips */}
               <div className="overflow-x-auto scrollbar-hide">
                 <div className="flex gap-2 pb-2">
                   {categories.map(cat => (
                     <Button
                       key={cat.value}
                       variant={category === cat.value ? "default" : "outline"}
                       size="sm"
                       onClick={() => {
                         setCategory(cat.value);
                         setPage(1);
                       }}
                       className={`whitespace-nowrap ${category === cat.value ? "bg-primary hover:bg-primary/90" : ""}`}
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
        <div className="max-w-7xl mx-auto px-4 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden border border-border animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Error loading news</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <h2 className="text-xl font-semibold mb-2 text-foreground">No articles found</h2>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Check back soon for updates'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map(article => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
              
              {/* Pagination */}
              {hasMore && (
                <div className="mt-12 flex justify-center">
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