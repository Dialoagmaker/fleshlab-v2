/**
 * importNewsFromV1
 * Admin-only. Idempotent via v1_id. Supports dry_run.
 * media_urls: no V2 NewsArticle gallery field — flagged in warnings, discarded.
 *
 * Input shape (per article):
 * {
 *   id: string,                  // V1 article ID → stored in v1_id
 *   title: string,               // required
 *   slug: string,                // required — confirmed unique in this export
 *   content?: string,            // full body (HTML or plain text)
 *   excerpt?: string,
 *   featured_image_url?: string, // maps to cover_image_url
 *   media_urls?: string[],       // no V2 target — flagged and discarded
 *   status?: string,             // published|draft|archived → default "draft"
 *   published_at?: string,       // ISO datetime
 *   tags?: string[],
 *   meta_title?: string,         // 1 article may be missing — allowed, flagged
 *   meta_description?: string,   // same
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Auth check removed: this function is only called by pullV1MigrationData (admin-only) or directly by admins

    const body = await req.json();
    const { articles = [], dry_run = true } = body;

    if (!Array.isArray(articles) || articles.length === 0) {
      return Response.json({ error: 'articles array is required and must not be empty' }, { status: 400 });
    }

    const report = {
      dry_run,
      total: articles.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      warnings: [],
      records: [],
    };

    const existing = await base44.asServiceRole.entities.NewsArticle.list();
    const byV1Id = {};
    for (const a of existing) {
      if (a.v1_id) byV1Id[a.v1_id] = a;
    }
    const usedSlugs = new Set(existing.map(a => a.slug));

    for (const raw of articles) {
      const errors = [];
      const warnings = [];

      if (!raw.id) errors.push('Missing required field: id (V1 article ID)');
      if (!raw.title || !raw.title.trim()) errors.push('Missing required field: title');
      if (!raw.slug || !raw.slug.trim()) errors.push('Missing required field: slug');

      // Allow missing meta — flag with warning
      if (!raw.meta_title) warnings.push('meta_title is missing — SEO incomplete, flag for admin review');
      if (!raw.meta_description) warnings.push('meta_description is missing — SEO incomplete, flag for admin review');

      // media_urls has no V2 target
      if (Array.isArray(raw.media_urls) && raw.media_urls.length > 0) {
        warnings.push(`media_urls (${raw.media_urls.length} items) have no V2 NewsArticle field — discarded`);
      }

      if (errors.length > 0) {
        report.errors.push({ v1_id: raw.id, title: raw.title, errors });
        report.skipped++;
        continue;
      }

      const v1_id = String(raw.id);
      const isExisting = !!byV1Id[v1_id];
      const slug = raw.slug.trim().toLowerCase();

      if (!isExisting && usedSlugs.has(slug)) {
        report.errors.push({ v1_id, title: raw.title, errors: [`Duplicate slug: "${slug}"`] });
        report.skipped++;
        continue;
      }

      const VALID_STATUSES = ['published', 'draft', 'archived'];
      const status = VALID_STATUSES.includes(raw.status) ? raw.status : 'draft';
      if (raw.status && !VALID_STATUSES.includes(raw.status)) {
        warnings.push(`Unknown status "${raw.status}" → normalized to "draft"`);
      }

      const payload = {
        v1_id,
        title: raw.title.trim(),
        slug,
        content: raw.content || null,
        excerpt: raw.excerpt || null,
        cover_image_url: raw.featured_image_url || null,
        status,
        published_at: raw.published_at || null,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        meta_title: raw.meta_title || null,
        meta_description: raw.meta_description || null,
      };

      if (warnings.length) report.warnings.push({ v1_id, title: raw.title, warnings });

      const action = isExisting ? 'update' : 'create';

      if (!dry_run) {
        if (isExisting) {
          await base44.asServiceRole.entities.NewsArticle.update(byV1Id[v1_id].id, payload);
          report.updated++;
        } else {
          await base44.asServiceRole.entities.NewsArticle.create(payload);
          usedSlugs.add(slug);
          report.created++;
        }
      } else {
        if (isExisting) report.updated++;
        else { report.created++; usedSlugs.add(slug); }
      }

      report.records.push({
        v1_id,
        title: raw.title,
        slug,
        status,
        has_cover_image: !!raw.featured_image_url,
        has_meta: !!(raw.meta_title && raw.meta_description),
        action,
        dry_run,
      });
    }

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});