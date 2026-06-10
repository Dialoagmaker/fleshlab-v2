/**
 * adminMonthlyPayoutSummary — Admin-Only Read-Only Payout Summary
 *
 * PURPOSE:
 * Provides read-only monthly payout summary showing performer earnings before any payout approval/generation.
 * Aggregates BOTH PerformerEarningLineItems AND VideoStatSnapshot records (xHamster/viewshare revenue).
 * Deduplicates: VideoStatSnapshots already linked to a LineItem (via source_reference_id) are excluded.
 * Does NOT create payouts, mark as paid, or modify any records - reporting only.
 *
 * SECURITY:
 * - Admin-only (role check)
 * - Read-only (no mutations)
 * - Excludes test_mode by default
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── TEST MODE DETECTION ──────────────────────────────────────────────────────
function isTestLineItem(item) {
  if (!item) return false;
  if (item.test_mode === true) return true;
  try {
    const desc = JSON.parse(item.description || '{}');
    if (desc.test_mode === true) return true;
    if (desc.simulated === true) return true;
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

// ── SOURCE CLASSIFICATION ───────────────────────────────────────────────────
function classifySource(li) {
  const sources = {
    is_internal_fleshlab: false,
    is_external: false,
    is_livecam: false,
    is_imported_platform: false,
  };
  if (li.source_type && ['ppv_purchase', 'fanclub_subscription', 'custom_content'].includes(li.source_type)) {
    if (li.source_platform === 'fleshlab' || li.source_platform === 'internal') {
      sources.is_internal_fleshlab = true;
    }
  }
  if (li.source_type && ['video_platform', 'livecam', 'bonus', 'manual_adjustment'].includes(li.source_type)) {
    sources.is_external = true;
    if (li.source_platform && ['chaturbate', 'stripchat', 'bongacams', 'livejasmin'].includes(li.source_platform)) {
      sources.is_livecam = true;
    }
    if (li.source_platform && ['xhamster', 'faphouse', 'pornhub', 'xvideos', 'boyfriendtv', 'zapping'].includes(li.source_platform)) {
      sources.is_imported_platform = true;
    }
  }
  return sources;
}

// ── PAYOUT STATUS DETECTION ─────────────────────────────────────────────────
async function getPayoutStatus(base44, performer_id, month) {
  try {
    const earnings = await base44.asServiceRole.entities.PerformerEarning.filter({ performer_id, period_month: month });
    if (earnings.length === 0) return 'not_generated';
    return earnings[0].status || 'draft';
  } catch (err) {
    console.error('[getPayoutStatus] Error:', err.message);
    return 'unknown';
  }
}

// ── UNPAID CARRYOVER CALCULATION ────────────────────────────────────────────
async function getUnpaidCarryover(base44, performer_id, before_month) {
  try {
    const allLineItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({ performer_id });
    const carryoverItems = allLineItems.filter(li => {
      if (li.period_month >= before_month) return false;
      if (isTestLineItem(li)) return false;
      if (li.status === 'paid') return false;
      return true;
    });
    const total = carryoverItems.reduce((sum, li) => sum + (li.performer_amount_usd || 0), 0);
    return total > 0 ? total : null;
  } catch (err) {
    console.error('[getUnpaidCarryover] Error:', err.message);
    return null;
  }
}

// ── VIDEO STAT SNAPSHOT PLATFORM CLASSIFICATION ─────────────────────────────
const LIVECAM_PLATFORMS = new Set(['chaturbate', 'stripchat', 'bongacams', 'livejasmin']);
const VIEWSHARE_PLATFORMS = new Set(['xhamster', 'faphouse', 'pornhub', 'xvideos', 'boyfriendtv', 'zapping']);

function classifyStatPlatform(platform) {
  if (LIVECAM_PLATFORMS.has(platform)) return 'livecam';
  if (VIEWSHARE_PLATFORMS.has(platform)) return 'viewshare';
  return 'other_external';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required', success: false }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      month,
      performer_id,
      source_platform = 'all',
      include_test_mode = false
    } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ error: 'Invalid month format. Use YYYY-MM', success: false }, { status: 400 });
    }

    console.log('[adminMonthlyPayoutSummary] Request:', { adminUser: user.email, month, performer_id, source_platform, include_test_mode });

    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [allLineItems, allPerformers, allStats] = await Promise.all([
      base44.asServiceRole.entities.PerformerEarningLineItem.filter({}),
      base44.asServiceRole.entities.Performer.list(),
      base44.asServiceRole.entities.VideoStatSnapshot.filter({ period_month: month }),
    ]);

    const performerMap = {};
    allPerformers.forEach(p => { performerMap[p.id] = p; });

    // Build set of VideoStatSnapshot IDs already linked to a LineItem (dedup guard)
    const linkedStatIds = new Set();
    allLineItems.forEach(li => {
      if (li.source_reference_id && li.source_type === 'video_platform') {
        linkedStatIds.add(li.source_reference_id);
      }
    });

    // ── Filter LineItems for this month ─────────────────────────────────────
    const isNotTest = (item) => include_test_mode ? true : !isTestLineItem(item);

    let lineItems = allLineItems.filter(li =>
      li.period_month === month && isNotTest(li)
    );
    if (performer_id) lineItems = lineItems.filter(li => li.performer_id === performer_id);

    // ── Filter VideoStatSnapshots for this month ─────────────────────────────
    // Only include stats with revenue_usd > 0, not already linked to a LineItem, not a test
    let statsWithRevenue = allStats.filter(s => {
      if ((s.revenue_usd || 0) <= 0) return false;                       // no revenue
      if (linkedStatIds.has(s.id)) return false;                          // already counted via LineItem
      if (!include_test_mode && s.notes && s.notes.toUpperCase().includes('TEST')) return false;
      if (!s.performer_id) return false;                                   // no performer link
      return true;
    });
    if (performer_id) statsWithRevenue = statsWithRevenue.filter(s => s.performer_id === performer_id);

    // ── Log dedup info ───────────────────────────────────────────────────────
    const duplicateStatCount = allStats.filter(s => linkedStatIds.has(s.id)).length;
    if (duplicateStatCount > 0) {
      console.log(`[adminMonthlyPayoutSummary] Excluded ${duplicateStatCount} VideoStatSnapshot(s) already linked to LineItems (dedup)`);
    }

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
          videostat_gross: 0,
          source_breakdown: {
            livecam_gross: 0,
            viewshare_gross: 0,
            internal_fleshlab_gross: 0,
            other_external_gross: 0,
          },
          line_items: [],
        };
      }
      return performerSummary[pid];
    };

    // Aggregate LineItems
    lineItems.forEach(li => {
      const summary = ensurePerformer(li.performer_id);
      summary.gross_revenue_total += (li.gross_amount_usd || 0);
      summary.performer_share_total += (li.performer_amount_usd || 0);
      summary.studio_share_total += (li.studio_amount_usd || 0);
      summary.line_item_count++;

      const sources = classifySource(li);
      if (sources.is_livecam) summary.source_breakdown.livecam_gross += (li.gross_amount_usd || 0);
      else if (sources.is_imported_platform) summary.source_breakdown.viewshare_gross += (li.gross_amount_usd || 0);
      else if (sources.is_internal_fleshlab) summary.source_breakdown.internal_fleshlab_gross += (li.gross_amount_usd || 0);
      else if (sources.is_external) summary.source_breakdown.other_external_gross += (li.gross_amount_usd || 0);

      summary.line_items.push({
        id: li.id,
        source: 'line_item',
        created_date: li.created_date,
        source_type: li.source_type,
        source_platform: li.source_platform,
        description: li.description,
        gross_amount_usd: li.gross_amount_usd,
        performer_amount_usd: li.performer_amount_usd,
        studio_amount_usd: li.studio_amount_usd,
        status: li.status,
      });
    });

    // Aggregate VideoStatSnapshot revenue (viewshare/external)
    statsWithRevenue.forEach(s => {
      const performer = performerMap[s.performer_id];
      if (!performer) return; // skip orphaned stats

      const splitPct = performer.revenue_split_pct || 40;
      const gross = s.revenue_usd || 0;
      const performerShare = Math.round(gross * splitPct) / 100;
      const studioShare = Math.round(gross * (100 - splitPct)) / 100;

      const summary = ensurePerformer(s.performer_id);
      summary.gross_revenue_total += gross;
      summary.performer_share_total += performerShare;
      summary.studio_share_total += studioShare;
      summary.videostat_count++;
      summary.videostat_gross += gross;

      const platformType = classifyStatPlatform(s.platform || '');
      if (platformType === 'livecam') summary.source_breakdown.livecam_gross += gross;
      else if (platformType === 'viewshare') summary.source_breakdown.viewshare_gross += gross;
      else summary.source_breakdown.other_external_gross += gross;

      summary.line_items.push({
        id: s.id,
        source: 'video_stat_snapshot',
        source_type: 'video_platform',
        source_platform: s.platform,
        description: s.external_title || `${s.platform} viewshare`,
        gross_amount_usd: gross,
        performer_amount_usd: performerShare,
        studio_amount_usd: studioShare,
        performer_share_pct: splitPct,
        views: s.views,
        status: 'estimated',
        not_yet_in_line_items: true,
      });
    });

    // ── ENRICH WITH PAYOUT STATUS & THRESHOLDS ──────────────────────────────
    const PAYOUT_THRESHOLD = 100;

    const enrichedSummaries = await Promise.all(
      Object.values(performerSummary).map(async (summary) => {
        const payout_status = await getPayoutStatus(base44, summary.performer_id, month);
        const unpaid_carryover_amount = await getUnpaidCarryover(base44, summary.performer_id, month);
        const total_eligible = summary.performer_share_total + (unpaid_carryover_amount || 0);
        const minimum_payout_threshold_status = total_eligible >= PAYOUT_THRESHOLD ? 'eligible' : 'below_threshold';

        return {
          ...summary,
          payout_status,
          minimum_payout_threshold_status,
          payout_threshold_amount: PAYOUT_THRESHOLD,
          unpaid_carryover_amount,
          total_eligible_amount: total_eligible,
        };
      })
    );

    enrichedSummaries.sort((a, b) => b.performer_share_total - a.performer_share_total);

    // ── SANITY CHECKS ───────────────────────────────────────────────────────
    const sanityWarnings = [];

    enrichedSummaries.forEach(summary => {
      const splitSum = summary.performer_share_total + summary.studio_share_total;
      const diff = Math.abs(splitSum - summary.gross_revenue_total);
      if (diff > 0.02) {
        sanityWarnings.push({
          code: 'SPLIT_MISMATCH',
          performer_id: summary.performer_id,
          performer_name: summary.performer_name,
          message: `Performer ($${summary.performer_share_total.toFixed(2)}) + Studio ($${summary.studio_share_total.toFixed(2)}) = $${splitSum.toFixed(2)}, but gross is $${summary.gross_revenue_total.toFixed(2)}. Diff: $${diff.toFixed(2)}`,
          severity: 'warning',
        });
      }

      // Verify source breakdown sums to gross
      const breakdownSum = Object.values(summary.source_breakdown).reduce((a, b) => a + b, 0);
      const breakdownDiff = Math.abs(breakdownSum - summary.gross_revenue_total);
      if (breakdownDiff > 0.02) {
        sanityWarnings.push({
          code: 'BREAKDOWN_SUM_MISMATCH',
          performer_id: summary.performer_id,
          performer_name: summary.performer_name,
          message: `Source breakdown sum ($${breakdownSum.toFixed(2)}) ≠ gross ($${summary.gross_revenue_total.toFixed(2)})`,
          severity: 'warning',
        });
      }
    });

    // Report on VideoStatSnapshot inclusion
    const totalStatGross = enrichedSummaries.reduce((sum, p) => sum + p.videostat_gross, 0);
    const totalStatCount = enrichedSummaries.reduce((sum, p) => sum + p.videostat_count, 0);
    if (totalStatCount > 0) {
      sanityWarnings.push({
        code: 'VIDEOSTAT_REVENUE_INCLUDED',
        message: `${totalStatCount} VideoStatSnapshot record(s) contributing $${totalStatGross.toFixed(2)} gross revenue included (not yet in LineItems). Deduplication: ${duplicateStatCount} already-linked stat(s) excluded.`,
        severity: 'info',
        stat_count: totalStatCount,
        stat_gross_usd: totalStatGross,
        deduped_count: duplicateStatCount,
      });
    }

    // ── SUMMARY TOTALS ──────────────────────────────────────────────────────
    const total_performer_earnings = enrichedSummaries.reduce((sum, p) => sum + p.performer_share_total, 0);
    const total_studio_share = enrichedSummaries.reduce((sum, p) => sum + p.studio_share_total, 0);
    const total_gross = enrichedSummaries.reduce((sum, p) => sum + p.gross_revenue_total, 0);
    const eligible_count = enrichedSummaries.filter(p => p.minimum_payout_threshold_status === 'eligible').length;
    const below_threshold_count = enrichedSummaries.filter(p => p.minimum_payout_threshold_status === 'below_threshold').length;

    return Response.json({
      success: true,
      period: { month, source_platform, include_test_mode },
      summary: {
        total_performer_earnings,
        total_studio_share,
        total_gross_revenue: total_gross,
        eligible_for_payout_count: eligible_count,
        below_threshold_count,
        total_performers: enrichedSummaries.length,
      },
      performer_summaries: enrichedSummaries,
      sanity_warnings: sanityWarnings,
      metadata: {
        payout_threshold_usd: PAYOUT_THRESHOLD,
        generated_at: new Date().toISOString(),
        generated_by: user.email,
        includes_videostat_revenue: true,
        videostat_dedup_applied: true,
      },
    });

  } catch (error) {
    console.error('[adminMonthlyPayoutSummary] Error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});