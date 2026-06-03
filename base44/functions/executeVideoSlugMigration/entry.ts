/**
 * executeVideoSlugMigration — Admin-only slug migration execution
 * 
 * Updates slugs for the 8 approved videos:
 * - Sets new clean slug
 * - Preserves old slug in legacy_slugs array
 * - Verifies each update
 * 
 * Does NOT change: title, meta_title, meta_description, tags, categories, duration, status, etc.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Approved slug migration map (from dry-run)
const SLUG_MIGRATION_MAP = {
  '6a1c2c14bc5b86df1313cd55': 'emjey-filipino-twink-shower-solo-masturbation',
  '6a1c2c1419fe764298123096': 'josh-filipino-twink-shower-jerk-off-solo',
  '6a1c2c023cc22c764b0a796a': 'kraken-dildo-solo-masturbation-explicit',
  '6a1c2c024cda111cd98bbcbc': 'emjey-intense-solo-cumshot-masturbation',
  '6a1c2c0343407cfd7c116047': 'kraken-solo-dildo-masturbation-scene',
  '6a1c2c146802decd595758db': 'yero-filipino-twink-anal-solo-play',
  '6a1c2c055b8505acbf465c5b': 'julian-benvao-bareback-creampie-scene',
  '6a1c2c139285a8f36ac6b7af': 'dondaddy-black-twink-solo-jerk-off',
};

// Expected old slugs (from dry-run verification)
const EXPECTED_OLD_SLUGS = {
  '6a1c2c14bc5b86df1313cd55': 'wild-asian-twink-jacking-off-his-stiff-cock-gay-porn-funny-adult-memes-twink-videos',
  '6a1c2c1419fe764298123096': 'naked-asian-stud-jerks-off-post-shower-live-gay-cams-adult-entertainment-twink-websites-2',
  '6a1c2c023cc22c764b0a796a': 'asian-guy-masturbates-with-dildo-explicit-solo-exploration-porno-clips-compare-fleshlights-f',
  '6a1c2c024cda111cd98bbcbc': 'solo-asian-stud-masturbates-intense-pleasure-cum-shot-gay-porn-best-porn-sites-lube-for-fl',
  '6a1c2c0343407cfd7c116047': 'watch-this-asian-man-pleasure-himself-with-his-dildo-in-steamy-solo-action-x-rated-videos-buy-fl',
  '6a1c2c146802decd595758db': 'watch-him-strip-and-harden-for-you-adult-live-cams-top-adult-products-fleshlight-discount-code-2',
  '6a1c2c055b8505acbf465c5b': 'watch-this-hot-asian-guy-dominate-and-creampie-a-willing-bottom-live-gay-cams-adult-film-reviews',
  '6a1c2c139285a8f36ac6b7af': 'hot-asian-stud-jerks-off-after-shower-and-swallows-his-thick-load-live-gay-cams-twink-porn',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all published videos for collision detection
    const allVideos = await base44.asServiceRole.entities.Video.list();
    const currentSlugSet = new Set(allVideos.filter(v => v.status === 'published').map(v => v.slug));

    const migrationResults = [];
    const errors = [];

    for (const [videoId, newSlug] of Object.entries(SLUG_MIGRATION_MAP)) {
      const expectedOldSlug = EXPECTED_OLD_SLUGS[videoId];
      
      try {
        // Step 1: Read current record
        const video = await base44.asServiceRole.entities.Video.get(videoId);
        
        if (!video) {
          errors.push({ video_id: videoId, error: 'Video not found' });
          continue;
        }

        const currentSlug = video.slug;
        
        // Step 2: Confirm current slug matches expected old slug
        if (currentSlug !== expectedOldSlug) {
          errors.push({
            video_id: videoId,
            error: 'Current slug does not match expected old slug',
            expected: expectedOldSlug,
            actual: currentSlug
          });
          continue;
        }

        // Step 3: Confirm new slug is still unique (excluding current slug)
        if (currentSlugSet.has(newSlug) && newSlug !== currentSlug) {
          errors.push({
            video_id: videoId,
            error: 'New slug collision detected',
            conflicting_slug: newSlug
          });
          continue;
        }

        // Step 4 & 5: Update slug and add old slug to legacy_slugs
        const legacySlugs = video.legacy_slugs || [];
        if (!legacySlugs.includes(currentSlug)) {
          legacySlugs.push(currentSlug);
        }

        await base44.asServiceRole.entities.Video.update(videoId, {
          slug: newSlug,
          legacy_slugs: legacySlugs
        });

        // Step 6: Read back and verify
        const updatedVideo = await base44.asServiceRole.entities.Video.get(videoId);
        
        const verification = {
          slug_matches_new: updatedVideo.slug === newSlug,
          legacy_slugs_contains_old: updatedVideo.legacy_slugs?.includes(currentSlug) || false,
        };

        if (!verification.slug_matches_new) {
          errors.push({
            video_id: videoId,
            error: 'Post-update verification failed - slug mismatch',
            expected_slug: newSlug,
            actual_slug: updatedVideo.slug
          });
          continue;
        }

        if (!verification.legacy_slugs_contains_old) {
          errors.push({
            video_id: videoId,
            error: 'Post-update verification failed - legacy_slugs missing old slug',
            expected_legacy: currentSlug,
            actual_legacy_slugs: updatedVideo.legacy_slugs
          });
          continue;
        }

        // Update slug set for next iteration
        currentSlugSet.delete(currentSlug);
        currentSlugSet.add(newSlug);

        migrationResults.push({
          video_id: videoId,
          title: video.title,
          old_slug: currentSlug,
          new_slug: newSlug,
          legacy_slugs: updatedVideo.legacy_slugs,
          old_url: `/videos/${currentSlug}`,
          new_url: `/videos/${newSlug}`,
          verification_passed: true,
        });

      } catch (error) {
        errors.push({
          video_id: videoId,
          error: error.message
        });
      }
    }

    const summary = {
      total_videos: Object.keys(SLUG_MIGRATION_MAP).length,
      successful_migrations: migrationResults.length,
      failed_migrations: errors.length,
      migration_completed_at: new Date().toISOString(),
    };

    return Response.json({
      summary,
      migration_results: migrationResults,
      errors,
      next_steps: {
        step1: 'Run sitemapXml to regenerate sitemap with new slugs',
        step2: 'Test all 8 new URLs load correctly',
        step3: 'Test all 8 old URLs resolve to new canonical URLs',
        step4: 'Run seoVideoAudit to verify indexing readiness',
        step5: 'Generate Clean Batch 1 GSC candidate list',
      }
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});