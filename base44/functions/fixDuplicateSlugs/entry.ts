/**
 * fixDuplicateSlugs
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only. Finds and fixes duplicate slugs within each entity type.
 * Appends unique suffix (-2, -3, etc.) to duplicates.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ENTITY_TYPES = [
  { name: 'brands', entity: 'Brand' },
  { name: 'performers', entity: 'Performer' },
  { name: 'videos', entity: 'Video' },
  { name: 'news', entity: 'NewsArticle' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dry_run = body.dry_run !== false;

    const report = {
      dry_run,
      entities_processed: [],
      total_duplicates_found: 0,
      total_fixed: 0,
      errors: [],
    };

    for (const { name, entity: entityName } of ENTITY_TYPES) {
      const entities = await base44.asServiceRole.entities[entityName].list();
      
      // Group by slug
      const slugMap = {};
      entities.forEach(e => {
        if (e.slug) {
          slugMap[e.slug] = slugMap[e.slug] || [];
          slugMap[e.slug].push(e);
        }
      });

      // Find duplicates
      const duplicates = Object.entries(slugMap)
        .filter(([_, ents]) => ents.length > 1)
        .map(([slug, ents]) => ({ slug, entities: ents }));

      if (duplicates.length === 0) {
        report.entities_processed.push({
          entity: entityName,
          duplicates_found: 0,
          fixed: 0,
          status: 'OK',
        });
        continue;
      }

      const entityReport = {
        entity: entityName,
        duplicates_found: duplicates.length,
        fixes: [],
        errors: [],
      };

      for (const { slug, entities } of duplicates) {
        // Keep first record with original slug, rename rest
        const [original, ...toRename] = entities;
        
        for (let i = 0; i < toRename.length; i++) {
          const record = toRename[i];
          const suffix = i + 2; // -2, -3, etc.
          const newSlug = `${slug}-${suffix}`;
          
          entityReport.fixes.push({
            id: record.id,
            old_slug: slug,
            new_slug: newSlug,
          });

          if (!dry_run) {
            try {
              await base44.asServiceRole.entities[entityName].update(record.id, { slug: newSlug });
              report.total_fixed++;
            } catch (err) {
              entityReport.errors.push({
                id: record.id,
                error: err.message,
              });
              report.errors.push(`Failed to update ${entityName} ${record.id}: ${err.message}`);
            }
          }
        }
      }

      report.total_duplicates_found += duplicates.length;
      report.entities_processed.push({
        entity: entityName,
        duplicates_found: duplicates.length,
        fixed: dry_run ? 0 : entityReport.fixes.length,
        details: entityReport.fixes,
        status: entityReport.errors.length === 0 ? 'FIXED' : 'PARTIAL',
      });
    }

    report.success = report.errors.length === 0;
    return Response.json(report);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});