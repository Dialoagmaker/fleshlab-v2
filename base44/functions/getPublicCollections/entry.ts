import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const DYNAMIC_COLLECTIONS = [
  { id: 'new-releases', type: 'dynamic', slug: 'new-releases', title: 'New Releases', short_description: 'The latest productions entering the FLESHLAB library.' },
  { id: 'from-the-archive', type: 'dynamic', slug: 'from-the-archive', title: 'From The Archive', short_description: 'Curated legacy catalogue productions with lasting archive value.' },
  { id: 'thefitmaster', type: 'dynamic', slug: 'thefitmaster', title: 'TheFitmaster', short_description: 'New productions from FLESHLAB’s currently active creator.' }
];

function isPublicVideo(video) {
  return video && video.status === 'published' && !['private', 'draft', 'hidden'].includes(video.release_status || 'public');
}

function videoDate(video) {
  return new Date(video.published_at || video.release_date || video.created_date || 0).getTime();
}

function performerMap(performers) {
  const map = new Map();
  performers.forEach((p) => map.set(p.id, p));
  return map;
}

function publicPerformer(p) {
  return { id: p.id, display_name: p.display_name, slug: p.slug, profile_image_url: p.profile_image_url, cover_image_url: p.cover_image_url, video_count: p.video_count, featured: p.featured, verified: p.verified };
}

function performerIdsFor(video, links) {
  const ids = new Set(Array.isArray(video.performer_ids) ? video.performer_ids : []);
  if (video.performer_id) ids.add(video.performer_id);
  links.filter((l) => l.video_id === video.id).forEach((l) => ids.add(l.performer_id));
  return Array.from(ids);
}

function withPerformerNames(video, links, performersById) {
  const performer_ids = performerIdsFor(video, links);
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
    performer_ids,
    performer_names: performer_ids.map((id) => performersById.get(id)?.display_name).filter(Boolean),
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
  const keys = [category.id, category.slug, category.name].filter(Boolean).map((v) => String(v).toLowerCase());
  const secondary = Array.isArray(video.secondary_categories) ? video.secondary_categories : [];
  const legacy = Array.isArray(video.categories) ? video.categories : [];
  const values = [video.primary_category, ...secondary, ...legacy].filter(Boolean).map((v) => String(v).toLowerCase());
  return keys.some((key) => values.includes(key));
}

function matchesSeries(video, series) {
  const keys = [series.id, series.slug, series.title].filter(Boolean).map((v) => String(v).toLowerCase());
  return keys.includes(String(video.series_id || '').toLowerCase()) || keys.includes(String(video.series_title || '').toLowerCase());
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const [categories, series, videosRaw, performers, links] = await Promise.all([
      base44.asServiceRole.entities.Category.list('display_order', 200),
      base44.asServiceRole.entities.Series.list('display_order', 200),
      base44.asServiceRole.entities.Video.list('-published_at', 500),
      base44.asServiceRole.entities.Performer.list('display_name', 500),
      base44.asServiceRole.entities.VideoPerformer.list('-created_date', 1000).catch(() => [])
    ]);

    const performersById = performerMap(performers || []);
    const videos = (videosRaw || []).filter(isPublicVideo).map((v) => withPerformerNames(v, links || [], performersById));
    const sortedNewest = [...videos].sort((a, b) => videoDate(b) - videoDate(a));
    const fitmaster = (performers || []).find((p) => String(p.slug || p.display_name || '').toLowerCase().includes('fitmaster'));

    const rows = [];
    (series || []).filter((s) => s.status === 'active' && s.featured).forEach((s) => {
      const rowVideos = videos.filter((v) => matchesSeries(v, s)).sort((a, b) => (a.episode_number || 9999) - (b.episode_number || 9999));
      if (rowVideos.length) rows.push({ id: s.id, type: 'series', slug: s.slug, title: s.title, description: s.description, cover_image: s.cover_image, video_count: rowVideos.length, videos: rowVideos.slice(0, 12) });
    });

    (categories || []).filter((c) => c.active && c.visibility === 'public').forEach((c) => {
      const rowVideos = videos.filter((v) => matchesCategory(v, c)).sort((a, b) => videoDate(b) - videoDate(a));
      if (rowVideos.length) rows.push({ id: c.id, type: 'category', slug: c.slug, title: c.name, description: c.short_description || c.full_description, cover_image: c.cover_image, video_count: rowVideos.length, videos: rowVideos.slice(0, 12) });
    });

    const newReleases = sortedNewest.slice(0, 12);
    if (newReleases.length) rows.push({ ...DYNAMIC_COLLECTIONS[0], video_count: sortedNewest.length, videos: newReleases });

    const archive = videos.filter((v) => v.release_status === 'archived' || matchesCategory(v, { slug: 'studio-archive', name: 'Studio Archive' })).sort((a, b) => videoDate(b) - videoDate(a));
    if (archive.length) rows.push({ ...DYNAMIC_COLLECTIONS[1], video_count: archive.length, videos: archive.slice(0, 12) });

    if (fitmaster) {
      const fitmasterVideos = videos.filter((v) => performerIdsFor(v, links || []).includes(fitmaster.id)).sort((a, b) => videoDate(b) - videoDate(a));
      if (fitmasterVideos.length) rows.push({ ...DYNAMIC_COLLECTIONS[2], video_count: fitmasterVideos.length, videos: fitmasterVideos.slice(0, 12) });
    }

    const trending = videos.filter((v) => v.trending === true || Number(v.view_count || 0) > 0).sort((a, b) => Number(b.view_count || 0) - Number(a.view_count || 0));
    if (trending.length) rows.push({ id: 'trending', type: 'dynamic', slug: 'trending', title: 'Trending', short_description: 'Productions with real audience momentum.', video_count: trending.length, videos: trending.slice(0, 12) });

    return Response.json({ collections: rows, performers: (performers || []).map(publicPerformer) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});