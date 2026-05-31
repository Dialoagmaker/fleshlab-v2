/**
 * importPerformersFromV1
 * Admin-only. Idempotent via v1_id. Supports dry_run.
 *
 * Input shape (per performer):
 * {
 *   id: string,                  // V1 performer ID → stored in v1_id
 *   stage_name: string,          // required → maps to display_name
 *   slug?: string,               // auto-generated from stage_name if missing
 *   bio?: string,
 *   nationality?: string,
 *   profile_picture_url?: string,// primary; fallback to profile_images[0]
 *   profile_images?: string[],   // array; use [0] if no profile_picture_url
 *   preview_video_url?: string,  // no V2 target — flagged in warnings
 *   status?: string,             // active|inactive|pending
 *   featured?: boolean,
 *   verified?: boolean,
 *   date_of_birth?: string,      // compliance — preserve exactly
 *   fanclub_enabled?: boolean,
 *   brands?: string[],           // optional reference, may be empty (10 performers)
 *   meta_title?: string,
 *   meta_description?: string,
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { performers = [], dry_run = true } = body;

    if (!Array.isArray(performers) || performers.length === 0) {
      return Response.json({ error: 'performers array is required and must not be empty' }, { status: 400 });
    }

    const report = {
      dry_run,
      total: performers.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      warnings: [],
      records: [],
    };

    const existing = await base44.asServiceRole.entities.Performer.list();
    const byV1Id = {};
    for (const p of existing) {
      if (p.v1_id) byV1Id[p.v1_id] = p;
    }

    const usedSlugs = new Set(existing.map(p => p.slug));

    for (const raw of performers) {
      const errors = [];
      const warnings = [];

      if (!raw.id) errors.push('Missing required field: id (V1 performer ID)');
      if (!raw.stage_name || !raw.stage_name.trim()) errors.push('Missing required field: stage_name');

      if (errors.length > 0) {
        report.errors.push({ v1_id: raw.id, stage_name: raw.stage_name, errors });
        report.skipped++;
        continue;
      }

      const v1_id = String(raw.id);
      const isExisting = !!byV1Id[v1_id];
      const displayName = raw.stage_name.trim();

      // Slug: use provided or auto-generate from stage_name
      let slug = raw.slug ? raw.slug.trim().toLowerCase() : generateSlug(displayName);
      if (!raw.slug) {
        warnings.push(`slug missing → auto-generated: "${slug}"`);
      }

      // Dedup slug for new records only
      if (!isExisting && usedSlugs.has(slug)) {
        let counter = 2;
        while (usedSlugs.has(`${slug}-${counter}`)) counter++;
        const newSlug = `${slug}-${counter}`;
        warnings.push(`Slug "${slug}" already taken → renamed to "${newSlug}"`);
        slug = newSlug;
      }

      // Profile image: profile_picture_url → profile_images[0] → null
      let profileImageUrl = raw.profile_picture_url || null;
      if (!profileImageUrl && Array.isArray(raw.profile_images) && raw.profile_images.length > 0) {
        profileImageUrl = raw.profile_images[0];
        warnings.push(`profile_picture_url missing → using profile_images[0]`);
      }

      // preview_video_url has no V2 Performer field — flag it
      if (raw.preview_video_url) {
        warnings.push(`preview_video_url present but has no V2 Performer field — discarded`);
      }

      // Brands array is informational only (no Brand FK on Performer entity)
      if (!raw.brands || raw.brands.length === 0) {
        warnings.push(`No brands[] reference — allowed`);
      }

      // Normalize status
      const VALID_STATUSES = ['active', 'inactive', 'pending'];
      const status = VALID_STATUSES.includes(raw.status) ? raw.status : 'active';
      if (raw.status && !VALID_STATUSES.includes(raw.status)) {
        warnings.push(`Unknown status "${raw.status}" → normalized to "active"`);
      }

      const payload = {
        v1_id,
        display_name: displayName,
        slug,
        bio: raw.bio || null,
        nationality: raw.nationality || null,
        profile_image_url: profileImageUrl,
        cover_image_url: raw.cover_image_url || null,
        status,
        featured: raw.featured === true,
        verified: raw.verified === true,
        date_of_birth: raw.date_of_birth || null,
        fanclub_enabled: raw.fanclub_enabled === true,
        video_count: 0, // computed post-migration
        meta_title: raw.meta_title || null,
        meta_description: raw.meta_description || null,
      };

      if (warnings.length) report.warnings.push({ v1_id, stage_name: displayName, warnings });

      const action = isExisting ? 'update' : 'create';

      if (!dry_run) {
        if (isExisting) {
          await base44.asServiceRole.entities.Performer.update(byV1Id[v1_id].id, payload);
          report.updated++;
        } else {
          await base44.asServiceRole.entities.Performer.create(payload);
          usedSlugs.add(slug);
          report.created++;
        }
      } else {
        if (isExisting) report.updated++;
        else { report.created++; usedSlugs.add(slug); }
      }

      report.records.push({ v1_id, display_name: displayName, slug, action, dry_run });
    }

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});