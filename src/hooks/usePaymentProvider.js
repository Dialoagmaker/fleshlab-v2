/**
 * usePaymentProvider — React hook
 *
 * Checks payment provider status on mount.
 * Used by checkout buttons to decide what UI to show.
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function usePaymentProvider() {
  const [status, setStatus] = useState({
    loading: true,
    configured: false,
    primary: null,
    mode: 'not_configured',
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
          message: d.message || '',
        });
      })
      .catch(() => {
        setStatus({
          loading: false,
          configured: false,
          primary: null,
          mode: 'not_configured',
          message: 'Payment provider is being configured.',
        });
      });
  }, []);

  return status;
}