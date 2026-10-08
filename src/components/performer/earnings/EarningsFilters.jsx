import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function EarningsFilters({ periodMonth, setPeriodMonth }) {
  const handleMonthChange = (e) => {
    const value = e.target.value;
    // Validate YYYY-MM format
    if (/^\d{4}-\d{2}$/.test(value)) {
      setPeriodMonth(value);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Period Filter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          type="month"
          value={periodMonth}
          onChange={handleMonthChange}
          className="w-full max-w-xs px-3 py-2 border border-input rounded-md bg-background text-sm"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Earnings are filtered by period month (YYYY-MM format)
        </p>
      </CardContent>
    </Card>
  );
}