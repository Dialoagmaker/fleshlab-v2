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
  canonical.setAttribute('href', targetCanonicalUrl || '/videos');
}

/**
 * LegacyVideoRedirect
 * Handles V1 URL: /VideoDetail?id=<db_id>
 * Looks up the video by ID and redirects to the clean V2 URL: /videos/:slug
 */
export default function LegacyVideoRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      navigate('/videos', { replace: true });
      return;
    }

    async function resolve() {
      try {
        const results = await base44.entities.Video.filter({ id });
        const video = results?.[0];
        if (video?.slug && video.status === 'published') {
          const targetUrl = `/videos/${video.slug}`;
          injectNoIndexAndCanonical(`https://fleshlab.online${targetUrl}`);
          navigate(targetUrl, { replace: true });
        } else {
          injectNoIndexAndCanonical('https://fleshlab.online/videos');
          navigate('/videos', { replace: true });
        }
      } catch {
        injectNoIndexAndCanonical('https://fleshlab.online/videos');
        navigate('/videos', { replace: true });
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