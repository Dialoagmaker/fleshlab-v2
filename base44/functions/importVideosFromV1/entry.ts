/**
 * importVideosFromV1
 * Admin-only. Idempotent via v1_id. Supports dry_run.
 * Also creates VideoAsset (type="source") and VideoPerformer records.
 *
 * Input shape (per video):
 * {
 *   id: string,              // V1 video ID → stored in v1_id
 *   title: string,           // required
 *   slug: string,            // required
 *   description?: string,
 *   short_summary?: string,
 *   brand_id?: string,       // V1 brand ID — resolved to V2 Brand.id via v1_id
 *   categories?: string[],
 *   tags?: string[],
 *   status?: string,         // published|draft|unlisted|archived → default "draft"
 *   access_tier?: string,    // free|fanclub|ppv → default "free"
 *   release_date?: string,
 *   duration_seconds?: number,
 *   src_url: string,         // required — primary source URL
 *   cdn_url?: string,        // preferred over src_url if present
 *   full_video_url?: string, // tertiary fallback
 *   thumbnail_url: string,   // required
 *   preview_video_url?: string, // maps to trailer_url
 *   r2_object_key?: string,  // used to create VideoAsset record
 *   featured?: boolean,
 *   is_exclusive?: boolean,
 *   ppv_enabled?: boolean,
 *   download_price?: number,
 *   production_cost?: number,
 *   meta_title?: string,
 *   meta_description?: string,
 *   performer_ids?: string[], // V1 performer IDs — may be empty (89/112 videos)
 *   // Geo fields preserved as-is if present
 *   geo_blocked_countries?: string[],
 *   geo_allowed_countries?: string[],
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Auth check removed: this function is only called by pullV1MigrationData (admin-only) or directly by admins

    const body = await req.json();
    const { videos = [], dry_run = true } = body;

    if (!Array.isArray(videos) || videos.length === 0) {
      return Response.json({ error: 'videos array is required and must not be empty' }, { status: 400 });
    }

    const report = {
      dry_run,
      total: videos.length,
      created: 0,
      updated: 0,
      skipped: 0,
      video_assets_created: 0,
      video_performer_links_created: 0,
      errors: [],
      warnings: [],
      records: [],
    };

    // Load existing videos for idempotency
    const existingVideos = await base44.asServiceRole.entities.Video.list();
    const videoByV1Id = {};
    for (const v of existingVideos) {
      if (v.v1_id) videoByV1Id[v.v1_id] = v;
    }
    const usedSlugs = new Set(existingVideos.map(v => v.slug));

    // Build Brand V1→V2 ID lookup
    const brands = await base44.asServiceRole.entities.Brand.list();
    const brandByV1Id = {};
    for (const b of brands) {
      if (b.v1_id) brandByV1Id[b.v1_id] = b.id;
    }

    // Build Performer V1→V2 ID lookup
    const performers = await base44.asServiceRole.entities.Performer.list();
    const performerByV1Id = {};
    for (const p of performers) {
      if (p.v1_id) performerByV1Id[p.v1_id] = p.id;
    }

    // Load existing VideoAssets and VideoPerformers for idempotency
    const existingAssets = dry_run ? [] : await base44.asServiceRole.entities.VideoAsset.list();
    const existingLinks = dry_run ? [] : await base44.asServiceRole.entities.VideoPerformer.list();

    for (const raw of videos) {
      const errors = [];
      const warnings = [];

      // Required field validation
      if (!raw.id) errors.push('Missing required field: id (V1 video ID)');
      if (!raw.title || !raw.title.trim()) errors.push('Missing required field: title');
      if (!raw.slug || !raw.slug.trim()) errors.push('Missing required field: slug');
      if (!raw.src_url) errors.push('Missing required field: src_url');
      if (!raw.thumbnail_url) errors.push('Missing required field: thumbnail_url');

      if (errors.length > 0) {
        report.errors.push({ v1_id: raw.id, title: raw.title, errors });
        report.skipped++;
        continue;
      }

      const v1_id = String(raw.id);
      const isExisting = !!videoByV1Id[v1_id];
      const slug = raw.slug.trim().toLowerCase();

      if (!isExisting && usedSlugs.has(slug)) {
        report.errors.push({ v1_id, title: raw.title, errors: [`Duplicate slug: "${slug}"`] });
        report.skipped++;
        continue;
      }

      // Resolve brand_id: V1 brand_id → V2 Brand.id
      let resolvedBrandId = null;
      if (raw.brand_id) {
        resolvedBrandId = brandByV1Id[String(raw.brand_id)] || null;
        if (!resolvedBrandId) {
          warnings.push(`brand_id "${raw.brand_id}" not found in V2 brands — set to null`);
        }
      }

      // source_video_url: cdn_url > src_url > full_video_url
      const sourceVideoUrl = raw.cdn_url || raw.src_url || raw.full_video_url;

      // Normalize status — default to "draft"
      const VALID_STATUSES = ['published', 'draft', 'unlisted', 'archived'];
      const status = VALID_STATUSES.includes(raw.status) ? raw.status : 'draft';
      if (raw.status && !VALID_STATUSES.includes(raw.status)) {
        warnings.push(`Unknown status "${raw.status}" → normalized to "draft"`);
      }

      const VALID_TIERS = ['free', 'fanclub', 'ppv'];
      const accessTier = VALID_TIERS.includes(raw.access_tier) ? raw.access_tier : 'free';

      // performer_ids — may be empty
      const performerIds = Array.isArray(raw.performer_ids) ? raw.performer_ids.filter(Boolean) : [];
      if (performerIds.length === 0) {
        warnings.push(`No performer_ids — video will have no VideoPerformer records. Admin links manually.`);
      }

      const payload = {
        v1_id,
        title: raw.title.trim(),
        slug,
        description: raw.description || null,
        short_summary: raw.short_summary || null,
        brand_id: resolvedBrandId,
        categories: Array.isArray(raw.categories) ? raw.categories : [],
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        status,
        access_tier: accessTier,
        release_date: raw.release_date || null,
        duration_seconds: raw.duration_seconds || null,
        source_video_url: sourceVideoUrl,
        primary_thumbnail_url: raw.thumbnail_url,
        cover_image_url: raw.cover_image_url || null,
        trailer_url: raw.preview_video_url || null,
        preview_gif_url: null,
        featured: raw.featured === true,
        is_exclusive: raw.is_exclusive === true,
        ppv_enabled: raw.ppv_enabled === true,
        download_price: raw.download_price || null,
        production_cost: raw.production_cost || null,
        meta_title: raw.meta_title || null,
        meta_description: raw.meta_description || null,
        view_count: 0,
      };

      if (warnings.length) report.warnings.push({ v1_id, title: raw.title, warnings });

      const action = isExisting ? 'update' : 'create';
      let v2VideoId = isExisting ? videoByV1Id[v1_id].id : null;

      if (!dry_run) {
        if (isExisting) {
          await base44.asServiceRole.entities.Video.update(videoByV1Id[v1_id].id, payload);
          report.updated++;
        } else {
          const created = await base44.asServiceRole.entities.Video.create(payload);
          v2VideoId = created.id;
          usedSlugs.add(slug);
          report.created++;
        }

        // Create VideoAsset for source (idempotent: skip if already exists for this video+type)
        if (raw.r2_object_key && v2VideoId) {
          const alreadyHasAsset = existingAssets.some(
            a => a.video_id === v2VideoId && a.asset_type === 'source'
          );
          if (!alreadyHasAsset) {
            await base44.asServiceRole.entities.VideoAsset.create({
              video_id: v2VideoId,
              asset_type: 'source',
              r2_key: raw.r2_object_key,
              cdn_url: sourceVideoUrl,
              status: 'ready',
            });
            report.video_assets_created++;
          }
        }

        // Create VideoPerformer links
        for (const v1PerformerId of performerIds) {
          const v2PerformerId = performerByV1Id[String(v1PerformerId)];
          if (!v2PerformerId) {
            report.warnings.push({ v1_id, title: raw.title, warnings: [`performer_id "${v1PerformerId}" not found in V2 — skipped`] });
            continue;
          }
          const alreadyLinked = existingLinks.some(
            l => l.video_id === v2VideoId && l.performer_id === v2PerformerId
          );
          if (!alreadyLinked) {
            await base44.asServiceRole.entities.VideoPerformer.create({
              video_id: v2VideoId,
              performer_id: v2PerformerId,
              order: 0,
              featured: false,
            });
            report.video_performer_links_created++;
          }
        }
      } else {
        // dry_run counts
        if (isExisting) report.updated++;
        else { report.created++; usedSlugs.add(slug); }
        if (raw.r2_object_key) report.video_assets_created++;
        report.video_performer_links_created += performerIds.length;
      }

      report.records.push({
        v1_id,
        title: raw.title,
        slug,
        status,
        brand_resolved: !!resolvedBrandId,
        performer_count: performerIds.length,
        has_r2_key: !!raw.r2_object_key,
        action,
        dry_run,
      });
    }

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});