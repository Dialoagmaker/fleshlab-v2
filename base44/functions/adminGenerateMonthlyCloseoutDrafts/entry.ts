/**
 * adminGenerateMonthlyCloseoutDrafts — Admin-Only Closeout Draft Generation
 *
 * SAFETY:
 * - Admin-only
 * - dry_run=true by default (no writes unless explicitly set false)
 * - Only creates PerformerEarning records with status="draft"
 * - Never approves, never marks paid, never sends notifications
 * - Never modifies RevenueLineItems
 * - Idempotent: skips if draft/approved/paid/on_hold already exists for same performer+month
 * - Only processes performers where payout_action_preview === "create_draft"
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── TEST MODE DETECTION (identical to adminMonthlyCloseoutPreview) ────────────
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

// ── SOURCE CLASSIFICATION (identical to adminMonthlyCloseoutPreview) ──────────
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

const PAYOUT_THRESHOLD = 100;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ADMIN-ONLY
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required', success: false }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      month,
      performer_id,
      include_test_mode = false,
      dry_run = true,
    } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ error: 'Invalid month format. Use YYYY-MM', success: false }, { status: 400 });
    }

    console.log('[adminGenerateMonthlyCloseoutDrafts] Request:', {
      admin: user.email,
      month,
      performer_id,
      include_test_mode,
      dry_run,
    });

    // ── Fetch source data in parallel ────────────────────────────────────────
    const [allLineItems, allPerformers, allEarnings] = await Promise.all([
      base44.asServiceRole.entities.PerformerEarningLineItem.filter({}),
      base44.asServiceRole.entities.Performer.list(),
      base44.asServiceRole.entities.PerformerEarning.filter({}),
    ]);

    const performerMap = {};
    allPerformers.forEach(p => { performerMap[p.id] = p; });

    // Build map of existing earnings headers
    const earningsMap = {};
    allEarnings.forEach(e => {
      const key = `${e.performer_id}:${e.period_month}`;
      earningsMap[key] = e;
    });

    // Filter line items for target month
    let lineItems = allLineItems.filter(li => {
      if (li.period_month !== month) return false;
      if (!include_test_mode && isTestLineItem(li)) return false;
      return true;
    });
    if (performer_id) {
      lineItems = lineItems.filter(li => li.performer_id === performer_id);
    }

    // Count excluded test records for reporting
    const excludedTestCount = include_test_mode ? 0 : allLineItems.filter(li =>
      li.period_month === month && isTestLineItem(li)
    ).length;

    // ── Aggregate by performer ───────────────────────────────────────────────
    const performerSummary = {};
    lineItems.forEach(li => {
      if (!performerSummary[li.performer_id]) {
        performerSummary[li.performer_id] = {
          performer_id: li.performer_id,
          performer_name: performerMap[li.performer_id]?.display_name || 'Unknown',
          gross_revenue_total: 0,
          performer_share_total: 0,
          studio_share_total: 0,
          line_item_count: 0,
          line_item_ids: [],
          source_breakdown: {
            internal_fleshlab_gross: 0,
            external_platform_gross: 0,
            livecam_gross: 0,
            imported_platform_gross: 0,
          },
        };
      }
      const s = performerSummary[li.performer_id];
      s.gross_revenue_total += (li.gross_amount_usd || 0);
      s.performer_share_total += (li.performer_amount_usd || 0);
      s.studio_share_total += (li.studio_amount_usd || 0);
      s.line_item_count++;
      s.line_item_ids.push(li.id);

      const src = classifySource(li);
      if (src.is_internal_fleshlab) s.source_breakdown.internal_fleshlab_gross += (li.gross_amount_usd || 0);
      if (src.is_external) s.source_breakdown.external_platform_gross += (li.gross_amount_usd || 0);
      if (src.is_livecam) s.source_breakdown.livecam_gross += (li.gross_amount_usd || 0);
      if (src.is_imported_platform) s.source_breakdown.imported_platform_gross += (li.gross_amount_usd || 0);
    });

    // ── Determine preview action per performer (same logic as preview function) ─
    const results = [];

    for (const summary of Object.values(performerSummary)) {
      const earningsKey = `${summary.performer_id}:${month}`;
      const existingEarning = earningsMap[earningsKey];
      const existing_status = existingEarning?.status || 'not_generated';

      // Determine payout_action_preview (SAME logic as adminMonthlyCloseoutPreview)
      let payout_action_preview;
      if (existing_status === 'paid') {
        payout_action_preview = 'skip_paid';
      } else if (existing_status === 'on_hold') {
        payout_action_preview = 'skip_on_hold';
      } else if (existing_status === 'draft' || existing_status === 'approved') {
        payout_action_preview = 'skip_existing_draft';
      } else if (summary.performer_share_total < PAYOUT_THRESHOLD) {
        payout_action_preview = 'carryover';
      } else {
        payout_action_preview = 'create_draft';
      }

      const result = {
        performer_id: summary.performer_id,
        performer_name: summary.performer_name,
        performer_share_total: summary.performer_share_total,
        studio_share_total: summary.studio_share_total,
        gross_revenue_total: summary.gross_revenue_total,
        line_item_count: summary.line_item_count,
        payout_action_preview,
        existing_status,
        draft_id: null,
        action_taken: null,
        reason: null,
      };

      // SAFETY: Only create_draft performers may be processed
      if (payout_action_preview !== 'create_draft') {
        result.action_taken = payout_action_preview; // carryover / skip_paid / skip_on_hold / skip_existing_draft
        result.reason = payout_action_preview === 'carryover'
          ? `Performer share $${summary.performer_share_total.toFixed(2)} is below $${PAYOUT_THRESHOLD} threshold`
          : payout_action_preview === 'skip_paid'
          ? 'Payout already marked as paid — skipped'
          : payout_action_preview === 'skip_on_hold'
          ? 'Payout is on hold — skipped'
          : 'Draft or approved payout already exists — skipped (idempotent)';
        results.push(result);
        continue;
      }

      // ELIGIBLE: payout_action_preview === 'create_draft'
      if (dry_run) {
        result.action_taken = 'would_create_draft';
        result.reason = `Eligible ($${summary.performer_share_total.toFixed(2)} ≥ $${PAYOUT_THRESHOLD}) — dry run, no write`;
        results.push(result);
        continue;
      }

      // dry_run=false: create PerformerEarning draft record
      // SAFETY: Re-check existence right before write (double guard)
      const recheckEarnings = await base44.asServiceRole.entities.PerformerEarning.filter({
        performer_id: summary.performer_id,
        period_month: month,
      });

      if (recheckEarnings.length > 0) {
        const recheckStatus = recheckEarnings[0].status || 'draft';
        result.action_taken = 'skipped_existing_draft';
        result.existing_status = recheckStatus;
        result.reason = `Draft already exists (status: ${recheckStatus}) — idempotent skip`;
        results.push(result);
        continue;
      }

      // Create the draft — status MUST be "draft", never approved/paid
      const draftRecord = await base44.asServiceRole.entities.PerformerEarning.create({
        performer_id: summary.performer_id,
        period_month: month,
        total_gross_usd: summary.gross_revenue_total,
        total_performer_usd: summary.performer_share_total,
        total_studio_usd: summary.studio_share_total,
        line_item_count: summary.line_item_count,
        status: 'draft', // NEVER 'approved' or 'paid'
        notes: JSON.stringify({
          generated_by: user.email,
          generated_by_id: user.id,
          source: 'adminGenerateMonthlyCloseoutDrafts',
          payout_threshold_usd: PAYOUT_THRESHOLD,
          line_item_ids: summary.line_item_ids,
          source_breakdown: summary.source_breakdown,
        }),
      });

      result.draft_id = draftRecord.id;
      result.action_taken = 'draft_created';
      result.reason = `Draft created (status: draft) for $${summary.performer_share_total.toFixed(2)}`;
      console.log(`[adminGenerateMonthlyCloseoutDrafts] Draft created for ${summary.performer_name}: ${draftRecord.id}`);
      results.push(result);
    }

    // ── Build summary counts ─────────────────────────────────────────────────
    const created_count = results.filter(r => r.action_taken === 'draft_created').length;
    const would_create_count = results.filter(r => r.action_taken === 'would_create_draft').length;
    const carryover_count = results.filter(r => r.action_taken === 'carryover').length;
    const skipped_existing_count = results.filter(r =>
      r.action_taken === 'skip_existing_draft' || r.action_taken === 'skipped_existing_draft'
    ).length;
    const skipped_paid_count = results.filter(r => r.action_taken === 'skip_paid').length;
    const skipped_on_hold_count = results.filter(r => r.action_taken === 'skip_on_hold').length;

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
        skipped_paid_count,
        skipped_on_hold_count,
        test_records_excluded: excludedTestCount,
      },
      results,
      safety: {
        no_approvals: true,
        no_payments: true,
        no_notifications: true,
        no_line_item_mutations: true,
        only_draft_status_created: true,
        idempotent: true,
      },
      metadata: {
        payout_threshold_usd: PAYOUT_THRESHOLD,
        generated_at: new Date().toISOString(),
        generated_by: user.email,
        generated_by_id: user.id,
        dry_run,
      },
    });

  } catch (error) {
    console.error('[adminGenerateMonthlyCloseoutDrafts] Error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});