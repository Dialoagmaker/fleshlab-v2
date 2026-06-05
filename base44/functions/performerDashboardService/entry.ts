import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action, performer_id, performer_token } = body;

    // Validate performer session token
    if (!performer_id || !performer_token) {
      return Response.json({ error: 'Unauthorized - performer session required' }, { status: 401 });
    }

    // Verify the session token is valid (owned by this performer)
    const sessions = await base44.asServiceRole.entities.PerformerSession.filter({
      performer_id,
      token: performer_token,
      revoked: false
    });

    if (!sessions || sessions.length === 0) {
      return Response.json({ error: 'Invalid or expired performer session' }, { status: 401 });
    }

    const session = sessions[0];
    if (new Date(session.expires_at) < new Date()) {
      return Response.json({ error: 'Performer session expired' }, { status: 401 });
    }

    // Get performer by ID
    const myPerformer = await base44.asServiceRole.entities.Performer.get(performer_id);

    if (!myPerformer) {
      return Response.json({ 
        error: 'Performer profile not found'
      }, { status: 403 });
    }

    // Action: get_dashboard_summary
    if (action === 'get_dashboard_summary') {
      // Get current period (YYYY-MM)
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Fetch earnings for current period from both sources
      const [legacyEarnings, lineItems] = await Promise.all([
        base44.asServiceRole.entities.PerformerEarning.filter({
          performer_id: myPerformer.id,
          period_month: currentMonth
        }),
        base44.asServiceRole.entities.PerformerEarningLineItem.filter({
          performer_id: myPerformer.id,
          period_month: currentMonth
        })
      ]);

      // Calculate summary from both sources
      const summary = {
        gross_total: 0,
        net_total: 0,
        pending_total: 0,
        paid_total: 0,
        held_total: 0,
        approved_total: 0
      };

      // Legacy earnings
      (legacyEarnings || []).forEach(e => {
        summary.gross_total += e.gross_amount_usd || 0;
        summary.net_total += e.net_amount_usd || 0;
        if (e.status === 'pending') summary.pending_total += e.net_amount_usd || 0;
        else if (e.status === 'paid') summary.paid_total += e.net_amount_usd || 0;
        else if (e.status === 'held') summary.held_total += e.net_amount_usd || 0;
        else if (e.status === 'approved') summary.approved_total += e.net_amount_usd || 0;
      });

      // Line items
      (lineItems || []).forEach(item => {
        summary.gross_total += item.gross_amount_usd || 0;
        summary.net_total += item.performer_amount_usd || 0;
        if (item.status === 'pending') summary.pending_total += item.performer_amount_usd || 0;
        else if (item.status === 'paid') summary.paid_total += item.performer_amount_usd || 0;
        else if (item.status === 'held') summary.held_total += item.performer_amount_usd || 0;
        else if (item.status === 'approved') summary.approved_total += item.performer_amount_usd || 0;
      });

      // Get latest videos (up to 5)
      const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
        performer_id: myPerformer.id
      });
      const videoIds = videoPerformers.slice(0, 5).map(vp => vp.video_id);
      // Parallel fetch — no batch query available, so Promise.all avoids serial awaits
      const latestVideoResults = await Promise.all(
        videoIds.map(vid => base44.asServiceRole.entities.Video.get(vid).catch(() => null))
      );
      const latestVideos = latestVideoResults
        .filter(video => video !== null)
        .map(video => ({
          id: video.id,
          title: video.title,
          status: video.status,
          published_at: video.published_at,
          view_count: video.view_count || 0,
          access_tier: video.access_tier
        }));

      // Get compliance records
      const complianceRecords = await base44.asServiceRole.entities.ComplianceRecord.filter({
        performer_id: myPerformer.id
      });
      const latestMedical = complianceRecords
        .filter(r => r.document_type === 'medical_test' || r.document_type === 'std_test')
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

      // Get contracts
      const contracts = await base44.asServiceRole.entities.Contract.filter({
        performer_id: myPerformer.id
      });
      const latestContract = contracts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

      // Determine payout readiness
      let payoutStatus = 'Eligible';
      let payoutReason = null;
      if (myPerformer.kyc_status !== 'approved') {
        payoutStatus = 'Missing KYC';
        payoutReason = 'KYC verification pending or rejected';
      } else if (myPerformer.compliance_locked) {
        payoutStatus = 'Compliance Locked';
        payoutReason = 'Account compliance lock active';
      } else if (myPerformer.account_status !== 'active') {
        payoutStatus = 'Account Not Active';
        payoutReason = `Account status: ${myPerformer.account_status}`;
      } else if (myPerformer.outstanding_balance_usd > 0) {
        payoutStatus = 'Outstanding Balance';
        payoutReason = `Outstanding balance: $${myPerformer.outstanding_balance_usd}`;
      }

      // Studio advance eligibility
      const advanceEligible = 
        myPerformer.account_status === 'active' &&
        myPerformer.kyc_status === 'approved' &&
        !myPerformer.compliance_locked &&
        myPerformer.outstanding_balance_usd === 0 &&
        summary.net_total > 0;

      // Action required items
      const actionRequired = [];
      if (myPerformer.kyc_status !== 'approved') {
        actionRequired.push({ type: 'kyc', message: 'KYC verification required', priority: 'high' });
      }
      if (!latestContract) {
        actionRequired.push({ type: 'contract', message: 'No signed contract on file', priority: 'high' });
      }
      if (latestMedical && latestMedical.expires_at) {
        const daysUntilExpiry = Math.ceil((new Date(latestMedical.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) {
          actionRequired.push({ type: 'medical', message: 'Medical/STI test expired', priority: 'critical' });
        } else if (daysUntilExpiry < 30) {
          actionRequired.push({ type: 'medical', message: `Medical/STI test expires in ${daysUntilExpiry} days`, priority: 'medium' });
        }
      }
      if (myPerformer.outstanding_balance_usd > 0) {
        actionRequired.push({ type: 'balance', message: `Outstanding balance: $${myPerformer.outstanding_balance_usd}`, priority: 'high' });
      }
      if (myPerformer.compliance_locked) {
        actionRequired.push({ type: 'compliance', message: 'Account compliance locked', priority: 'critical' });
      }
      if (summary.net_total === 0 && summary.gross_total === 0) {
        actionRequired.push({ type: 'earnings', message: 'No earnings recorded this month', priority: 'low' });
      }

      // Determine revenue share (default 40% for managed performers)
      const revenueSharePct = myPerformer.revenue_split_pct || 40;
      const studioSharePct = 100 - revenueSharePct;
      const revenueModel = revenueSharePct === 70 ? 'Established/Network' : 'Managed Performer';

      // Sanitize performer data (remove admin-only fields)
      const safePerformer = {
        id: myPerformer.id,
        display_name: myPerformer.display_name,
        slug: myPerformer.slug,
        profile_image_url: myPerformer.profile_image_url,
        cover_image_url: myPerformer.cover_image_url,
        status: myPerformer.status,
        account_status: myPerformer.account_status,
        kyc_status: myPerformer.kyc_status,
        compliance_locked: myPerformer.compliance_locked,
        outstanding_balance_usd: myPerformer.outstanding_balance_usd,
        verified: myPerformer.verified,
        fanclub_enabled: myPerformer.fanclub_enabled,
        revenue_share_pct: revenueSharePct,
        studio_share_pct: studioSharePct,
        revenue_model: revenueModel
      };

      return Response.json({
        success: true,
        performer: safePerformer,
        current_period: currentMonth,
        earnings_summary: summary,
        payout_readiness: {
          status: payoutStatus,
          reason: payoutReason
        },
        studio_advance: {
          eligible: advanceEligible,
          max_amount: 500,
          reason: advanceEligible ? null : 'Not eligible - review eligibility criteria'
        },
        action_required: actionRequired,
        latest_videos: latestVideos,
        compliance: {
          latest_medical: latestMedical ? {
            type: latestMedical.document_type,
            status: latestMedical.status,
            expires_at: latestMedical.expires_at
          } : null,
          latest_contract: latestContract ? {
            title: latestContract.contract_type,
            status: latestContract.status,
            signed_at: latestContract.signed_at
          } : null
        },
        revenue_share: {
          performer_pct: revenueSharePct,
          studio_pct: studioSharePct,
          model: revenueModel
        }
      });
    }

    // Action: get_earnings
    if (action === 'get_earnings') {
      const { period_month } = body;
      if (!period_month) {
        return Response.json({ error: 'period_month required' }, { status: 400 });
      }

      // Get VideoPerformer links to find videos this performer is in
      const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
        performer_id: myPerformer.id
      });

      // Get all performance data in parallel
      const [legacyEarnings, lineItems, videoStatSnapshots] = await Promise.all([
        base44.asServiceRole.entities.PerformerEarning.filter({
          performer_id: myPerformer.id,
          period_month
        }),
        base44.asServiceRole.entities.PerformerEarningLineItem.filter({
          performer_id: myPerformer.id,
          period_month
        }),
        // Get video stats for all videos this performer is in
        Promise.all(
          (videoPerformers || []).map(vp =>
            base44.asServiceRole.entities.VideoStatSnapshot.filter({
              video_id: vp.video_id,
              period_month
            }).catch(() => [])
          )
        )
      ]);

      // Flatten video stats and get video titles
      const allStats = videoStatSnapshots.flat();
      const videoMap = {};
      
      // Build video title lookup
      if (videoPerformers && videoPerformers.length > 0) {
        const videoIds = [...new Set(videoPerformers.map(vp => vp.video_id))];
        const videos = await Promise.all(
          videoIds.map(vid => base44.asServiceRole.entities.Video.get(vid).catch(() => null))
        );
        videos.forEach(v => {
          if (v) videoMap[v.id] = v.title;
        });
      }

      // Process legacy earnings with video titles
      const legacyWithVideos = await Promise.all((legacyEarnings || []).map(async (e) => {
        let video_title = null;
        if (e.video_id) {
          const video = await base44.asServiceRole.entities.Video.get(e.video_id);
          video_title = video ? video.title : null;
        }
        return {
          id: e.id,
          source_type: e.earning_type === 'livestream' ? 'livecam' : e.earning_type === 'video_platform' ? 'video_platform' : 'manual_adjustment',
          source_platform: e.earning_type === 'livestream' ? 'internal' : 'internal',
          description: video_title || `${e.earning_type} - ${period_month}`,
          gross_amount_usd: e.gross_amount_usd || 0,
          performer_share_percent: e.split_pct || myPerformer.revenue_split_pct || 40,
          performer_amount_usd: e.net_amount_usd || 0,
          studio_amount_usd: (e.gross_amount_usd || 0) - (e.net_amount_usd || 0),
          status: e.status,
          period_month: e.period_month,
          video_title,
          paid_at: e.paid_at,
          hold_reason: e.hold_reason,
          notes: e.notes,
          is_legacy: true
        };
      }));

      // Process line items
      const lineItemsProcessed = (lineItems || []).map(item => ({
        id: item.id,
        source_type: item.source_type,
        source_platform: item.source_platform,
        description: item.description || `${item.source_type} - ${period_month}`,
        gross_amount_usd: item.gross_amount_usd || 0,
        performer_share_percent: item.performer_share_percent || 0,
        performer_amount_usd: item.performer_amount_usd || 0,
        studio_amount_usd: item.studio_amount_usd || 0,
        status: item.status,
        period_month: item.period_month,
        notes: item.notes,
        is_legacy: false
      }));

      // Convert VideoStatSnapshot to earnings line items (estimated status)
      // Only include if NOT already in manual earnings to avoid double counting
      const existingVideoIds = new Set(
        [...(lineItems || []), ...(legacyEarnings || [])]
          .filter(e => e.source_type === 'video_platform' || e.earning_type === 'video_platform')
          .map(e => e.video_id)
          .filter(Boolean)
      );

      const videoStatsAsEarnings = allStats
        .filter(stat => !existingVideoIds.has(stat.video_id)) // Dedup: skip if already in manual earnings
        .map(stat => ({
          id: `stat_${stat.id}`, // Pseudo-ID to distinguish from DB records
          source_type: 'video_platform',
          source_platform: stat.platform,
          description: videoMap[stat.video_id] || 'Video platform revenue',
          video_title: videoMap[stat.video_id],
          gross_amount_usd: stat.revenue_usd || 0,
          performer_share_percent: myPerformer.revenue_split_pct || 40,
          performer_amount_usd: (stat.revenue_usd || 0) * ((myPerformer.revenue_split_pct || 40) / 100),
          studio_amount_usd: (stat.revenue_usd || 0) * (100 - (myPerformer.revenue_split_pct || 40)) / 100,
          status: 'pending',
          period_month: stat.period_month,
          views: stat.views,
          likes: stat.likes,
          favourites: stat.favourites,
          is_legacy: false,
          is_from_stats: true
        }));

      // Combine all earnings sources: legacy + line items + video stats
      const allEarnings = [...legacyWithVideos, ...lineItemsProcessed, ...videoStatsAsEarnings];

      // Calculate summary
      const summary = {
        gross_total: 0,
        performer_total: 0,
        studio_total: 0,
        pending_total: 0,
        approved_total: 0,
        paid_total: 0,
        held_total: 0,
        by_source_type: {},
        by_source_platform: {},
        by_status: {}
      };

      allEarnings.forEach(e => {
        summary.gross_total += e.gross_amount_usd;
        summary.performer_total += e.performer_amount_usd;
        summary.studio_total += e.studio_amount_usd;

        if (e.status === 'pending') summary.pending_total += e.performer_amount_usd;
        else if (e.status === 'approved') summary.approved_total += e.performer_amount_usd;
        else if (e.status === 'paid') summary.paid_total += e.performer_amount_usd;
        else if (e.status === 'held') summary.held_total += e.performer_amount_usd;

        // By source type
        if (!summary.by_source_type[e.source_type]) {
          summary.by_source_type[e.source_type] = { count: 0, gross: 0, performer: 0, studio: 0 };
        }
        summary.by_source_type[e.source_type].count += 1;
        summary.by_source_type[e.source_type].gross += e.gross_amount_usd;
        summary.by_source_type[e.source_type].performer += e.performer_amount_usd;
        summary.by_source_type[e.source_type].studio += e.studio_amount_usd;

        // By source platform
        if (!summary.by_source_platform[e.source_platform]) {
          summary.by_source_platform[e.source_platform] = { count: 0, performer: 0 };
        }
        summary.by_source_platform[e.source_platform].count += 1;
        summary.by_source_platform[e.source_platform].performer += e.performer_amount_usd;

        // By status
        if (!summary.by_status[e.status]) {
          summary.by_status[e.status] = { count: 0, performer: 0 };
        }
        summary.by_status[e.status].count += 1;
        summary.by_status[e.status].performer += e.performer_amount_usd;
      });

      return Response.json({ 
        success: true, 
        earnings: allEarnings,
        summary,
        legacy_count: legacyWithVideos.length,
        line_item_count: lineItemsProcessed.length,
        video_stats_count: videoStatsAsEarnings.length
      });
    }

    // Action: get_compliance
    if (action === 'get_compliance') {
      const contracts = await base44.asServiceRole.entities.Contract.filter({
        performer_id: myPerformer.id
      });

      const complianceRecords = await base44.asServiceRole.entities.ComplianceRecord.filter({
        performer_id: myPerformer.id
      });

      // Sanitize - remove internal notes
      const safeContracts = contracts.map(c => ({
        id: c.id,
        contract_type: c.contract_type,
        status: c.status,
        signed_at: c.signed_at,
        expires_at: c.expires_at
      }));

      const safeRecords = complianceRecords.map(r => ({
        id: r.id,
        document_type: r.document_type,
        status: r.status,
        issued_at: r.issued_at,
        expires_at: r.expires_at
      }));

      return Response.json({
        success: true,
        contracts: safeContracts,
        compliance_records: safeRecords,
        kyc_status: myPerformer.kyc_status,
        account_status: myPerformer.account_status,
        compliance_locked: myPerformer.compliance_locked
      });
    }

    // Action: get_videos
    if (action === 'get_videos') {
      const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
        performer_id: myPerformer.id
      });

      // Fetch all videos and their stats in parallel
      const videoDetails = await Promise.all(videoPerformers.map(async (vp) => {
        const video = await base44.asServiceRole.entities.Video.get(vp.video_id);
        if (!video) return null;

        // Fetch assets for this video
        const assets = await base44.asServiceRole.entities.VideoAsset.filter({
          video_id: vp.video_id
        });

        // Fetch stats for this video
        const stats = await base44.asServiceRole.entities.VideoStatSnapshot.filter({
          video_id: vp.video_id
        });

        // Calculate totals from stats
        const totalViews = stats.reduce((sum, s) => sum + (s.views || 0), 0);
        const totalLikes = stats.reduce((sum, s) => sum + (s.likes || 0), 0);
        const totalFavourites = stats.reduce((sum, s) => sum + (s.favourites || 0), 0);
        const grossRevenue = stats.reduce((sum, s) => sum + (s.revenue_usd || 0), 0);
        const performerShare = grossRevenue * (myPerformer.revenue_split_pct || 40) / 100;
        const studioShare = grossRevenue - performerShare;

        // Check asset existence
        const sourceAsset = assets.find(a => a.asset_type === 'source');
        const thumbnailAsset = assets.find(a => a.asset_type === 'thumbnail');
        const previewAsset = assets.find(a => a.asset_type === 'preview');

        // Get latest stats period
        const latestStats = stats.sort((a, b) => b.period_month.localeCompare(a.period_month))[0];

        // Stats by platform
        const statsByPlatform = {};
        stats.forEach(s => {
          if (!statsByPlatform[s.platform]) {
            statsByPlatform[s.platform] = {
              platform: s.platform,
              period_month: s.period_month,
              views: 0,
              likes: 0,
              favourites: 0,
              gross_revenue: 0,
              performer_amount: 0,
              studio_amount: 0
            };
          }
          statsByPlatform[s.platform].views += s.views || 0;
          statsByPlatform[s.platform].likes += s.likes || 0;
          statsByPlatform[s.platform].favourites += s.favourites || 0;
          statsByPlatform[s.platform].gross_revenue += s.revenue_usd || 0;
          statsByPlatform[s.platform].performer_amount += (s.revenue_usd || 0) * (myPerformer.revenue_split_pct || 40) / 100;
          statsByPlatform[s.platform].studio_amount += (s.revenue_usd || 0) * (100 - (myPerformer.revenue_split_pct || 40)) / 100;
        });

        return {
          video_id: video.id,
          title: video.title,
          slug: video.slug,
          status: video.status,
          thumbnail_url: video.primary_thumbnail_url,
          preview_url: assets.find(a => a.asset_type === 'preview')?.cdn_url || null,
          duration: video.duration_seconds || 0,
          created_date: video.created_date,
          uploaded_at: video.published_at,
          published_at: video.published_at,
          public_url: video.status === 'published' ? `/videos/${video.slug}` : null,

          performer_role: vp.role,
          lead_performer: vp.lead_performer || false,
          featured: vp.featured || false,
          credit_status: vp.role ? 'credited' : 'uncredited',

          asset_status: sourceAsset && thumbnailAsset ? 'complete' : sourceAsset ? 'partial' : 'missing',
          source_asset_exists: !!sourceAsset,
          thumbnail_exists: !!thumbnailAsset,
          preview_exists: !!previewAsset,
          processing_status: video.processing_status || 'unknown',
          processing_error: null,

          compliance_status: 'compliant',
          release_status: video.status === 'published' ? 'released' : video.status,
          contract_status: 'active',

          promo_status: latestStats?.promotion_status || 'none',
          active_promo: latestStats?.promotion_status === 'active',

          stats_summary: {
            gross_revenue_total: grossRevenue,
            performer_share_percent: myPerformer.revenue_split_pct || 40,
            performer_amount_total: performerShare,
            studio_amount_total: studioShare,
            views_total: totalViews,
            likes_total: totalLikes,
            favourites_total: totalFavourites,
            latest_period: latestStats?.period_month || null
          },

          stats_by_platform: Object.values(statsByPlatform)
        };
      }));

      const filteredVideos = videoDetails.filter(v => v !== null);

      return Response.json({ 
        success: true, 
        performer_id: myPerformer.id,
        revenue_share: myPerformer.revenue_split_pct || 40,
        videos: filteredVideos 
      });
    }

    // Action: get_career_statistics
    if (action === 'get_career_statistics') {
      // Get all VideoPerformer records for this performer
      const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
        performer_id: myPerformer.id
      });

      if (!videoPerformers || videoPerformers.length === 0) {
        return Response.json({ 
          success: true, 
          stats: {
            total_productions: 0,
            published_videos: 0,
            draft_videos: 0,
            total_runtime_minutes: 0,
            latest_release_date: null,
            active_promotions: 0,
            lifetime_revenue_usd: 0,
            lifetime_performer_earnings: 0,
            lead_roles: 0,
            lead_percentage: 0,
            revenue_share_pct: myPerformer.revenue_split_pct || 40
          }
        });
      }

      // Get unique video IDs
      const videoIds = [...new Set(videoPerformers.map(vp => vp.video_id))];
      const leadVideoIds = videoPerformers
        .filter(vp => vp.lead_performer)
        .map(vp => vp.video_id);

      // Determine revenue share (default 40% for managed performers)
      const revenueSharePct = myPerformer.revenue_split_pct || 40;

      // Parallel fetch all videos + earnings + stats simultaneously
      const [videoResults, earnings, snapshotSets] = await Promise.all([
        Promise.all(
          videoIds.map(vid => base44.asServiceRole.entities.Video.get(vid).catch(() => null))
        ),
        base44.asServiceRole.entities.PerformerEarning.filter({ performer_id: myPerformer.id }),
        Promise.all(
          videoIds.map(videoId =>
            base44.asServiceRole.entities.VideoStatSnapshot.filter({ video_id: videoId }).catch(() => [])
          )
        )
      ]);
      const videos = videoResults.filter(v => v !== null);
      const allSnapshots = snapshotSets.flat();

      // Calculate statistics
      const totalProductions = videoIds.length;
      // Only count as published if status is exactly "published"
      const publishedVideos = videos.filter(v => v.status === 'published').length;
      // Count all non-published as draft/other
      const draftVideos = totalProductions - publishedVideos;
      
      const totalRuntimeMinutes = Math.round(
        videos.reduce((sum, v) => sum + (v.duration_seconds || 0), 0) / 60
      );

      // Latest release date (prefer release_date, fallback to published_at, only for published videos)
      let latestReleaseDate = null;
      for (const v of videos.filter(v => v.status === 'published')) {
        const date = v.release_date || v.published_at;
        if (date && (!latestReleaseDate || date > latestReleaseDate)) {
          latestReleaseDate = date;
        }
      }

      // Active promotions
      const activePromotions = allSnapshots.filter(s => s.promotion_status === 'active').length;

      // Calculate gross revenue from VideoStatSnapshot
      const grossPlatformRevenue = allSnapshots.reduce((sum, s) => sum + (s.revenue_usd || 0), 0);

      // Lifetime revenue: Include ALL non-void earnings (approved, paid, pending, estimated)
      // This gives a true "lifetime earnings" picture, not just paid amounts
      let lifetimeRevenue = 0;
      let lifetimePerformerEarnings = 0;
      
      if (earnings && earnings.length > 0) {
        // Use official PerformerEarning records - include all statuses except void/cancelled
        lifetimeRevenue = earnings
          .filter(e => e.status !== 'draft' && e.status !== 'cancelled')
          .reduce((sum, e) => sum + (e.gross_amount_usd || 0), 0);
        lifetimePerformerEarnings = earnings
          .filter(e => e.status !== 'draft' && e.status !== 'cancelled')
          .reduce((sum, e) => sum + (e.net_amount_usd || 0), 0);
      } else {
        // Fallback: calculate from VideoStatSnapshot
        lifetimeRevenue = grossPlatformRevenue;
        lifetimePerformerEarnings = grossPlatformRevenue * (revenueSharePct / 100);
      }

      // Lead roles count
      const leadRolesCount = leadVideoIds.length;
      const leadPercentage = totalProductions > 0 
        ? Math.round((leadRolesCount / totalProductions) * 100) 
        : 0;

      return Response.json({
        success: true,
        stats: {
          total_productions: totalProductions,
          published_videos: publishedVideos,
          draft_videos: draftVideos,
          total_runtime_minutes: totalRuntimeMinutes,
          latest_release_date: latestReleaseDate,
          active_promotions: activePromotions,
          lifetime_revenue_usd: lifetimeRevenue,
          lifetime_performer_earnings: lifetimePerformerEarnings,
          lead_roles: leadRolesCount,
          lead_percentage: leadPercentage,
          revenue_share_pct: revenueSharePct,
          gross_platform_revenue: grossPlatformRevenue
        }
      });
    }

    // Action: create_document_signed_url
    if (action === 'create_document_signed_url') {
      const { document_type, document_id } = body;
      
      if (!document_type || !document_id) {
        return Response.json({ 
          error: 'document_type and document_id are required' 
        }, { status: 400 });
      }
      
      if (!['contract', 'compliance_record'].includes(document_type)) {
        return Response.json({ 
          error: 'Invalid document_type. Must be "contract" or "compliance_record"' 
        }, { status: 400 });
      }
      
      // Fetch the document based on type
      let document;
      let entityName;
      
      if (document_type === 'contract') {
        document = await base44.asServiceRole.entities.Contract.get(document_id);
        entityName = 'Contract';
      } else {
        document = await base44.asServiceRole.entities.ComplianceRecord.get(document_id);
        entityName = 'ComplianceRecord';
      }
      
      if (!document) {
        return Response.json({ 
          error: 'Document not found' 
        }, { status: 404 });
      }
      
      // Verify document belongs to the linked performer
      if (document.performer_id !== myPerformer.id) {
        return Response.json({ 
          error: 'Access denied: Document does not belong to your performer profile' 
        }, { status: 403 });
      }
      
      // Check document status - only allow downloads for valid/signed documents
      const allowedStatuses = document_type === 'contract' 
        ? ['signed'] 
        : ['valid'];
      
      if (!allowedStatuses.includes(document.status)) {
        return Response.json({ 
          error: `Document not available for download (status: ${document.status})` 
        }, { status: 403 });
      }
      
      // Verify document has a valid URL
      if (!document.document_url) {
        return Response.json({ 
          error: 'Document file not available' 
        }, { status: 404 });
      }
      
      // Extract file URI from document_url
      // Base44 private files use format: base44://app/{app_id}/files/{file_key}
      // or may be direct R2 URLs. We need to handle both.
      let fileUri = document.document_url;
      
      // If it's already a base44:// URI, use it directly
      if (!fileUri.startsWith('base44://')) {
        // For R2 URLs or other formats, we need to construct the file_uri
        // Try to extract the key from common URL patterns
        try {
          const urlObj = new URL(fileUri);
          // If it's an R2 URL, extract the key from the path
          const pathParts = urlObj.pathname.split('/').filter(p => p);
          if (pathParts.length > 0) {
            // Construct base44:// URI
            const appInfo = await base44.asServiceRole.app.getApp();
            fileUri = `base44://app/${appInfo.id}/files/${pathParts[pathParts.length - 1]}`;
          }
        } catch (e) {
          // If URL parsing fails, try using as-is
          // This might work if it's already a relative path or key
        }
      }
      
      try {
        // Generate signed URL using Base44 Core integration
        const signedUrlResult = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: fileUri,
          expires_in: 300 // 5 minutes
        });
        
        // Create AuditLog entry
        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: entityName,
          entity_id: document_id,
          actor_id: myPerformer.id,
          actor_role: 'performer',
          action: 'performer_document_signed_url_created',
          changes_json: JSON.stringify({
            performer_id: myPerformer.id,
            document_type,
            document_id,
            document_status: document.status,
          }),
          notes: `Performer ${myPerformer.display_name} requested signed URL for ${document_type}`,
        });
        
        // Return only safe data - never expose raw URLs or keys
        return Response.json({
          success: true,
          signed_url: signedUrlResult.signed_url,
          expires_in_seconds: 300,
          filename: document.title || `${document_type}_${document_id}`,
        });
      } catch (error) {
        // Log the attempt but don't expose internal error details
        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: entityName,
          entity_id: document_id,
          actor_id: myPerformer.id,
          actor_role: 'performer',
          action: 'performer_document_signed_url_failed',
          changes_json: JSON.stringify({
            performer_id: myPerformer.id,
            document_type,
            document_id,
            error: 'Signed URL generation failed',
          }),
          notes: `Failed to generate signed URL: ${error.message}`,
        });
        
        return Response.json({ 
          error: 'Unable to generate secure download link. Please contact support.' 
        }, { status: 500 });
      }
    }

    // Action: get_fanclub
    if (action === 'get_fanclub') {
      const fanclubs = await base44.asServiceRole.entities.Fanclub.filter({
        performer_id: myPerformer.id
      });

      const fanclub = fanclubs[0] || null;

      if (!fanclub) {
        return Response.json({ success: true, fanclub: null, active: false });
      }

      return Response.json({
        success: true,
        fanclub: {
          id: fanclub.id,
          name: fanclub.name,
          description: fanclub.description,
          monthly_price_usd: fanclub.monthly_price_usd,
          perks: fanclub.perks,
          status: fanclub.status,
          subscriber_count: fanclub.subscriber_count || 0
        },
        active: fanclub.status === 'active'
      });
    }

    // Action: get_content_submissions
    if (action === 'get_content_submissions') {
      const submissions = await base44.asServiceRole.entities.ContentSubmission.filter({
        performer_id: myPerformer.id
      });

      // Sort by created_date descending
      const sorted = submissions.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );

      // Sanitize - remove admin-only fields
      const safeSubmissions = sorted.map(s => ({
        id: s.id,
        title: s.title,
        content_type: s.content_type,
        file_name: s.file_name,
        file_size_bytes: s.file_size_bytes,
        upload_status: s.upload_status,
        review_status: s.review_status,
        performer_visible_message: s.performer_visible_message,
        created_date: s.created_date,
        uploaded_at: s.uploaded_at,
        reviewed_at: s.reviewed_at,
        linked_video_id: s.linked_video_id
      }));

      return Response.json({ 
        success: true, 
        submissions: safeSubmissions,
        total_count: safeSubmissions.length
      });
    }

    // Action: get_video_stats (performer read-only)
    if (action === 'get_video_stats') {
      const { period_month } = body;

      // Get all VideoPerformer records for this performer
      const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
        performer_id: myPerformer.id
      });

      if (!videoPerformers || videoPerformers.length === 0) {
        return Response.json({ 
          success: true, 
          stats: [], 
          total_count: 0,
          gross_revenue_total: 0,
          performer_earnings_total: 0,
          revenue_share_pct: myPerformer.revenue_split_pct || 40
        });
      }

      const videoIds = [...new Set(videoPerformers.map(vp => vp.video_id))];
      const revenueSharePct = myPerformer.revenue_split_pct || 40;

      // Fetch all snapshot sets + all video records in parallel
      const [snapshotSets, videoResults] = await Promise.all([
        Promise.all(
          videoIds.map(videoId => {
            const query = { video_id: videoId };
            if (period_month) query.period_month = period_month;
            return base44.asServiceRole.entities.VideoStatSnapshot.filter(query).catch(() => []);
          })
        ),
        Promise.all(
          videoIds.map(vid => base44.asServiceRole.entities.Video.get(vid).catch(() => null))
        )
      ]);

      const allSnapshots = snapshotSets.flat();

      // Build a lookup map of videoId → title
      const videoTitleMap = {};
      videoResults.forEach((video, i) => {
        if (video) videoTitleMap[videoIds[i]] = video.title;
      });

      // Map snapshots with video titles
      const statsWithVideos = allSnapshots.map(snap => ({
        id: snap.id,
        video_id: snap.video_id,
        video_title: videoTitleMap[snap.video_id] || 'Unknown',
        platform: snap.platform,
        period_month: snap.period_month,
        views: snap.views,
        likes: snap.likes,
        favourites: snap.favourites,
        revenue_usd: snap.revenue_usd,
        promotion_status: snap.promotion_status
      }));

      // Sort by period_month descending
      const sorted = statsWithVideos.sort((a, b) => 
        b.period_month.localeCompare(a.period_month)
      );

      // Calculate totals
      const grossRevenueTotal = sorted.reduce((sum, s) => sum + (s.revenue_usd || 0), 0);
      const performerEarningsTotal = grossRevenueTotal * (revenueSharePct / 100);

      return Response.json({ 
        success: true, 
        stats: sorted, 
        total_count: sorted.length,
        gross_revenue_total: grossRevenueTotal,
        performer_earnings_total: performerEarningsTotal,
        revenue_share_pct: revenueSharePct
      });
    }

    // Action: update_submission_uploaded
    if (action === 'update_submission_uploaded') {
      const { submission_id } = body;
      
      if (!submission_id) {
        return Response.json({ error: 'submission_id required' }, { status: 400 });
      }

      const submission = await base44.asServiceRole.entities.ContentSubmission.get(submission_id);
      
      if (!submission) {
        return Response.json({ error: 'Submission not found' }, { status: 404 });
      }

      if (submission.performer_id !== myPerformer.id) {
        return Response.json({ error: 'Access denied' }, { status: 403 });
      }

      await base44.asServiceRole.entities.ContentSubmission.update(submission_id, {
        upload_status: 'uploaded',
        uploaded_at: new Date().toISOString()
      });

      return Response.json({ success: true });
    }

    // Action: admin_update_submission (Admin only)
    if (action === 'admin_update_submission') {
      const { submission_id, data } = body;
      
      if (!submission_id || !data) {
        return Response.json({ error: 'submission_id and data required' }, { status: 400 });
      }

      // Admin auth check
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }

      const submission = await base44.asServiceRole.entities.ContentSubmission.get(submission_id);
      
      if (!submission) {
        return Response.json({ error: 'Submission not found' }, { status: 404 });
      }

      // Update submission
      const updateData = {
        ...data,
        reviewed_by: user.id
      };

      await base44.asServiceRole.entities.ContentSubmission.update(submission_id, updateData);

      return Response.json({ success: true });
    }

    // Action: get_submission_download_url (Admin only)
    if (action === 'get_submission_download_url') {
      const { submission_id } = body;
      
      if (!submission_id) {
        return Response.json({ error: 'submission_id required' }, { status: 400 });
      }

      // Admin auth check
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }

      const submission = await base44.asServiceRole.entities.ContentSubmission.get(submission_id);
      
      if (!submission || !submission.r2_object_key) {
        return Response.json({ error: 'Submission or file not found' }, { status: 404 });
      }

      // Generate signed download URL (1 hour expiry)
      const { S3Client, GetObjectCommand } = await import('npm:@aws-sdk/client-s3@3.1057.0');
      const { getSignedUrl } = await import('npm:@aws-sdk/s3-request-presigner@3.1057.0');

      const bucketName = Deno.env.get('R2_BUCKET_NAME') || 'fleshlab-v2';
      const r2AccountId = Deno.env.get('R2_ACCOUNT_ID');

      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') || '',
          secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') || ''
        }
      });

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: submission.r2_object_key
      });

      const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

      return Response.json({ signed_url: signedUrl });
    }

    // Action: create_support_request
    if (action === 'create_support_request') {
      const { subject, category, message } = body;

      if (!subject || !category || !message) {
        return Response.json({ 
          error: 'subject, category, and message are required' 
        }, { status: 400 });
      }

      // Create support request
      const supportRequest = await base44.asServiceRole.entities.PerformerSupportRequest.create({
        performer_id: myPerformer.id,
        user_id: myPerformer.user_id || null,
        subject: subject.slice(0, 120),
        category,
        message: message.slice(0, 4000),
        status: 'open',
        priority: 'normal'
      });

      return Response.json({
        success: true,
        request_id: supportRequest.id,
        message: 'Support request submitted successfully'
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});