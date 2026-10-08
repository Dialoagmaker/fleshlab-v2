import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-side: Get performer private profile (full details)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    
    const user = await base44.auth.me();
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { performer_id } = body;
    if (!performer_id) {
      return Response.json({ error: 'Missing performer_id' }, { status: 400 });
    }

    // Get performer
    const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
    if (!performer) {
      return Response.json({ error: 'Performer not found' }, { status: 404 });
    }

    // Get private profile
    const profiles = await base44.asServiceRole.entities.PerformerProfilePrivate.filter({
      performer_id
    });

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    // Get pending change requests
    const changeRequests = await base44.asServiceRole.entities.ProfileChangeRequest.filter({
      performer_id,
      status: 'pending_review'
    });

    return Response.json({
      performer: {
        id: performer.id,
        display_name: performer.display_name,
        slug: performer.slug,
        bio: performer.bio,
        nationality: performer.nationality,
        profile_image_url: performer.profile_image_url,
        status: performer.status,
        account_status: performer.account_status,
        revenue_split_pct: performer.revenue_split_pct,
        user_id: performer.user_id
      },
      private_profile: profile ? {
        ...profile,
        payout_details: profile.payout_details_encrypted ? 
          JSON.parse(atob(profile.payout_details_encrypted)) : null,
        payout_details_encrypted: undefined // Don't expose encrypted field
      } : null,
      pending_change_requests: changeRequests || []
    });
  } catch (error) {
    console.error('getAdminPerformerPrivateProfile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});