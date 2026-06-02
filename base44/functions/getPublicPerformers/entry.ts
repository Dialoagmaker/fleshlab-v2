import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await req.json().catch(() => ({})); // Consume body (not used, but required for SDK init)

    const [performers, brands, videoPerformers] = await Promise.all([
      base44.asServiceRole.entities.Performer.filter({ status: 'active' }, 'display_name', 200),
      base44.asServiceRole.entities.Brand.filter({ status: 'active' }),
      base44.asServiceRole.entities.VideoPerformer.list(),
    ]);

    // Count videos per performer
    const videoCounts = {};
    for (const vp of videoPerformers) {
      videoCounts[vp.performer_id] = (videoCounts[vp.performer_id] || 0) + 1;
    }

    // Sanitize — only public-safe fields, never expose compliance/payout/internal data
    const sanitizedPerformers = performers.map(p => ({
      id: p.id,
      display_name: p.display_name,
      slug: p.slug,
      bio: p.bio,
      nationality: p.nationality,
      profile_image_url: p.profile_image_url,
      cover_image_url: p.cover_image_url,
      status: p.status,
      featured: p.featured,
      verified: p.verified,
      fanclub_enabled: p.fanclub_enabled,
      video_count: videoCounts[p.id] || p.video_count || 0,
      onlyfans_url: p.onlyfans_url,
      twitter_url: p.twitter_url,
      instagram_url: p.instagram_url,
      date_of_birth: p.date_of_birth,
      created_date: p.created_date,
    }));

    const sanitizedBrands = brands.map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      logo_url: b.logo_url,
      cover_image_url: b.cover_image_url,
      status: b.status,
    }));

    return Response.json({ performers: sanitizedPerformers, brands: sanitizedBrands });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});