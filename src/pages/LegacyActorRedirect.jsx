import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
 * LegacyActorRedirect
 * Handles V1 URL: /ActorDetail?slug=<db_id_or_name>
 *
 * V1 used two patterns:
 *   1. ?slug=6a0c703aa60bbcced3d45a0a  (24-char hex DB ID)
 *   2. ?slug=Jameson                  (display name or partial slug)
 *
 * Redirects to the clean V2 URL: /performers/:slug
 */
export default function LegacyActorRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    injectNoIndex();
    const params = new URLSearchParams(window.location.search);
    const slugParam = params.get('slug');

    if (!slugParam) {
      navigate('/performers', { replace: true });
      return;
    }

    const isDbId = /^[0-9a-f]{24}$/.test(slugParam);

    async function resolve() {
      try {
        let performer = null;

        if (isDbId) {
          // Direct DB ID lookup
          const results = await base44.entities.Performer.filter({ id: slugParam });
          performer = results?.[0];
        } else {
          // Slug or display name lookup (case-insensitive)
          const all = await base44.entities.Performer.list();
          const lower = slugParam.toLowerCase();
          performer = all.find(p =>
            p.slug?.toLowerCase() === lower ||
            p.display_name?.toLowerCase() === lower
          );
        }

        if (performer?.slug) {
          navigate(`/performers/${performer.slug}`, { replace: true });
        } else {
          navigate('/performers', { replace: true });
        }
      } catch {
        navigate('/performers', { replace: true });
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