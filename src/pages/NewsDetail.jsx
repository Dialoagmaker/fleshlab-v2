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
  
  // If found via legacy slug, redirect to canonical new URL
  useEffect(() => {
    if (article && article.slug !== slug) {
      // Found via legacy slug - redirect to canonical
      const canonicalPath = `/news/${article.slug}`;
      window.history.replaceState(null, '', canonicalPath);
    }
  }, [article, slug]);

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
      ...(article.cover_image_url && { 
        "image": [
          article.cover_image_url
        ]
      }),
      "datePublished": article.published_at,
      "dateModified": article.updated_date || article.published_at,
      "url": `https://fleshlab.online/news/${article.slug}`,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://fleshlab.online/news/${article.slug}`
      },
      "author": {
        "@type": "Organization",
        "name": "FLESHLAB Studios",
        "url": "https://fleshlab.online"
      },
      "publisher": {
        "@type": "Organization",
        "name": "FLESHLAB Studios",
        "url": "https://fleshlab.online",
        "logo": {
          "@type": "ImageObject",
          "url": "https://fleshlab.online/logo.png"
        }
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
        {/* Article Content - Compact Layout */}
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Back Navigation - Inline */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/news')}
              className="gap-2 text-muted-foreground hover:text-foreground"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to News
            </Button>
          </div>

          {/* Header - Compact */}
          <div className="mb-6 space-y-4">
            {/* Category Badge */}
            {article.category && (
              <Badge className="bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
                {article.category}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
              {article.published_at && (
                <span className="flex items-center gap-1.5">
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
                  <Badge key={idx} variant="secondary" className="gap-1 text-xs">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Cover Image - Below header for better flow */}
          {article.cover_image_url && (
            <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Content - Optimized Readability */}
          {article.content && (
            <article className="prose prose-invert prose-lg max-w-none">
              <div 
                className="text-muted-foreground leading-relaxed space-y-4"
                style={{
                  maxWidth: '65ch',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
                dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
              />
            </article>
          )}

          {/* Social Sharing */}
          <div className="mt-8 pt-6 border-t border-border">
            <ShareArticle
              title={article.title}
              url={canonicalUrl || window.location.href}
            />
          </div>

          {/* Bottom CTA - Conversion Links */}
          <div className="mt-12 pt-8 border-t border-white/8">
            <p className="text-xs font-black uppercase tracking-widest text-rose-400/70 text-center mb-4">More from FLESHLAB</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { href: "/videos", label: "Watch Videos" },
                { href: "/performers", label: "Meet Performers" },
                { href: "/fanclub", label: "Join Fanclub" },
                { href: "/become-performer", label: "Apply as Performer" },
              ].map(({ href, label }) => (
                <a key={href} href={href}
                  className="group text-center px-3 py-3 rounded-xl text-white/55 text-xs font-semibold hover:text-rose-400 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-12 border-t border-border mt-8">
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