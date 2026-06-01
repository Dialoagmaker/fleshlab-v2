import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EarningsFilters from '../earnings/EarningsFilters';
import EarningsSummaryCards from '../earnings/EarningsSummaryCards';
import EarningsTable from '../earnings/EarningsTable';
import EarningEntryModal from '../earnings/EarningEntryModal';
import OutstandingBalanceCard from '../earnings/OutstandingBalanceCard';

export default function EarningsTab({ performer }) {
  const [periodMonth, setPeriodMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showEntryModal, setShowEntryModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch period summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['earnings-summary', performer.id, periodMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke('performerFinanceService', {
        action: 'calculate_period_summary',
        performer_id: performer.id,
        period_month: periodMonth
      });
      return res.data;
    },
    enabled: !!performer.id && !!periodMonth
  });

  // Fetch earnings for period
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['earnings-list', performer.id, periodMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke('performerFinanceService', {
        action: 'list_earnings_for_period',
        performer_id: performer.id,
        period_month: periodMonth
      });
      return res.data;
    },
    enabled: !!performer.id && !!periodMonth
  });

  // Fetch video titles for earnings
  const { data: videos } = useQuery({
    queryKey: ['videos-for-earnings', earnings?.map(e => e.video_id).filter(Boolean)],
    queryFn: async () => {
      const videoIds = earnings?.map(e => e.video_id).filter(Boolean) || [];
      if (videoIds.length === 0) return {};
      
      const videoMap = {};
      for (const id of videoIds) {
        try {
          const video = await base44.entities.Video.get(id);
          videoMap[id] = video.title;
        } catch {
          videoMap[id] = 'Unknown';
        }
      }
      return videoMap;
    },
    enabled: !!earnings?.length
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Earnings</h2>
        <button
          onClick={() => setShowEntryModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Add Earning
        </button>
      </div>

      {/* Period Filter */}
      <EarningsFilters periodMonth={periodMonth} setPeriodMonth={setPeriodMonth} />

      {/* Outstanding Balance */}
      <OutstandingBalanceCard performer={performer} />

      {/* Summary Cards */}
      {summary && <EarningsSummaryCards summary={summary} isLoading={summaryLoading} />}

      {/* Earnings Table */}
      <EarningsTable
        earnings={earnings || []}
        videos={videos || {}}
        isLoading={earningsLoading}
        onRefresh={() => queryClient.invalidateQueries(['earnings-list', performer.id, periodMonth])}
      />

      {/* Entry Modal */}
      {showEntryModal && (
        <EarningEntryModal
          performer={performer}
          periodMonth={periodMonth}
          onClose={() => setShowEntryModal(false)}
          onSuccess={() => {
            setShowEntryModal(false);
            queryClient.invalidateQueries(['earnings-list', performer.id, periodMonth]);
            queryClient.invalidateQueries(['earnings-summary', performer.id, periodMonth]);
          }}
        />
      )}
    </div>
  );
}