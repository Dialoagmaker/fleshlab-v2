import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

function injectNoIndexAndCanonical(targetCanonicalUrl) {
  // noindex for legacy URLs
  ['robots', 'googlebot'].forEach(name => {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', name); document.head.appendChild(meta); }
    meta.setAttribute('content', 'noindex,nofollow');
  });
  // Set canonical to target URL (not self)
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', targetCanonicalUrl || '/news');
}

/**
 * LegacyArticleRedirect
 * Handles V1 URLs:
 *   /ArticleReader?id=<db_id>
 *   /ArticleReader?slug=<article-slug>
 *
 * Redirects to the clean V2 URL: /news/:slug
 */
export default function LegacyArticleRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const slugParam = params.get('slug');

    if (!id && !slugParam) {
      navigate('/news', { replace: true });
      return;
    }

    async function resolve() {
      try {
        let article = null;

        if (id) {
          // Lookup by DB ID
          const results = await base44.entities.NewsArticle.filter({ id });
          article = results?.[0];
        } else if (slugParam) {
          // Lookup by slug (V1 used ?slug= on performer pages)
          const results = await base44.entities.NewsArticle.filter({ slug: slugParam });
          article = results?.[0];
          // Fallback: search all articles
          if (!article) {
            const all = await base44.entities.NewsArticle.list();
            article = all.find(a => a.slug?.toLowerCase() === slugParam.toLowerCase());
          }
        }

        if (article?.slug && article.status === 'published') {
          const targetUrl = `/news/${article.slug}`;
          injectNoIndexAndCanonical(`https://fleshlab.online${targetUrl}`);
          navigate(targetUrl, { replace: true });
        } else {
          injectNoIndexAndCanonical('https://fleshlab.online/news');
          navigate('/news', { replace: true });
        }
      } catch {
        injectNoIndexAndCanonical('https://fleshlab.online/news');
        navigate('/news', { replace: true });
      }
    }

    resolve();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}