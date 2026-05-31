/**
 * importBrandsFromV1
 * Admin-only. Idempotent via v1_id. Supports dry_run.
 * 
 * Input shape (per brand):
 * {
 *   id: string,              // V1 brand ID → stored in v1_id
 *   name: string,            // required
 *   slug: string,            // required
 *   description?: string,
 *   logo_url?: string|null,  // FLESHLAB Asia may be null — allowed
 *   banner_url?: string,     // maps to cover_image_url
 *   status?: string,         // "active"|"inactive"
 *   featured?: boolean,
 *   meta_title?: string,
 *   meta_description?: string,
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Auth check removed: this function is only called by pullV1MigrationData (admin-only) or directly by admins

    const body = await req.json();
    const { brands = [], dry_run = true } = body;

    if (!Array.isArray(brands) || brands.length === 0) {
      return Response.json({ error: 'brands array is required and must not be empty' }, { status: 400 });
    }

    const report = {
      dry_run,
      total: brands.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      warnings: [],
      records: [],
    };

    // Load existing brands for idempotency check (v1_id lookup)
    const existing = await base44.asServiceRole.entities.Brand.list();
    const byV1Id = {};
    for (const b of existing) {
      if (b.v1_id) byV1Id[b.v1_id] = b;
    }

    // Load all slugs for duplicate detection
    const usedSlugs = new Set(existing.map(b => b.slug));

    for (const raw of brands) {
      const errors = [];
      const warnings = [];

      // --- Required field validation ---
      if (!raw.id) errors.push('Missing required field: id (V1 brand ID)');
      if (!raw.name || !raw.name.trim()) errors.push('Missing required field: name');
      if (!raw.slug || !raw.slug.trim()) errors.push('Missing required field: slug');

      if (!raw.logo_url) warnings.push(`logo_url is null/empty for brand "${raw.name}" — allowed`);

      if (errors.length > 0) {
        report.errors.push({ v1_id: raw.id, name: raw.name, errors });
        report.skipped++;
        continue;
      }

      const v1_id = String(raw.id);
      const isExisting = !!byV1Id[v1_id];
      const slug = raw.slug.trim().toLowerCase();

      // Duplicate slug check (only for new records)
      if (!isExisting && usedSlugs.has(slug)) {
        report.errors.push({ v1_id, name: raw.name, errors: [`Duplicate slug: "${slug}"`] });
        report.skipped++;
        continue;
      }

      // Normalize status
      const VALID_STATUSES = ['active', 'inactive'];
      const status = VALID_STATUSES.includes(raw.status) ? raw.status : 'active';
      if (raw.status && !VALID_STATUSES.includes(raw.status)) {
        warnings.push(`Unknown status "${raw.status}" → normalized to "active"`);
      }

      const payload = {
        v1_id,
        name: raw.name.trim(),
        slug,
        description: raw.description || null,
        logo_url: raw.logo_url || null,
        cover_image_url: raw.banner_url || null,
        status,
        featured: raw.featured === true,
        meta_title: raw.meta_title || null,
        meta_description: raw.meta_description || null,
      };

      if (warnings.length) report.warnings.push({ v1_id, name: raw.name, warnings });

      const action = isExisting ? 'update' : 'create';

      if (!dry_run) {
        if (isExisting) {
          await base44.asServiceRole.entities.Brand.update(byV1Id[v1_id].id, payload);
          report.updated++;
        } else {
          await base44.asServiceRole.entities.Brand.create(payload);
          usedSlugs.add(slug);
          report.created++;
        }
      } else {
        if (isExisting) report.updated++;
        else { report.created++; usedSlugs.add(slug); }
      }

      report.records.push({ v1_id, name: raw.name, slug, action, dry_run });
    }

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});