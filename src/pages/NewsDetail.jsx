import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import SEOMeta from "@/components/SEOMeta";
import ShareArticle from "@/components/public/ShareArticle";
import NewsCard from "@/components/public/NewsCard";
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  Newspaper,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/i18n.jsx";

export default function NewsDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  // Fetch article by slug
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-news-article', slug],
    queryFn: () => callPublicFunction('getPublicNewsArticleBySlug', { slug }),
    enabled: !!slug,
  });

  const article = data?.article;

  // Fetch related articles
  const { data: allNewsData } = useQuery({
    queryKey: ['public-news-list'],
    queryFn: () => callPublicFunction('getPublicNews', { page: 1, limit: 10 }),
  });

  const relatedArticles = article && allNewsData?.articles
    ? allNewsData.articles
        .filter(a => 
          a.id !== article.id &&
          (a.tags?.some(t => article.tags?.includes(t)) || a.category === article.category)
        )
        .slice(0, 3)
    : [];

  const jsonLd = article ? [
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": (article.meta_description || article.excerpt || article.content?.substring(0, 160) || '').substring(0, 300),
      ...(article.cover_image_url && { "image": article.cover_image_url }),
      "datePublished": article.published_at,
      "dateModified": article.updated_date || article.published_at,
      "url": `https://fleshlab.online/news/${article.slug}`,
      "author": {
        "@type": "Organization",
        "name": "FLESHLAB Studios",
        "url": "https://fleshlab.online"
      },
      "publisher": {
        "@type": "Organization",
        "name": "FLESHLAB Studios",
        "url": "https://fleshlab.online"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fleshlab.online/" },
        { "@type": "ListItem", "position": 2, "name": "News", "item": "https://fleshlab.online/news" },
        { "@type": "ListItem", "position": 3, "name": article.title, "item": `https://fleshlab.online/news/${article.slug}` }
      ]
    }
  ] : undefined;

  const canonicalUrl = article ? `https://fleshlab.online/news/${article.slug}` : undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Newspaper className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
          <h1 className="text-2xl font-bold text-white">Article not found</h1>
          <Button onClick={() => navigate('/news')} variant="outline">
            Back to News
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title={article.meta_title || `${article.title} | FLESHLAB Studios`}
        description={article.meta_description || article.excerpt || article.content?.substring(0, 160)}
        canonical={canonicalUrl}
        ogImage={article.cover_image_url}
        ogType="article"
        jsonLd={jsonLd}
      />
      <div className="min-h-screen bg-background">
        {/* Back Navigation */}
        <div className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/news')}
              className="gap-2 text-white hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to News
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 space-y-4">
            {/* Cover Image */}
            {article.cover_image_url && (
              <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
                <img
                  src={article.cover_image_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Category Badge */}
            {article.category && (
              <Badge className="bg-primary/10 text-primary">
                {article.category}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white">{article.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
              {article.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(article.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          {article.content && (
            <div className="prose prose-invert prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {article.content}
              </div>
            </div>
          )}

          {/* Social Sharing */}
          <ShareArticle
            title={article.title}
            url={canonicalUrl || window.location.href}
          />
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-12 border-t border-border">
            <div className="flex items-center gap-2 mb-6">
              <Newspaper className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-white">Related Articles</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map(a => (
                <NewsCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}