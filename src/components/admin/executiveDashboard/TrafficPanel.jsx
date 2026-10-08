import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function List({ title, items }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
      <CardContent>
        {items?.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Value</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium truncate max-w-[180px]">{item.key}</TableCell>
                  <TableCell className="text-right text-xs">{item.count}</TableCell>
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

export default function TrafficPanel({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <List title="Traffic Source" items={data.by_source} />
        <List title="Country" items={data.by_country} />
        <List title="Browser" items={data.by_browser} />
        <List title="Device" items={data.by_device} />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Returning vs New (30d logins)</CardTitle></CardHeader>
        <CardContent className="flex gap-6">
          <div><p className="text-xs text-muted-foreground">New</p><p className="text-xl font-bold">{data.new_vs_returning?.new ?? 0}</p></div>
          <div><p className="text-xs text-muted-foreground">Returning</p><p className="text-xl font-bold">{data.new_vs_returning?.returning ?? 0}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}