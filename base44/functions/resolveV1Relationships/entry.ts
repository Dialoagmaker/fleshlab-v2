/**
 * resolveV1Relationships
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only. Resolves V1 ID references to V2 entity IDs.
 * 
 * Operations:
 * 1. Video.brand_id: Replace V1 brand ID with V2 Brand.id (via Brand.v1_id lookup)
 * 2. Video.performer_ids: If array exists with V1 IDs, create VideoPerformer junction records
 * 
 * Dry-run first to show what will change.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dry_run = body.dry_run !== false;
    const execute = body.execute === true;

    // Safety check
    if (!dry_run && !execute) {
      return Response.json({
        error: 'Real execution requires: { "execute": true, "dry_run": false }',
      }, { status: 400 });
    }

    const report = {
      mode: dry_run ? 'DRY RUN' : 'LIVE EXECUTION',
      dry_run,
      brand_resolution: {
        total_videos_with_brand_id: 0,
        resolved_count: 0,
        unresolved_count: 0,
        updates: [],
      },
      performer_resolution: {
        videos_with_performer_ids: 0,
        total_links_to_create: 0,
        created_count: 0,
        skipped_empty: 0,
        links: [],
      },
      errors: [],
      summary: {},
    };

    // ── Load all data ────────────────────────────────────────────────────────
    const [videos, brands, performers, existingVideoPerformers] = await Promise.all([
      base44.asServiceRole.entities.Video.list(),
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Performer.list(),
      base44.asServiceRole.entities.VideoPerformer.list(),
    ]);

    // Build V1 ID → V2 ID lookup maps
    const brandIds = new Set(brands.map(b => b.id));
    const brandByV1Id = {};
    brands.forEach(b => {
      if (b.v1_id) brandByV1Id[b.v1_id] = b;
    });

    const performerByV1Id = {};
    performers.forEach(p => {
      if (p.v1_id) performerByV1Id[p.v1_id] = p;
    });

    // Existing VideoPerformer links (to avoid duplicates)
    const existingLinks = new Set();
    existingVideoPerformers.forEach(vp => {
      existingLinks.add(`${vp.video_id}:${vp.performer_id}`);
    });

    // ── 1. Resolve Video.brand_id ────────────────────────────────────────────
    for (const video of videos) {
      if (!video.brand_id) continue;

      report.brand_resolution.total_videos_with_brand_id++;

      // Check if brand_id is already a V2 ID
      if (brandIds.has(video.brand_id)) {
        // Already resolved to V2 ID
        report.brand_resolution.resolved_count++;
        continue;
      }

      // brand_id is a V1 ID - look up the V2 brand
      const v1BrandId = video.brand_id;
      const v2Brand = brandByV1Id[v1BrandId];

      if (v2Brand) {
        // Found matching V2 brand
        report.brand_resolution.resolved_count++;
        report.brand_resolution.updates.push({
          video_id: video.id,
          video_title: video.title,
          old_brand_id: v1BrandId,
          new_brand_id: v2Brand.id,
          brand_name: v2Brand.name,
        });

        if (!dry_run) {
          try {
            // Rate limit protection: 500ms delay between updates
            await new Promise(resolve => setTimeout(resolve, 500));
            await base44.asServiceRole.entities.Video.update(video.id, {
              brand_id: v2Brand.id,
            });
          } catch (err) {
            report.errors.push(`Failed to update video ${video.id}: ${err.message}`);
          }
        }
      } else {
        // No matching V2 brand found
        report.brand_resolution.unresolved_count++;
        report.errors.push(`Video "${video.title}" (id: ${video.id}) has brand_id "${v1BrandId}" but no matching V2 Brand.v1_id found`);
      }
    }

    // ── 2. Resolve Video.performers (V1 ID array) → VideoPerformer links ─────
    for (const video of videos) {
      // Check if video has performers array (V1 performer IDs)
      // Note: Field is called "performers" (array of V1 IDs), not "performer_ids"
      if (!video.performers || !Array.isArray(video.performers) || video.performers.length === 0) {
        report.performer_resolution.skipped_empty++;
        continue;
      }

      report.performer_resolution.videos_with_performer_ids++;

      for (const v1PerformerId of video.performers) {
        const v2Performer = performerByV1Id[v1PerformerId];
        
        if (!v2Performer) {
          report.errors.push(`Video "${video.title}": performer V1 ID "${v1PerformerId}" not found in V2`);
          continue;
        }

        const linkKey = `${video.id}:${v2Performer.id}`;
        
        // Check if link already exists
        if (existingLinks.has(linkKey)) {
          continue;
        }

        report.performer_resolution.total_links_to_create++;
        report.performer_resolution.links.push({
          video_id: video.id,
          video_title: video.title,
          performer_id: v2Performer.id,
          performer_name: v2Performer.display_name,
          v1_performer_id: v1PerformerId,
        });

        if (!dry_run) {
          try {
            await base44.asServiceRole.entities.VideoPerformer.create({
              video_id: video.id,
              performer_id: v2Performer.id,
              role: 'performer',
              order: 0,
              featured: false,
            });
            report.performer_resolution.created_count++;
            existingLinks.add(linkKey);
          } catch (err) {
            report.errors.push(`Failed to create VideoPerformer link for video ${video.id}, performer ${v2Performer.id}: ${err.message}`);
          }
        }
      }
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    report.summary = {
      brand_resolution: {
        total: report.brand_resolution.total_videos_with_brand_id,
        resolved: report.brand_resolution.resolved_count,
        unresolved: report.brand_resolution.unresolved_count,
        success_rate: report.brand_resolution.total_videos_with_brand_id > 0
          ? Math.round((report.brand_resolution.resolved_count / report.brand_resolution.total_videos_with_brand_id) * 100)
          : 0,
      },
      performer_resolution: {
        videos_with_performers: report.performer_resolution.videos_with_performer_ids,
        links_created: report.performer_resolution.created_count,
        links_to_create: report.performer_resolution.total_links_to_create,
      },
      total_errors: report.errors.length,
    };

    return Response.json(report);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});