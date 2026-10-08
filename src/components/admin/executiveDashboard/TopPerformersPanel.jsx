import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function List({ title, items, valueLabel, formatValue }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
      <CardContent>
        {items?.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Performer</TableHead><TableHead className="text-right">{valueLabel}</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{item.name}</TableCell>
                  <TableCell className="text-right text-xs">{formatValue ? formatValue(item.value) : item.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No data available (last 30 days)</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function TopPerformersPanel({ data }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <List title="Most Viewed (30d)" items={data.most_viewed} valueLabel="Views" />
      <List title="Highest Revenue (all-time)" items={data.highest_revenue} valueLabel="Revenue" formatValue={(v) => `$${v.toFixed(2)}`} />
      <List title="Highest PPV Sales (30d)" items={data.highest_ppv_sales} valueLabel="Sales" />
      <List title="Highest Fanclub Conversions (30d)" items={data.highest_fanclub_conversions} valueLabel="Subs" />
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Highest Average Watch Time</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Not tracked — no watch-time telemetry exists yet.</p></CardContent>
      </Card>
    </div>
  );
}