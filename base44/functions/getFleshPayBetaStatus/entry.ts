/**
 * getFleshPayBetaStatus — Backend Function
 *
 * Returns whether FleshPay beta is enabled for the current user.
 *
 * Controlled by:
 *   FLESHPAY_BETA_ENABLED  — "true" or "false" (env secret)
 *   FLESHPAY_BETA_ALLOWLIST — comma-separated user IDs or emails (optional)
 *
 * If ALLOWLIST is set, only listed users can access FleshPay.
 * If ALLOWLIST is empty/not set and beta is enabled, all users can access.
 * If BETA_ENABLED is "false" or not set, FleshPay is disabled for everyone.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const betaEnabled = Deno.env.get('FLESHPAY_BETA_ENABLED');
    const allowlistRaw = Deno.env.get('FLESHPAY_BETA_ALLOWLIST') || '';

    // ── Beta gate ────────────────────────────────────────────────────────
    if (betaEnabled !== 'true') {
      return Response.json({
        enabled: false,
        reason: 'FleshPay beta is not currently enabled.',
      });
    }

    // ── Allowlist check (if configured) ───────────────────────────────────
    if (allowlistRaw.trim()) {
      // If user is not authenticated and allowlist is set, deny
      if (!user) {
        return Response.json({
          enabled: false,
          reason: 'FleshPay beta is limited to selected users.',
          requires_auth: true,
        });
      }

      const allowedIds = allowlistRaw.split(',').map(s => s.trim().toLowerCase());
      const isAllowed = allowedIds.includes(user.id.toLowerCase()) ||
                        allowedIds.includes((user.email || '').toLowerCase());

      if (!isAllowed) {
        return Response.json({
          enabled: false,
          reason: 'FleshPay beta is limited to selected users.',
        });
      }
    }

    // ── Admin override — admins always have access during beta ────────────
    if (user && user.role === 'admin') {
      return Response.json({
        enabled: true,
        beta_access: 'admin',
      });
    }

    return Response.json({
      enabled: true,
      beta_access: user ? 'user' : 'public',
    });
  } catch (err) {
    console.error('[getFleshPayBetaStatus]', err);
    return Response.json({ enabled: false, error: err.message }, { status: 500 });
  }
});