/**
 * adminMonthlyCloseoutPreview — Admin-Only Read-Only Closeout Preview
 *
 * PURPOSE:
 * Provides a safe preview of what monthly payout closeout drafts would be generated.
 * Aggregates BOTH PerformerEarningLineItems AND VideoStatSnapshot records (xHamster/viewshare).
 * Deduplicates VideoStatSnapshots already linked via LineItem source_reference_id.
 * Does NOT create any payouts, mark anything paid, or send notifications.
 *
 * SECURITY:
 * - Admin-only (role check)
 * - Read-only (no mutations)
 * - Excludes test_mode by default
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

async function getPayoutStatus(base44, performer_id, month) {
  try {
    const earnings = await base44.asServiceRole.entities.PerformerEarning.filter({ performer_id, period_month: month });
    if (earnings.length === 0) return 'not_generated';
    return earnings[0].status || 'draft';
  } catch { return 'unknown'; }
}

async function getUnpaidCarryover(base44, performer_id, before_month) {
  try {
    const allLineItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({ performer_id });
    const carryoverItems = allLineItems.filter(li =>
      li.period_month < before_month && !isTestLineItem(li) && li.status !== 'paid'
    );
    const total = carryoverItems.reduce((sum, li) => sum + (li.performer_amount_usd || 0), 0);
    return total > 0 ? total : null;
  } catch { return null; }
}

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
    const { month, performer_id, include_test_mode = false } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ error: 'Invalid month format. Use YYYY-MM', success: false }, { status: 400 });
    }

    console.log('[adminMonthlyCloseoutPreview] Request:', { adminUser: user.email, month, performer_id, include_test_mode });

    // ── Fetch all data in parallel ──────────────────────────────────────────
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

    // Build dedup set — VideoStatSnapshot IDs already linked to a LineItem
    const linkedStatIds = new Set();
    allLineItems.forEach(li => {
      if (li.source_reference_id && li.source_type === 'video_platform') linkedStatIds.add(li.source_reference_id);
    });

    const isNotTest = (item) => include_test_mode ? true : !isTestLineItem(item);

    // Filter LineItems
    let lineItems = allLineItems.filter(li => li.period_month === month && isNotTest(li));
    if (performer_id) lineItems = lineItems.filter(li => li.performer_id === performer_id);

    // Filter VideoStatSnapshots
    let statsWithRevenue = allStats.filter(s =>
      (s.revenue_usd || 0) > 0 &&
      !linkedStatIds.has(s.id) &&
      s.performer_id &&
      (include_test_mode || !s.notes?.toUpperCase().includes('TEST'))
    );
    if (performer_id) statsWithRevenue = statsWithRevenue.filter(s => s.performer_id === performer_id);

    // ── AGGREGATE BY PERFORMER ──────────────────────────────────────────────
    const performerSummary = {};

    const ensurePerformer = (pid) => {
      if (!performerSummary[pid]) {
        performerSummary[pid] = {
          performer_id: pid,
          performer_name: performerMap[pid]?.display_name || 'Unknown',
          stage_name: performerMap[pid]?.display_name || 'Unknown',
          month,
          gross_revenue_total: 0,
          performer_share_total: 0,
          studio_share_total: 0,
          line_item_count: 0,
          videostat_count: 0,
          line_item_ids: [],
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

      const platform = stat.platform || '';
      if (LIVECAM_PLATFORMS.has(platform)) s.source_breakdown.livecam_gross += gross;
      else if (VIEWSHARE_PLATFORMS.has(platform)) s.source_breakdown.viewshare_gross += gross;
      else s.source_breakdown.other_external_gross += gross;
    });

    // ── PREVIEW LOGIC ───────────────────────────────────────────────────────
    const PAYOUT_THRESHOLD = 100;

    const enrichedSummaries = await Promise.all(
      Object.values(performerSummary).map(async (summary) => {
        const earningsKey = `${summary.performer_id}:${month}`;
        const existingEarning = earningsMap[earningsKey];
        let existing_payout_status = existingEarning ? (existingEarning.status || 'draft') : 'not_generated';

        const unpaid_carryover_amount = await getUnpaidCarryover(base44, summary.performer_id, month);
        const total_eligible = summary.performer_share_total + (unpaid_carryover_amount || 0);
        const threshold_status = total_eligible >= PAYOUT_THRESHOLD ? 'eligible' : 'below_threshold';

        let payout_action_preview = 'skip_no_data';
        if (existing_payout_status === 'paid') payout_action_preview = 'skip_paid';
        else if (existing_payout_status === 'on_hold' || existing_payout_status === 'held') payout_action_preview = 'skip_on_hold';
        else if (existing_payout_status === 'draft' || existing_payout_status === 'approved') payout_action_preview = 'skip_existing_draft';
        else if (threshold_status === 'below_threshold') payout_action_preview = 'carryover';
        else payout_action_preview = 'create_draft';

        return {
          ...summary,
          existing_payout_status,
          minimum_payout_threshold_status: threshold_status,
          payout_threshold_amount: PAYOUT_THRESHOLD,
          unpaid_carryover_amount,
          total_eligible_amount: total_eligible,
          payout_action_preview,
        };
      })
    );

    enrichedSummaries.sort((a, b) => b.performer_share_total - a.performer_share_total);

    // ── SUMMARY TOTALS ──────────────────────────────────────────────────────
    const total_performer_earnings = enrichedSummaries.reduce((sum, p) => sum + p.performer_share_total, 0);
    const total_studio_share = enrichedSummaries.reduce((sum, p) => sum + p.studio_share_total, 0);
    const eligible_count = enrichedSummaries.filter(p => p.payout_action_preview === 'create_draft').length;
    const below_threshold_count = enrichedSummaries.filter(p => p.payout_action_preview === 'carryover').length;

    // ── SAFETY CHECKS ───────────────────────────────────────────────────────
    const safetyWarnings = [];

    enrichedSummaries.forEach(summary => {
      const splitSum = summary.performer_share_total + summary.studio_share_total;
      const diff = Math.abs(splitSum - summary.gross_revenue_total);
      if (diff > 0.02) {
        safetyWarnings.push({
          code: 'SPLIT_MISMATCH',
          performer_id: summary.performer_id,
          performer_name: summary.performer_name,
          message: `Split sum $${splitSum.toFixed(2)} ≠ gross $${summary.gross_revenue_total.toFixed(2)} (diff $${diff.toFixed(2)})`,
          severity: 'error',
        });
      }
    });

    const totalStatCount = enrichedSummaries.reduce((sum, p) => sum + p.videostat_count, 0);
    const totalStatGross = statsWithRevenue.reduce((sum, s) => sum + (s.revenue_usd || 0), 0);
    if (totalStatCount > 0) {
      safetyWarnings.push({
        code: 'VIDEOSTAT_REVENUE_INCLUDED',
        message: `${totalStatCount} VideoStatSnapshot record(s) contributing $${totalStatGross.toFixed(2)} gross included in preview. ${linkedStatIds.size} already-linked stat(s) excluded (dedup).`,
        severity: 'info',
      });
    }

    if (!include_test_mode) {
      const excludedTestItems = allLineItems.filter(li => li.period_month === month && !isNotTest(li)).length;
      if (excludedTestItems > 0) {
        safetyWarnings.push({
          code: 'TEST_RECORDS_EXCLUDED',
          message: `${excludedTestItems} test mode line items excluded`,
          severity: 'info',
          count: excludedTestItems,
        });
      }
    }

    return Response.json({
      success: true,
      preview_mode: true,
      period: { month, include_test_mode },
      summary: {
        total_performer_earnings,
        total_studio_share,
        total_gross_revenue: enrichedSummaries.reduce((sum, p) => sum + p.gross_revenue_total, 0),
        performers_count: enrichedSummaries.length,
        eligible_count,
        below_threshold_count,
        on_hold_count: enrichedSummaries.filter(p => p.payout_action_preview === 'skip_on_hold').length,
        draft_exists_count: enrichedSummaries.filter(p => p.payout_action_preview === 'skip_existing_draft').length,
        paid_count: enrichedSummaries.filter(p => p.payout_action_preview === 'skip_paid').length,
      },
      performer_previews: enrichedSummaries,
      safety_warnings: safetyWarnings,
      metadata: {
        payout_threshold_usd: PAYOUT_THRESHOLD,
        generated_at: new Date().toISOString(),
        generated_by: user.email,
        preview_only: true,
        no_mutations: true,
        includes_videostat_revenue: true,
        videostat_dedup_applied: true,
      },
    });

  } catch (error) {
    console.error('[adminMonthlyCloseoutPreview] Error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});