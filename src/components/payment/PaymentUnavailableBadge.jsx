/**
 * PaymentUnavailableBadge
 *
 * Shown in place of checkout buttons when no payment provider is configured.
 * Never creates fake purchases or grants access.
 */

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PaymentUnavailableBadge({ className, label }) {
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border',
      'bg-muted/40 text-muted-foreground text-sm cursor-not-allowed select-none',
      className
    )}>
      <Clock className="w-4 h-4 shrink-0" />
      <span>{label || 'Payment option coming soon'}</span>
    </div>
  );
}