import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function parseMeta(json) {
  try { return JSON.parse(json || '{}') || {}; } catch (_) { return {}; }
}

function pct(num, den) {
  if (!den || den <= 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

function inRange(dateStr, start, end) {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function isSimulatedIntent(pi) {
  const meta = parseMeta(pi.metadata);
  return meta.simulated === true || meta.test_mode === true;
}

function topN(map, n = 5) {
  return Array.from(map.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, n)
    .map(([key, v]) => ({ key, ...v }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const [events, users, paymentIntents, subscriptions, purchases, pageViews, performers, videos, videoPerformers, earnings, fanclubs, walletLedger, wallets] =
      await Promise.all([
        svc.entities.ConversionEvent.list('-created_date', 5000),
        svc.entities.User.list('-created_date', 5000),
        svc.entities.PaymentIntent.list('-created_date', 3000).then(rows => rows.filter(pi => !isSimulatedIntent(pi))),
        svc.entities.Subscription.list('-created_date', 2000),
        svc.entities.FleshPayPurchase.list('-created_date', 2000),
        svc.entities.PageView.list('-created_date', 5000).catch(() => []),
        svc.entities.Performer.list(),
        svc.entities.Video.list('-view_count', 300),
        svc.entities.VideoPerformer.filter({ lead_performer: true }),
        svc.entities.PerformerEarningLineItem.list('-created_date', 2000),
        svc.entities.Fanclub.list(),
        svc.entities.FleshPayLedger.list('-created_date', 3000).catch(() => []),
        svc.entities.FleshPayWallet.list('-created_date', 2000).catch(() => []),
      ]);

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const last7Start = new Date(now.getTime() - 7 * 86400000);
    const last30Start = new Date(now.getTime() - 30 * 86400000);

    const usersById = new Map(users.map(u => [u.id, u]));

    function computePeriod(start, end) {
      const ev = events.filter(e => inRange(e.created_date, start, end));
      const usersInPeriod = users.filter(u => inRange(u.created_date, start, end));
      const pisInPeriod = paymentIntents.filter(p => inRange(p.created_date, start, end));
      const subsInPeriod = subscriptions.filter(s => inRange(s.created_date, start, end));
      const purchasesInPeriod = purchases.filter(p => inRange(p.created_date, start, end));
      const pvInPeriod = pageViews.filter(p => inRange(p.created_date, start, end));

      const countEvent = (name) => ev.filter(e => e.event_name === name).length;

      const loginEvents = ev.filter(e => e.event_name === 'login_success');
      const returningUsers = loginEvents.filter(e => {
        const u = e.user_id ? usersById.get(e.user_id) : null;
        return u && new Date(u.created_date).getTime() < start.getTime();
      }).length;

      const visitors = pvInPeriod.length;
      const registrations = usersInPeriod.length;
      const verifiedUsers = countEvent('otp_verified');
      const firstLogins = loginEvents.length;
      const videoViews = countEvent('video_detail_view');
      const performerViews = countEvent('performer_profile_view');
      const fanclubPageViews = ev.filter(e => (e.source_page || '').startsWith('/fanclub')).length;
      const checkoutStarts = countEvent('checkout_start');
      const paymentSuccess = pisInPeriod.filter(p => p.status === 'completed').length;
      const paymentFailed = pisInPeriod.filter(p => p.status === 'failed').length;
      const subs = subsInPeriod.length;
      const ppvPurchases = purchasesInPeriod.filter(p => p.purchase_type === 'ppv_unlock').length;
      const revenue = pisInPeriod.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);

      return {
        visitors,
        registrations,
        verified_users: verifiedUsers,
        first_logins: firstLogins,
        returning_users: returningUsers,
        video_views: videoViews,
        performer_views: performerViews,
        fanclub_page_views: fanclubPageViews,
        checkout_starts: checkoutStarts,
        payment_success: paymentSuccess,
        payment_failed: paymentFailed,
        subscriptions: subs,
        ppv_purchases: ppvPurchases,
        revenue_usd: Math.round(revenue * 100) / 100,
        arpu: Math.round((revenue / (registrations || 1)) * 100) / 100,
        arps: Math.round((revenue / (subs || 1)) * 100) / 100,
        conversion_rates: {
          visitor_to_registration: pct(registrations, visitors),
          registration_to_verification: pct(verifiedUsers, registrations),
          verification_to_first_login: pct(firstLogins, verifiedUsers),
          first_login_to_performer_view: pct(performerViews, firstLogins),
          performer_view_to_fanclub: pct(fanclubPageViews, performerViews),
          fanclub_to_checkout: pct(checkoutStarts, fanclubPageViews),
          checkout_to_payment: pct(paymentSuccess, checkoutStarts),
          payment_to_subscription: pct(subs, paymentSuccess),
        },
      };
    }

    const periods = {
      today: computePeriod(todayStart, now),
      yesterday: computePeriod(yesterdayStart, todayStart),
      last7: computePeriod(last7Start, now),
      last30: computePeriod(last30Start, now),
    };

    // ── Top Performers (last 30 days window for activity metrics, all-time for revenue) ──
    const performersById = new Map(performers.map(p => [p.id, p]));
    const performersBySlug = new Map(performers.map(p => [p.slug, p]));

    const viewsByPerformer = new Map();
    events.filter(e => e.event_name === 'performer_profile_view' && inRange(e.created_date, last30Start, now)).forEach(e => {
      const meta = parseMeta(e.metadata_json);
      const perf = meta.performer_slug ? performersBySlug.get(meta.performer_slug) : null;
      if (!perf) return;
      const cur = viewsByPerformer.get(perf.id) || { value: 0, name: perf.display_name };
      cur.value += 1;
      viewsByPerformer.set(perf.id, cur);
    });

    const revenueByPerformer = new Map();
    earnings.forEach(e => {
      if (!e.performer_id) return;
      const perf = performersById.get(e.performer_id);
      if (!perf) return;
      const cur = revenueByPerformer.get(e.performer_id) || { value: 0, name: perf.display_name };
      cur.value += (e.performer_amount_usd || 0);
      revenueByPerformer.set(e.performer_id, cur);
    });

    const videoToPerformer = new Map(videoPerformers.map(vp => [vp.video_id, vp.performer_id]));
    const ppvByPerformer = new Map();
    purchases.filter(p => p.purchase_type === 'ppv_unlock' && inRange(p.created_date, last30Start, now)).forEach(p => {
      const performerId = p.video_id ? videoToPerformer.get(p.video_id) : null;
      if (!performerId) return;
      const perf = performersById.get(performerId);
      if (!perf) return;
      const cur = ppvByPerformer.get(performerId) || { value: 0, name: perf.display_name };
      cur.value += 1;
      ppvByPerformer.set(performerId, cur);
    });

    const fanclubToPerformer = new Map(fanclubs.map(f => [f.id, f.performer_id]));
    const fanclubConvByPerformer = new Map();
    subscriptions.filter(s => inRange(s.created_date, last30Start, now)).forEach(s => {
      const performerId = s.fanclub_id ? fanclubToPerformer.get(s.fanclub_id) : null;
      if (!performerId) return;
      const perf = performersById.get(performerId);
      if (!perf) return;
      const cur = fanclubConvByPerformer.get(performerId) || { value: 0, name: perf.display_name };
      cur.value += 1;
      fanclubConvByPerformer.set(performerId, cur);
    });

    const topPerformers = {
      most_viewed: topN(viewsByPerformer, 5),
      highest_revenue: topN(revenueByPerformer, 5),
      highest_ppv_sales: topN(ppvByPerformer, 5),
      highest_fanclub_conversions: topN(fanclubConvByPerformer, 5),
      highest_avg_watch_time: [], // not tracked — no watch-time telemetry exists yet
    };

    // ── Top Videos ──
    const videosBySlug = new Map(videos.map(v => [v.slug, v]));
    const videosById = new Map(videos.map(v => [v.id, v]));

    const mostViewedVideos = [...videos]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 10)
      .map(v => ({ id: v.id, title: v.title, value: v.view_count || 0 }));

    const ppvByVideo = new Map();
    purchases.filter(p => p.purchase_type === 'ppv_unlock' && inRange(p.created_date, last30Start, now)).forEach(p => {
      if (!p.video_id) return;
      const v = videosById.get(p.video_id);
      if (!v) return;
      const cur = ppvByVideo.get(p.video_id) || { value: 0, title: v.title };
      cur.value += 1;
      ppvByVideo.set(p.video_id, cur);
    });
    const highestPpvVideos = topN(ppvByVideo, 10);

    const viewsBySlug = new Map();
    events.filter(e => e.event_name === 'video_detail_view' && inRange(e.created_date, last30Start, now)).forEach(e => {
      const meta = parseMeta(e.metadata_json);
      if (!meta.video_slug) return;
      viewsBySlug.set(meta.video_slug, (viewsBySlug.get(meta.video_slug) || 0) + 1);
    });
    const conversionVideos = [];
    viewsBySlug.forEach((views, slug) => {
      const v = videosBySlug.get(slug);
      if (!v) return;
      const purchaseData = ppvByVideo.get(v.id);
      const purchaseCount = purchaseData ? purchaseData.value : 0;
      if (views > 0) {
        conversionVideos.push({ id: v.id, title: v.title, views, purchases: purchaseCount, value: pct(purchaseCount, views) || 0 });
      }
    });
    conversionVideos.sort((a, b) => b.value - a.value);

    const topVideos = {
      most_viewed: mostViewedVideos,
      highest_ppv: highestPpvVideos,
      highest_conversion: conversionVideos.slice(0, 10),
    };

    // ── Traffic (last 30 days, from event metadata) ──
    const last30Events = events.filter(e => inRange(e.created_date, last30Start, now));
    function groupBy(field) {
      const map = new Map();
      last30Events.forEach(e => {
        const meta = parseMeta(e.metadata_json);
        const key = meta[field] || 'unknown';
        map.set(key, (map.get(key) || 0) + 1);
      });
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, count]) => ({ key, count }));
    }
    function groupBySource() {
      const map = new Map();
      last30Events.forEach(e => {
        const meta = parseMeta(e.metadata_json);
        const key = meta.utm_source || meta.referrer || 'direct';
        map.set(key, (map.get(key) || 0) + 1);
      });
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, count]) => ({ key, count }));
    }

    const newVsReturningLogins = last30Events.filter(e => e.event_name === 'login_success');
    const returningCount = newVsReturningLogins.filter(e => {
      const u = e.user_id ? usersById.get(e.user_id) : null;
      return u && new Date(u.created_date).getTime() < last30Start.getTime();
    }).length;
    const newCount = newVsReturningLogins.length - returningCount;

    const traffic = {
      by_source: groupBySource(),
      by_country: groupBy('country'),
      by_browser: groupBy('browser'),
      by_device: groupBy('device_type'),
      new_vs_returning: { new: newCount, returning: returningCount },
    };

    // ── Alerts ──
    const alerts = [];
    if (periods.today.payment_failed >= 5 || (periods.today.payment_failed > periods.today.payment_success && periods.today.payment_failed + periods.today.payment_success >= 3)) {
      alerts.push({ level: 'critical', message: `Payment failures elevated today: ${periods.today.payment_failed} failed vs ${periods.today.payment_success} succeeded.` });
    }
    if (periods.yesterday.registrations >= 3 && periods.today.registrations < periods.yesterday.registrations * 0.5) {
      alerts.push({ level: 'warning', message: `Registrations dropped sharply: ${periods.today.registrations} today vs ${periods.yesterday.registrations} yesterday.` });
    }
    const todayConv = periods.today.conversion_rates.checkout_to_payment;
    const last7Conv = periods.last7.conversion_rates.checkout_to_payment;
    if (periods.today.checkout_starts >= 3 && last7Conv !== null && todayConv !== null && todayConv < last7Conv * 0.5) {
      alerts.push({ level: 'warning', message: `Checkout → Payment conversion dropped: ${todayConv}% today vs ${last7Conv}% (7-day avg).` });
    }
    const lastEvent = events[0];
    if (lastEvent) {
      const minutesSince = (now.getTime() - new Date(lastEvent.created_date).getTime()) / 60000;
      if (minutesSince > 60) {
        alerts.push({ level: 'warning', message: `No events received in the last ${Math.round(minutesSince)} minutes.` });
      }
    } else {
      alerts.push({ level: 'warning', message: 'No events have been recorded yet.' });
    }

    // ── Wallet KPIs (FlashPay Phase 2) ────────────────────────────────────
    const todayTopups = walletLedger.filter(l => l.entry_type === 'credit' && inRange(l.created_date, todayStart, now));
    const todaySpends = walletLedger.filter(l => l.entry_type === 'debit' && inRange(l.created_date, todayStart, now));
    const last30Topups = walletLedger.filter(l => l.entry_type === 'credit' && inRange(l.created_date, last30Start, now));
    const last30Spends = walletLedger.filter(l => l.entry_type === 'debit' && inRange(l.created_date, last30Start, now));
    const last30CryptoPayments = paymentIntents.filter(p => p.provider === 'nowpayments' && p.status === 'completed' && inRange(p.created_date, last30Start, now));

    const walletsWithTopup = new Set(last30Topups.map(l => l.wallet_id));
    const walletsWithSpend = new Set(last30Spends.map(l => l.wallet_id));

    const walletKpis = {
      today_wallet_topups_usd: Math.round(todayTopups.reduce((s, l) => s + (l.amount_usd || 0), 0) * 100) / 100,
      today_wallet_revenue_usd: Math.round(todaySpends.reduce((s, l) => s + (l.amount_usd || 0), 0) * 100) / 100,
      today_wallet_spend_count: todaySpends.length,
      average_wallet_balance_usd: wallets.length ? Math.round((wallets.reduce((s, w) => s + (w.balance_usd || 0), 0) / wallets.length) * 100) / 100 : 0,
      wallet_conversion_rate: pct(walletsWithSpend.size, walletsWithTopup.size),
      wallet_vs_crypto_split: {
        wallet_purchases: last30Spends.length,
        crypto_purchases: last30CryptoPayments.length,
      },
    };

    return Response.json({
      success: true,
      generated_at: now.toISOString(),
      periods,
      top_performers: topPerformers,
      top_videos: topVideos,
      traffic,
      alerts,
      wallet_kpis: walletKpis,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});