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
            lead_roles: 0,
            lead_percentage: 0
          }
        });
      }

      // Get unique video IDs
      const videoIds = [...new Set(videoPerformers.map(vp => vp.video_id))];
      const leadVideoIds = videoPerformers
        .filter(vp => vp.lead_performer)
        .map(vp => vp.video_id);

      // Fetch all videos
      const videos = [];
      for (const vid of videoIds) {
        const video = await base44.asServiceRole.entities.Video.get(vid);
        if (video) videos.push(video);
      }

      // Calculate statistics
      const totalProductions = videoIds.length;
      const publishedVideos = videos.filter(v => v.status === 'published').length;
      const draftVideos = videos.filter(v => v.status === 'draft').length;
      const totalRuntimeMinutes = Math.round(
        videos.reduce((sum, v) => sum + (v.duration_seconds || 0), 0) / 60
      );

      // Latest release date (prefer release_date, fallback to published_at)
      let latestReleaseDate = null;
      for (const v of videos) {
        const date = v.release_date || v.published_at;
        if (date && (!latestReleaseDate || date > latestReleaseDate)) {
          latestReleaseDate = date;
        }
      }

      // Active promotions
      const allSnapshots = [];
      for (const videoId of videoIds) {
        const snapshots = await base44.asServiceRole.entities.VideoStatSnapshot.filter({ video_id: videoId });
        allSnapshots.push(...snapshots);
      }
      const activePromotions = allSnapshots.filter(s => s.promotion_status === 'active').length;

      // Lifetime revenue (all approved/paid earnings)
      const earnings = await base44.asServiceRole.entities.PerformerEarning.filter({
        performer_id: myPerformer.id
      });
      const lifetimeRevenue = earnings
        .filter(e => e.status === 'approved' || e.status === 'paid')
        .reduce((sum, e) => sum + (e.net_amount_usd || 0), 0);

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
          lead_roles: leadRolesCount,
          lead_percentage: leadPercentage
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