import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import NewsCard from "@/components/public/NewsCard";
import SEOMeta from "@/components/SEOMeta";
import ShareArticle from "@/components/public/ShareArticle";
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  Newspaper,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NewsDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);

  // Fetch news articles
  const { data: articles = [] } = useQuery({
    queryKey: ['public-news'],
    queryFn: () => base44.entities.NewsArticle.list(),
  });

  useEffect(() => {
    if (articles.length > 0 && slug) {
      const foundArticle = articles.find(a => a.slug === slug);
      if (foundArticle) {
        setArticle(foundArticle);
        
        // Find related articles (same tags or recent)
        const related = articles
          .filter(a => 
            a.id !== foundArticle.id &&
            a.status === 'published' &&
            (a.tags?.some(t => foundArticle.tags?.includes(t)))
          )
          .slice(0, 3);
        
        // If no tag matches, get recent articles
        if (related.length === 0) {
          setRelatedArticles(
            articles
              .filter(a => a.id !== foundArticle.id && a.status === 'published')
              .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
              .slice(0, 3)
          );
        } else {
          setRelatedArticles(related);
        }
      }
    }
  }, [articles, slug]);

  const jsonLd = article ? {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.excerpt || article.content?.substring(0, 160),
    "image": article.cover_image_url,
    "datePublished": article.published_at,
    "dateModified": article.updated_date,
    "author": {
      "@type": "Organization",
      "name": "FLESHLAB"
    },
  } : undefined;

  const canonicalUrl = article ? `https://fleshlab.online/news/${article.slug}` : undefined;

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOMeta
        title={article.meta_title || `${article.title} | FLESHLAB`}
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
              className="gap-2"
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

            {/* Title */}
            <h1 className="text-4xl font-bold">{article.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-muted-foreground">
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
              <span className={`px-2 py-1 rounded-full text-xs ${
                article.status === 'published' 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {article.status}
              </span>
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
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center gap-2 mb-6">
              <Newspaper className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Related Articles</h2>
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