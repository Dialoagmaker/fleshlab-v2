/**
 * validateMigrationIntegrity
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only post-migration validation report.
 * Checks data integrity, asset readiness, and public page readiness.
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

    const report = {
      timestamp: new Date().toISOString(),
      counts: {},
      integrity_checks: {},
      asset_checks: {},
      readiness_checks: {},
      issues: {
        errors: [],
        warnings: [],
      },
      scores: {},
      recommendation: null,
    };

    // ── 1. Entity Counts ─────────────────────────────────────────────────────
    const [brands, performers, videos, newsArticles, videoAssets, videoPerformers] = await Promise.all([
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Performer.list(),
      base44.asServiceRole.entities.Video.list(),
      base44.asServiceRole.entities.NewsArticle.list(),
      base44.asServiceRole.entities.VideoAsset.list(),
      base44.asServiceRole.entities.VideoPerformer.list(),
    ]);

    report.counts = {
      brands: brands.length,
      performers: performers.length,
      videos: videos.length,
      news_articles: newsArticles.length,
      video_assets: videoAssets.length,
      video_performer_links: videoPerformers.length,
    };

    // Expected counts
    const expectedCounts = {
      brands: 4,
      performers: 19,
      videos: 112,
      news_articles: 21,
    };

    for (const [entity, expected] of Object.entries(expectedCounts)) {
      const actual = report.counts[entity];
      const match = actual === expected;
      report.integrity_checks[`${entity}_count`] = {
        expected,
        actual,
        match,
        status: match ? 'PASS' : 'FAIL',
      };
      if (!match) {
        report.issues.errors.push(`${entity}: expected ${expected}, got ${actual}`);
      }
    }

    // ── 2. Video Asset Checks (VideoAsset entity not created by migration) ───
    report.integrity_checks.video_asset_source_count = {
      note: 'VideoAsset entities not created by V1 migration (metadata-only import)',
      status: 'INFO',
    };

    // ── 3. Video.brand_id Resolution (V1 brand_id stored as string ID) ───────
    // Note: V1 brand_id is stored as v1_id string, not V2 ID - this is expected
    const videosWithBrandId = videos.filter(v => v.brand_id);
    report.integrity_checks.video_brand_id_present = {
      total: videos.length,
      with_brand_id: videosWithBrandId.length,
      percentage: videos.length > 0 ? Math.round((videosWithBrandId.length / videos.length) * 100) : 0,
      note: 'brand_id stored as V1 ID string (migration preserves original references)',
      status: 'INFO',
    };

    // ── 4. Videos Without Performers (VideoPerformer not created by migration) ─
    report.integrity_checks.video_performer_links = {
      note: 'VideoPerformer entities not created by V1 migration (performer data stored in video.performers array if available)',
      actual_links: videoPerformers.length,
      status: 'INFO',
    };

    // ── 5. Missing Asset URLs ────────────────────────────────────────────────
    const missingThumbnail = videos.filter(v => !v.primary_thumbnail_url || v.primary_thumbnail_url.trim() === '');
    const missingSource = videos.filter(v => !v.source_video_url || v.source_video_url.trim() === '');
    const missingTrailer = videos.filter(v => !v.trailer_url || v.trailer_url.trim() === '');

    report.asset_checks.missing_thumbnail_url = {
      count: missingThumbnail.length,
      percentage: videos.length > 0 ? Math.round((missingThumbnail.length / videos.length) * 100) : 0,
      status: missingThumbnail.length === 0 ? 'PASS' : 'WARN',
    };

    report.asset_checks.missing_source_video_url = {
      count: missingSource.length,
      percentage: videos.length > 0 ? Math.round((missingSource.length / videos.length) * 100) : 0,
      status: missingSource.length === 0 ? 'PASS' : 'WARN',
    };

    report.asset_checks.missing_trailer_url = {
      count: missingTrailer.length,
      percentage: videos.length > 0 ? Math.round((missingTrailer.length / videos.length) * 100) : 0,
      status: missingTrailer.length === 0 ? 'PASS' : 'INFO',
    };

    if (missingSource.length > 0) {
      report.issues.errors.push(`${missingSource.length} videos missing source_video_url (CRITICAL)`);
    }
    if (missingThumbnail.length > 0) {
      report.issues.warnings.push(`${missingThumbnail.length} videos missing primary_thumbnail_url`);
    }

    // ── 6. Duplicate Slug Detection (within same entity type only) ───────────
    const checkDuplicateSlugs = (entities, entityName) => {
      const slugMap = {};
      entities.forEach(e => {
        if (e.slug) {
          slugMap[e.slug] = slugMap[e.slug] || [];
          slugMap[e.slug].push(e.id);
        }
      });
      return Object.entries(slugMap)
        .filter(([_, ids]) => ids.length > 1)
        .map(([slug, ids]) => ({ entity: entityName, slug, ids }));
    };

    const duplicateBrandSlugs = checkDuplicateSlugs(brands, 'Brand');
    const duplicatePerformerSlugs = checkDuplicateSlugs(performers, 'Performer');
    const duplicateVideoSlugs = checkDuplicateSlugs(videos, 'Video');
    const duplicateNewsSlugs = checkDuplicateSlugs(newsArticles, 'NewsArticle');
    
    const allDuplicates = [
      ...duplicateBrandSlugs,
      ...duplicatePerformerSlugs,
      ...duplicateVideoSlugs,
      ...duplicateNewsSlugs,
    ];

    report.integrity_checks.duplicate_slugs = {
      total_count: allDuplicates.length,
      by_entity: {
        brands: duplicateBrandSlugs.length,
        performers: duplicatePerformerSlugs.length,
        videos: duplicateVideoSlugs.length,
        news: duplicateNewsSlugs.length,
      },
      duplicates: allDuplicates.slice(0, 20), // Limit to first 20 for readability
      status: allDuplicates.length === 0 ? 'PASS' : 'FAIL',
    };

    if (allDuplicates.length > 0) {
      report.issues.errors.push(`${allDuplicates.length} duplicate slugs detected (CRITICAL - must fix before launch)`);
    }

    // ── 7. Broken/Null Asset URLs ────────────────────────────────────────────
    const brokenUrls = {
      brands: brands.filter(b => b.logo_url === null || b.cover_image_url === null),
      performers: performers.filter(p => p.profile_image_url === null || p.cover_image_url === null),
      videos: videos.filter(v => 
        v.primary_thumbnail_url === null || 
        v.cover_image_url === null ||
        v.preview_gif_url === null
      ),
    };

    report.asset_checks.null_asset_urls = {
      brands_with_null_assets: brokenUrls.brands.length,
      performers_with_null_assets: brokenUrls.performers.length,
      videos_with_null_assets: brokenUrls.videos.length,
      status: brokenUrls.brands.length === 0 && brokenUrls.performers.length === 0 ? 'PASS' : 'INFO',
    };

    // ── 8. Status Distribution ───────────────────────────────────────────────
    const videoStatuses = {};
    videos.forEach(v => {
      videoStatuses[v.status] = (videoStatuses[v.status] || 0) + 1;
    });

    report.readiness_checks.video_status_distribution = {
      ...videoStatuses,
      published_count: videoStatuses['published'] || 0,
      draft_count: videoStatuses['draft'] || 0,
    };

    const performerStatuses = {};
    performers.forEach(p => {
      performerStatuses[p.status] = (performerStatuses[p.status] || 0) + 1;
    });

    report.readiness_checks.performer_status_distribution = performerStatuses;

    // ── 9. Calculate Scores ──────────────────────────────────────────────────
    // Data Integrity Score (0-100)
    const integrityChecks = Object.values(report.integrity_checks);
    const passedIntegrity = integrityChecks.filter(c => c.status === 'PASS').length;
    const totalIntegrity = integrityChecks.length;
    report.scores.data_integrity_score = Math.round((passedIntegrity / totalIntegrity) * 100);

    // Asset Readiness Score (0-100)
    const assetChecks = Object.values(report.asset_checks);
    const passedAssets = assetChecks.filter(c => c.status === 'PASS').length;
    const totalAssets = assetChecks.length;
    report.scores.asset_readiness_score = Math.round((passedAssets / totalAssets) * 100);

    // Public Page Readiness (0-100)
    const hasPublishedVideos = (videoStatuses['published'] || 0) > 0;
    const hasActivePerformers = (performerStatuses['active'] || 0) > 0;
    const hasActiveBrands = brands.filter(b => b.status === 'active').length > 0;
    const hasNews = newsArticles.filter(n => n.status === 'published').length > 0;
    
    let readinessScore = 0;
    if (hasPublishedVideos) readinessScore += 40;
    if (hasActivePerformers) readinessScore += 20;
    if (hasActiveBrands) readinessScore += 20;
    if (hasNews) readinessScore += 20;
    
    report.scores.public_page_readiness = readinessScore;

    // ── 10. GO / NO-GO Recommendation ────────────────────────────────────────
    const criticalIssues = report.issues.errors.filter(e => e.includes('CRITICAL') || e.includes('expected'));
    const hasCriticalFailures = report.integrity_checks.duplicate_slugs.status === 'FAIL' ||
                                 report.integrity_checks.brands_count?.status === 'FAIL' ||
                                 report.integrity_checks.performers_count?.status === 'FAIL' ||
                                 report.integrity_checks.videos_count?.status === 'FAIL' ||
                                 report.integrity_checks.news_articles_count?.status === 'FAIL';

    if (hasCriticalFailures) {
      report.recommendation = {
        status: 'NO-GO',
        reason: 'Critical data integrity issues detected',
        blockers: criticalIssues,
        action_required: 'Fix duplicate slugs and/or count mismatches before building public pages',
      };
    } else if (missingSource.length > videos.length * 0.5) {
      report.recommendation = {
        status: 'NO-GO',
        reason: 'More than 50% of videos missing source_video_url',
        blockers: [`${missingSource.length} videos missing source URLs`],
        action_required: 'Restore video source URLs before launch',
      };
    } else if (report.scores.data_integrity_score >= 80 && report.scores.asset_readiness_score >= 50) {
      report.recommendation = {
        status: 'GO',
        reason: 'Data integrity and asset readiness meet minimum thresholds',
        notes: [
          'Some warnings present but non-blocking for initial launch',
          'Address warnings in next iteration',
        ],
      };
    } else {
      report.recommendation = {
        status: 'CONDITIONAL GO',
        reason: 'Core data present but quality issues remain',
        warnings: report.issues.warnings,
        action_required: 'Review warnings and address critical asset gaps',
      };
    }

    return Response.json(report);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});