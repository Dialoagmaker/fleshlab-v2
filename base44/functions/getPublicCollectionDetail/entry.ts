import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

function isPublicVideo(video) {
  return video && video.status === 'published' && !['private', 'draft', 'hidden'].includes(video.release_status || 'public');
}
function videoDate(video) { return new Date(video.published_at || video.release_date || video.created_date || 0).getTime(); }
function performerIdsFor(video, links) {
  const ids = new Set(Array.isArray(video.performer_ids) ? video.performer_ids : []);
  if (video.performer_id) ids.add(video.performer_id);
  links.filter((l) => l.video_id === video.id).forEach((l) => ids.add(l.performer_id));
  return Array.from(ids);
}
function publicPerformer(p) {
  return { id: p.id, display_name: p.display_name, slug: p.slug, profile_image_url: p.profile_image_url, cover_image_url: p.cover_image_url, video_count: p.video_count, featured: p.featured, verified: p.verified };
}
function enrich(video, links, performers) {
  const ids = performerIdsFor(video, links);
  return {
    id: video.id,
    title: video.title,
    slug: video.slug,
    description: video.description,
    short_summary: video.short_summary,
    primary_category: video.primary_category,
    series_id: video.series_id,
    series_title: video.series_title,
    episode_number: video.episode_number,
    performer_ids: ids,
    performer_names: ids.map((id) => performers.find((p) => p.id === id)?.display_name).filter(Boolean),
    production_type: video.production_type,
    location_type: video.location_type,
    release_status: video.release_status,
    published_at: video.published_at,
    release_date: video.release_date,
    duration_seconds: video.duration_seconds || video.duration,
    thumbnail: video.thumbnail,
    teaser: video.teaser,
    primary_thumbnail_url: video.primary_thumbnail_url,
    cover_image_url: video.cover_image_url,
    trailer_url: video.trailer_url,
    preview_gif_url: video.preview_gif_url,
    tags: video.tags || [],
    access_tier: video.access_tier,
    download_price: video.download_price,
    featured: video.featured,
    is_exclusive: video.is_exclusive,
    view_count: video.view_count,
    v1_id: video.v1_id
  };
}
function matchesCategory(video, category) {
  const keys = [category?.id, category?.slug, category?.name].filter(Boolean).map((v) => String(v).toLowerCase());
  const values = [video.primary_category, ...(video.secondary_categories || []), ...(video.categories || [])].filter(Boolean).map((v) => String(v).toLowerCase());
  return keys.some((key) => values.includes(key));
}
function matchesSeries(video, series) {
  const keys = [series?.id, series?.slug, series?.title].filter(Boolean).map((v) => String(v).toLowerCase());
  return keys.includes(String(video.series_id || '').toLowerCase()) || keys.includes(String(video.series_title || '').toLowerCase());
}
function sortVideos(videos, sort) {
  const copy = [...videos];
  if (sort === 'oldest') return copy.sort((a, b) => videoDate(a) - videoDate(b));
  if (sort === 'most-viewed') return copy.sort((a, b) => Number(b.view_count || 0) - Number(a.view_count || 0));
  if (sort === 'longest') return copy.sort((a, b) => Number(b.duration_seconds || b.duration || 0) - Number(a.duration_seconds || a.duration || 0));
  if (sort === 'shortest') return copy.sort((a, b) => Number(a.duration_seconds || a.duration || 0) - Number(b.duration_seconds || b.duration || 0));
  return copy.sort((a, b) => videoDate(b) - videoDate(a));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || '').trim();
    const sort = body.sort || 'newest';
    const page = Math.max(1, Number(body.page || 1));
    const limit = Math.min(48, Math.max(12, Number(body.limit || 24)));
    const [categories, series, videosRaw, performers, links] = await Promise.all([
      base44.asServiceRole.entities.Category.list('display_order', 200),
      base44.asServiceRole.entities.Series.list('display_order', 200),
      base44.asServiceRole.entities.Video.list('-published_at', 500),
      base44.asServiceRole.entities.Performer.list('display_name', 500),
      base44.asServiceRole.entities.VideoPerformer.list('-created_date', 1000).catch(() => [])
    ]);
    const videos = (videosRaw || []).filter(isPublicVideo).map((v) => enrich(v, links || [], performers || []));
    const category = (categories || []).find((c) => c.slug === slug && c.active && c.visibility === 'public');
    const foundSeries = (series || []).find((s) => s.slug === slug && s.status === 'active');
    const fitmaster = (performers || []).find((p) => String(p.slug || p.display_name || '').toLowerCase().includes('fitmaster'));
    let collection = null;
    let matched = [];

    if (foundSeries) {
      collection = { type: 'series', slug: foundSeries.slug, title: foundSeries.title, description: foundSeries.description, cover_image: foundSeries.cover_image, seo_title: foundSeries.seo_title, seo_description: foundSeries.seo_description };
      matched = videos.filter((v) => matchesSeries(v, foundSeries));
    } else if (category) {
      collection = { type: 'category', slug: category.slug, title: category.name, description: category.full_description || category.short_description, cover_image: category.cover_image, seo_title: category.seo_title, seo_description: category.seo_description };
      matched = videos.filter((v) => matchesCategory(v, category));
    } else if (slug === 'new-releases') {
      collection = { type: 'dynamic', slug, title: 'New Releases', description: 'The newest public FLESHLAB productions.' };
      matched = videos;
    } else if (slug === 'from-the-archive') {
      collection = { type: 'dynamic', slug, title: 'From The Archive', description: 'Legacy catalogue productions curated into the current FLESHLAB library.' };
      matched = videos.filter((v) => v.release_status === 'archived' || matchesCategory(v, { slug: 'studio-archive', name: 'Studio Archive' }));
    } else if (slug === 'thefitmaster' && fitmaster) {
      collection = { type: 'dynamic', slug, title: 'TheFitmaster', description: 'Published content from FLESHLAB’s currently active creator.', cover_image: fitmaster.cover_image_url || fitmaster.profile_image_url };
      matched = videos.filter((v) => performerIdsFor(v, links || []).includes(fitmaster.id));
    } else if (slug === 'trending') {
      collection = { type: 'dynamic', slug, title: 'Trending', description: 'Productions backed by real viewing or engagement signals.' };
      matched = videos.filter((v) => v.trending === true || Number(v.view_count || 0) > 0);
    }

    if (!collection) return Response.json({ error: 'Collection not found' }, { status: 404 });
    const sorted = sortVideos(matched, sort);
    const start = (page - 1) * limit;
    const pageVideos = sorted.slice(start, start + limit);
    const relevantPerformerIds = Array.from(new Set(sorted.flatMap((v) => v.performer_ids || [])));
    const relevantPerformers = (performers || []).filter((p) => relevantPerformerIds.includes(p.id)).map(publicPerformer);
    const sorting = ['newest', 'oldest'];
    if (sorted.some((v) => Number(v.view_count || 0) > 0)) sorting.push('most-viewed');
    if (sorted.some((v) => Number(v.duration_seconds || v.duration || 0) > 0)) sorting.push('longest', 'shortest');
    return Response.json({ collection: { ...collection, video_count: sorted.length, performers: relevantPerformers }, videos: pageVideos, performers: (performers || []).map(publicPerformer), sorting_options: sorting, total: sorted.length, hasMore: start + limit < sorted.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});