/**
 * adminGenerateMonthlyCloseoutDrafts — Admin-Only Closeout Draft Generation
 *
 * SAFETY:
 * - Admin-only
 * - dry_run=true by default (no writes unless explicitly set false)
 * - Only creates PerformerEarning records with status="draft"
 * - Never approves, never marks paid, never sends notifications
 * - Never modifies RevenueLineItems or VideoStatSnapshots
 * - Idempotent: skips if draft/approved/paid/on_hold already exists for same performer+month
 * - Aggregates BOTH PerformerEarningLineItems AND VideoStatSnapshot revenue
 * - Deduplicates VideoStatSnapshots already linked via LineItem source_reference_id
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function isTestLineItem(item) {
  if (!item) return false;
  if (item.test_mode === true) return true;
  try {
    const desc = JSON.parse(item.description || '{}');
    if (desc.test_mode === true || desc.simulated === true) return true;
    if (desc.note) {
      const note = desc.note.toUpperCase();
      if (note.includes('TEST') || note.includes('SIMULATED') || note.includes('REVENUE_ATTRIBUTION_TEST')) return true;
    }
  } catch {}
  if (item.notes) {
    const notes = item.notes.toUpperCase();
    if (notes.includes('TEST') || notes.includes('SIMULATED')) return true;
  }
  return false;
}

function classifySource(li) {
  const sources = { is_internal_fleshlab: false, is_external: false, is_livecam: false, is_imported_platform: false };
  if (li.source_type && ['ppv_purchase', 'fanclub_subscription', 'custom_content'].includes(li.source_type)) {
    if (li.source_platform === 'fleshlab' || li.source_platform === 'internal') sources.is_internal_fleshlab = true;
  }
  if (li.source_type && ['video_platform', 'livecam', 'bonus', 'manual_adjustment'].includes(li.source_type)) {
    sources.is_external = true;
    if (li.source_platform && ['chaturbate', 'stripchat', 'bongacams', 'livejasmin'].includes(li.source_platform)) sources.is_livecam = true;
    if (li.source_platform && ['xhamster', 'faphouse', 'pornhub', 'xvideos', 'boyfriendtv', 'zapping'].includes(li.source_platform)) sources.is_imported_platform = true;
  }
  return sources;
}

const PAYOUT_THRESHOLD = 100;
const LIVECAM_PLATFORMS = new Set(['chaturbate', 'stripchat', 'bongacams', 'livejasmin']);
const VIEWSHARE_PLATFORMS = new Set(['xhamster', 'faphouse', 'pornhub', 'xvideos', 'boyfriendtv', 'zapping']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required', success: false }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { month, performer_id, include_test_mode = false, dry_run = true } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ error: 'Invalid month format. Use YYYY-MM', success: false }, { status: 400 });
    }

    console.log('[adminGenerateMonthlyCloseoutDrafts] Request:', { admin: user.email, month, performer_id, include_test_mode, dry_run });

    // ── Fetch source data in parallel ────────────────────────────────────────
    const [allLineItems, allPerformers, allEarnings, allStats] = await Promise.all([
      base44.asServiceRole.entities.PerformerEarningLineItem.filter({}),
      base44.asServiceRole.entities.Performer.list(),
      base44.asServiceRole.entities.PerformerEarning.filter({}),
      base44.asServiceRole.entities.VideoStatSnapshot.filter({ period_month: month }),
    ]);

    const performerMap = {};
    allPerformers.forEach(p => { performerMap[p.id] = p; });

    const earningsMap = {};
    allEarnings.forEach(e => { earningsMap[`${e.performer_id}:${e.period_month}`] = e; });

    // Build dedup set
    const linkedStatIds = new Set();
    allLineItems.forEach(li => {
      if (li.source_reference_id && li.source_type === 'video_platform') linkedStatIds.add(li.source_reference_id);
    });

    // Filter LineItems
    let lineItems = allLineItems.filter(li => {
      if (li.period_month !== month) return false;
      if (!include_test_mode && isTestLineItem(li)) return false;
      return true;
    });
    if (performer_id) lineItems = lineItems.filter(li => li.performer_id === performer_id);

    // Filter VideoStatSnapshots
    let statsWithRevenue = allStats.filter(s =>
      (s.revenue_usd || 0) > 0 &&
      !linkedStatIds.has(s.id) &&
      s.performer_id &&
      (include_test_mode || !s.notes?.toUpperCase().includes('TEST'))
    );
    if (performer_id) statsWithRevenue = statsWithRevenue.filter(s => s.performer_id === performer_id);

    const excludedTestCount = include_test_mode ? 0 : allLineItems.filter(li =>
      li.period_month === month && isTestLineItem(li)
    ).length;

    // ── Aggregate by performer ───────────────────────────────────────────────
    const performerSummary = {};

    const ensurePerformer = (pid) => {
      if (!performerSummary[pid]) {
        performerSummary[pid] = {
          performer_id: pid,
          performer_name: performerMap[pid]?.display_name || 'Unknown',
          gross_revenue_total: 0,
          performer_share_total: 0,
          studio_share_total: 0,
          line_item_count: 0,
          videostat_count: 0,
          line_item_ids: [],
          videostat_ids: [],
          source_breakdown: {
            livecam_gross: 0,
            viewshare_gross: 0,
            internal_fleshlab_gross: 0,
            other_external_gross: 0,
          },
        };
      }
      return performerSummary[pid];
    };

    lineItems.forEach(li => {
      const s = ensurePerformer(li.performer_id);
      s.gross_revenue_total += (li.gross_amount_usd || 0);
      s.performer_share_total += (li.performer_amount_usd || 0);
      s.studio_share_total += (li.studio_amount_usd || 0);
      s.line_item_count++;
      s.line_item_ids.push(li.id);

      const src = classifySource(li);
      if (src.is_livecam) s.source_breakdown.livecam_gross += (li.gross_amount_usd || 0);
      else if (src.is_imported_platform) s.source_breakdown.viewshare_gross += (li.gross_amount_usd || 0);
      else if (src.is_internal_fleshlab) s.source_breakdown.internal_fleshlab_gross += (li.gross_amount_usd || 0);
      else if (src.is_external) s.source_breakdown.other_external_gross += (li.gross_amount_usd || 0);
    });

    statsWithRevenue.forEach(stat => {
      const performer = performerMap[stat.performer_id];
      if (!performer) return;

      const splitPct = performer.revenue_split_pct || 40;
      const gross = stat.revenue_usd || 0;
      const performerShare = Math.round(gross * splitPct) / 100;
      const studioShare = Math.round(gross * (100 - splitPct)) / 100;

      const s = ensurePerformer(stat.performer_id);
      s.gross_revenue_total += gross;
      s.performer_share_total += performerShare;
      s.studio_share_total += studioShare;
      s.videostat_count++;
      s.videostat_ids.push(stat.id);

      const platform = stat.platform || '';
      if (LIVECAM_PLATFORMS.has(platform)) s.source_breakdown.livecam_gross += gross;
      else if (VIEWSHARE_PLATFORMS.has(platform)) s.source_breakdown.viewshare_gross += gross;
      else s.source_breakdown.other_external_gross += gross;
    });

    // ── Determine action per performer ───────────────────────────────────────
    const results = [];

    for (const summary of Object.values(performerSummary)) {
      const earningsKey = `${summary.performer_id}:${month}`;
      const existingEarning = earningsMap[earningsKey];
      const existing_status = existingEarning?.status || 'not_generated';

      let payout_action_preview;
      if (existing_status === 'paid') payout_action_preview = 'skip_paid';
      else if (existing_status === 'on_hold' || existing_status === 'held') payout_action_preview = 'skip_on_hold';
      else if (existing_status === 'draft' || existing_status === 'approved') payout_action_preview = 'skip_existing_draft';
      else if (summary.performer_share_total < PAYOUT_THRESHOLD) payout_action_preview = 'carryover';
      else payout_action_preview = 'create_draft';

      const result = {
        performer_id: summary.performer_id,
        performer_name: summary.performer_name,
        performer_share_total: summary.performer_share_total,
        studio_share_total: summary.studio_share_total,
        gross_revenue_total: summary.gross_revenue_total,
        line_item_count: summary.line_item_count,
        videostat_count: summary.videostat_count,
        payout_action_preview,
        existing_status,
        draft_id: null,
        action_taken: null,
        reason: null,
      };

      if (payout_action_preview !== 'create_draft') {
        result.action_taken = payout_action_preview;
        result.reason = payout_action_preview === 'carryover'
          ? `Performer share $${summary.performer_share_total.toFixed(2)} is below $${PAYOUT_THRESHOLD} threshold`
          : payout_action_preview === 'skip_paid' ? 'Payout already marked as paid — skipped'
          : payout_action_preview === 'skip_on_hold' ? 'Payout is on hold — skipped'
          : 'Draft or approved payout already exists — skipped (idempotent)';
        results.push(result);
        continue;
      }

      if (dry_run) {
        result.action_taken = 'would_create_draft';
        result.reason = `Eligible ($${summary.performer_share_total.toFixed(2)} ≥ $${PAYOUT_THRESHOLD}) — dry run, no write`;
        results.push(result);
        continue;
      }

      // Re-check before write (double guard)
      const recheckEarnings = await base44.asServiceRole.entities.PerformerEarning.filter({
        performer_id: summary.performer_id,
        period_month: month,
      });
      if (recheckEarnings.length > 0) {
        result.action_taken = 'skipped_existing_draft';
        result.existing_status = recheckEarnings[0].status || 'draft';
        result.reason = `Draft already exists (status: ${result.existing_status}) — idempotent skip`;
        results.push(result);
        continue;
      }

      const draftRecord = await base44.asServiceRole.entities.PerformerEarning.create({
        performer_id: summary.performer_id,
        period_month: month,
        total_gross_usd: summary.gross_revenue_total,
        total_performer_usd: summary.performer_share_total,
        total_studio_usd: summary.studio_share_total,
        line_item_count: summary.line_item_count + summary.videostat_count,
        status: 'draft',
        notes: JSON.stringify({
          generated_by: user.email,
          generated_by_id: user.id,
          source: 'adminGenerateMonthlyCloseoutDrafts',
          payout_threshold_usd: PAYOUT_THRESHOLD,
          line_item_ids: summary.line_item_ids,
          videostat_ids: summary.videostat_ids,
          source_breakdown: summary.source_breakdown,
          includes_videostat_revenue: summary.videostat_count > 0,
        }),
      });

      result.draft_id = draftRecord.id;
      result.action_taken = 'draft_created';
      result.reason = `Draft created (status: draft) for $${summary.performer_share_total.toFixed(2)} (${summary.line_item_count} line items + ${summary.videostat_count} video stats)`;
      console.log(`[adminGenerateMonthlyCloseoutDrafts] Draft created for ${summary.performer_name}: ${draftRecord.id}`);
      results.push(result);
    }

    const created_count = results.filter(r => r.action_taken === 'draft_created').length;
    const would_create_count = results.filter(r => r.action_taken === 'would_create_draft').length;
    const carryover_count = results.filter(r => r.action_taken === 'carryover').length;
    const skipped_existing_count = results.filter(r =>
      r.action_taken === 'skip_existing_draft' || r.action_taken === 'skipped_existing_draft'
    ).length;

    return Response.json({
      success: true,
      dry_run,
      period: { month, include_test_mode },
      summary: {
        total_performers_evaluated: results.length,
        created_count,
        would_create_count,
        carryover_count,
        skipped_existing_draft_count: skipped_existing_count,
        skipped_paid_count: results.filter(r => r.action_taken === 'skip_paid').length,
        skipped_on_hold_count: results.filter(r => r.action_taken === 'skip_on_hold').length,
        test_records_excluded: excludedTestCount,
        videostat_records_included: statsWithRevenue.length,
        videostat_deduped_count: linkedStatIds.size,
      },
      results,
      safety: {
        no_approvals: true,
        no_payments: true,
        no_notifications: true,
        no_line_item_mutations: true,
        no_videostat_mutations: true,
        only_draft_status_created: true,
        idempotent: true,
      },
      metadata: {
        payout_threshold_usd: PAYOUT_THRESHOLD,
        generated_at: new Date().toISOString(),
        generated_by: user.email,
        generated_by_id: user.id,
        dry_run,
        includes_videostat_revenue: true,
      },
    });

  } catch (error) {
    console.error('[adminGenerateMonthlyCloseoutDrafts] Error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});