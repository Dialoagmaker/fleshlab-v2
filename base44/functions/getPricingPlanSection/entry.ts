/**
 * getPricingPlanSection — fetches one section of the reclassification plan
 * to work around response size limits.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function fmtDur(s) {
  if (!s || s === 0) return '—';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}m${sec > 0 ? sec + 's' : ''}`;
}

function classify(v) {
  const dur = v.duration_seconds || 0;
  const title = (v.title || '').toLowerCase();
  const tags = (v.tags || []).map(t => t.toLowerCase());
  const cats = (v.categories || []).map(c => c.toLowerCase());
  const all = title + ' ' + tags.join(' ') + ' ' + cats.join(' ');

  const isSolo = /solo|masturbat|jerk|stroke|wank|cum|shower|strip|tease|toy|fleshlight|finger|edge|clamp|mirror|bed/.test(all);
  const is2Performer = /\brebound\b|raw fuck|takes cock|gets fucked|fuck(ed|ing)|suck(ed|ing)|blowjob|blow job|rimm|breed|creampie|bareback|raw|duo|together|threesome|trio|double penetrat/.test(all);
  const isOutdoor = /outdoor|public|park|exhib|dirt path|outside/.test(all);
  const isSpecialContent = /nipple clamp|bondage|fetish|kink|bdsm|dom|sub/.test(all);
  const hasStrongPerformer = /jameson|emjey|yero|dondaddy|feli|josh|kenji fox|cubanuevo/.test(all);

  const isTeaser   = dur > 0 && dur < 90;
  const isShortClip = dur >= 90 && dur < 300;
  const isMidLength = dur >= 300 && dur < 720;
  const isFullScene = dur >= 720 && dur < 1200;
  const isLong      = dur >= 1200;
  const missingDur  = !dur || dur === 0;

  let tier, ppvPriceTier, price, keepExclusive, keepPpvEnabled, reason, confidence, manualReview;
  manualReview = false;

  if (missingDur && (v.access_tier === 'ppv' || v.ppv_enabled || v.access_tier === 'fanclub')) {
    return { tier:'manual_review', ppvPriceTier:null, price:null, keepExclusive:v.is_exclusive, keepPpvEnabled:false, reason:'Missing duration — verify content length first.', confidence:'low', manualReview:true };
  }
  if (missingDur && v.access_tier === 'free' && !v.ppv_enabled) {
    return { tier:'free', ppvPriceTier:null, price:'$0', keepExclusive:false, keepPpvEnabled:false, reason:'Missing duration, currently free, not ppv_enabled — keep free. Clear is_exclusive.', confidence:'medium', manualReview:false };
  }
  if (isTeaser) {
    if (v.access_tier === 'fanclub' || (v.is_exclusive && v.ppv_enabled)) {
      return { tier:'fanclub', ppvPriceTier:null, price:'subscription', keepExclusive:false, keepPpvEnabled:false, reason:`Very short ${fmtDur(dur)} — fanclub teaser. Not PPV. Clear is_exclusive.`, confidence:'high', manualReview:false };
    }
    return { tier:'free', ppvPriceTier:null, price:'$0', keepExclusive:false, keepPpvEnabled:false, reason:`Very short ${fmtDur(dur)} — free teaser/sample. Clear is_exclusive.`, confidence:'high', manualReview:false };
  }
  if (is2Performer) {
    if (isMidLength || isFullScene || isLong) {
      return { tier:'ppv', ppvPriceTier:'standard', price:'$12.99', keepExclusive:isLong||(v.is_exclusive&&dur>=900), keepPpvEnabled:true, reason:`2-performer scene ${fmtDur(dur)} — PPV Standard.`, confidence:'high', manualReview:false };
    }
    if (isShortClip) {
      return { tier:'ppv', ppvPriceTier:'standard', price:'$12.99', keepExclusive:false, keepPpvEnabled:true, reason:`2-performer scene ${fmtDur(dur)} — PPV Standard (partner scenes valued higher).`, confidence:'medium', manualReview:false };
    }
    return { tier:'manual_review', ppvPriceTier:null, price:null, keepExclusive:v.is_exclusive, keepPpvEnabled:false, reason:'2-performer, missing duration — verify first.', confidence:'low', manualReview:true };
  }
  if (isSpecialContent) {
    const t = (isMidLength||isFullScene||isLong) ? 'standard' : 'short_solo';
    const p = t === 'standard' ? '$12.99' : '$6.99';
    return { tier:'ppv', ppvPriceTier:t, price:p, keepExclusive:t==='standard', keepPpvEnabled:true, reason:`Specialty/kink content ${fmtDur(dur)} — ${t==='standard'?'PPV Standard':'PPV Short/Solo'}.`, confidence:'medium', manualReview:false };
  }
  if (isOutdoor && isMidLength) {
    return { tier:'ppv', ppvPriceTier:'short_solo', price:'$6.99', keepExclusive:true, keepPpvEnabled:true, reason:`Outdoor exhibitionism ${fmtDur(dur)} — niche PPV Short/Solo, keep exclusive badge.`, confidence:'medium', manualReview:false };
  }
  if (isLong) {
    const t = hasStrongPerformer ? 'premium_exclusive' : 'standard';
    const p = hasStrongPerformer ? '$19.99' : '$12.99';
    return { tier:'ppv', ppvPriceTier:t, price:p, keepExclusive:true, keepPpvEnabled:true, reason:`Long solo ${fmtDur(dur)} — ${t==='premium_exclusive'?'PPV Premium Exclusive':'PPV Standard'}.`, confidence:'high', manualReview:false };
  }
  if (isFullScene) {
    if (v.access_tier === 'free' && !v.ppv_enabled) {
      return { tier:'fanclub', ppvPriceTier:null, price:'subscription', keepExclusive:false, keepPpvEnabled:false, reason:`Full solo ${fmtDur(dur)}, currently free+not ppv_enabled — move to Fanclub.`, confidence:'medium', manualReview:false };
    }
    return { tier:'ppv', ppvPriceTier:'short_solo', price:'$6.99', keepExclusive:false, keepPpvEnabled:true, reason:`Full solo ${fmtDur(dur)} — PPV Short/Solo $6.99. Good entry price.`, confidence:'high', manualReview:false };
  }
  if (isMidLength) {
    if (v.ppv_enabled || v.access_tier === 'ppv') {
      return { tier:'ppv', ppvPriceTier:'short_solo', price:'$6.99', keepExclusive:false, keepPpvEnabled:true, reason:`Mid solo ${fmtDur(dur)}, ppv_enabled — PPV Short/Solo.`, confidence:'high', manualReview:false };
    }
    return { tier:'fanclub', ppvPriceTier:null, price:'subscription', keepExclusive:false, keepPpvEnabled:false, reason:`Mid solo ${fmtDur(dur)}, not ppv targeted — Fanclub member content.`, confidence:'medium', manualReview:false };
  }
  if (isShortClip) {
    if (v.access_tier === 'fanclub' || (v.is_exclusive && v.ppv_enabled)) {
      return { tier:'fanclub', ppvPriceTier:null, price:'subscription', keepExclusive:false, keepPpvEnabled:false, reason:`Short clip ${fmtDur(dur)} — fanclub bonus. Not PPV-viable.`, confidence:'high', manualReview:false };
    }
    return { tier:'free', ppvPriceTier:null, price:'$0', keepExclusive:false, keepPpvEnabled:false, reason:`Short clip ${fmtDur(dur)} — free teaser. Clear is_exclusive.`, confidence:'high', manualReview:false };
  }
  return { tier:'free', ppvPriceTier:null, price:'$0', keepExclusive:false, keepPpvEnabled:false, reason:'No strong signal, keep free. Clear is_exclusive.', confidence:'low', manualReview:true };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const section = body.section || 'summary';

    const videos = await base44.asServiceRole.entities.Video.filter({ status: 'published' }, '-created_date', 500);

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
        recommended_tier: rec.tier,
        recommended_ppv_price_tier: rec.ppvPriceTier,
        recommended_price: rec.price,
        recommended_is_exclusive: !!rec.keepExclusive,
        recommended_ppv_enabled: !!rec.keepPpvEnabled,
        reason: rec.reason,
        confidence: rec.confidence,
        manual_review: rec.manualReview,
      };
    });

    if (section === 'summary') {
      const dist = {
        free: plan.filter(p=>p.recommended_tier==='free').length,
        fanclub: plan.filter(p=>p.recommended_tier==='fanclub').length,
        ppv_short_solo: plan.filter(p=>p.recommended_ppv_price_tier==='short_solo').length,
        ppv_standard: plan.filter(p=>p.recommended_ppv_price_tier==='standard').length,
        ppv_premium_exclusive: plan.filter(p=>p.recommended_ppv_price_tier==='premium_exclusive').length,
        manual_review: plan.filter(p=>p.manual_review).length,
      };
      return Response.json({
        total: videos.length,
        distribution: dist,
        confidence: {
          high: plan.filter(p=>p.confidence==='high').length,
          medium: plan.filter(p=>p.confidence==='medium').length,
          low: plan.filter(p=>p.confidence==='low').length,
        },
        tier_changes: plan.filter(p=>p.current_tier!==p.recommended_tier&&p.recommended_tier!=='manual_review').length,
        exclusive_to_clear: plan.filter(p=>p.current_is_exclusive&&!p.recommended_is_exclusive).length,
        targets: {
          free:              { target:'20–25', actual: dist.free, on_target: dist.free>=20&&dist.free<=25 },
          fanclub:           { target:'25–30', actual: dist.fanclub, on_target: dist.fanclub>=25&&dist.fanclub<=30 },
          ppv_short_solo:    { target:'20–25', actual: dist.ppv_short_solo, on_target: dist.ppv_short_solo>=20&&dist.ppv_short_solo<=25 },
          ppv_standard:      { target:'10–15', actual: dist.ppv_standard, on_target: dist.ppv_standard>=10&&dist.ppv_standard<=15 },
          ppv_premium:       { target:'5–10',  actual: dist.ppv_premium_exclusive, on_target: dist.ppv_premium_exclusive>=5&&dist.ppv_premium_exclusive<=10 },
        },
      });
    }

    if (section === 'keep_free') return Response.json(plan.filter(p=>p.recommended_tier==='free'&&!p.manual_review&&p.current_tier==='free'));
    if (section === 'to_fanclub') return Response.json(plan.filter(p=>p.recommended_tier==='fanclub'&&p.current_tier!=='fanclub'));
    if (section === 'stay_fanclub') return Response.json(plan.filter(p=>p.recommended_tier==='fanclub'&&p.current_tier==='fanclub'));
    if (section === 'ppv_short') return Response.json(plan.filter(p=>p.recommended_ppv_price_tier==='short_solo'));
    if (section === 'ppv_standard') return Response.json(plan.filter(p=>p.recommended_ppv_price_tier==='standard'));
    if (section === 'ppv_premium') return Response.json(plan.filter(p=>p.recommended_ppv_price_tier==='premium_exclusive'));
    if (section === 'clear_exclusive') return Response.json(plan.filter(p=>p.current_is_exclusive&&!p.recommended_is_exclusive));
    if (section === 'keep_exclusive') return Response.json(plan.filter(p=>p.recommended_is_exclusive));
    if (section === 'manual_review') return Response.json(plan.filter(p=>p.manual_review));
    if (section === 'all') return Response.json(plan);

    return Response.json({ error: 'Unknown section' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});