/**
 * adminUserService — Admin-only backend function
 *
 * Provides aggregated user account, payment, subscription, and purchase data
 * for the admin backoffice. All actions require admin role.
 *
 * Security:
 * - Every action checks user.role === 'admin' → 403 if not admin
 * - Never returns passwords, tokens, API keys, KYC/compliance docs, private R2 URLs
 * - Returns provider_session_id (invoice ID) only — never API secrets
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Plan label map ────────────────────────────────────────────────────────────
const PLAN_LABELS = {
  fanclub_monthly:  'Fanclub Monthly',
  premium_monthly:  'Fanclub Premium Monthly',
  fanclub_3mo:      'Fanclub 3-Month',
  fanclub_6mo:      'Fanclub 6-Month',
  fanclub_annual:   'Fanclub Annual',
  annual_pass:      'Annual Pass',
};

function planLabel(id) {
  return PLAN_LABELS[id] || id || 'Fanclub Access';
}

// ── Status timestamp helper ────────────────────────────────────────────────────
function statusDate(intent) {
  if (intent.completed_at) return intent.completed_at;
  if (intent.failed_at) return intent.failed_at;
  if (intent.cancelled_at) return intent.cancelled_at;
  return intent.created_date || null;
}

// ── Statuses that count toward lifetime spend ─────────────────────────────────
const COUNTABLE_STATUSES = new Set(['completed']);

/**
 * calculateDedupedLifetimeSpend
 *
 * Rules:
 * 1. Only count "completed" records on either side.
 * 2. Never count refunded, pending, failed, cancelled, underpaid,
 *    currency_mismatch, or payment_review.
 * 3. If a completed Payment and a completed PaymentIntent represent the same
 *    transaction, count it ONCE (prefer the Payment record as source of truth).
 *
 * Deduplication match priority (any one match is sufficient):
 *   A. payment.stripe_payment_intent_id === intent.provider_session_id
 *   B. intent.id appears in payment.metadata JSON
 *   C. intent.id appears in payment.related_entity_id (edge case)
 *   D. Fuzzy: same user_id + same payment_type + same amount ± $0.01 + created within 5 min of each other
 *
 * Returns: { amount, intentCount, paymentCount, dedupedCount, excludedIntentIds, method }
 */
function calculateDedupedLifetimeSpend(userId, paymentIntents, payments) {
  const completedIntents = paymentIntents.filter(i => COUNTABLE_STATUSES.has(i.status));
  const completedPayments = payments.filter(p => COUNTABLE_STATUSES.has(p.status));

  // Set of PaymentIntent IDs that are already covered by a completed Payment
  const coveredIntentIds = new Set();
  const dedupeMethods = {};

  for (const pmt of completedPayments) {
    let metadataParsed = null;
    try {
      if (pmt.metadata) metadataParsed = JSON.parse(pmt.metadata);
    } catch (_) {}

    for (const intent of completedIntents) {
      if (coveredIntentIds.has(intent.id)) continue;

      // A. Stripe payment intent ID matches provider_session_id
      if (
        pmt.stripe_payment_intent_id &&
        intent.provider_session_id &&
        pmt.stripe_payment_intent_id === intent.provider_session_id
      ) {
        coveredIntentIds.add(intent.id);
        dedupeMethods[intent.id] = 'A:stripe_id_match';
        continue;
      }

      // B. Intent ID appears in payment metadata JSON
      if (metadataParsed) {
        const metaStr = JSON.stringify(metadataParsed);
        if (metaStr.includes(intent.id)) {
          coveredIntentIds.add(intent.id);
          dedupeMethods[intent.id] = 'B:metadata_intent_id';
          continue;
        }
      }

      // C. Intent ID matches payment's related_entity_id
      if (pmt.related_entity_id && pmt.related_entity_id === intent.id) {
        coveredIntentIds.add(intent.id);
        dedupeMethods[intent.id] = 'C:related_entity_id';
        continue;
      }

      // D. Fuzzy: same payment_type + same amount ± $0.01 + created within 5 minutes
      const pmtType = pmt.payment_type;
      const intentType = intent.payment_type;
      const pmtAmount = pmt.amount_usd || 0;
      const intentAmount = intent.amount || 0;
      const pmtDate = pmt.created_date ? new Date(pmt.created_date).getTime() : null;
      const intentDate = intent.created_date ? new Date(intent.created_date).getTime() : null;
      const FIVE_MIN_MS = 5 * 60 * 1000;

      if (
        pmtType && intentType && pmtType === intentType &&
        Math.abs(pmtAmount - intentAmount) <= 0.01 &&
        pmtDate && intentDate &&
        Math.abs(pmtDate - intentDate) <= FIVE_MIN_MS
      ) {
        coveredIntentIds.add(intent.id);
        dedupeMethods[intent.id] = 'D:fuzzy_type_amount_time';
        continue;
      }
    }
  }

  // Sum: all completed payments + completed intents not covered by a payment
  const paymentTotal = completedPayments.reduce((sum, p) => sum + (p.amount_usd || 0), 0);
  const uniqueIntentTotal = completedIntents
    .filter(i => !coveredIntentIds.has(i.id))
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const amount = Math.round((paymentTotal + uniqueIntentTotal) * 100) / 100;

  return {
    amount,
    intentCount: completedIntents.length,
    paymentCount: completedPayments.length,
    dedupedCount: coveredIntentIds.size,
    excludedIntentIds: [...coveredIntentIds],
    dedupeMethods,
  };
}

// ── list_users ────────────────────────────────────────────────────────────────
async function listUsers(base44, body) {
  const { page = 1, limit = 50, search = '', filters = {} } = body;

  // Fetch all needed data in parallel
  const [users, allIntents, allPayments, allSubs, allPerformers] = await Promise.all([
    base44.asServiceRole.entities.User.list('-created_date', 500),
    base44.asServiceRole.entities.PaymentIntent.list('-created_date', 1000),
    base44.asServiceRole.entities.Payment.list('-created_date', 1000),
    base44.asServiceRole.entities.Subscription.list('-created_date', 1000),
    base44.asServiceRole.entities.Performer.list('-created_date', 500),
  ]);

  // Build lookup maps
  const performerByUserId = {};
  for (const p of allPerformers) {
    if (p.user_id) performerByUserId[p.user_id] = { id: p.id, display_name: p.display_name, slug: p.slug };
  }

  const intentsByUser = {};
  for (const i of allIntents) {
    if (!intentsByUser[i.user_id]) intentsByUser[i.user_id] = [];
    intentsByUser[i.user_id].push(i);
  }

  const paymentsByUser = {};
  for (const p of allPayments) {
    if (!paymentsByUser[p.user_id]) paymentsByUser[p.user_id] = [];
    paymentsByUser[p.user_id].push(p);
  }

  const subsByUser = {};
  for (const s of allSubs) {
    if (!subsByUser[s.user_id]) subsByUser[s.user_id] = [];
    subsByUser[s.user_id].push(s);
  }

  // Map + enrich users
  let enriched = users.map(u => {
    const userIntents = intentsByUser[u.id] || [];
    const userPayments = paymentsByUser[u.id] || [];
    const userSubs = subsByUser[u.id] || [];
    const linkedPerformer = performerByUserId[u.id] || null;

    // Deduped lifetime spend
    const deduped = calculateDedupedLifetimeSpend(u.id, userIntents, userPayments);

    const now = new Date();
    const activeSubs = userSubs.filter(s =>
      s.status === 'active' && s.current_period_end && new Date(s.current_period_end) > now
    );

    // Last payment: most recent intent or payment by date
    const allDated = [...userIntents, ...userPayments]
      .map(r => ({ status: r.status, date: r.created_date || null }))
      .filter(r => r.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const lastPayment = allDated[0] || null;
    const hasFailed = userIntents.some(i => ['failed', 'underpaid', 'currency_mismatch', 'payment_review', 'cancelled'].includes(i.status));
    const hasPending = userIntents.some(i => i.status === 'pending');
    const hasPpv = userPayments.some(p => p.payment_type === 'ppv');

    return {
      user_id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      created_date: u.created_date,
      linked_performer: linkedPerformer,
      active_subscription_count: activeSubs.length,
      lifetime_spend_usd: deduped.amount,
      payment_count: userIntents.length + userPayments.length,
      last_payment_status: lastPayment?.status || null,
      last_payment_date: lastPayment?.date || null,
      _has_active_subscription: activeSubs.length > 0,
      _has_payments: userIntents.length > 0 || userPayments.length > 0,
      _has_failed: hasFailed,
      _has_pending: hasPending,
      _has_ppv: hasPpv,
      _is_linked_performer: !!linkedPerformer,
    };
  });

  // Apply search
  if (search) {
    const q = search.toLowerCase();
    enriched = enriched.filter(u =>
      (u.email || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.user_id || '').toLowerCase().includes(q) ||
      (u.linked_performer?.display_name || '').toLowerCase().includes(q)
    );

    // Also search by provider_session_id in intents
    if (enriched.length === 0) {
      const matchedIntent = allIntents.find(i =>
        (i.provider_session_id || '').toLowerCase().includes(q) ||
        (i.id || '').toLowerCase().includes(q)
      );
      if (matchedIntent) {
        const user = users.find(u => u.id === matchedIntent.user_id);
        if (user) {
          const match = enriched.find(e => e.user_id === user.id);
          if (!match) {
            enriched = enriched.concat(users.filter(u => u.id === matchedIntent.user_id));
          }
        }
      }
    }
  }

  // Apply filters
  const { role, has_active_subscription, has_payments, has_failed_payments, has_guest_productions, linked_performer, date_from, date_to } = filters;

  if (role) enriched = enriched.filter(u => u.role === role);
  if (has_active_subscription) enriched = enriched.filter(u => u._has_active_subscription);
  if (has_payments) enriched = enriched.filter(u => u._has_payments);
  if (has_failed_payments) enriched = enriched.filter(u => u._has_failed);
  if (linked_performer) enriched = enriched.filter(u => u._is_linked_performer);

  if (has_guest_productions) {
    const apps = await base44.asServiceRole.entities.GuestProductionApplication.list('-created_date', 500);
    const userIdsWithApps = new Set(apps.filter(a => a.applicant_user_id).map(a => a.applicant_user_id));
    enriched = enriched.filter(u => userIdsWithApps.has(u.user_id));
  }

  if (date_from) enriched = enriched.filter(u => u.created_date && new Date(u.created_date) >= new Date(date_from));
  if (date_to) enriched = enriched.filter(u => u.created_date && new Date(u.created_date) <= new Date(date_to));

  // Strip internal _flags before returning
  const cleaned = enriched.map(u => {
    const { _has_active_subscription, _has_payments, _has_failed, _has_pending, _has_ppv, _is_linked_performer, ...safe } = u;
    return safe;
  });

  const total = cleaned.length;
  const offset = (page - 1) * limit;
  const paginated = cleaned.slice(offset, offset + limit);

  return { users: paginated, total, page, limit };
}

// ── get_user_detail ────────────────────────────────────────────────────────────
async function getUserDetail(base44, body) {
  const { userId } = body;
  if (!userId) return { error: 'userId required' };

  const [users, intents, payments, subs, performers, guestApps] = await Promise.all([
    base44.asServiceRole.entities.User.list('-created_date', 500),
    base44.asServiceRole.entities.PaymentIntent.filter({ user_id: userId }),
    base44.asServiceRole.entities.Payment.filter({ user_id: userId }),
    base44.asServiceRole.entities.Subscription.filter({ user_id: userId }),
    base44.asServiceRole.entities.Performer.list(),
    base44.asServiceRole.entities.GuestProductionApplication.filter({ applicant_user_id: userId }),
  ]);

  const user = users.find(u => u.id === userId);
  if (!user) return { error: 'User not found' };

  const linkedPerformer = performers.find(p => p.user_id === userId) || null;

  // Deduped lifetime spend
  const deduped = calculateDedupedLifetimeSpend(userId, intents, payments);

  const now = new Date();
  const activeSubs = subs.filter(s =>
    s.status === 'active' && s.current_period_end && new Date(s.current_period_end) > now
  );

  const ppvPurchases = payments.filter(p => p.payment_type === 'ppv' && p.status === 'completed');

  const allDated = [...intents, ...payments]
    .filter(r => r.created_date)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const lastItem = allDated[0] || null;

  return {
    user: {
      user_id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_date: user.created_date,
    },
    linked_performer: linkedPerformer ? {
      id: linkedPerformer.id,
      display_name: linkedPerformer.display_name,
      slug: linkedPerformer.slug,
      profile_image_url: linkedPerformer.profile_image_url,
    } : null,
    summary: {
      lifetime_spend_usd: deduped.amount,
      lifetime_spend_debug: {
        completed_intent_count: deduped.intentCount,
        completed_payment_count: deduped.paymentCount,
        deduped_intent_count: deduped.dedupedCount,
        excluded_intent_ids: deduped.excludedIntentIds,
        dedup_methods: deduped.dedupeMethods,
      },
      payment_count: intents.length + payments.length,
      active_subscription_count: activeSubs.length,
      ppv_purchase_count: ppvPurchases.length,
      guest_production_count: guestApps.length,
      last_payment_date: lastItem?.created_date || null,
      last_payment_status: lastItem?.status || null,
    },
  };
}

// ── get_user_payments ──────────────────────────────────────────────────────────
async function getUserPayments(base44, body) {
  const { userId } = body;
  if (!userId) return { error: 'userId required' };

  const [intents, payments] = await Promise.all([
    base44.asServiceRole.entities.PaymentIntent.filter({ user_id: userId }),
    base44.asServiceRole.entities.Payment.filter({ user_id: userId }),
  ]);

  // Enrich intents with video/application info
  const videoIds = [...new Set(intents.filter(i => i.video_id).map(i => i.video_id))];
  const appIds = [...new Set(intents.filter(i => i.application_id).map(i => i.application_id))];

  const [videos, apps] = await Promise.all([
    videoIds.length > 0
      ? base44.asServiceRole.entities.Video.list().then(all => all.filter(v => videoIds.includes(v.id)))
      : Promise.resolve([]),
    appIds.length > 0
      ? base44.asServiceRole.entities.GuestProductionApplication.list().then(all => all.filter(a => appIds.includes(a.id)))
      : Promise.resolve([]),
  ]);

  const videoById = Object.fromEntries(videos.map(v => [v.id, { id: v.id, title: v.title, slug: v.slug }]));
  const appById = Object.fromEntries(apps.map(a => [a.id, { id: a.id, applicant_name: a.applicant_name, status: a.status, production_package: a.production_package }]));

  const enrichedIntents = intents
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .map(i => ({
      record_type: 'payment_intent',
      id: i.id,
      payment_type: i.payment_type,
      provider: i.provider,
      provider_session_id: i.provider_session_id || null,
      plan_id: i.plan_id || null,
      plan_label: i.plan_id ? planLabel(i.plan_id) : null,
      amount: i.amount,
      currency: i.currency,
      status: i.status,
      checkout_url: i.status === 'pending' ? i.checkout_url : null,
      created_date: i.created_date,
      completed_at: i.completed_at || null,
      failed_at: i.failed_at || null,
      cancelled_at: i.cancelled_at || null,
      error_message: i.error_message || null,
      metadata: i.metadata || null,
      related_video: i.video_id ? (videoById[i.video_id] || { id: i.video_id }) : null,
      related_application: i.application_id ? (appById[i.application_id] || { id: i.application_id }) : null,
    }));

  // Also enrich Payment records with video title
  const paymentVideoIds = [...new Set(payments.filter(p => p.related_entity_type === 'Video' && p.related_entity_id).map(p => p.related_entity_id))];
  const extraVideos = paymentVideoIds.filter(id => !videoById[id]).length > 0
    ? await base44.asServiceRole.entities.Video.list().then(all => all.filter(v => paymentVideoIds.includes(v.id)))
    : [];
  for (const v of extraVideos) videoById[v.id] = { id: v.id, title: v.title, slug: v.slug };

  const enrichedPayments = payments
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .map(p => ({
      record_type: 'payment',
      id: p.id,
      payment_type: p.payment_type,
      amount_usd: p.amount_usd,
      currency: p.currency,
      status: p.status,
      related_entity_type: p.related_entity_type || null,
      related_entity_id: p.related_entity_id || null,
      related_video: (p.related_entity_type === 'Video' && p.related_entity_id)
        ? (videoById[p.related_entity_id] || { id: p.related_entity_id })
        : null,
      metadata: p.metadata || null,
      created_date: p.created_date,
    }));

  return { intents: enrichedIntents, payments: enrichedPayments };
}

// ── get_user_subscriptions ─────────────────────────────────────────────────────
async function getUserSubscriptions(base44, body) {
  const { userId } = body;
  if (!userId) return { error: 'userId required' };

  const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });

  const now = new Date();
  const enriched = subs
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .map(s => ({
      id: s.id,
      fanclub_id: s.fanclub_id,
      plan_label: planLabel(s.fanclub_id),
      status: s.status,
      amount_usd: s.amount_usd,
      current_period_start: s.current_period_start || null,
      current_period_end: s.current_period_end || null,
      cancelled_at: s.cancelled_at || null,
      entitlement_active: !!(
        s.status === 'active' &&
        s.current_period_end &&
        new Date(s.current_period_end) > now
      ),
      provider_session_ref: s.stripe_subscription_id || null,
      created_date: s.created_date,
    }));

  return { subscriptions: enriched };
}

// ── get_user_purchases ─────────────────────────────────────────────────────────
async function getUserPurchases(base44, body) {
  const { userId } = body;
  if (!userId) return { error: 'userId required' };

  const payments = await base44.asServiceRole.entities.Payment.filter({ user_id: userId });
  const ppv = payments.filter(p => p.payment_type === 'ppv');

  const videoIds = [...new Set(ppv.filter(p => p.related_entity_id).map(p => p.related_entity_id))];
  const videos = videoIds.length > 0
    ? await base44.asServiceRole.entities.Video.list().then(all => all.filter(v => videoIds.includes(v.id)))
    : [];
  const videoById = Object.fromEntries(videos.map(v => [v.id, v]));

  const enriched = ppv
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .map(p => {
      const video = p.related_entity_id ? videoById[p.related_entity_id] : null;
      return {
        payment_id: p.id,
        video_id: p.related_entity_id || null,
        video_title: video?.title || null,
        video_slug: video?.slug || null,
        amount_usd: p.amount_usd,
        currency: p.currency,
        status: p.status,
        created_date: p.created_date,
        access_active: p.status === 'completed',
      };
    });

  return { purchases: enriched };
}

// ── get_user_guest_productions ─────────────────────────────────────────────────
async function getUserGuestProductions(base44, body) {
  const { userId } = body;
  if (!userId) return { error: 'userId required' };

  const apps = await base44.asServiceRole.entities.GuestProductionApplication.filter({ applicant_user_id: userId });

  const appIds = apps.map(a => a.id);
  const payments = appIds.length > 0
    ? await base44.asServiceRole.entities.Payment.list().then(all =>
        all.filter(p => p.related_entity_type === 'GuestProductionApplication' && appIds.includes(p.related_entity_id))
      )
    : [];
  const intents = appIds.length > 0
    ? await base44.asServiceRole.entities.PaymentIntent.list().then(all =>
        all.filter(i => appIds.includes(i.application_id))
      )
    : [];

  const paymentByApp = {};
  for (const p of payments) paymentByApp[p.related_entity_id] = p;
  const intentByApp = {};
  for (const i of intents) intentByApp[i.application_id] = i;

  const enriched = apps
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .map(a => {
      const payment = paymentByApp[a.id] || null;
      const intent = intentByApp[a.id] || null;
      return {
        application_id: a.id,
        applicant_name: a.applicant_name,
        request_type: a.request_type,
        production_package: a.production_package || null,
        status: a.status,
        submitted_at: a.submitted_at || a.created_date,
        created_date: a.created_date,
        payment_status: payment?.status || intent?.status || null,
        payment_amount: payment?.amount_usd || intent?.amount || null,
        payment_provider: intent?.provider || null,
        payment_session_id: intent?.provider_session_id || null,
      };
    });

  return { guest_productions: enriched };
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'list_users':
        return Response.json(await listUsers(base44, body));
      case 'get_user_detail':
        return Response.json(await getUserDetail(base44, body));
      case 'get_user_payments':
        return Response.json(await getUserPayments(base44, body));
      case 'get_user_subscriptions':
        return Response.json(await getUserSubscriptions(base44, body));
      case 'get_user_purchases':
        return Response.json(await getUserPurchases(base44, body));
      case 'get_user_guest_productions':
        return Response.json(await getUserGuestProductions(base44, body));
      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('[adminUserService]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});