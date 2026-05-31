/**
 * pullV1MigrationData
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only V2 migration orchestrator.
 * Pulls export data from V1 export functions via API, then pipes each dataset
 * into the corresponding V2 import function.
 *
 * Import order: Brands → Performers → Videos → News
 *
 * Defaults to dry_run. Real import requires explicit confirmation:
 * { "execute": true, "dry_run": false, "confirm": "IMPORT_V1_TO_V2" }
 *
 * Environment variables required (set via secrets):
 *   V1_API_BASE_URL   — V1 app base URL, no trailing slash
 *   V1_AUTH_TOKEN     — V1 admin API token
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STAGES = [
  {
    name:         'brands',
    v1Function:   'exportBrandsForV2',
    v2Function:   'importBrandsFromV1',
    payloadKey:   'brands',
  },
  {
    name:         'performers',
    v1Function:   'exportPerformersForV2',
    v2Function:   'importPerformersFromV1',
    payloadKey:   'performers',
  },
  {
    name:         'videos',
    v1Function:   'exportVideosForV2',
    v2Function:   'importVideosFromV1',
    payloadKey:   'videos',
  },
  {
    name:         'news',
    v1Function:   'exportNewsForV2',
    v2Function:   'importNewsFromV1',
    payloadKey:   'articles',
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // ── Config ────────────────────────────────────────────────────────────────
    const V1_BASE = Deno.env.get('V1_API_BASE_URL');
    const V1_TOKEN = Deno.env.get('V1_AUTH_TOKEN');

    if (!V1_BASE || !V1_TOKEN) {
      return Response.json({
        error: 'Missing required secrets: V1_API_BASE_URL and/or V1_AUTH_TOKEN. Set them via the dashboard.',
      }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const dry_run = body.dry_run !== false;        // default true
    const execute = body.execute === true;          // default false
    const confirm = body.confirm;

    // ── Real import guard ─────────────────────────────────────────────────────
    if (!dry_run && execute && confirm !== 'IMPORT_V1_TO_V2') {
      return Response.json({
        error: 'Real import requires: { "execute": true, "dry_run": false, "confirm": "IMPORT_V1_TO_V2" }',
      }, { status: 400 });
    }

    // Safety: if execute not set but dry_run=false somehow, force dry_run back on
    const effectiveDryRun = !(execute && !dry_run && confirm === 'IMPORT_V1_TO_V2');

    const report = {
      mode: effectiveDryRun ? 'DRY RUN' : '⚠️  LIVE IMPORT',
      dry_run: effectiveDryRun,
      stages: {},
      aborted_at: null,
      success: false,
    };

    // ── Stage runner ──────────────────────────────────────────────────────────
    for (const stage of STAGES) {
      const stageReport = {
        v1_function: stage.v1Function,
        v2_function: stage.v2Function,
        exported_count: 0,
        v1_reachable: false,
        imported_created: 0,
        imported_updated: 0,
        imported_skipped: 0,
        errors: [],
        warnings: [],
      };

      // ── 1. Pull from V1 ───────────────────────────────────────────────────
      let v1Data = null;
      try {
        const v1Url = `${V1_BASE}/api/functions/${stage.v1Function}`;
        const v1Res = await fetch(v1Url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_key': V1_TOKEN,           // never logged
          },
          body: JSON.stringify({}),
        });

        if (!v1Res.ok) {
          const errText = await v1Res.text();
          stageReport.errors.push(`V1 ${stage.v1Function} returned HTTP ${v1Res.status}`);
          stageReport.errors.push(`V1 response: ${errText.substring(0, 200)}`);
          report.stages[stage.name] = stageReport;
          report.aborted_at = stage.name;
          return Response.json(report, { status: 200 });
        }

        const v1Json = await v1Res.json();

        // V1 export functions may return: raw array [...] OR { data: [...] } OR { data: { data: [...] } }
        if (Array.isArray(v1Json)) {
          v1Data = v1Json;
        } else {
          v1Data = v1Json?.data?.data ?? v1Json?.data ?? null;
        }

        if (!Array.isArray(v1Data)) {
          stageReport.errors.push(`V1 ${stage.v1Function} did not return an array. Got: ${JSON.stringify(v1Json).substring(0, 200)}`);
          report.stages[stage.name] = stageReport;
          report.aborted_at = stage.name;
          return Response.json(report, { status: 200 });
        }

        stageReport.v1_reachable = true;
        stageReport.exported_count = v1Data.length;

      } catch (fetchErr) {
        stageReport.errors.push(`Network error calling V1 ${stage.v1Function}: ${fetchErr.message}`);
        report.stages[stage.name] = stageReport;
        report.aborted_at = stage.name;
        return Response.json(report, { status: 200 });
      }

      // ── 2. Import directly into V2 entities ───────────────────────────────
      try {
        // Load existing records for idempotency
        const entityMap = {
          brands: 'Brand',
          performers: 'Performer',
          videos: 'Video',
          news: 'NewsArticle',
        };
        const entityName = entityMap[stage.name];
        const v1IdField = 'v1_id';
        
        const existing = await base44.asServiceRole.entities[entityName].list();
        const byV1Id = {};
        for (const rec of existing) {
          if (rec[v1IdField]) byV1Id[rec[v1IdField]] = rec;
        }
        const usedSlugs = new Set(existing.map(r => r.slug));

        for (const raw of v1Data) {
          const errors = [];
          const warnings = [];

          // Validation
          if (!raw.id) errors.push('Missing id');
          if (!raw.name && !raw.title && !raw.display_name) errors.push('Missing name/title');
          if (!raw.slug) errors.push('Missing slug');

          if (errors.length > 0) {
            stageReport.errors.push(`[${raw.id || '?'}] ${raw.name || raw.title || '?'}: ${errors.join('; ')}`);
            stageReport.imported_skipped++;
            continue;
          }

          const v1_id = String(raw.id);
          const isExisting = !!byV1Id[v1_id];
          const slug = (raw.slug || '').trim().toLowerCase();

          if (!isExisting && usedSlugs.has(slug)) {
            stageReport.errors.push(`[${v1_id}] ${raw.name || raw.title || '?'}: Duplicate slug "${slug}"`);
            stageReport.imported_skipped++;
            continue;
          }

          // Build payload based on entity type
          let payload = { v1_id, slug };
          
          if (stage.name === 'brands') {
            payload = {
              ...payload,
              name: (raw.name || '').trim(),
              description: raw.description || null,
              logo_url: raw.logo_url || null,
              cover_image_url: raw.banner_url || raw.cover_image_url || null,
              status: ['active', 'inactive'].includes(raw.status) ? raw.status : 'active',
              featured: raw.featured === true,
              meta_title: raw.meta_title || null,
              meta_description: raw.meta_description || null,
            };
          } else if (stage.name === 'performers') {
            payload = {
              ...payload,
              display_name: (raw.display_name || '').trim(),
              bio: raw.bio || null,
              nationality: raw.nationality || null,
              profile_image_url: raw.profile_image_url || null,
              cover_image_url: raw.cover_image_url || null,
              status: ['active', 'inactive', 'pending'].includes(raw.status) ? raw.status : 'active',
              featured: raw.featured === true,
              video_count: raw.video_count || 0,
              fanclub_enabled: raw.fanclub_enabled === true,
              verified: raw.verified === true,
              date_of_birth: raw.date_of_birth || null,
              meta_title: raw.meta_title || null,
              meta_description: raw.meta_description || null,
            };
          } else if (stage.name === 'videos') {
            payload = {
              ...payload,
              title: (raw.title || '').trim(),
              description: raw.description || null,
              short_summary: raw.short_summary || null,
              brand_id: raw.brand_id || null,
              categories: raw.categories || [],
              tags: raw.tags || [],
              status: ['draft', 'published', 'unlisted', 'archived'].includes(raw.status) ? raw.status : 'draft',
              access_tier: ['free', 'fanclub', 'ppv'].includes(raw.access_tier) ? raw.access_tier : 'free',
              release_date: raw.release_date || null,
              duration_seconds: raw.duration_seconds || 0,
              source_video_url: raw.source_video_url || null,
              primary_thumbnail_url: raw.primary_thumbnail_url || null,
              cover_image_url: raw.cover_image_url || null,
              trailer_url: raw.trailer_url || null,
              preview_gif_url: raw.preview_gif_url || null,
              meta_title: raw.meta_title || null,
              meta_description: raw.meta_description || null,
              view_count: raw.view_count || 0,
              featured: raw.featured === true,
              is_exclusive: raw.is_exclusive === true,
              ppv_enabled: raw.ppv_enabled === true,
              download_price: raw.download_price || null,
              production_cost: raw.production_cost || null,
            };
          } else if (stage.name === 'news') {
            payload = {
              ...payload,
              title: (raw.title || '').trim(),
              content: raw.content || null,
              excerpt: raw.excerpt || null,
              cover_image_url: raw.cover_image_url || null,
              status: ['draft', 'published', 'archived'].includes(raw.status) ? raw.status : 'draft',
              published_at: raw.published_at || null,
              meta_title: raw.meta_title || null,
              meta_description: raw.meta_description || null,
              tags: raw.tags || [],
            };
          }

          if (warnings.length) {
            stageReport.warnings.push(`[${v1_id}] ${raw.name || raw.title || '?'}: ${warnings.join('; ')}`);
          }

          if (!effectiveDryRun) {
            if (isExisting) {
              await base44.asServiceRole.entities[entityName].update(byV1Id[v1_id].id, payload);
              stageReport.imported_updated++;
            } else {
              await base44.asServiceRole.entities[entityName].create(payload);
              usedSlugs.add(slug);
              stageReport.imported_created++;
            }
          } else {
            if (isExisting) stageReport.imported_updated++;
            else { stageReport.imported_created++; usedSlugs.add(slug); }
          }
        }

      } catch (importErr) {
        stageReport.errors.push(`Import error for ${stage.name}: ${importErr.message}`);
        report.stages[stage.name] = stageReport;
        report.aborted_at = stage.name;
        return Response.json(report, { status: 200 });
      }

      report.stages[stage.name] = stageReport;
    }

    report.success = true;
    return Response.json(report);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});