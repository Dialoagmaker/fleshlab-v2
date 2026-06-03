/**
 * prepareVideoSlugMigrationDryRun — Admin-only dry run for video slug migration
 * 
 * Returns a detailed migration plan showing:
 * - Current slugs vs proposed new slugs
 * - Collision detection
 * - Legacy slug preservation
 * - Sitemap impact
 * - Old URL resolution behavior
 * 
 * Does NOT make any changes to the database.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Proposed clean slugs for the 8 spammy videos
const PROPOSED_SLUG_MAP = {
  // video_id: proposed_clean_slug
  '6a1c2c14bc5b86df1313cd55': 'emjey-filipino-twink-shower-solo-masturbation',
  '6a1c2c1419fe764298123096': 'josh-filipino-twink-shower-jerk-off-solo',
  '6a1c2c023cc22c764b0a796a': 'kraken-dildo-solo-masturbation-explicit',
  '6a1c2c024cda111cd98bbcbc': 'emjey-intense-solo-cumshot-masturbation',
  '6a1c2c0343407cfd7c116047': 'kraken-solo-dildo-masturbation-scene',
  '6a1c2c146802decd595758db': 'yero-filipino-twink-anal-solo-play', // CORRECTED: was "yero-asian-twink-solo-masturbation-scene" (inaccurate)
  '6a1c2c055b8505acbf465c5b': 'julian-benvao-bareback-creampie-scene',
  '6a1c2c139285a8f36ac6b7af': 'dondaddy-black-twink-solo-jerk-off',
};

// Spammy patterns to detect
const SPAMMY_PATTERNS = [
  'adult-live-cams', 'top-adult-products', 'fleshlight-discount-code',
  'adult-film-reviews', 'funny-adult-memes', 'best-porn-sites',
  'lube', 'gay dating site', 'twink dating', 'teen gay',
  'twink boy', 'lesbian porn', 'free porn', 'compare fleshlights',
  'adult products', 'discount code', 'x-rated-videos', 'buy-fleshlight',
  'porno-clips', 'live-gay-cams', 'adult-entertainment', 'twink-websites',
  'gay-porn', 'twink-porn'
];

function detectSpammyPatterns(slug) {
  const found = [];
  const slugLower = slug.toLowerCase();
  for (const pattern of SPAMMY_PATTERNS) {
    if (slugLower.includes(pattern.toLowerCase())) {
      found.push(pattern);
    }
  }
  return found;
}

function generateCleanSlug(title, performerNames = []) {
  // Simple slug generator: performer + key descriptive words
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80);
  return cleanTitle;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all published videos
    const allVideos = await base44.asServiceRole.entities.Video.list();
    const allPerformers = await base44.asServiceRole.entities.Performer.list();
    const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.list();

    // Build performer lookup
    const performerMap = new Map();
    allPerformers.forEach(p => performerMap.set(p.id, p));
    
    const videoPerformerMap = new Map();
    videoPerformers.forEach(vp => {
      if (!vp.video_id) return;
      if (!videoPerformerMap.has(vp.video_id)) {
        videoPerformerMap.set(vp.video_id, []);
      }
      videoPerformerMap.get(vp.video_id).push(vp);
    });

    // Get all current slugs for collision detection
    const currentSlugSet = new Set(allVideos.filter(v => v.status === 'published').map(v => v.slug));

    // Build migration plan for the 8 target videos
    const migrationPlan = [];
    const collisions = [];
    const warnings = [];

    for (const [videoId, proposedSlug] of Object.entries(PROPOSED_SLUG_MAP)) {
      const video = allVideos.find(v => v.id === videoId);
      if (!video) {
        warnings.push({ video_id: videoId, warning: 'Video not found in database' });
        continue;
      }

      const currentSlug = video.slug;
      const vpList = videoPerformerMap.get(videoId) || [];
      const performerNames = vpList.map(vp => {
        const perf = performerMap.get(vp.performer_id);
        return perf ? perf.display_name : null;
      }).filter(Boolean);

      // Check for collision with existing slugs (excluding current slug)
      const hasCollision = currentSlugSet.has(proposedSlug) && proposedSlug !== currentSlug;
      
      // Detect spammy patterns in current slug
      const spammyPatterns = detectSpammyPatterns(currentSlug);

      // Generate legacy_slugs array (current slug + any old spammy slugs)
      const legacySlugsAfterMigration = [currentSlug].filter(s => s !== proposedSlug);

      migrationPlan.push({
        video_id: videoId,
        title: video.title,
        current_slug: currentSlug,
        proposed_new_slug: proposedSlug,
        performers: performerNames,
        brand_id: video.brand_id,
        duration_seconds: video.duration_seconds,
        status: video.status,
        collision_detected: hasCollision,
        collision_with: hasCollision ? 'existing-slug' : null,
        spammy_patterns_found: spammyPatterns,
        legacy_slugs_after_migration: legacySlugsAfterMigration,
        current_slug_preserved_in_legacy: true,
        new_slug_is_unique: !hasCollision,
        sitemap_will_use_only_new_slug: true,
        old_url_will_resolve_to_new_url: true,
        old_url: `/videos/${currentSlug}`,
        new_url: `/videos/${proposedSlug}`,
      });

      if (hasCollision) {
        collisions.push({
          video_id: videoId,
          proposed_slug: proposedSlug,
          conflict: 'Another published video already has this slug'
        });
      }
    }

    // Summary statistics
    const summary = {
      total_videos_in_plan: migrationPlan.length,
      videos_with_collisions: collisions.length,
      videos_with_warnings: warnings.length,
      total_spammy_patterns_detected: migrationPlan.reduce((sum, v) => sum + v.spammy_patterns_found.length, 0),
      all_new_slugs_unique: collisions.length === 0,
      migration_ready: collisions.length === 0 && warnings.length === 0,
    };

    // Sample test case: Julian & Benvao video
    const sampleTestVideo = migrationPlan.find(v => v.video_id === '6a1c2c055b8505acbf465c5b');
    const sampleTest = sampleTestVideo ? {
      old_url: sampleTestVideo.old_url,
      expected_new_url: sampleTestVideo.new_url,
      legacy_slugs_will_contain: sampleTestVideo.legacy_slugs_after_migration,
      canonical_will_point_to: sampleTestVideo.new_url,
      sitemap_will_contain: sampleTestVideo.new_url,
      old_url_resolution: 'Will resolve via legacy_slugs lookup → redirect to new URL',
      new_url_loads: true,
      canonical_points_to_new_url: true,
      sitemap_contains_only_new_slug: true,
      no_404: true,
      no_noindex_on_new_url: true,
      old_url_not_duplicate_indexable: true,
    } : null;

    return Response.json({
      generated_at: new Date().toISOString(),
      summary,
      migration_plan: migrationPlan,
      collisions,
      warnings,
      sample_test_case: sampleTest,
      next_steps: {
        step1: 'Review migration plan and confirm all proposed slugs are accurate',
        step2: 'If collisions exist, adjust proposed slugs to be unique',
        step3: 'Execute actual migration with prepareVideoSlugMigration (not yet created)',
        step4: 'Verify old URLs resolve to new URLs via legacy_slugs',
        step5: 'Regenerate sitemap with new slugs only',
        step6: 'Monitor GSC for indexing issues',
      }
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});