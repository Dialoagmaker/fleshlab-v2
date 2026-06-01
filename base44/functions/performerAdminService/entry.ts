// performerAdminService — Service layer for performer account management.
// Phase 1: Account freeze/unfreeze, KYC status, revenue split, platform accounts.
//
// Actions:
//   freeze_account — Sets account_status to "suspended", records freeze_reason
//   unfreeze_account — Sets account_status to "active", clears freeze_reason
//   set_kyc_status — Updates kyc_status (approved, pending, rejected, expired)
//   set_revenue_split — Sets revenue_split_pct
//   update_platform_accounts — Updates onlyfans_url, twitter_url, instagram_url

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, performer_id } = body;

    if (!performer_id) {
      return Response.json({ error: 'performer_id is required' }, { status: 400 });
    }

    // Fetch performer
    const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
    if (!performer) {
      return Response.json({ error: 'Performer not found' }, { status: 404 });
    }

    if (action === 'freeze_account') {
      const { reason } = body;
      await base44.asServiceRole.entities.Performer.update(performer_id, {
        account_status: 'suspended',
        freeze_reason: reason || 'Suspended by admin',
      });

      return Response.json({
        success: true,
        message: 'Account frozen',
        performer_id,
        account_status: 'suspended',
      });
    }

    if (action === 'unfreeze_account') {
      await base44.asServiceRole.entities.Performer.update(performer_id, {
        account_status: 'active',
        freeze_reason: null,
      });

      return Response.json({
        success: true,
        message: 'Account unfrozen',
        performer_id,
        account_status: 'active',
      });
    }

    if (action === 'set_kyc_status') {
      const { kyc_status } = body;
      const validStatuses = ['approved', 'pending', 'rejected', 'expired'];
      if (!validStatuses.includes(kyc_status)) {
        return Response.json({ error: `Invalid kyc_status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
      }

      await base44.asServiceRole.entities.Performer.update(performer_id, { kyc_status });

      return Response.json({
        success: true,
        message: 'KYC status updated',
        performer_id,
        kyc_status,
      });
    }

    if (action === 'set_revenue_split') {
      const { revenue_split_pct } = body;
      if (typeof revenue_split_pct !== 'number' || revenue_split_pct < 0 || revenue_split_pct > 100) {
        return Response.json({ error: 'revenue_split_pct must be a number between 0 and 100' }, { status: 400 });
      }

      await base44.asServiceRole.entities.Performer.update(performer_id, { revenue_split_pct });

      return Response.json({
        success: true,
        message: 'Revenue split updated',
        performer_id,
        revenue_split_pct,
      });
    }

    if (action === 'update_platform_accounts') {
      const { onlyfans_url, twitter_url, instagram_url } = body;
      const updates = {};
      if (onlyfans_url !== undefined) updates.onlyfans_url = onlyfans_url;
      if (twitter_url !== undefined) updates.twitter_url = twitter_url;
      if (instagram_url !== undefined) updates.instagram_url = instagram_url;

      await base44.asServiceRole.entities.Performer.update(performer_id, updates);

      return Response.json({
        success: true,
        message: 'Platform accounts updated',
        performer_id,
        updated_fields: Object.keys(updates),
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});