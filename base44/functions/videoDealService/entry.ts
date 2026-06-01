import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const data = body;

    // Action 1: create_deal
    if (action === 'create_deal') {
      const {
        video_id,
        deal_type,
        brand_name,
        deal_amount_usd,
        currency = 'usd',
        payment_status = 'unpaid',
        disclosure_required = false,
        disclosure_text,
        period_month,
        notes
      } = data;

      // Validate required fields
      if (!video_id || !deal_type || !brand_name) {
        return Response.json({ 
          error: 'Missing required fields: video_id, deal_type, brand_name' 
        }, { status: 400 });
      }

      // Validate video exists
      const video = await base44.asServiceRole.entities.Video.get(video_id);
      if (!video) {
        return Response.json({ error: 'Video not found' }, { status: 404 });
      }

      // Validate deal_type
      const validDealTypes = ['sponsorship', 'product_placement', 'promotion', 'affiliate'];
      if (!validDealTypes.includes(deal_type)) {
        return Response.json({ error: 'Invalid deal_type' }, { status: 400 });
      }

      // Validate period_month format if provided
      if (period_month) {
        const periodRegex = /^\d{4}-\d{2}$/;
        if (!periodRegex.test(period_month)) {
          return Response.json({ error: 'period_month must be in YYYY-MM format' }, { status: 400 });
        }
      }

      const dealData = {
        video_id,
        deal_type,
        brand_name,
        deal_amount_usd: deal_amount_usd || 0,
        currency,
        payment_status,
        disclosure_required,
        disclosure_text: disclosure_text || null,
        period_month: period_month || null,
        notes: notes || null
      };

      const created = await base44.asServiceRole.entities.VideoDeal.create(dealData);

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'VideoDeal',
        entity_id: created.id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'video_deal_created',
        changes_json: JSON.stringify(dealData),
        ip_address: null,
        notes: `Video deal created: ${deal_type} with ${brand_name} - $${deal_amount_usd || 0}`
      });

      return Response.json({ success: true, deal_id: created.id });
    }

    // Action 2: update_deal_status
    if (action === 'update_deal_status') {
      const { deal_id, payment_status, reason } = data;

      if (!deal_id || !payment_status) {
        return Response.json({ error: 'Missing required fields: deal_id, payment_status' }, { status: 400 });
      }

      const deal = await base44.asServiceRole.entities.VideoDeal.get(deal_id);
      if (!deal) {
        return Response.json({ error: 'Deal not found' }, { status: 404 });
      }

      const updateData = { payment_status };
      if (payment_status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      await base44.asServiceRole.entities.VideoDeal.update(deal_id, updateData);

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'VideoDeal',
        entity_id: deal_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'video_deal_status_changed',
        changes_json: JSON.stringify({
          payment_status: { before: deal.payment_status, after: payment_status },
          reason: reason || null
        }),
        ip_address: null,
        notes: `Video deal payment status changed from ${deal.payment_status} to ${payment_status}`
      });

      return Response.json({ success: true, deal_id, payment_status });
    }

    // Action 3: list_deals_for_video
    if (action === 'list_deals_for_video') {
      const { video_id } = data;

      if (!video_id) {
        return Response.json({ error: 'Missing required field: video_id' }, { status: 400 });
      }

      const deals = await base44.asServiceRole.entities.VideoDeal.filter({ video_id });

      // Limit results
      const limited = deals.slice(0, 50);

      return Response.json({ success: true, deals: limited, total_count: deals.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});