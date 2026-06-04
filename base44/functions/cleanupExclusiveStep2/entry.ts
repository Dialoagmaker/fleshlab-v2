/**
 * cleanupExclusiveStep2
 *
 * Safe pre-payment pricing cleanup — Step 2 only.
 *
 * Corrects the overused is_exclusive flag. Updates ONLY is_exclusive.
 * No access_tier, ppv_enabled, pricing, duration_seconds, categories, or tags changed.
 *
 * Usage:
 *   POST {}                  → dry_run (safe preview, no writes)
 *   POST { execute: true }   → live write of dry-run-approved list only
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─── Rules ────────────────────────────────────────────────────────────────────
//
// KEEP is_exclusive=true only when ALL of the following apply:
//   1. Video is genuinely premium/flagship (long runtime, rare content, or top performer)
//   2. Access tier is ppv OR it is a clear premium candidate in fanclub/standard
//   3. Duration is known and >= 720s (12 min), OR content is explicitly special
//
// CLEAR is_exclusive=false when ANY of the following apply:
//   A. Duration known and < 90s  (short teaser — exclusive badge has no meaning)
//   B. Duration known and < 300s AND not ppv_enabled  (short clip, not targeted for PPV)
//   C. access_tier = 'free' AND ppv_enabled = false AND duration < 720s
//      (free non-monetized content — exclusive badge misleads)
//   D. access_tier = 'free' AND ppv_enabled = false AND duration = 0/missing
//      (free, no ppv intent, unknown duration — safe to clear)
//   E. access_tier = 'fanclub' AND ppv_enabled = true AND duration < 90s
//      (very short fanclub teaser — not exclusive)
//   F. access_tier = 'ppv' AND duration < 90s  (ppv-flagged but too short — was mis-set)
//
// SKIP (manual_review) when:
//   - duration is 0/missing AND (access_tier = 'ppv' OR ppv_enabled = true)
//     because we can't safely classify without knowing the length
//
// KEEP (confirmed premium) when:
//   - access_tier = 'ppv' AND duration >= 900s (long premium scene)
//   - is_exclusive currently true AND duration >= 1200s (definitely long)
//   - Specific known flagship title (Kenji Fox deepthroat scene)
//
// ─────────────────────────────────────────────────────────────────────────────

const CONFIRMED_PREMIUM_SLUGS = new Set([
  // Kenji Fox Deepthroats — 30m46s, PPV, confirmed premium
  'filipino-twink-sucks-big-dick-swallows-gay-adult-content-twink-cum-shots-gay-porn-sites',
  // Benvao long shower/bedroom — 28m39s
  'watch-this-asian-man-masturbate-in-the-shower-and-finish-it-in-bed',
]);

function classify(v) {
  const dur = v.duration_seconds || 0;
  const tier = v.access_tier || 'free';
  const ppvOn = !!v.ppv_enabled;
  const missingDur = !dur || dur <= 0;

  // Confirmed premium slugs always KEEP
  if (CONFIRMED_PREMIUM_SLUGS.has(v.slug)) {
    return { action: 'keep', reason: 'Confirmed flagship premium scene — explicit keep list' };
  }

  // Short teaser rule — always clear regardless of tier
  if (!missingDur && dur < 90) {
    return { action: 'clear', reason: `Very short teaser (${fmtDur(dur)}) — exclusive badge has no meaning on teasers` };
  }

  // Short clip, not ppv_enabled
  if (!missingDur && dur < 300 && !ppvOn) {
    return { action: 'clear', reason: `Short clip (${fmtDur(dur)}), not ppv_enabled — not premium content` };
  }

  // Missing duration: safe to clear only if free + no ppv intent
  if (missingDur && tier === 'free' && !ppvOn) {
    return { action: 'clear', reason: 'Missing duration, free tier, ppv_enabled=false — no monetization signal, safe to clear' };
  }

  // Missing duration + ppv intent → cannot safely classify
  if (missingDur && (tier === 'ppv' || ppvOn)) {
    return { action: 'manual_review', reason: 'Missing duration with ppv intent — cannot safely classify without known length' };
  }

  // Long scene (20+ min) in PPV → keep
  if (!missingDur && dur >= 1200 && tier === 'ppv') {
    return { action: 'keep', reason: `Long PPV scene (${fmtDur(dur)}) — warrants exclusive badge` };
  }

  // Long scene (20+ min) anywhere → keep
  if (!missingDur && dur >= 1200) {
    return { action: 'keep', reason: `Long scene (${fmtDur(dur)}) — premium content by runtime` };
  }

  // PPV-enabled, decent length (12+ min) → keep (will be monetized, badge meaningful)
  if (!missingDur && dur >= 720 && ppvOn) {
    return { action: 'keep', reason: `PPV-enabled full scene (${fmtDur(dur)}) — badge meaningful for a paid product` };
  }

  // Free, not ppv_enabled, any length → clear
  if (tier === 'free' && !ppvOn) {
    return { action: 'clear', reason: `Free tier, ppv_enabled=false (${fmtDur(dur)}) — exclusive badge misleads on freely available content` };
  }

  // Fanclub very short teasers (already caught by <90s above, belt-and-suspenders)
  if (tier === 'fanclub' && !missingDur && dur < 120) {
    return { action: 'clear', reason: `Fanclub teaser (${fmtDur(dur)}) — too short to carry exclusive badge` };
  }

  // PPV-enabled mid-length solo (5–12 min) — exclusive not warranted at $6.99 entry price
  if (ppvOn && !missingDur && dur >= 300 && dur < 720) {
    return { action: 'clear', reason: `Mid-length PPV Short/Solo (${fmtDur(dur)}) — $6.99 entry tier, exclusive badge not warranted` };
  }

  // Anything else with ppv_enabled and reasonable length → keep (uncertain, err on side of keep)
  if (ppvOn && !missingDur && dur >= 720) {
    return { action: 'keep', reason: `PPV-enabled, sufficient length (${fmtDur(dur)}) — keep for now` };
  }

  // Default: if we can't confidently classify, keep (safer than accidental clear)
  return { action: 'keep', reason: `No clear signal to remove — keeping as default safe action (${fmtDur(dur)}, tier=${tier}, ppv=${ppvOn})` };
}

function fmtDur(s) {
  if (!s || s <= 0) return '—';
  const m = Math.floor(s / 60), sec = s % 60;
  return sec > 0 ? `${m}m${sec}s` : `${m}m`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const execute = body.execute === true;

    // Fetch all published videos that currently have is_exclusive = true
    const allPublished = await base44.asServiceRole.entities.Video.filter({ status: 'published' }, '-created_date', 500);
    const exclusiveVideos = allPublished.filter(v => !!v.is_exclusive);
    const totalExclusive = exclusiveVideos.length;
    const totalPublished = allPublished.length;

    const toClear = [];
    const toKeep = [];
    const manualReview = [];

    for (const v of exclusiveVideos) {
      const result = classify(v);
      const entry = {
        title: v.title,
        slug: v.slug,
        video_id: v.id,
        access_tier: v.access_tier,
        ppv_enabled: !!v.ppv_enabled,
        duration: fmtDur(v.duration_seconds),
        duration_s: v.duration_seconds || 0,
        reason: result.reason,
        admin_url: `/admin/videos/${v.id}`,
      };

      if (result.action === 'clear')         toClear.push(entry);
      else if (result.action === 'keep')     toKeep.push(entry);
      else                                   manualReview.push(entry);
    }

    // Execute writes if requested
    let writeResults = null;
    if (execute) {
      const writes = await Promise.allSettled(
        toClear.map(v =>
          base44.asServiceRole.entities.Video.update(v.video_id, { is_exclusive: false })
            .then(() => ({ video_id: v.video_id, title: v.title, status: 'updated' }))
            .catch(err => ({ video_id: v.video_id, title: v.title, status: 'error', error: err.message }))
        )
      );
      writeResults = writes.map(r => r.status === 'fulfilled' ? r.value : r.reason);
    }

    const successCount = writeResults ? writeResults.filter(r => r.status === 'updated').length : 0;
    const errorCount   = writeResults ? writeResults.filter(r => r.status === 'error').length : 0;
    const finalExclusiveCount = execute
      ? (totalExclusive - successCount)
      : null;

    return Response.json({
      mode: execute ? 'EXECUTE' : 'DRY_RUN',
      only_field_changed: 'is_exclusive',
      unchanged_fields: ['access_tier', 'ppv_enabled', 'pricing', 'duration_seconds', 'categories', 'tags'],

      A_current_is_exclusive_count: totalExclusive,
      A_total_published_videos: totalPublished,

      B_proposed_to_clear: {
        count: toClear.length,
        videos: toClear,
      },

      C_proposed_to_keep_true: {
        count: toKeep.length,
        videos: toKeep,
      },

      D_manual_review_exclusions: {
        count: manualReview.length,
        note: 'These videos have ppv intent but missing duration — is_exclusive NOT touched',
        videos: manualReview,
      },

      E_dry_run_summary: execute ? null : {
        would_clear: toClear.length,
        would_keep: toKeep.length,
        would_skip_manual_review: manualReview.length,
        net_exclusive_after: totalExclusive - toClear.length,
        action_required: 'POST { "execute": true } to apply',
      },

      F_execute_result: execute ? {
        attempted: toClear.length,
        successfully_updated: successCount,
        errors: errorCount,
        error_detail: writeResults?.filter(r => r.status === 'error') || [],
      } : null,

      G_final_is_exclusive_count: finalExclusiveCount,

      H_final_verdict: execute
        ? (errorCount === 0
          ? `Step 2 complete. Cleared is_exclusive on ${successCount} videos. ${toKeep.length} premium videos retain the badge. ${manualReview.length} skipped (manual review). is_exclusive is now a meaningful premium signal.`
          : `Step 2 partial. ${successCount} cleared, ${errorCount} errors. Review F_execute_result.`)
        : `DRY RUN only — no data written. ${toClear.length} videos proposed to clear, ${toKeep.length} to keep true, ${manualReview.length} excluded (manual review). POST { "execute": true } to apply.`,
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});