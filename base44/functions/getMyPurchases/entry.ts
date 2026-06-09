/**
 * getMyPurchases — User Account Purchase History
 * 
 * PURPOSE:
 * Returns current user's purchase history (PPV videos + Fanclub subscriptions).
 * Excludes test_mode payments from user view.
 * 
 * SECURITY:
 * - User sees ONLY their own payments/subscriptions
 * - test_mode payments are hidden
 * - No sensitive provider data exposed
 * - No source_video_url exposed
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth required
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { include_test_mode } = body; // Admin-only flag

    // ── PPV Purchases ────────────────────────────────────────────────────────
    const allPayments = await base44.asServiceRole.entities.Payment.filter({
      user_id: user.id,
      payment_type: 'ppv',
      related_entity_type: 'Video',
      status: 'completed',
    });

    // Filter out test_mode payments (unless admin with include_test_mode flag)
    const payments = (allPayments || []).filter(p => {
      if (include_test_mode && user.role === 'admin') return true;
      try {
        const meta = JSON.parse(p.metadata || '{}');
        return meta.test_mode !== true;
      } catch {
        return true;
      }
    });

    // Fetch video details for each payment
    const videoIds = [...new Set(payments.map(p => p.related_entity_id).filter(Boolean))];
    const videoMap = {};
    
    if (videoIds.length > 0) {
      const videos = await Promise.all(
        videoIds.map(vid => base44.asServiceRole.entities.Video.get(vid).catch(() => null))
      );
      videos.forEach((v, i) => {
        if (v) videoMap[videoIds[i]] = v;
      });
    }

    const purchasedVideos = payments.map(p => {
      const video = videoMap[p.related_entity_id];
      const meta = JSON.parse(p.metadata || '{}');
      
      return {
        id: p.id,
        payment_type: 'ppv',
        video_id: p.related_entity_id,
        video_title: video?.title || 'Video no longer available',
        video_slug: video?.slug,
        video_status: video?.status,
        video_thumbnail: video?.primary_thumbnail_url,
        amount_usd: p.amount_usd,
        currency: p.currency || 'usd',
        purchase_date: p.created_date,
        access_status: video?.status === 'published' ? 'active' : 'unavailable',
        provider: meta.provider || 'unknown',
        is_test_mode: meta.test_mode === true,
      };
    });

    // ── Fanclub Subscriptions ───────────────────────────────────────────────
    const allSubscriptions = await base44.asServiceRole.entities.Subscription.filter({
      user_id: user.id,
    });

    // Filter out test subscriptions if needed
    const subscriptions = (allSubscriptions || []).filter(s => {
      if (include_test_mode && user.role === 'admin') return true;
      // Check metadata for test_mode if needed
      return true;
    });

    // Fetch fanclub details
    const fanclubIds = [...new Set(subscriptions.map(s => s.fanclub_id).filter(Boolean))];
    const fanclubMap = {};
    
    if (fanclubIds.length > 0) {
      const fanclubs = await Promise.all(
        fanclubIds.map(fid => base44.asServiceRole.entities.Fanclub.get(fid).catch(() => null))
      );
      fanclubs.forEach((f, i) => {
        if (f) fanclubMap[fanclubIds[i]] = f;
      });
    }

    const subscriptionHistory = subscriptions.map(s => {
      const fanclub = fanclubMap[s.fanclub_id];
      const now = new Date();
      const periodEnd = new Date(s.current_period_end);
      
      let statusLabel = s.status;
      if (s.status === 'active' && periodEnd < now) {
        statusLabel = 'expired';
      }

      return {
        id: s.id,
        subscription_type: 'fanclub',
        fanclub_id: s.fanclub_id,
        fanclub_name: fanclub?.name || 'Fanclub Membership',
        performer_id: fanclub?.performer_id,
        plan_name: fanclub?.monthly_price_usd ? `$${fanclub.monthly_price_usd}/month` : 'Membership',
        status: statusLabel,
        amount_usd: s.amount_usd,
        currency: 'usd',
        current_period_start: s.current_period_start,
        current_period_end: s.current_period_end,
        access_until: s.current_period_end,
        cancelled_at: s.cancelled_at,
        created_date: s.created_date,
        provider: s.provider || 'unknown',
      };
    });

    // ── Payment History (All Types) ─────────────────────────────────────────
    const allPaymentHistory = await base44.asServiceRole.entities.Payment.filter({
      user_id: user.id,
    });

    const paymentHistory = (allPaymentHistory || []).filter(p => {
      if (include_test_mode && user.role === 'admin') return true;
      try {
        const meta = JSON.parse(p.metadata || '{}');
        return meta.test_mode !== true;
      } catch {
        return true;
      }
    }).map(p => {
      const meta = JSON.parse(p.metadata || '{}');
      
      return {
        id: p.id,
        payment_type: p.payment_type,
        amount_usd: p.amount_usd,
        currency: p.currency || 'usd',
        status: p.status,
        created_date: p.created_date,
        related_entity_type: p.related_entity_type,
        related_entity_id: p.related_entity_id,
        provider: meta.provider || 'unknown',
        is_test_mode: meta.test_mode === true,
      };
    });

    return Response.json({
      success: true,
      user_id: user.id,
      purchased_videos: purchasedVideos,
      subscriptions: subscriptionHistory,
      payment_history: paymentHistory,
      summary: {
        total_ppv_purchases: purchasedVideos.length,
        total_subscriptions: subscriptionHistory.length,
        active_subscriptions: subscriptionHistory.filter(s => s.status === 'active').length,
        total_payments: paymentHistory.length,
      }
    });

  } catch (error) {
    console.error('getMyPurchases error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});