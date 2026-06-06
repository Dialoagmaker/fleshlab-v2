/**
 * CheckoutButton
 *
 * Unified checkout CTA component used across PPV, Fanclub, Guest Production.
 *
 * Behavior matrix:
 *   Logged-out          → requireSignup (M2 intent preservation)
 *   Logged-in, no provider → PaymentUnavailableBadge (no silent no-op)
 *   Logged-in, provider  → start createCheckoutSession → redirect to checkoutUrl
 *
 * Security:
 *   - Never grants access without confirmed webhook
 *   - Amount sent to backend only; backend resolves from SERVER_PRICING
 *   - No fake purchases
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PaymentUnavailableBadge from './PaymentUnavailableBadge';

export default function CheckoutButton({
  // Required
  paymentType,       // 'ppv' | 'fanclub' | 'guest_production_deposit'
  label,             // Button text when ready
  // Context
  planId,            // For fanclub
  videoId,           // For PPV
  applicationId,     // For guest production deposit
  priceTier,         // For PPV: 'short_solo' | 'standard' | 'premium'
  returnUrl,         // Internal path to return to after payment
  cancelUrl,         // Internal path on cancel
  // Auth
  isAuthenticated,
  onRequireAuth,     // () => void — called when user is not logged in
  // Payment provider state
  paymentProvider,   // from usePaymentProvider()
  // Styling
  className,
  size = 'lg',
  unavailableLabel,  // Custom label for unavailable badge
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Not logged in — M2 intent preservation
  if (!isAuthenticated) {
    return (
      <Button size={size} className={className} onClick={onRequireAuth}>
        {label}
      </Button>
    );
  }

  // Logged in but provider loading — show neutral state
  if (paymentProvider.loading) {
    return (
      <Button size={size} className={className} disabled>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Checking checkout...
      </Button>
    );
  }

  // Logged in but provider not configured
  if (!paymentProvider.configured) {
    return (
      <PaymentUnavailableBadge
        label={unavailableLabel || 'Secure crypto/card checkout coming soon'}
        className={className}
      />
    );
  }

  // Provider ready — start checkout
  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', {
        paymentType,
        planId:        planId || undefined,
        videoId:       videoId || undefined,
        applicationId: applicationId || undefined,
        priceTier:     priceTier || undefined,
        returnUrl:     returnUrl || window.location.pathname,
        cancelUrl:     cancelUrl || window.location.pathname,
      });

      const data = res.data || {};
      if (data.checkoutUrl) {
        // Redirect to NOWPayments hosted checkout
        window.location.href = data.checkoutUrl;
      } else if (data.code === 'AUTH_REQUIRED') {
        // Auth required — redirect to login/register
        console.log('[CheckoutButton] Auth required, redirecting');
        onRequireAuth();
        return;
      } else if (data.blocked_reason === 'below_crypto_minimum') {
        setError(`This crypto payment method currently requires a higher minimum payment than this plan. Please choose a higher-value plan or another payment method.`);
      } else if (data.blocked_reason === 'minimum_amount') {
        setError(`This crypto payment method currently requires a higher minimum amount. Please choose the 3-Month plan or contact support.`);
      } else if (data.blocked_reason === 'provider_credentials') {
        setError(`Crypto checkout is temporarily unavailable due to payment provider configuration. Please contact support.`);
      } else if (data.blocked_reason === 'provider_config') {
        setError(`Crypto checkout is temporarily unavailable. Please contact support.`);
      } else if (data.blocked_reason === 'provider_rejected') {
        setError(`The payment provider rejected this checkout request. Please try the 3-Month plan or contact support.`);
      } else {
        setError(`Crypto checkout is temporarily unavailable. Please contact support.`);
      }
    } catch (err) {
      console.error('[CheckoutButton] Checkout error:', err);
      setError('Crypto checkout is temporarily unavailable. Please contact support.');
    }
    setLoading(false);
  };

  return (
    <div>
      <Button size={size} className={className} onClick={handleCheckout} disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {label}
      </Button>
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
      {paymentProvider.primary === 'nowpayments' && (
        <p className="text-white/40 text-xs mt-1.5 text-center">
          Crypto / card-to-crypto checkout · Card availability depends on provider approval and region
        </p>
      )}
    </div>
  );
}