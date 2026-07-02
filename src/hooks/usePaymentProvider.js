/**
 * usePaymentProvider — React hook
 *
 * Checks payment provider status on mount.
 * Used by checkout buttons to decide what UI to show.
 * Returns provider details including checkoutLabel for accurate UI copy.
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function usePaymentProvider() {
  const [status, setStatus] = useState({
    loading: true,
    configured: false,
    primary: null,
    mode: 'not_configured',
    checkoutLabel: 'Secure checkout',
    message: '',
  });

  useEffect(() => {
    base44.functions.invoke('checkPaymentProviderStatus', {})
      .then(res => {
        const d = res.data || {};
        setStatus({
          loading: false,
          configured: !!d.configured,
          primary: d.primary || null,
          mode: d.mode || 'not_configured',
          checkoutLabel: d.checkoutLabel || 'Secure checkout',
          message: d.message || '',
        });
      })
      .catch(() => {
        setStatus({
          loading: false,
          configured: false,
          primary: null,
          mode: 'not_configured',
          checkoutLabel: 'Secure checkout',
          message: 'Secure crypto checkout is being configured.',
        });
      });
  }, []);

  return status;
}