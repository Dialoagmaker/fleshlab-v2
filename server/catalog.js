// Public catalogue projection.  Imported source payloads remain private in
// PostgreSQL; these functions return only the fields needed by the public
// website and never expose raw payloads, private media origins, finance, or
// performer compliance data.

const text = (value) => typeof value === 'string' ? value : null;
const list = (value) => Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
const dateValue = (value) => value ? String(value) : null;

function brand(row) {
  const value = row.source_payload || {};
  return { id: row.legacy_id, name: row.name, slug: row.slug, description: text(value.description), logo_url: text(value.logo_url), cover_image_url: text(value.cover_image_url), meta_title: text(value.meta_title), meta_description: text(value.meta_description), status: row.status };
}

function performer(row, videoCount = 0, brandId = null) {
  const value = row.source_payload || {};
  return {
    id: row.legacy_id, display_name: row.display_name, slug: row.slug, bio: text(value.bio), nationality: text(value.nationality),
    profile_image_url: text(value.profile_image_url), cover_image_url: text(value.cover_image_url), meta_title: text(value.meta_title), meta_description: text(value.meta_description),
    status: row.status, featured: value.featured === true, verified: value.verified === true, fanclub_enabled: value.fanclub_enabled === true,
    video_count: videoCount, brand_id: brandId, created_date: dateValue(value.created_date || row.imported_at)
  };
}

function video(row, performerIds = [], performerNames = []) {
  const value = row.source_payload || {};
  return {
    id: row.legacy_id, title: row.title, slug: row.slug, description: text(row.description), short_summary: text(row.short_summary), brand_id: row.brand_legacy_id,
    status: row.status, access_tier: row.access_tier, release_date: dateValue(row.release_date || value.published_at || value.created_date),
    duration_seconds: row.duration_seconds, primary_thumbnail_url: text(row.legacy_thumbnail_url), cover_image_url: text(value.cover_image_url), trailer_url: text(row.legacy_trailer_url),
    preview_gif_url: text(value.preview_gif_url), categories: list(value.categories), tags: list(value.tags), primary_category: text(value.primary_category),
    series_id: text(value.series_id), series_title: text(value.series_title), episode_number: Number.isInteger(value.episode_number) ? value.episode_number : null,
    featured: value.featured === true, is_exclusive: value.is_exclusive === true, view_count: Number(value.view_count || 0), download_price: Number.isFinite(value.download_price) ? value.download_price : null,
    performer_ids: performerIds, performer_names: performerNames, created_date: dateValue(value.created_date || row.imported_at), updated_date: dateValue(value.updated_date || row.imported_at)
  };
}

export class CatalogueService {
  constructor(db) { this.db = db; }

  async snapshot() {
    const [brands, performers, videos, credits] = await Promise.all([
      this.db.query("SELECT legacy_id,name,slug,status,source_payload,imported_at FROM catalog_brands WHERE status='active' ORDER BY name"),
      this.db.query("SELECT legacy_id,display_name,slug,status,source_payload,imported_at FROM catalog_performers WHERE status='active' ORDER BY display_name"),
      this.db.query("SELECT legacy_id,title,slug,description,short_summary,brand_legacy_id,status,access_tier,release_date,duration_seconds,legacy_thumbnail_url,legacy_trailer_url,source_payload,imported_at FROM catalog_videos WHERE status='published' ORDER BY release_date DESC NULLS LAST, imported_at DESC"),
      this.db.query('SELECT video_legacy_id,performer_legacy_id FROM catalog_video_performers')
    ]);
    const performerRows = new Map(performers.rows.map((row) => [row.legacy_id, row]));
    const performerIdsByVideo = new Map();
    for (const credit of credits.rows) {
      if (!performerRows.has(credit.performer_legacy_id)) continue;
      const ids = performerIdsByVideo.get(credit.video_legacy_id) || [];
      ids.push(credit.performer_legacy_id); performerIdsByVideo.set(credit.video_legacy_id, ids);
    }
    const videosPublic = videos.rows.map((row) => {
      const ids = performerIdsByVideo.get(row.legacy_id) || [];
      return video(row, ids, ids.map((id) => performerRows.get(id)?.display_name).filter(Boolean));
    });
    const videosByPerformer = new Map();
    const brandCountsByPerformer = new Map();
    for (const item of videosPublic) for (const performerId of item.performer_ids) {
      videosByPerformer.set(performerId, (videosByPerformer.get(performerId) || 0) + 1);
      if (item.brand_id) {
        const counts = brandCountsByPerformer.get(performerId) || new Map();
        counts.set(item.brand_id, (counts.get(item.brand_id) || 0) + 1); brandCountsByPerformer.set(performerId, counts);
      }
    }
    const performersPublic = performers.rows.map((row) => {
      const counts = brandCountsByPerformer.get(row.legacy_id);
      const primaryBrand = counts ? [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null : null;
      return performer(row, videosByPerformer.get(row.legacy_id) || 0, primaryBrand);
    });
    return { brands: brands.rows.map(brand), performers: performersPublic, videos: videosPublic };
  }

  async dispatch(name, input = {}) {
    const catalogue = await this.snapshot();
    if (name === 'getPublicVideos') {
      const page = Math.max(1, Number.parseInt(input.page, 10) || 1); const limit = Math.min(48, Math.max(1, Number.parseInt(input.limit, 10) || 24));
      const search = String(input.search || '').trim().toLowerCase();
      let videos = catalogue.videos;
      if (input.brand) videos = videos.filter((item) => item.brand_id === input.brand);
      if (input.access_tier) videos = videos.filter((item) => item.access_tier === input.access_tier);
      if (search) videos = videos.filter((item) => [item.title, item.description, item.short_summary, ...item.tags, ...item.performer_names].filter(Boolean).join(' ').toLowerCase().includes(search));
      const total = videos.length; const start = (page - 1) * limit;
      return { videos: videos.slice(start, start + limit), brands: catalogue.brands, total, published_total: catalogue.videos.length, page, limit, hasMore: start + limit < total };
    }
    if (name === 'getPublicPerformers') return { performers: catalogue.performers, brands: catalogue.brands, videos: catalogue.videos };
    if (name === 'getPublicBrands') return { brands: catalogue.brands, videos: catalogue.videos };
    if (name === 'getPublicCollections') {
      const newest = catalogue.videos.slice(0, 12);
      const collections = [];
      if (newest.length) collections.push({ id: 'new-releases', type: 'dynamic', slug: 'new-releases', title: 'New Releases', short_description: 'The latest productions entering the FLESHLAB library.', video_count: catalogue.videos.length, videos: newest });
      for (const item of catalogue.brands) {
        const items = catalogue.videos.filter((video) => video.brand_id === item.id).slice(0, 12);
        if (items.length) collections.push({ id: item.id, type: 'brand', slug: item.slug, title: item.name, short_description: item.description, cover_image: item.cover_image_url, video_count: items.length, videos: items });
      }
      return { collections, performers: catalogue.performers };
    }
    if (name === 'getPublicVideoDetail') {
      const current = catalogue.videos.find((item) => item.slug === input.slug);
      if (!current) return { error: 'Video not found.' };
      const relatedPerformers = catalogue.performers.filter((item) => current.performer_ids.includes(item.id));
      const brandItem = catalogue.brands.find((item) => item.id === current.brand_id) || null;
      const studioVideos = catalogue.videos.filter((item) => item.brand_id === current.brand_id && item.id !== current.id).slice(0, 12);
      const morePerformerVideos = catalogue.videos.filter((item) => item.id !== current.id && item.performer_ids.some((id) => current.performer_ids.includes(id))).slice(0, 12);
      return { video: current, brand: brandItem, performers: relatedPerformers, studioVideos, morePerformerVideos, similarVideos: morePerformerVideos, relatedVideos: studioVideos, brands: catalogue.brands };
    }
    return null;
  }
}
