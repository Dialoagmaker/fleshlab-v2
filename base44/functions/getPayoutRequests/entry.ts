import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-side: Get all payout requests (with filtering)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    
    const user = await base44.auth.me();
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { status, performer_id, limit = 100 } = body;

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (performer_id) filter.performer_id = performer_id;

    // Get payout requests
    let requests = await base44.asServiceRole.entities.PayoutRequest.filter(filter);

    // Sort by requested_at descending
    requests = (requests || []).sort((a, b) => 
      new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
    );

    // Limit results
    requests = requests.slice(0, limit);

    // Enrich with performer names
    const enriched = await Promise.all(requests.map(async (r) => {
      const performer = await base44.asServiceRole.entities.Performer.get(r.performer_id);
      return {
        ...r,
        performer_name: performer?.display_name || 'Unknown',
        performer_slug: performer?.slug || ''
      };
    }));

    return Response.json({ 
      success: true,
      payout_requests: enriched
    });
  } catch (error) {
    console.error('getPayoutRequests error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});