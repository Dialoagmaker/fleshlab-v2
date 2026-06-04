/**
 * auditVideoPricingClassification — READ-ONLY audit function
 *
 * Audits all published/public-ready videos for correct pricing classification.
 * Does NOT modify any data.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── PPV tier recommendation logic ────────────────────────────────────────────
function recommendPPVTier(video) {
  const dur = video.duration_seconds || 0;
  const isExclusive = !!video.is_exclusive;
  const title = (video.title || '').toLowerCase();
  const tags = (video.tags || []).map(t => t.toLowerCase());
  const categories = (video.categories || []).map(c => c.toLowerCase());

  // Keywords suggesting solo/short/simple
  const soloKeywords = ['solo', 'masturbat', 'tease', 'strip', 'jerk', 'finger', 'toy', 'intro', 'preview', 'selfie', 'selfshot'];
  const premiumKeywords = ['exclusive', 'premium', 'special', 'rare', 'vip', 'private', 'custom', 'creampie', 'dp ', 'double penetrat', 'orgy', 'gangbang', 'squirt'];
  const multiKeywords = ['threesome', 'threeway', '3some', 'trio', 'double', 'multi', 'group'];

  const isSoloLike = soloKeywords.some(k => title.includes(k) || tags.some(t => t.includes(k)) || categories.some(c => c.includes(k)));
  const isPremiumLike = premiumKeywords.some(k => title.includes(k) || tags.some(t => t.includes(k)));
  const isMulti = multiKeywords.some(k => title.includes(k) || tags.some(t => t.includes(k)));

  // Duration buckets
  const isShort = dur > 0 && dur < 7 * 60;       // < 7 min
  const isMedium = dur >= 7 * 60 && dur < 20 * 60; // 7–20 min
  const isLong = dur >= 20 * 60;                   // 20+ min

  let tier, price, reason;

  if (isExclusive && (isLong || isPremiumLike || isMulti)) {
    tier = 'PPV Premium Exclusive';
    price = 19.99;
    reason = `Exclusive flag + ${isLong ? 'long runtime' : isPremiumLike ? 'premium keywords' : 'multi-performer'}`;
  } else if ((isSoloLike || isShort) && !isExclusive && !isPremiumLike) {
    tier = 'PPV Short / Solo';
    price = 6.99;
    reason = `${isSoloLike ? 'Solo/tease keywords' : 'Short runtime (<7min)'}`;
  } else if (isExclusive || isPremiumLike || isLong) {
    tier = 'PPV Premium Exclusive';
    price = 19.99;
    reason = `${isExclusive ? 'Exclusive flag' : ''} ${isPremiumLike ? 'premium keywords' : ''} ${isLong ? 'long runtime' : ''}`.trim();
  } else {
    tier = 'PPV Standard';
    price = 12.99;
    reason = `Standard scene — medium runtime/production`;
  }

  return { tier, price, reason };
}

// ── Free video premium flag logic ────────────────────────────────────────────
function flagFreeVideo(video) {
  const dur = video.duration_seconds || 0;
  const isExclusive = !!video.is_exclusive;
  const tags = (video.tags || []).map(t => t.toLowerCase());
  const title = (video.title || '').toLowerCase();
  const premiumKeywords = ['exclusive', 'premium', 'rare', 'vip', 'special', 'creampie', 'dp ', 'double penetrat', 'orgy', 'gangbang'];
  const isPremiumLike = premiumKeywords.some(k => title.includes(k) || tags.some(t => t.includes(k)));
  const isLong = dur >= 20 * 60;
  const isVeryLong = dur >= 30 * 60;
  const flags = [];

  if (isExclusive) flags.push('is_exclusive=true on free video');
  if (isVeryLong) flags.push(`Very long runtime (${Math.round(dur / 60)}min) — consider Fanclub/PPV`);
  else if (isLong) flags.push(`Long runtime (${Math.round(dur / 60)}min) — consider Fanclub`);
  if (isPremiumLike) flags.push('Premium keywords in title/tags — consider Fanclub/PPV');

  return flags;
}

// ── Fanclub → PPV flag logic ──────────────────────────────────────────────────
function flagFanclubVideo(video) {
  const dur = video.duration_seconds || 0;
  const isExclusive = !!video.is_exclusive;
  const tags = (video.tags || []).map(t => t.toLowerCase());
  const title = (video.title || '').toLowerCase();
  const premiumKeywords = ['exclusive', 'premium', 'rare', 'vip', 'custom', 'creampie', 'dp ', 'orgy', 'gangbang', 'squirt'];
  const isPremiumLike = premiumKeywords.some(k => title.includes(k) || tags.some(t => t.includes(k)));
  const flags = [];

  if (isExclusive && isPremiumLike) flags.push('Exclusive + premium keywords — might be better as PPV');
  if (isExclusive && dur >= 25 * 60) flags.push(`Exclusive + long runtime (${Math.round(dur / 60)}min) — strong PPV candidate`);

  return flags;
}

// ── Duration bucket ───────────────────────────────────────────────────────────
function durationBucket(seconds) {
  if (!seconds || seconds === 0) return 'missing/0';
  if (seconds < 3 * 60)  return '0–3 min';
  if (seconds < 6 * 60)  return '3–6 min';
  if (seconds < 12 * 60) return '6–12 min';
  if (seconds < 20 * 60) return '12–20 min';
  return '20+ min';
}

function fmtDur(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}m${sec > 0 ? sec + 's' : ''}`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all published + unlisted videos (public-ready)
    const allVideos = await base44.asServiceRole.entities.Video.filter(
      { status: 'published' },
      '-created_date',
      500
    );

    // Also grab unlisted (publicly accessible if you have the link)
    const unlistedVideos = await base44.asServiceRole.entities.Video.filter(
      { status: 'unlisted' },
      '-created_date',
      200
    );

    const videos = [...allVideos, ...unlistedVideos];
    const total = videos.length;

    // ── 1. Access tier distribution ──────────────────────────────────────────
    const dist = { free: 0, fanclub: 0, ppv: 0, invalid: 0, exclusive: 0, ppvEnabled: 0 };
    for (const v of videos) {
      const tier = v.access_tier;
      if (tier === 'free') dist.free++;
      else if (tier === 'fanclub') dist.fanclub++;
      else if (tier === 'ppv') dist.ppv++;
      else dist.invalid++;
      if (v.is_exclusive) dist.exclusive++;
      if (v.ppv_enabled) dist.ppvEnabled++;
    }

    // ── 2. Free video audit ───────────────────────────────────────────────────
    const freeVideos = videos.filter(v => v.access_tier === 'free');
    const freeFlags = [];
    for (const v of freeVideos) {
      const flags = flagFreeVideo(v);
      if (flags.length > 0) {
        freeFlags.push({ title: v.title, slug: v.slug, duration: fmtDur(v.duration_seconds), flags });
      }
    }

    // ── 3. Fanclub video audit ────────────────────────────────────────────────
    const fanclubVideos = videos.filter(v => v.access_tier === 'fanclub');
    const fanclubFlags = [];
    for (const v of fanclubVideos) {
      const flags = flagFanclubVideo(v);
      if (flags.length > 0) {
        fanclubFlags.push({ title: v.title, slug: v.slug, duration: fmtDur(v.duration_seconds), flags });
      }
    }

    // ── 4. PPV tier audit ─────────────────────────────────────────────────────
    const ppvVideos = videos.filter(v => v.access_tier === 'ppv' || v.ppv_enabled);
    const ppvAudit = ppvVideos.map(v => {
      const rec = recommendPPVTier(v);
      return {
        title: v.title,
        slug: v.slug,
        duration: fmtDur(v.duration_seconds),
        duration_seconds: v.duration_seconds || 0,
        current_access_tier: v.access_tier,
        is_exclusive: !!v.is_exclusive,
        ppv_enabled: !!v.ppv_enabled,
        recommended_tier: rec.tier,
        recommended_price: rec.price,
        reason: rec.reason,
      };
    });

    // Summarise PPV tier distribution
    const ppvTierCounts = { 'PPV Short / Solo': 0, 'PPV Standard': 0, 'PPV Premium Exclusive': 0 };
    for (const p of ppvAudit) {
      if (ppvTierCounts[p.recommended_tier] !== undefined) ppvTierCounts[p.recommended_tier]++;
    }

    // ── 5. Duration sanity check ──────────────────────────────────────────────
    const buckets = { '0–3 min': [], '3–6 min': [], '6–12 min': [], '12–20 min': [], '20+ min': [], 'missing/0': [] };
    const durationFlags = [];
    for (const v of videos) {
      const b = durationBucket(v.duration_seconds);
      buckets[b].push(v.title);

      const tier = v.access_tier;
      const dur = v.duration_seconds || 0;

      // Flag: very short but PPV premium recommended
      if (dur > 0 && dur < 3 * 60 && tier === 'ppv') {
        durationFlags.push({ title: v.title, duration: fmtDur(dur), issue: 'Very short (<3min) but marked PPV — verify tier' });
      }
      // Flag: long free video
      if (dur >= 20 * 60 && tier === 'free') {
        durationFlags.push({ title: v.title, duration: fmtDur(dur), issue: `Long video (${fmtDur(dur)}) marked Free — consider Fanclub` });
      }
      // Flag: PPV with no duration
      if ((!dur || dur === 0) && (tier === 'ppv' || v.ppv_enabled)) {
        durationFlags.push({ title: v.title, duration: '—', issue: 'PPV/ppv_enabled but duration_seconds = 0 or missing' });
      }
    }

    const durationSummary = {};
    for (const [bucket, titles] of Object.entries(buckets)) {
      durationSummary[bucket] = titles.length;
    }

    // ── 6. Exclusive logic check ──────────────────────────────────────────────
    const exclusiveIssues = [];
    for (const v of videos) {
      if (v.is_exclusive) {
        // Check if access_tier is set
        const validTiers = ['free', 'fanclub', 'ppv'];
        if (!validTiers.includes(v.access_tier)) {
          exclusiveIssues.push({ title: v.title, issue: `is_exclusive=true but access_tier="${v.access_tier}" is invalid/missing` });
        }
        // Check for exclusive category/tag (should not exist as access control)
        const tags = (v.tags || []).map(t => t.toLowerCase());
        const cats = (v.categories || []).map(c => c.toLowerCase());
        if (tags.includes('exclusive') || cats.includes('exclusive')) {
          exclusiveIssues.push({ title: v.title, issue: '"exclusive" used as tag/category — should only be is_exclusive flag' });
        }
      }
    }

    // ── 7. Full pricing map ───────────────────────────────────────────────────
    const pricingMap = videos.map(v => {
      let recommendedTier, recommendedPrice, action;

      if (v.access_tier === 'free') {
        const flags = flagFreeVideo(v);
        recommendedTier = flags.length > 0 ? 'Fanclub or PPV (review)' : 'Free';
        recommendedPrice = flags.length > 0 ? 'TBD' : '$0';
        action = flags.length > 0 ? 'Manual Review' : 'OK';
      } else if (v.access_tier === 'fanclub') {
        const flags = flagFanclubVideo(v);
        recommendedTier = flags.length > 0 ? 'PPV (review)' : 'Fanclub';
        recommendedPrice = flags.length > 0 ? 'TBD' : 'Subscription';
        action = flags.length > 0 ? 'Manual Review' : 'OK';
      } else if (v.access_tier === 'ppv' || v.ppv_enabled) {
        const rec = recommendPPVTier(v);
        recommendedTier = rec.tier;
        recommendedPrice = `$${rec.price}`;
        action = 'Set price_tier';
      } else {
        recommendedTier = 'Unknown';
        recommendedPrice = '?';
        action = 'Manual Review — invalid tier';
      }

      return {
        title: v.title,
        slug: v.slug,
        current_tier: v.access_tier || 'MISSING',
        recommended_tier: recommendedTier,
        recommended_price: recommendedPrice,
        is_exclusive: !!v.is_exclusive,
        duration: fmtDur(v.duration_seconds),
        action,
      };
    });

    const manualReview = pricingMap.filter(p => p.action === 'Manual Review' || p.action.includes('Manual Review'));

    // ── 8. Launch distribution recommendation ────────────────────────────────
    const launchDist = {
      free: pricingMap.filter(p => p.recommended_tier === 'Free').length,
      fanclub: pricingMap.filter(p => p.recommended_tier === 'Fanclub').length,
      ppv_short: ppvAudit.filter(p => p.recommended_tier === 'PPV Short / Solo').length,
      ppv_standard: ppvAudit.filter(p => p.recommended_tier === 'PPV Standard').length,
      ppv_premium: ppvAudit.filter(p => p.recommended_tier === 'PPV Premium Exclusive').length,
      manual_review: manualReview.length,
    };

    // ── Build final report ────────────────────────────────────────────────────
    return Response.json({
      audit_date: new Date().toISOString(),
      read_only: true,
      no_data_modified: true,

      A_executive_summary: {
        total_public_ready_videos: total,
        published: allVideos.length,
        unlisted: unlistedVideos.length,
        videos_needing_manual_review: manualReview.length,
        ppv_videos_total: ppvVideos.length,
        free_videos_flagged: freeFlags.length,
        fanclub_videos_flagged: fanclubFlags.length,
        duration_sanity_flags: durationFlags.length,
        exclusive_logic_issues: exclusiveIssues.length,
      },

      B_access_tier_counts: {
        free: dist.free,
        fanclub: dist.fanclub,
        ppv: dist.ppv,
        invalid_or_missing: dist.invalid,
        is_exclusive_true: dist.exclusive,
        ppv_enabled_true: dist.ppvEnabled,
      },

      C_free_video_audit: {
        total_free: freeVideos.length,
        flagged_count: freeFlags.length,
        flagged_videos: freeFlags,
      },

      D_fanclub_video_audit: {
        total_fanclub: fanclubVideos.length,
        flagged_count: fanclubFlags.length,
        flagged_videos: fanclubFlags,
      },

      E_ppv_tier_recommendations: {
        total_ppv_candidates: ppvVideos.length,
        tier_distribution: ppvTierCounts,
        per_video: ppvAudit,
      },

      F_duration_sanity_check: {
        bucket_counts: durationSummary,
        flagged_count: durationFlags.length,
        flagged_videos: durationFlags,
      },

      G_exclusive_logic_check: {
        total_exclusive_videos: dist.exclusive,
        issues_found: exclusiveIssues.length,
        issues: exclusiveIssues,
        note: 'is_exclusive should be badge/flag only. Access controlled solely by access_tier.',
      },

      H_videos_needing_manual_review: manualReview,

      I_recommended_launch_distribution: launchDist,

      J_full_pricing_map: pricingMap,

      K_final_verdict: manualReview.length === 0 && durationFlags.length === 0 && exclusiveIssues.length === 0
        ? 'PRICING CLASSIFICATION CLEAN — no issues detected'
        : `PRICING AUDIT COMPLETE — ${manualReview.length} videos need manual review, ${durationFlags.length} duration flags, ${exclusiveIssues.length} exclusive logic issues`,
    });

  } catch (err) {
    console.error('[auditVideoPricingClassification]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});