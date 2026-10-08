import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { DollarSign, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function OutstandingBalanceCard({ performer }) {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(performer.outstanding_balance_usd || 0);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.functions.invoke('performerFinanceService', {
        action: 'update_outstanding_balance',
        performer_id: performer.id,
        outstanding_balance_usd: parseFloat(amount),
        reason: reason.trim()
      });

      toast.success('Balance updated');
      setIsEditing(false);
      setReason('');
      queryClient.invalidateQueries(['performer', performer.id]);
    } catch (error) {
      toast.error(error.message || 'Failed to update balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Outstanding Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason (Required)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Explain why this balance is being set"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">
                ${(performer.outstanding_balance_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              {performer.outstanding_balance_usd > 0 && (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Update
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}