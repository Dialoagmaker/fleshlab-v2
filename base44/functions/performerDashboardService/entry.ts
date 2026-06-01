import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Find performer linked to this user via user_id field
    const performers = await base44.asServiceRole.entities.Performer.filter({
      user_id: user.id
    });
    const myPerformer = performers[0] || null;

    if (!myPerformer) {
      return Response.json({ 
        error: 'No linked performer profile found. Please contact support to link your account.'
      }, { status: 404 });
    }

    // Action: get_dashboard_summary
    if (action === 'get_dashboard_summary') {
      // Get current period (YYYY-MM)
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Fetch earnings for current period
      const earnings = await base44.asServiceRole.entities.PerformerEarning.filter({
        performer_id: myPerformer.id,
        period_month: currentMonth
      });

      // Calculate summary
      const summary = {
        gross_total: 0,
        net_total: 0,
        pending_total: 0,
        paid_total: 0,
        held_total: 0
      };

      earnings.forEach(e => {
        summary.gross_total += e.gross_amount_usd || 0;
        summary.net_total += e.net_amount_usd || 0;
        if (e.status === 'pending') summary.pending_total += e.net_amount_usd || 0;
        else if (e.status === 'paid') summary.paid_total += e.net_amount_usd || 0;
        else if (e.status === 'held') summary.held_total += e.net_amount_usd || 0;
      });

      // Get latest videos (up to 5)
      const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
        performer_id: myPerformer.id
      });
      const videoIds = videoPerformers.slice(0, 5).map(vp => vp.video_id);
      const latestVideos = [];
      for (const vid of videoIds) {
        const video = await base44.asServiceRole.entities.Video.get(vid);
        if (video) {
          latestVideos.push({
            id: video.id,
            title: video.title,
            status: video.status,
            published_at: video.published_at,
            view_count: video.view_count || 0,
            access_tier: video.access_tier
          });
        }
      }

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
      if (summary.net_total === 0) {
        actionRequired.push({ type: 'earnings', message: 'No earnings recorded this month', priority: 'low' });
      }

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
        fanclub_enabled: myPerformer.fanclub_enabled
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
        }
      });
    }

    // Action: get_earnings
    if (action === 'get_earnings') {
      const { period_month } = body;
      if (!period_month) {
        return Response.json({ error: 'period_month required' }, { status: 400 });
      }

      const earnings = await base44.asServiceRole.entities.PerformerEarning.filter({
        performer_id: myPerformer.id,
        period_month
      });

      // Get video titles for earnings that have video_id
      const earningsWithVideos = await Promise.all(earnings.map(async (e) => {
        let video_title = null;
        if (e.video_id) {
          const video = await base44.asServiceRole.entities.Video.get(e.video_id);
          video_title = video ? video.title : null;
        }
        return {
          id: e.id,
          earning_type: e.earning_type,
          gross_amount_usd: e.gross_amount_usd,
          net_amount_usd: e.net_amount_usd,
          status: e.status,
          period_month: e.period_month,
          video_title,
          paid_at: e.paid_at,
          hold_reason: e.hold_reason
        };
      }));

      return Response.json({ success: true, earnings: earningsWithVideos });
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
        expires_at: c.expires_at,
        document_url: c.document_url
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

      const videos = await Promise.all(videoPerformers.map(async (vp) => {
        const video = await base44.asServiceRole.entities.Video.get(vp.video_id);
        if (!video) return null;
        return {
          id: video.id,
          title: video.title,
          slug: video.slug,
          status: video.status,
          published_at: video.published_at,
          view_count: video.view_count || 0,
          access_tier: video.access_tier,
          primary_thumbnail_url: video.primary_thumbnail_url,
          role: vp.role
        };
      }));

      const filteredVideos = videos.filter(v => v !== null).slice(0, 50);

      return Response.json({ success: true, videos: filteredVideos });
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

    // Action: get_video_stats (performer read-only)
    if (action === 'get_video_stats') {
      const { period_month } = body;

      // Get all VideoPerformer records for this performer
      const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
        performer_id: myPerformer.id
      });

      if (!videoPerformers || videoPerformers.length === 0) {
        return Response.json({ success: true, stats: [], total_count: 0 });
      }

      const videoIds = videoPerformers.map(vp => vp.video_id);

      // Get all snapshots for these videos
      const allSnapshots = [];
      for (const videoId of videoIds) {
        const query = { video_id: videoId };
        if (period_month) query.period_month = period_month;

        const snapshots = await base44.asServiceRole.entities.VideoStatSnapshot.filter(query);
        allSnapshots.push(...snapshots);
      }

      // Get video titles and sanitize data (remove admin-only fields)
      const statsWithVideos = await Promise.all(allSnapshots.map(async (snap) => {
        const video = await base44.asServiceRole.entities.Video.get(snap.video_id);
        return {
          id: snap.id,
          video_id: snap.video_id,
          video_title: video?.title || 'Unknown',
          platform: snap.platform,
          period_month: snap.period_month,
          views: snap.views,
          likes: snap.likes,
          favourites: snap.favourites,
          revenue_usd: snap.revenue_usd,
          promotion_status: snap.promotion_status
          // NOT returning: admin_note, promotion_note, raw_data_json (admin-only)
        };
      }));

      // Sort by period_month descending
      const sorted = statsWithVideos.sort((a, b) => 
        b.period_month.localeCompare(a.period_month)
      );

      return Response.json({ 
        success: true, 
        stats: sorted, 
        total_count: sorted.length 
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});