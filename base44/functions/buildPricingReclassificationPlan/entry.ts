/**
 * buildPricingReclassificationPlan — READ-ONLY planning function
 *
 * Generates a full per-video pricing reclassification plan.
 * Does NOT modify any data.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function fmtDur(s) {
  if (!s || s === 0) return '—';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}m${sec > 0 ? sec + 's' : ''}`;
}

/**
 * Core classification logic.
 *
 * Rules (in priority order):
 * 1. No duration + monetized → manual review unless classification very obvious
 * 2. Very short (<90s) → teasers/clips → Free or Fanclub teaser, not PPV
 * 3. Short (90s–7min) solo → PPV Short/Solo $6.99 or Fanclub
 * 4. Full scene (7–20min) solo → PPV Short/Solo $6.99 (good value entry) or Fanclub
 * 5. 2-performer scenes → PPV Standard $12.99
 * 6. Long (20min+) solo or multi → PPV Standard or Premium depending on performer/content
 * 7. Premium Exclusive: only scenes with strong commercial/performer premium signal
 * 8. is_exclusive: should only remain true for genuinely premium/marketing-valuable scenes
 */
function classify(v) {
  const dur = v.duration_seconds || 0;
  const title = (v.title || '').toLowerCase();
  const tags = (v.tags || []).map(t => t.toLowerCase());
  const cats = (v.categories || []).map(c => c.toLowerCase());
  const all = title + ' ' + tags.join(' ') + ' ' + cats.join(' ');

  // Content signal detection
  const isSolo = /solo|masturbat|jerk|stroke|wank|cum|shower|strip|tease|toy|fleshlight|finger|edge|clamp|mirror|bed|bedroom/.test(all);
  const is2Performer = /\brebound\b|raw fuck|takes cock|gets fucked|fuck(ed|ing)|suck(ed|ing)|blowjob|blow job|rimm|breed|creampie|bareback|raw|partner|duo|with|together|threesome|trio|double penetrat/.test(all);
  const isOutdoor = /outdoor|public|park|exhib|dirt path|outside/.test(all);
  const isSpecialContent = /nipple clamp|bondage|fetish|kink|bdsm|dom|sub|domina/.test(all);
  const hasStrongPerformer = /jameson|emjey|yero|dondaddy|feli|josh|kenji fox|cubanue|cubanuevo/.test(all);

  // Duration flags
  const isTeaser = dur > 0 && dur < 90;       // < 1.5 min
  const isShortClip = dur >= 90 && dur < 300;  // 1.5–5 min
  const isMidLength = dur >= 300 && dur < 720; // 5–12 min
  const isFullScene = dur >= 720 && dur < 1200;// 12–20 min
  const isLong = dur >= 1200;                  // 20+ min
  const missingDur = !dur || dur === 0;

  let tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview;
  manualReview = false;

  // ── Special cases ──────────────────────────────────────────────────────────
  // Missing duration + currently monetized → manual review
  if (missingDur && (v.access_tier === 'ppv' || v.ppv_enabled || v.access_tier === 'fanclub')) {
    tier = 'manual_review';
    ppvPriceTier = null;
    price = null;
    keepExclusive = v.is_exclusive; // don't change until content verified
    keepPpvEnabled = false;
    reason = 'Missing duration — cannot safely classify. Verify content length first.';
    confidence = 'low';
    manualReview = true;
    return { tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview };
  }

  // Missing duration + currently free + no ppv_enabled → can stay free
  if (missingDur && v.access_tier === 'free' && !v.ppv_enabled) {
    tier = 'free';
    ppvPriceTier = null;
    price = '$0';
    keepExclusive = false; // if unknown duration and free, exclusive flag adds no value
    keepPpvEnabled = false;
    reason = 'Missing duration. Currently free and not ppv_enabled — keep free. Clear is_exclusive until content reviewed.';
    confidence = 'medium';
    manualReview = false;
    return { tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview };
  }

  // ── Very short teasers / clips < 90s ──────────────────────────────────────
  if (isTeaser || (dur > 0 && dur < 90)) {
    // Under 90s is not sellable as PPV — either free teaser or fanclub clip
    if (v.is_exclusive && (v.access_tier === 'fanclub' || v.ppv_enabled)) {
      tier = 'fanclub';
      ppvPriceTier = null;
      price = 'subscription';
      keepExclusive = false; // a 90s clip is not "premium exclusive"
      keepPpvEnabled = false;
      reason = `Very short (${fmtDur(dur)}) — fanclub teaser clip. Not PPV-viable. Clear is_exclusive.`;
      confidence = 'high';
    } else {
      tier = 'free';
      ppvPriceTier = null;
      price = '$0';
      keepExclusive = false;
      keepPpvEnabled = false;
      reason = `Very short clip (${fmtDur(dur)}) — teaser/sample. Free acquisition content. Clear is_exclusive.`;
      confidence = 'high';
    }
    manualReview = false;
    return { tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview };
  }

  // ── 2-performer / partner scenes ──────────────────────────────────────────
  if (is2Performer) {
    // Strong 2P scene with good duration → PPV Standard
    if (isFullScene || isLong || isMidLength) {
      tier = 'ppv';
      ppvPriceTier = 'standard';
      price = '$12.99';
      keepExclusive = isLong || (v.is_exclusive && dur >= 900); // keep exclusive only if long/strong
      keepPpvEnabled = true;
      reason = `2-performer scene (${fmtDur(dur)}) — PPV Standard. Strong commercial value.`;
      confidence = 'high';
    } else if (isShortClip) {
      // Short 2P scene
      tier = 'ppv';
      ppvPriceTier = 'standard';
      price = '$12.99';
      keepExclusive = false;
      keepPpvEnabled = true;
      reason = `2-performer scene (${fmtDur(dur)}) — PPV Standard even if short. Partner scenes have higher commercial value.`;
      confidence = 'medium';
    } else {
      // missing duration 2P
      tier = 'manual_review';
      ppvPriceTier = null;
      price = null;
      keepExclusive = v.is_exclusive;
      keepPpvEnabled = false;
      reason = `2-performer scene with missing duration — verify length before classifying.`;
      confidence = 'low';
      manualReview = true;
    }
    return { tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview };
  }

  // ── Special/kink content ──────────────────────────────────────────────────
  if (isSpecialContent) {
    if (isMidLength || isFullScene || isLong) {
      tier = 'ppv';
      ppvPriceTier = 'standard';
      price = '$12.99';
      keepExclusive = true;
      keepPpvEnabled = true;
      reason = `Specialty/kink content (${fmtDur(dur)}) — niche PPV Standard or above.`;
      confidence = 'medium';
    } else {
      tier = 'ppv';
      ppvPriceTier = 'short_solo';
      price = '$6.99';
      keepExclusive = false;
      keepPpvEnabled = true;
      reason = `Specialty/kink content but short (${fmtDur(dur)}) — PPV Short/Solo.`;
      confidence = 'medium';
    }
    return { tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview };
  }

  // ── Outdoor/exhibitionist content ─────────────────────────────────────────
  if (isOutdoor && isMidLength) {
    tier = 'ppv';
    ppvPriceTier = 'short_solo';
    price = '$6.99';
    keepExclusive = true; // outdoor exhibitionism has niche premium value
    keepPpvEnabled = true;
    reason = `Outdoor exhibitionism (${fmtDur(dur)}) — distinctive niche content, PPV Short/Solo with exclusive badge.`;
    confidence = 'medium';
    return { tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview };
  }

  // ── Solo content classification ────────────────────────────────────────────
  // Long solo (20min+) — PPV Standard or Premium
  if (isLong) {
    tier = 'ppv';
    ppvPriceTier = hasStrongPerformer ? 'premium_exclusive' : 'standard';
    price = hasStrongPerformer ? '$19.99' : '$12.99';
    keepExclusive = true; // long scenes justify exclusive badge
    keepPpvEnabled = true;
    reason = `Long solo (${fmtDur(dur)}) — ${hasStrongPerformer ? 'PPV Premium Exclusive (strong performer)' : 'PPV Standard (long runtime)'}`;
    confidence = 'high';
    return { tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview };
  }

  // Full solo scene 12–20min — PPV Short/Solo (good entry point) or Fanclub
  if (isFullScene) {
    // If currently free but not ppv_enabled → Fanclub (softer move)
    if (v.access_tier === 'free' && !v.ppv_enabled) {
      tier = 'fanclub';
      ppvPriceTier = null;
      price = 'subscription';
      keepExclusive = false;
      keepPpvEnabled = false;
      reason = `Full solo scene (${fmtDur(dur)}) — currently free, not ppv_enabled. Move to Fanclub as softer monetization step. Clear is_exclusive.`;
      confidence = 'medium';
    } else {
      tier = 'ppv';
      ppvPriceTier = 'short_solo';
      price = '$6.99';
      keepExclusive = false; // 12min solo is not "premium exclusive"
      keepPpvEnabled = true;
      reason = `Full solo scene (${fmtDur(dur)}) — PPV Short/Solo. Good value. Not premium exclusive.`;
      confidence = 'high';
    }
    return { tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview };
  }

  // Mid-length solo 5–12min
  if (isMidLength) {
    if (v.ppv_enabled || v.access_tier === 'ppv') {
      tier = 'ppv';
      ppvPriceTier = 'short_solo';
      price = '$6.99';
      keepExclusive = false;
      keepPpvEnabled = true;
      reason = `Mid-length solo (${fmtDur(dur)}) — PPV Short/Solo entry price. Strong volume play.`;
      confidence = 'high';
    } else {
      // Not currently PPV targeted → Fanclub
      tier = 'fanclub';
      ppvPriceTier = null;
      price = 'subscription';
      keepExclusive = false;
      keepPpvEnabled = false;
      reason = `Mid-length solo (${fmtDur(dur)}) — not marked for PPV. Fanclub member content.`;
      confidence = 'medium';
    }
    return { tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview };
  }

  // Short solo 90s–5min
  if (isShortClip) {
    if (v.access_tier === 'fanclub' || (v.is_exclusive && v.ppv_enabled)) {
      tier = 'fanclub';
      ppvPriceTier = null;
      price = 'subscription';
      keepExclusive = false;
      keepPpvEnabled = false;
      reason = `Short clip (${fmtDur(dur)}) — fanclub bonus/teaser clip. Not PPV-viable at this length.`;
      confidence = 'high';
    } else {
      tier = 'free';
      ppvPriceTier = null;
      price = '$0';
      keepExclusive = false;
      keepPpvEnabled = false;
      reason = `Short clip (${fmtDur(dur)}) — free sample/teaser content. Clear is_exclusive.`;
      confidence = 'high';
    }
    return { tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview };
  }

  // Fallback — missing duration + free + no signals
  tier = 'free';
  ppvPriceTier = null;
  price = '$0';
  keepExclusive = false;
  keepPpvEnabled = false;
  reason = 'No strong classification signal. Keep free. Clear is_exclusive.';
  confidence = 'low';
  manualReview = true;
  return { tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const videos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' }, '-created_date', 500
    );

    const plan = videos.map(v => {
      const rec = classify(v);
      return {
        title: v.title,
        slug: v.slug,
        current_tier: v.access_tier,
        current_is_exclusive: !!v.is_exclusive,
        current_ppv_enabled: !!v.ppv_enabled,
        duration: fmtDur(v.duration_seconds),
        duration_s: v.duration_seconds || 0,
        tags_sample: (v.tags || []).slice(0, 5),
        // Recommendations
        recommended_tier: rec.tier,
        recommended_ppv_price_tier: rec.ppvPriceTier,
        recommended_price: rec.price,
        recommended_is_exclusive: rec.keepExclusive,
        recommended_ppv_enabled: rec.keepPpvEnabled,
        reason: rec.reason,
        confidence: rec.confidence,
        manual_review: rec.manualReview,
        // Change flags
        tier_changes: v.access_tier !== rec.tier && rec.tier !== 'manual_review',
        exclusive_changes: !!v.is_exclusive !== !!rec.keepExclusive,
        ppv_enabled_changes: !!v.ppv_enabled !== !!rec.keepPpvEnabled,
      };
    });

    // ── Grouped sections ────────────────────────────────────────────────────

    const keepFree    = plan.filter(p => p.recommended_tier === 'free' && !p.manual_review && p.current_tier === 'free');
    const toFanclub   = plan.filter(p => p.recommended_tier === 'fanclub' && p.current_tier !== 'fanclub');
    const stayFanclub = plan.filter(p => p.recommended_tier === 'fanclub' && p.current_tier === 'fanclub');
    const toPPVShort  = plan.filter(p => p.recommended_tier === 'ppv' && p.recommended_ppv_price_tier === 'short_solo');
    const toPPVStd    = plan.filter(p => p.recommended_tier === 'ppv' && p.recommended_ppv_price_tier === 'standard');
    const toPPVPrem   = plan.filter(p => p.recommended_tier === 'ppv' && p.recommended_ppv_price_tier === 'premium_exclusive');
    const manualReview = plan.filter(p => p.manual_review);
    const clearExcl   = plan.filter(p => p.current_is_exclusive && !p.recommended_is_exclusive);
    const keepExcl    = plan.filter(p => p.recommended_is_exclusive);

    // Final distribution summary
    const distribution = {
      free: plan.filter(p => p.recommended_tier === 'free').length,
      fanclub: plan.filter(p => p.recommended_tier === 'fanclub').length,
      ppv_short_solo: toPPVShort.length,
      ppv_standard: toPPVStd.length,
      ppv_premium_exclusive: toPPVPrem.length,
      manual_review: manualReview.length,
    };

    // Target check
    const targets = {
      free: { target: '20–25', actual: distribution.free, ok: distribution.free >= 20 && distribution.free <= 25 },
      fanclub: { target: '25–30', actual: distribution.fanclub, ok: distribution.fanclub >= 25 && distribution.fanclub <= 30 },
      ppv_short_solo: { target: '20–25', actual: distribution.ppv_short_solo, ok: distribution.ppv_short_solo >= 20 && distribution.ppv_short_solo <= 25 },
      ppv_standard: { target: '10–15', actual: distribution.ppv_standard, ok: distribution.ppv_standard >= 10 && distribution.ppv_standard <= 15 },
      ppv_premium_exclusive: { target: '5–10', actual: distribution.ppv_premium_exclusive, ok: distribution.ppv_premium_exclusive >= 5 && distribution.ppv_premium_exclusive <= 10 },
    };

    const slim = arr => arr.map(p => ({
      title: p.title,
      duration: p.duration,
      current_tier: p.current_tier,
      recommended_tier: p.recommended_tier,
      recommended_ppv_price_tier: p.recommended_ppv_price_tier,
      recommended_price: p.recommended_price,
      is_exclusive: `${p.current_is_exclusive} → ${p.recommended_is_exclusive}`,
      ppv_enabled: `${p.current_ppv_enabled} → ${p.recommended_ppv_enabled}`,
      confidence: p.confidence,
      manual_review: p.manual_review,
      reason: p.reason,
    }));

    return Response.json({
      generated_at: new Date().toISOString(),
      read_only: true,
      no_data_modified: true,
      total_videos: videos.length,

      A_executive_summary: {
        total: videos.length,
        high_confidence_plans: plan.filter(p => p.confidence === 'high').length,
        medium_confidence: plan.filter(p => p.confidence === 'medium').length,
        low_confidence: plan.filter(p => p.confidence === 'low').length,
        requires_manual_review: manualReview.length,
        exclusive_flag_changes: clearExcl.length,
        videos_changing_tier: plan.filter(p => p.tier_changes).length,
      },

      B_recommended_distribution: distribution,
      B_target_vs_actual: targets,

      C_keep_free: slim(keepFree),
      D_free_to_fanclub: slim(toFanclub.filter(p => p.current_tier === 'free')),
      E_free_to_ppv_short_solo: slim(toPPVShort.filter(p => p.current_tier === 'free')),
      F_ppv_standard_all: slim(toPPVStd),
      G_ppv_premium_exclusive_all: slim(toPPVPrem),
      H_clear_is_exclusive: clearExcl.map(p => ({ title: p.title, duration: p.duration, current_tier: p.current_tier, reason: p.reason })),
      I_keep_is_exclusive: keepExcl.map(p => ({ title: p.title, duration: p.duration, recommended_tier: p.recommended_tier, recommended_price: p.recommended_price })),
      J_manual_review: slim(manualReview),

      K_implementation_order: [
        'Step 1: Fix duration metadata on 10 videos with missing duration_seconds (required before classifying those videos)',
        'Step 2: Clear is_exclusive on all clips under 90 seconds (teasers — never premium)',
        'Step 3: Clear is_exclusive on mid-length free solo scenes staying Free or moving to Fanclub',
        'Step 4: Move free → Fanclub (soft monetization, low risk)',
        'Step 5: Move free → PPV Short/Solo $6.99 (active monetization)',
        'Step 6: Confirm PPV Standard $12.99 assignments (2-performer scenes)',
        'Step 7: Assign PPV Premium Exclusive $19.99 (only the verified top scenes)',
        'Step 8: Set ppv_enabled=false on any video no longer targeting PPV',
        'Step 9: Final QA — verify distribution targets are met',
        'Step 10: Enable payment provider (M3B) once classification is complete',
      ],

      L_full_plan: slim(plan),
    });

  } catch (err) {
    console.error('[buildPricingReclassificationPlan]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});