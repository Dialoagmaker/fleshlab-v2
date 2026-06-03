import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

function injectNoIndex() {
  ['robots', 'googlebot'].forEach(name => {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', name); document.head.appendChild(meta); }
    meta.setAttribute('content', 'noindex,nofollow');
  });
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.remove();
}

/**
 * LegacyPerformerSlug
 * Handles V1 root performer URLs like /jameson-official
 * V1 served performer pages at the root path level (no /performers/ prefix).
 *
 * Attempts to find a performer with a matching slug and redirects to:
 *   /performers/:slug
 *
 * Falls back to / if not found (better than a 404 for old indexed URLs).
 */
export default function LegacyPerformerSlug() {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    injectNoIndex();
    if (!slug) {
      navigate('/', { replace: true });
      return;
    }

    async function resolve() {
      try {
        const results = await base44.entities.Performer.filter({ slug });
        if (results?.length > 0) {
          navigate(`/performers/${slug}`, { replace: true });
        } else {
          // Not a performer slug — send to home rather than 404
          navigate('/', { replace: true });
        }
      } catch {
        navigate('/', { replace: true });
      }
    }

    resolve();
  }, [slug, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}