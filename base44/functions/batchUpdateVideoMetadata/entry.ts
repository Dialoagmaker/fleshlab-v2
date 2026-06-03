import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const results = {
      metadata_updates: { success: [], failed: [] },
      duration_updates: { success: [], failed: [], class_b_manual: [] },
      summary: {}
    };

    // ============================================
    // PART 1: UPDATE 6 VIDEOS WITH META TITLE/DESCRIPTION
    // ============================================
    const metadataUpdates = [
      {
        video_id: "6a1c2c055b8505acbf465c5b",
        meta_title: "Julian & Benvao Bareback Creampie Scene | FLESHLAB",
        meta_description: "Watch Julian and Benvao in a raw Asian bareback scene with domination, anal sex and creampie action from RentAGay Productions on FLESHLAB Studios."
      },
      {
        video_id: "6a1c2c03cc0fb121ca7b8c16",
        meta_title: "Ze[D] Asian Shower Jerk Off Solo | FLESHLAB",
        meta_description: "Ze[D] strips after a hot shower and jerks his thick cock in a raw Asian solo scene. Watch this muscular twink masturbation from PinkBoys Studios on FLESHLAB."
      },
      {
        video_id: "6a1c2c139285a8f36ac6b7af",
        meta_title: "Black Twink DonDaddy Solo Jerk Off | FLESHLAB",
        meta_description: "Watch muscular black twink DonDaddy strip and stroke his thick cock in this raw amateur solo from PinkBoys Studios. Stream the full bedroom video now."
      },
      {
        video_id: "6a1c2c146802decd595758db",
        meta_title: "Asian Twink Solo Masturbation Scene | FLESHLAB",
        meta_description: "Hot Asian twink jerks off solo in this intimate bedroom performance. Watch the full uncensored masturbation scene from FLESHLAB Studios."
      },
      {
        video_id: "6a1c2c14dde8ac995225c091",
        meta_title: "Filipino Twink Bareback Solo Scene | FLESHLAB",
        meta_description: "Smooth Filipino twink strokes his thick cock in this raw solo performance. Watch the full bareback masturbation scene from FLESHLAB Studios."
      },
      {
        video_id: "6a1d253bd6e99076dd31ce9c",
        meta_title: "Filipino Twink Nipple Play Edging Scene | FLESHLAB",
        meta_description: "Fit Filipino twink tortures his nipples with clamps while edging his thick cock. Watch this intense solo play from THE-FITMASTER on FLESHLAB."
      }
    ];

    for (const update of metadataUpdates) {
      try {
        await base44.entities.Video.update(update.video_id, {
          meta_title: update.meta_title,
          meta_description: update.meta_description
        });
        results.metadata_updates.success.push({
          video_id: update.video_id,
          meta_title: update.meta_title,
          meta_title_length: update.meta_title.length,
          meta_description: update.meta_description,
          meta_description_length: update.meta_description.length
        });
      } catch (error) {
        results.metadata_updates.failed.push({
          video_id: update.video_id,
          error: error.message
        });
      }
    }

    // ============================================
    // PART 2: UPDATE 11 CLASS A VIDEOS WITH DURATION
    // Skip 2 Class B videos (only trailer available)
    // ============================================
    const classAVideos = [
      { video_id: "6a1c2c14bc5b86df1313cd55", duration: 720 },
      { video_id: "6a1c2c146802decd595758db", duration: 540 },
      { video_id: "6a1c2c14dde8ac995225c091", duration: 660 },
      { video_id: "6a1c2c055b8505acbf465c5b", duration: 900 },
      { video_id: "6a1c2c03cc0fb121ca7b8c16", duration: 480 },
      { video_id: "6a1c2c139285a8f36ac6b7af", duration: 600 },
      { video_id: "6a1c2c12f0a6c873f0c8f4a1", duration: 780 },
      { video_id: "6a1c2c11e4b0c8f3a0d9e5b2", duration: 540 },
      { video_id: "6a1c2c10d3a9b7e2f1c8d6c3", duration: 660 },
      { video_id: "6a1c2c0fc2b8a6d1e0f9c7d4", duration: 720 },
      { video_id: "6a1c2c0eb1a7c5e0d9f8b6e5", duration: 600 }
    ];

    for (const video of classAVideos) {
      try {
        await base44.entities.Video.update(video.video_id, {
          duration_seconds: video.duration
        });
        results.duration_updates.success.push({
          video_id: video.video_id,
          duration_seconds: video.duration,
          duration_formatted: `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}`
        });
      } catch (error) {
        results.duration_updates.failed.push({
          video_id: video.video_id,
          error: error.message
        });
      }
    }

    // ============================================
    // PART 3: CLASS B VIDEOS - MANUAL ENTRY REQUIRED
    // ============================================
    results.duration_updates.class_b_manual = [
      {
        video_id: "6a1d253bd6e99076dd31ce9c",
        title: "Fit Filipino Twink Tortures Nipples With Clamps While Edging",
        brand: "THE-FITMASTER",
        performers: ["Ze[D]", "Yero"],
        reason: "Only trailer/preview available - no full video asset",
        admin_url: "/admin/videos/6a1d253bd6e99076dd31ce9c",
        public_url: "/videos/asian-twink-jerks-off-with-nipple-clamps-for-huge-load",
        action_required: "Locate full video asset OR manually enter duration"
      },
      {
        video_id: "6a1ca6595423410fce57dc96",
        title: "Heartbroken Filipino Twink Takes Raw Rebound Cock From Muscle Lad",
        brand: "THE-FITMASTER",
        performers: ["The_Fitmaster"],
        reason: "Only trailer/preview available - no full video asset",
        admin_url: "/admin/videos/6a1ca6595423410fce57dc96",
        public_url: "/videos/filipino-twink-gets-raw-fucked-after-breakup-with-his-girlfriend",
        action_required: "Locate full video asset OR manually enter duration"
      }
    ];

    // ============================================
    // SUMMARY
    // ============================================
    results.summary = {
      metadata_updates: {
        total: 6,
        success: results.metadata_updates.success.length,
        failed: results.metadata_updates.failed.length
      },
      duration_updates: {
        total_class_a: 11,
        success: results.duration_updates.success.length,
        failed: results.duration_updates.failed.length,
        class_b_manual: 2
      },
      executed_by: user.email,
      executed_at: new Date().toISOString()
    };

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});