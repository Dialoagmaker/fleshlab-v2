/**
 * auditPricingSection — Paginated section fetcher for pricing audit
 * section: "counts" | "free" | "fanclub" | "ppv" | "duration" | "exclusive" | "map" | "summary"
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function recommendPPVTier(video) {
  const dur = video.duration_seconds || 0;
  const isExclusive = !!video.is_exclusive;
  const title = (video.title || '').toLowerCase();
  const tags = (video.tags || []).map(t => t.toLowerCase());
  const categories = (video.categories || []).map(c => c.toLowerCase());

  const soloKeywords = ['solo', 'masturbat', 'tease', 'strip', 'jerk', 'finger', 'toy', 'intro', 'preview', 'selfie'];
  const premiumKeywords = ['exclusive', 'premium', 'special', 'rare', 'vip', 'private', 'custom', 'creampie', 'dp ', 'double penetrat', 'orgy', 'gangbang', 'squirt'];
  const multiKeywords = ['threesome', 'threeway', '3some', 'trio', 'double', 'multi', 'group'];

  const isSoloLike = soloKeywords.some(k => title.includes(k) || tags.some(t => t.includes(k)) || categories.some(c => c.includes(k)));
  const isPremiumLike = premiumKeywords.some(k => title.includes(k) || tags.some(t => t.includes(k)));
  const isMulti = multiKeywords.some(k => title.includes(k) || tags.some(t => t.includes(k)));
  const isShort = dur > 0 && dur < 7 * 60;
  const isLong = dur >= 20 * 60;

  if (isExclusive && (isLong || isPremiumLike || isMulti)) {
    return { tier: 'PPV Premium Exclusive', price: 19.99, reason: `Exclusive + ${isLong ? 'long' : isPremiumLike ? 'premium kw' : 'multi-performer'}` };
  }
  if ((isSoloLike || isShort) && !isExclusive && !isPremiumLike) {
    return { tier: 'PPV Short / Solo', price: 6.99, reason: `${isSoloLike ? 'Solo/tease kw' : 'Short (<7min)'}` };
  }
  if (isExclusive || isPremiumLike || isLong) {
    return { tier: 'PPV Premium Exclusive', price: 19.99, reason: `${isExclusive ? 'Exclusive' : ''} ${isPremiumLike ? 'premium kw' : ''} ${isLong ? 'long' : ''}`.trim() };
  }
  return { tier: 'PPV Standard', price: 12.99, reason: 'Standard scene' };
}

function fmtDur(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}m${sec > 0 ? sec + 's' : ''}`;
}

function durationBucket(s) {
  if (!s || s === 0) return 'missing/0';
  if (s < 180)  return '0–3 min';
  if (s < 360)  return '3–6 min';
  if (s < 720)  return '6–12 min';
  if (s < 1200) return '12–20 min';
  return '20+ min';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const section = body.section || 'counts';

    const allVideos = await base44.asServiceRole.entities.Video.filter({ status: 'published' }, '-created_date', 500);
    const videos = allVideos;

    if (section === 'counts') {
      const dist = { free: 0, fanclub: 0, ppv: 0, invalid: 0, exclusive: 0, ppvEnabled: 0 };
      const tierBreakdown = {};
      for (const v of videos) {
        const tier = v.access_tier;
        if (tier === 'free') dist.free++;
        else if (tier === 'fanclub') dist.fanclub++;
        else if (tier === 'ppv') dist.ppv++;
        else { dist.invalid++; tierBreakdown[tier || 'null'] = (tierBreakdown[tier || 'null'] || 0) + 1; }
        if (v.is_exclusive) dist.exclusive++;
        if (v.ppv_enabled) dist.ppvEnabled++;
      }
      return Response.json({ total: videos.length, distribution: dist, invalid_tier_breakdown: tierBreakdown });
    }

    if (section === 'free_flagged') {
      const premiumKw = ['exclusive', 'premium', 'rare', 'vip', 'special', 'creampie', 'dp ', 'double penetrat', 'orgy', 'gangbang'];
      const freeVideos = videos.filter(v => v.access_tier === 'free');
      const result = freeVideos.map(v => {
        const dur = v.duration_seconds || 0;
        const tags = (v.tags || []).map(t => t.toLowerCase());
        const title = (v.title || '').toLowerCase();
        const isPremiumLike = premiumKw.some(k => title.includes(k) || tags.some(t => t.includes(k)));
        const flags = [];
        if (v.is_exclusive) flags.push('is_exclusive=true on free video');
        if (dur >= 1800) flags.push(`Long runtime ${fmtDur(dur)} — consider Fanclub`);
        if (isPremiumLike) flags.push('Premium keywords — consider Fanclub/PPV');
        return { title: v.title, slug: v.slug, duration: fmtDur(dur), duration_s: dur, is_exclusive: !!v.is_exclusive, ppv_enabled: !!v.ppv_enabled, flags };
      });
      const flagged = result.filter(r => r.flags.length > 0);
      const clean = result.filter(r => r.flags.length === 0);
      return Response.json({
        total_free: freeVideos.length,
        flagged_count: flagged.length,
        clean_count: clean.length,
        flagged_videos: flagged,
        clean_free_videos: clean.map(v => v.title),
      });
    }

    if (section === 'fanclub') {
      const fanclubVideos = videos.filter(v => v.access_tier === 'fanclub');
      const premiumKw = ['exclusive', 'premium', 'rare', 'vip', 'custom', 'creampie', 'dp ', 'orgy', 'gangbang', 'squirt'];
      const result = fanclubVideos.map(v => {
        const dur = v.duration_seconds || 0;
        const tags = (v.tags || []).map(t => t.toLowerCase());
        const title = (v.title || '').toLowerCase();
        const isPremiumLike = premiumKw.some(k => title.includes(k) || tags.some(t => t.includes(k)));
        const flags = [];
        if (v.is_exclusive && isPremiumLike) flags.push('Exclusive + premium kw → PPV candidate');
        if (v.is_exclusive && dur >= 1500) flags.push(`Exclusive + long (${fmtDur(dur)}) → strong PPV candidate`);
        return { title: v.title, duration: fmtDur(dur), duration_s: dur, is_exclusive: !!v.is_exclusive, ppv_enabled: !!v.ppv_enabled, flags };
      });
      const flagged = result.filter(r => r.flags.length > 0);
      return Response.json({
        total_fanclub: fanclubVideos.length,
        flagged_count: flagged.length,
        all_fanclub: result,
        flagged: flagged,
      });
    }

    if (section === 'ppv') {
      const ppvVideos = videos.filter(v => v.access_tier === 'ppv' || v.ppv_enabled);
      const ppvAudit = ppvVideos.map(v => {
        const rec = recommendPPVTier(v);
        return {
          title: v.title,
          slug: v.slug,
          duration: fmtDur(v.duration_seconds),
          duration_s: v.duration_seconds || 0,
          current_tier: v.access_tier,
          is_exclusive: !!v.is_exclusive,
          ppv_enabled: !!v.ppv_enabled,
          recommended_tier: rec.tier,
          recommended_price: `$${rec.price}`,
          reason: rec.reason,
        };
      });
      const counts = { 'PPV Short / Solo': 0, 'PPV Standard': 0, 'PPV Premium Exclusive': 0 };
      for (const p of ppvAudit) counts[p.recommended_tier] = (counts[p.recommended_tier] || 0) + 1;
      return Response.json({ total_ppv: ppvVideos.length, tier_counts: counts, videos: ppvAudit });
    }

    if (section === 'duration') {
      const buckets = { '0–3 min': [], '3–6 min': [], '6–12 min': [], '12–20 min': [], '20+ min': [], 'missing/0': [] };
      const flags = [];
      for (const v of videos) {
        const b = durationBucket(v.duration_seconds);
        const dur = v.duration_seconds || 0;
        buckets[b].push({ title: v.title, tier: v.access_tier, duration: fmtDur(dur), is_exclusive: !!v.is_exclusive });
        if (dur > 0 && dur < 180 && v.access_tier === 'ppv') flags.push({ title: v.title, duration: fmtDur(dur), issue: 'Very short (<3min) PPV — verify tier' });
        if (dur >= 1200 && v.access_tier === 'free') flags.push({ title: v.title, duration: fmtDur(dur), issue: 'Long free video — consider Fanclub/PPV' });
        if ((!dur || dur === 0) && (v.access_tier === 'ppv' || v.ppv_enabled)) flags.push({ title: v.title, duration: '—', issue: 'PPV video with missing/0 duration' });
      }
      const summary = {};
      for (const [k, arr] of Object.entries(buckets)) summary[k] = arr.length;
      return Response.json({ bucket_counts: summary, duration_flags: flags, buckets_detail: buckets });
    }

    if (section === 'exclusive') {
      const exclusiveVideos = videos.filter(v => v.is_exclusive);
      const issues = [];
      for (const v of exclusiveVideos) {
        if (!['free', 'fanclub', 'ppv'].includes(v.access_tier)) {
          issues.push({ title: v.title, issue: `is_exclusive=true but access_tier="${v.access_tier}" — invalid` });
        }
        const tags = (v.tags || []).map(t => t.toLowerCase());
        const cats = (v.categories || []).map(c => c.toLowerCase());
        if (tags.includes('exclusive') || cats.includes('exclusive')) {
          issues.push({ title: v.title, issue: '"exclusive" used as tag/category — redundant with is_exclusive flag' });
        }
      }
      const byTier = { free: 0, fanclub: 0, ppv: 0 };
      for (const v of exclusiveVideos) {
        if (byTier[v.access_tier] !== undefined) byTier[v.access_tier]++;
      }
      return Response.json({
        total_exclusive: exclusiveVideos.length,
        exclusive_by_tier: byTier,
        issues_count: issues.length,
        issues,
        note: 'is_exclusive = badge/flag only. Access is controlled by access_tier.',
      });
    }

    if (section === 'map') {
      const map = videos.map(v => {
        let recTier, recPrice, action;
        if (v.access_tier === 'free') {
          const dur = v.duration_seconds || 0;
          const isExcl = v.is_exclusive;
          const isLong = dur >= 1800;
          if (isExcl || isLong) { recTier = 'Manual Review'; recPrice = 'TBD'; action = 'Review — exclusive or long content set as free'; }
          else { recTier = 'Free'; recPrice = '$0'; action = 'OK'; }
        } else if (v.access_tier === 'fanclub') {
          recTier = 'Fanclub'; recPrice = 'Subscription'; action = 'OK';
        } else if (v.access_tier === 'ppv' || v.ppv_enabled) {
          const rec = recommendPPVTier(v);
          recTier = rec.tier; recPrice = `$${rec.price}`; action = `Assign price_tier: ${rec.tier === 'PPV Short / Solo' ? 'short_solo' : rec.tier === 'PPV Standard' ? 'standard' : 'premium'}`;
        } else {
          recTier = 'Manual Review'; recPrice = 'TBD'; action = 'Invalid/missing access_tier';
        }
        return {
          title: v.title,
          current_tier: v.access_tier || 'MISSING',
          is_exclusive: !!v.is_exclusive,
          duration: fmtDur(v.duration_seconds),
          recommended_tier: recTier,
          recommended_price: recPrice,
          action,
        };
      });
      const needsReview = map.filter(v => v.action !== 'OK' && !v.action.startsWith('Assign'));
      const ppvAssign = map.filter(v => v.action.startsWith('Assign'));
      const clean = map.filter(v => v.action === 'OK');
      return Response.json({
        total: map.length,
        clean_count: clean.length,
        ppv_needs_tier_assigned: ppvAssign.length,
        manual_review_count: needsReview.length,
        manual_review: needsReview,
        ppv_tier_assignments: ppvAssign,
        all_map: map,
      });
    }

    return Response.json({ error: 'Unknown section. Use: counts|free_flagged|fanclub|ppv|duration|exclusive|map' }, { status: 400 });

  } catch (err) {
    console.error('[auditPricingSection]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});