import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Clock, CheckCircle, Wallet, PauseCircle } from 'lucide-react';

export default function EarningsSummaryCards({ summary, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Defensive: handle missing or malformed summary
  const safeSummary = summary?.summary || summary || {};
  
  const cards = [
    {
      title: 'Gross Total',
      value: safeSummary.gross_total || 0,
      icon: DollarSign,
      color: 'text-blue-500'
    },
    {
      title: 'Net Total',
      value: safeSummary.net_total || 0,
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      title: 'Pending',
      value: safeSummary.pending_total || 0,
      icon: Clock,
      color: 'text-yellow-500'
    },
    {
      title: 'Approved',
      value: safeSummary.approved_total || 0,
      icon: CheckCircle,
      color: 'text-blue-500'
    },
    {
      title: 'Paid',
      value: safeSummary.paid_total || 0,
      icon: Wallet,
      color: 'text-green-600'
    },
    {
      title: 'Held',
      value: safeSummary.held_total || 0,
      icon: PauseCircle,
      color: 'text-red-500'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${card.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}