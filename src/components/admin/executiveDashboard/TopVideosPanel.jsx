import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function List({ title, items, valueLabel, formatValue }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
      <CardContent>
        {items?.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Video</TableHead><TableHead className="text-right">{valueLabel}</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium truncate max-w-[220px]">{item.title}</TableCell>
                  <TableCell className="text-right text-xs">{formatValue ? formatValue(item.value) : item.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No data available</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function TopVideosPanel({ data }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <List title="Most Viewed" items={data.most_viewed} valueLabel="Views" />
      <List title="Highest PPV (30d)" items={data.highest_ppv} valueLabel="Sales" />
      <List title="Highest Conversion (30d)" items={data.highest_conversion} valueLabel="Rate" formatValue={(v) => `${v}%`} />
    </div>
  );
}