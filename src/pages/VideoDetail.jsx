import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAccessControl, PRICING } from "@/lib/useAccessControl";
import { usePaymentProvider } from "@/hooks/usePaymentProvider";
import PaymentMethodSelector from "@/components/payment/PaymentMethodSelector";
import SEOMeta from "@/components/SEOMeta";
import VideoRail from "@/components/public/VideoRail";
import LargeVideoRail from "@/components/public/LargeVideoRail";
import VideoPurchaseBox from "@/components/payment/VideoPurchaseBox";
import PerformerSection from "@/components/public/PerformerSection";
import FeaturedPerformerBlock from "@/components/public/FeaturedPerformerBlock";
import PremiumTeaserBlock from "@/components/public/PremiumTeaserBlock";
import FanProductionTeaser from "@/components/public/FanProductionTeaser";
import FanclubTeaser from "@/components/public/FanclubTeaser";
import StudioVideosMiniList from "@/components/public/StudioVideosMiniList";
import { trackVideoDetailView, trackPerformerProfileView } from "@/lib/analytics";
import SmartContentCta from "@/components/cta/SmartContentCta";
import {
  Calendar, Clock, Film, ArrowLeft, Loader2, Tag,
  Play, Eye, Crown, Users, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ACCESS_TIER = {
  free:    { label: 'Free Preview',       color: 'bg-green-500/10 text-green-500' },
  fanclub: { label: 'Fanclub Exclusive',  color: 'bg-purple-500/10 text-purple-500' },
  ppv:     { label: 'Premium PPV',        color: 'bg-primary/10 text-primary' },
};

// Sanitize a video record — only safe public fields (v2)
const safeVideo = (v) => v ? {
  id: v.id, slug: v.slug, title: v.title, description: v.description,
  short_summary: v.short_summary, brand_id: v.brand_id, categories: v.categories,
  tags: v.tags, access_tier: v.access_tier, release_date: v.release_date,
  duration_seconds: v.duration_seconds, primary_thumbnail_url: v.primary_thumbnail_url,
  cover_image_url: v.cover_image_url, trailer_url: v.trailer_url,
  preview_gif_url: v.preview_gif_url, view_count: v.view_count, featured: v.featured,
  is_exclusive: v.is_exclusive, ppv_enabled: v.ppv_enabled, created_date: v.created_date,
  meta_title: v.meta_title, meta_description: v.meta_description,
} : null;

export default function VideoDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { requireSignup, getCTA } = useAccessControl();
  const paymentProvider = usePaymentProvider();
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState(null);

  // Fetch directly via entity SDK — same as PerformerDetail, works headless/Googlebot
  const { data: allVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['public-all-videos'],
    queryFn: () => base44.entities.Video.filter({ status: 'published' }, '-release_date', 100),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: allBrands = [] } = useQuery({
    queryKey: ['public-all-brands'],
    queryFn: () => base44.entities.Brand.filter({ status: 'active' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allPerformers = [] } = useQuery({
    queryKey: ['public-all-performers'],
    queryFn: () => base44.entities.Performer.filter({ status: 'active' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allVideoPerformers = [] } = useQuery({
    queryKey: ['public-all-video-performers'],
    queryFn: () => base44.entities.VideoPerformer.list(),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = videosLoading;

  // Resolve video from slug — with legacy slug fallback
  let videoRaw = allVideos.find(v => v.slug === slug) || null;
  let foundViaLegacy = false;
  
  // If not found by current slug, check legacy_slugs array
  if (!videoRaw && slug) {
    videoRaw = allVideos.find(v => v.legacy_slugs?.includes(slug)) || null;
    foundViaLegacy = !!videoRaw;
  }
  
  // If found via legacy slug, redirect to canonical new URL
  if (foundViaLegacy && videoRaw) {
    const canonicalSlug = videoRaw.slug;
    const canonicalPath = `/videos/${canonicalSlug}`;
    // Replace state to avoid back button loop, preserve canonical URL
    window.history.replaceState(null, '', canonicalPath);
  }
  
  // Phase 2D P0: Check if video is complete enough to display publicly
  // Even if status is 'published', hide if critical fields are missing
  if (videoRaw) {
    const hasRequiredFields = 
      videoRaw.source_video_url &&
      videoRaw.primary_thumbnail_url &&
      (videoRaw.trailer_url || videoRaw.source_video_url) &&
      videoRaw.duration_seconds &&
      videoRaw.duration_seconds > 0 &&
      videoRaw.access_tier &&
      ['free', 'fanclub', 'ppv'].includes(videoRaw.access_tier) &&
      videoRaw.title &&
      videoRaw.title.trim().length >= 3;
    
    // Check performer relations
    const videoPerformerIds = allVideoPerformers
      .filter(vp => vp.video_id === videoRaw.id)
      .map(vp => vp.performer_id);
    
    if (!hasRequiredFields || videoPerformerIds.length === 0) {
      // Video is incomplete - treat as not found
      videoRaw = null;
    }
  }
  
  const video = safeVideo(videoRaw);

  // Resolve brand
  const brand = video ? (allBrands.find(b => b.id === video.brand_id) || null) : null;
  const safeBrand = brand ? { id: brand.id, name: brand.name, slug: brand.slug, logo_url: brand.logo_url, cover_image_url: brand.cover_image_url, description: brand.description } : null;

  // Resolve performers for this video
  const performerIds = video ? allVideoPerformers.filter(vp => vp.video_id === video.id).map(vp => vp.performer_id) : [];
  const performers = allPerformers
    .filter(p => performerIds.includes(p.id))
    .map(p => ({ id: p.id, display_name: p.display_name, slug: p.slug, profile_image_url: p.profile_image_url, nationality: p.nationality, verified: p.verified, fanclub_enabled: p.fanclub_enabled }));

  // Related video sets
  const otherVideos = allVideos.filter(v => v.slug !== slug);
  const studioVideos = video ? otherVideos.filter(v => v.brand_id === video.brand_id).slice(0, 6).map(safeVideo) : [];

  // "More from Performer" — videos featuring the primary performer, excluding the current video
  const primaryPerformerForRail = performers[0] || null;
  const morePerformerVideoIds = (video && primaryPerformerForRail)
    ? allVideoPerformers.filter(vp => vp.performer_id === primaryPerformerForRail.id && vp.video_id !== video.id).map(vp => vp.video_id)
    : [];
  const morePerformerVideos = video ? otherVideos.filter(v => morePerformerVideoIds.includes(v.id)).slice(0, 6).map(safeVideo) : [];

  // Exclusion set — a video must not appear in both "More from Performer" and "Similar Videos"; earlier section wins
  const excludedVideoIds = new Set([video?.id, ...morePerformerVideos.map(v => v.id)]);
  const similarVideos = video ? otherVideos.filter(v => !excludedVideoIds.has(v.id) && v.tags?.some(t => video.tags?.includes(t))).slice(0, 6).map(safeVideo) : [];

  const relatedVideos = video ? otherVideos.filter(v => v.brand_id === video.brand_id || v.tags?.some(t => video.tags?.includes(t))).slice(0, 6).map(safeVideo) : [];
  const brands = allBrands.map(b => ({ id: b.id, name: b.name, slug: b.slug, logo_url: b.logo_url }));

  const handleUnlock = async () => {
    setUnlockError(null);
    
    // Check auth using access control
    const cta = getCTA(video.access_tier === 'fanclub' ? 'fanclub' : 'ppv', {
      price: video.access_tier === 'ppv' ? PRICING.ppv.standard.price : undefined
    });
    
    if (cta.requiresAuth) {
      cta.action();
      return;
    }
    
    // User is authenticated, proceed with unlock
    setIsUnlocking(true);
    try {
      const res = await base44.functions.invoke('getVideoPlaybackUrl', { videoId: video.id });
      if (res.data?.entitled && res.data?.playback_url) {
        setPlaybackUrl(res.data.playback_url);
      } else {
        setUnlockError(res.data?.message || 'Access required');
      }
    } catch {
      setUnlockError('Could not unlock video. Please try again.');
    }
    setIsUnlocking(false);
  };

  // Track video detail view
  useEffect(() => {
    if (video?.slug) {
      trackVideoDetailView(video.slug);
    }
  }, [video?.slug]);

  // Track performer profile views
  useEffect(() => {
    performers.forEach(p => {
      if (p?.slug) {
        trackPerformerProfileView(p.slug);
      }
    });
  }, [performers]);

  // Loading state — render slug-derived content so Googlebot sees real H1 immediately
  if (isLoading) {
    const titleFromSlug = slug
      ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Loading Video';
    return (
      <>
        <SEOMeta
          title={`${titleFromSlug} | FLESHLAB Studios`}
          description={`Watch ${titleFromSlug} on FLESHLAB Studios. Premium gay adult content featuring verified Asian performers.`}
          canonical={`https://fleshlab.online/videos/${slug}`}
        />
        <div className="min-h-screen bg-background">
          <div className="bg-card border-b border-border">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <Button variant="ghost" onClick={() => navigate('/videos')} className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Back to Library
              </Button>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8 bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{titleFromSlug}</h1>
            <p className="text-muted-foreground">Premium gay adult content from FLESHLAB Studios. Featuring verified performers, exclusive studio productions, and fanclub-exclusive scenes.</p>
          </div>
        </div>
      </>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2 text-foreground">Video Not Found</h1>
          <p className="text-muted-foreground mb-4">This video doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/videos')} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Videos
          </Button>
        </div>
      </div>
    );
  }

  const tierInfo = ACCESS_TIER[video.access_tier] || { label: video.access_tier, color: 'bg-muted text-muted-foreground' };
  const primaryPerformer = performers[0] || null;
  const canonicalUrl = `https://fleshlab.online/videos/${video.slug}`;
  
  // Get CTA based on auth state and access tier
  const cta = getCTA(video.access_tier === 'fanclub' ? 'fanclub' : video.access_tier === 'ppv' ? 'ppv' : 'full-video');

  // ISO 8601 duration: PT2H3M45S
  const isoDuration = (secs) => {
    if (!secs || secs <= 0) return undefined;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `PT${h > 0 ? h + 'H' : ''}${m > 0 ? m + 'M' : ''}${s > 0 ? s + 'S' : ''}` || `PT${secs}S`;
  };

  // Safe ISO upload date — full ISO 8601 with +08:00 timezone (required by Google)
  const isoUploadDate = (() => {
    const d = video.release_date || video.created_date;
    if (!d) return undefined;
    try {
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return undefined;
      // If source already has time+timezone info, normalize to +08:00
      if (/[TZ+]/.test(String(d)) && String(d).length > 10) {
        const offsetMs = 8 * 60 * 60 * 1000;
        const local = new Date(parsed.getTime() + offsetMs);
        const pad = n => String(n).padStart(2, '0');
        return `${local.getUTCFullYear()}-${pad(local.getUTCMonth()+1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}+08:00`;
      }
      // Date-only string — use midnight Taiwan time
      return `${String(d).substring(0, 10)}T00:00:00+08:00`;
    } catch { return undefined; }
  })();

  // BreadcrumbList for video detail
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fleshlab.online/" },
      { "@type": "ListItem", "position": 2, "name": "Videos", "item": "https://fleshlab.online/videos" },
      { "@type": "ListItem", "position": 3, "name": video.title, "item": canonicalUrl }
    ]
  };

  // JSON-LD: VideoObject — never include source/private video URL
  // contentUrl omitted: trailer_url is a preview, not the full video
  // embedUrl = canonical page URL (no dedicated embed player exists)
  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": (video.meta_description || video.short_summary || video.description || '').substring(0, 300),
    "thumbnailUrl": video.primary_thumbnail_url,
    "uploadDate": isoUploadDate,
    "datePublished": isoUploadDate,
    "duration": isoDuration(video.duration_seconds),
    "embedUrl": canonicalUrl,
    "url": canonicalUrl,
    "isFamilyFriendly": false,
    "inLanguage": "en",
    "contentRating": "adult",
    "publisher": {
      "@type": "Organization",
      "name": "FLESHLAB Studios",
      "url": "https://fleshlab.online"
    },
    ...(performers.length > 0 && {
      "actor": performers.map(p => ({
        "@type": "Person",
        "name": p.display_name,
        ...(p.slug && { "url": `https://fleshlab.online/performers/${p.slug}` })
      }))
    }),
    ...(video.categories?.length > 0 && { "genre": video.categories }),
    ...(video.tags?.length > 0 && { "keywords": video.tags.join(', ') }),
    ...(video.view_count > 0 && {
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/WatchAction",
        "userInteractionCount": video.view_count
      }
    }),
    ...((video.access_tier === 'fanclub' || video.access_tier === 'ppv') && {
      "requiresSubscription": true
    })
  };

  const jsonLd = [videoSchema, breadcrumb];

  const unlockLabel =
    video.access_tier === 'fanclub' ? 'Join Fanclub' :
    video.access_tier === 'ppv'     ? 'Buy Video'    : 'Watch Full Video';

  return (
    <>
      <SEOMeta
        title={video.meta_title || `${video.title} | FLESHLAB Studios`}
        description={video.meta_description || video.short_summary || video.description}
        canonical={canonicalUrl}
        ogImage={video.primary_thumbnail_url || video.cover_image_url}
        ogType="video.object"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-background">
        {/* Back */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <Button variant="ghost" onClick={() => navigate('/videos')} className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Library
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* ── Video Player ── */}
          <div className="mb-8">
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
              <div className="aspect-video">

                {/* UNLOCKED: authenticated + entitled → show full video */}
                {playbackUrl ? (
                  <video controls autoPlay className="w-full h-full" poster={video.primary_thumbnail_url}>
                    <source src={playbackUrl} />
                  </video>

                ) : video.trailer_url ? (
                  /* PUBLIC TRAILER: free for all visitors */
                  <iframe
                    src={video.trailer_url}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />

                ) : (
                  /* LOCKED: no trailer → thumbnail + CTA overlay */
                  <div className="relative w-full h-full">
                    {video.primary_thumbnail_url ? (
                      <img src={video.primary_thumbnail_url} alt={video.title} className="w-full h-full object-cover opacity-40" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-4">
                      <Lock className="w-16 h-16 text-primary/60" />
                      <div>
                        <p className="text-white font-bold text-xl mb-1">
                          {video.access_tier === 'fanclub' ? 'Fanclub Exclusive'
                            : video.access_tier === 'ppv' ? 'Premium Video'
                            : 'Full Video'}
                        </p>
                        <p className="text-white/70 text-sm">
                          {video.access_tier === 'fanclub' ? 'Join the fanclub to watch'
                            : video.access_tier === 'ppv' ? 'Purchase to unlock'
                            : 'Create an account to watch'}
                        </p>
                      </div>
                      {unlockError && <p className="text-red-400 text-sm">{unlockError}</p>}
                      <div className="flex flex-wrap gap-3 justify-center">
                        <Button onClick={handleUnlock} disabled={isUnlocking} className="bg-primary hover:bg-primary/90 gap-2">
                          {isUnlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                          {cta.primaryText}
                        </Button>
                        {!isAuthenticated && (
                          <Button variant="outline" onClick={() => navigate('/register')} className="border-white/30 text-white hover:bg-white/10">
                            Create Free Account
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Trailer bar — shown when trailer is playing */}
            {video.trailer_url && !playbackUrl && (
              <div className="flex items-center justify-between mt-3">
                <Badge variant="outline" className="text-xs gap-1">
                  <Play className="w-3 h-3" /> Trailer Preview
                </Badge>
                <Button size="sm" onClick={handleUnlock} disabled={isUnlocking} className="bg-primary hover:bg-primary/90 gap-1.5 text-xs h-7">
                  {isUnlocking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                  Watch Full Video
                </Button>
              </div>
            )}
          </div>

          {/* ── Page Layout ── */}
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{video.title}</h1>

              {/* Stats bar */}
              <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-border text-sm">
                <Badge className={tierInfo.color}>{tierInfo.label}</Badge>
                {video.release_date && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(video.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {video.duration_seconds && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                  </span>
                )}
                {!!video.view_count && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    {video.view_count.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Performers */}
              {performers.length > 1 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Featured Performers ({performers.length})</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {performers.map(p => (
                      <Link key={p.id} to={`/performers/${p.slug}`}
                        className="group flex items-center gap-3 bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-all"
                      >
                        {p.profile_image_url
                          ? <img src={p.profile_image_url} alt={p.display_name} className="w-12 h-12 rounded-full object-cover border-2 border-border group-hover:border-primary" />
                          : <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><Users className="w-6 h-6 text-muted-foreground" /></div>
                        }
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{p.display_name}</p>
                          <p className="text-xs text-muted-foreground">{p.nationality || 'Performer'}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : primaryPerformer ? (
                <PerformerSection performer={primaryPerformer} videoCount={1} />
              ) : null}

              {morePerformerVideos.length > 0 && primaryPerformerForRail && (
                <LargeVideoRail
                  title={`More from ${primaryPerformerForRail.display_name}`}
                  subtitle={`${morePerformerVideos.length} videos available`}
                  videos={morePerformerVideos} brands={brands} performers={performers}
                  viewAllLink={`/performers/${primaryPerformerForRail.slug}`} viewAllText="View Performer"
                />
              )}

              {similarVideos.length > 0 && (
                <LargeVideoRail title="Similar Videos" subtitle="Based on tags" videos={similarVideos} brands={brands} performers={performers} />
              )}

              <FanProductionTeaser />
              <FanclubTeaser />

              {video.description && (
                <div className="pt-2">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{video.description}</p>
                </div>
              )}

              {video.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {video.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="gap-1.5 px-3 py-1">
                      <Tag className="w-3 h-3" />{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {relatedVideos.length > 0 && (
                <VideoRail title="Related Videos" videos={relatedVideos} brands={brands} performers={performers} />
              )}

              <SmartContentCta contentType="videos" user={user} hasActiveSub={!!playbackUrl} />
              <div className="pt-8"><PremiumTeaserBlock title="Want Full Access?" /></div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">

              {/* Performer card */}
              {primaryPerformer ? (
                <FeaturedPerformerBlock performer={primaryPerformer} videoCount={1} isFallback={false} />
              ) : (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-muted-foreground">Featured Performer</h3>
                  <p className="text-sm text-muted-foreground mb-3">Browse our featured Asian twink performers and discover exclusive content.</p>
                  <Link to="/performers"><Button className="w-full bg-primary hover:bg-primary/90">View All Performers</Button></Link>
                </div>
              )}

              {/* All performers list (multi) */}
              {performers.length > 1 && (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-muted-foreground">All Performers ({performers.length})</h3>
                  <div className="space-y-2">
                    {performers.map(p => (
                      <Link key={p.id} to={`/performers/${p.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group">
                        {p.profile_image_url
                          ? <img src={p.profile_image_url} alt={p.display_name} className="w-10 h-10 rounded-full object-cover border border-border" />
                          : <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"><Users className="w-5 h-5 text-muted-foreground" /></div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{p.display_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.nationality || 'Performer'}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase box */}
              {!playbackUrl && (
                <VideoPurchaseBox
                  video={video}
                  priceUsd={video.access_tier === 'ppv' ? PRICING.ppv.standard.price : video.access_tier === 'fanclub' ? 49.99 : 0}
                  isAuthenticated={isAuthenticated}
                  isUnlocking={isUnlocking}
                  unlockError={unlockError}
                  cta={cta}
                  handleUnlock={handleUnlock}
                  requireSignup={requireSignup}
                  paymentProvider={paymentProvider}
                />
              )}

              {/* Access level */}
              <div className="bg-card rounded-xl p-5 border border-border">
                <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-muted-foreground">Access Level</h3>
                <Badge className={`${tierInfo.color} text-sm px-3 py-1.5`}>{tierInfo.label}</Badge>
              </div>

              {/* Categories */}
              {video.categories?.length > 0 && (
                <div className="bg-card rounded-xl p-5 border border-border">
                  <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-muted-foreground">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.categories.map((cat, i) => <Badge key={i} variant="outline" className="text-xs">{cat}</Badge>)}
                  </div>
                </div>
              )}

              {/* Fanclub CTA */}
              <div className="bg-purple-900/10 rounded-xl p-5 border border-purple-500/30">
                <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-purple-400 flex items-center gap-2">
                  <Crown className="w-4 h-4" /> Fanclub Access
                </h3>
                <p className="text-sm text-muted-foreground mb-3">Get exclusive behind-the-scenes content and direct interaction with performers.</p>
                <Link to="/fanclub"><Button className="w-full bg-primary hover:bg-primary/90 text-sm">Join Fanclub</Button></Link>
              </div>

              {studioVideos.length > 0 && safeBrand && (
                <StudioVideosMiniList brand={safeBrand} videos={studioVideos} performers={performers} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}