import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { callPublicFunction } from "@/lib/publicApi";
import { appParams } from "@/lib/app-params";
import SEOMeta from "@/components/SEOMeta";
import ShareArticle from "@/components/public/ShareArticle";
import NewsCard from "@/components/public/NewsCard";
import { ArrowLeft, Calendar, Loader2, Newspaper, Rss, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categoryLabels = {
  studioUpdates: "Platform Update",
  creatorStories: "Creator Announcement",
  fanclub: "Community Update",
  guestProduction: "New Release",
  behindTheScenes: "Studio News",
  production: "New Release",
  casting: "Creator Announcement",
  platformNews: "Feature Rollout",
  pressRelease: "Press Release",
};

export default function NewsDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const rssBase = `/api/apps/${appParams.appId}/functions/newsRssFeed`;

  const { data, isLoading, error } = useQuery({ queryKey: ["public-news-article", slug], queryFn: () => callPublicFunction("getPublicNewsArticleBySlug", { slug }), enabled: !!slug });
  const article = data?.article;

  useEffect(() => {
    if (article && article.slug !== slug) window.history.replaceState(null, "", `/news/${article.slug}`);
  }, [article, slug]);

  const { data: allNewsData } = useQuery({ queryKey: ["public-news-list-detail"], queryFn: () => callPublicFunction("getPublicNews", { page: 1, limit: 24, sort: "newest" }) });

  const candidates = (allNewsData?.articles || []).filter((item) => item.id !== article?.id);
  const relatedMatches = article ? candidates.filter((item) => item.category === article.category || item.tags?.some((tag) => article.tags?.includes(tag))) : [];
  const latestUpdates = candidates.slice(0, 4);
  const relatedArticles = (relatedMatches.length ? relatedMatches : latestUpdates).slice(0, 4);
  const canonicalUrl = article ? `https://fleshlab.online/news/${article.slug}` : undefined;
  const summary = article ? (article.meta_description || article.excerpt || article.content?.replace(/<[^>]+>/g, " ").substring(0, 160)) : "";
  const categoryLabel = article ? (categoryLabels[article.category] || article.category || "Studio News") : "Studio News";

  const jsonLd = article ? [
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": summary,
      ...(article.cover_image_url && { "image": [article.cover_image_url] }),
      "datePublished": article.published_at || article.created_date,
      "dateModified": article.updated_date || article.published_at || article.created_date,
      "url": canonicalUrl,
      "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
      "author": { "@type": "Organization", "name": "FLESHLAB Studios", "url": "https://fleshlab.online" },
      "publisher": { "@type": "Organization", "name": "FLESHLAB Studios", "url": "https://fleshlab.online", "logo": { "@type": "ImageObject", "url": "https://fleshlab.online/logo.png" } }
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": summary,
      "datePublished": article.published_at || article.created_date,
      "dateModified": article.updated_date || article.published_at || article.created_date,
      "author": { "@type": "Organization", "name": "FLESHLAB Studios" }
    },
    { "@context": "https://schema.org", "@type": "Organization", "name": "FLESHLAB Studios", "url": "https://fleshlab.online" },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fleshlab.online/" },
        { "@type": "ListItem", "position": 2, "name": "News Center", "item": "https://fleshlab.online/news" },
        { "@type": "ListItem", "position": 3, "name": article.title, "item": canonicalUrl }
      ]
    }
  ] : undefined;

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#040608]"><Loader2 className="h-8 w-8 animate-spin text-[#f0183d]" /></div>;

  if (error || !article) {
    return <div className="flex min-h-screen items-center justify-center bg-[#040608] text-white"><div className="space-y-4 text-center"><Newspaper className="mx-auto h-12 w-12 text-white/20" /><h1 className="text-2xl font-black">Update not found</h1><Button onClick={() => navigate("/news")} variant="outline">Back to News Center</Button></div></div>;
  }

  return (
    <>
      <SEOMeta title={article.meta_title || `${article.title} | FLESHLAB News Center`} description={summary} canonical={canonicalUrl} ogImage={article.cover_image_url} ogType="article" twitterCard="summary_large_image" jsonLd={jsonLd} />
      <div className="min-h-screen bg-[#040608] text-white">
        <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
          <Button variant="ghost" onClick={() => navigate("/news")} className="mb-8 gap-2 text-white/52 hover:bg-white/10 hover:text-white" size="sm"><ArrowLeft className="h-4 w-4" /> Back to News Center</Button>

          <header className="space-y-5">
            <div className="flex flex-wrap items-center gap-3"><Badge className="rounded-full bg-[#f0183d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#f0183d]">{categoryLabel}</Badge>{article.published_at && <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/44"><Calendar className="h-3.5 w-3.5" />{new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>}</div>
            <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.045em] md:text-6xl">{article.title}</h1>
            {summary && <p className="max-w-3xl text-lg leading-8 text-white/58">{summary}</p>}
            {article.tags?.length > 0 && <div className="flex flex-wrap gap-2">{article.tags.map((tag) => <Badge key={tag} variant="secondary" className="gap-1 rounded-full bg-white/[0.06] text-white/54"><Tag className="h-3 w-3" />{tag}</Badge>)}</div>}
          </header>

          {article.cover_image_url && <img src={article.cover_image_url} alt={article.title} className="mt-8 aspect-video w-full rounded-2xl border border-white/10 object-cover" loading="eager" decoding="async" />}

          {article.content && <article className="prose prose-invert prose-lg mt-10 max-w-none"><div className="leading-8 text-white/70" dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br/>") }} /></article>}

          <div className="mt-10"><ShareArticle title={article.title} summary={summary} url={canonicalUrl || window.location.href} category={article.category} /></div>
        </main>

        <section className="mx-auto max-w-7xl space-y-12 border-t border-white/10 px-4 py-12">
          {relatedArticles.length > 0 && <div className="space-y-5"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f0183d]">Related News</p><h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">Relevant official updates</h2></div><div className="grid gap-4 md:grid-cols-2">{relatedArticles.map((item) => <NewsCard key={item.id} article={item} />)}</div></div>}
          {latestUpdates.length > 0 && <div className="space-y-5"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f0183d]">Latest Updates</p><h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">Newest announcements</h2></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{latestUpdates.map((item) => <NewsCard key={item.id} article={item} />)}</div></div>}
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-6 md:flex-row md:items-center md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f0183d]">Follow Updates</p><p className="mt-2 text-sm text-white/52">Newsletter, RSS, X, Facebook, Telegram and Discord-ready updates without interrupting reading.</p></div><div className="flex flex-wrap gap-2"><a href={rssBase} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/60 hover:text-[#f0183d]"><Rss className="h-3.5 w-3.5" /> RSS Feed</a><a href="/news" className="rounded-full border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/60 hover:text-[#f0183d]">News Center</a></div></div>
        </section>
      </div>
    </>
  );
}