import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const rows = ["layoutFamily", "crop", "subject", "title", "logo", "type", "cta", "hierarchy", "grade", "intent"];

export default function ArtDirectionComparisonMatrix({ report }) {
  if (!report?.directions?.length) return null;
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Art Direction Variation Matrix</CardTitle></CardHeader>
      <CardContent className="overflow-auto">
        <table className="w-full min-w-[920px] text-left text-xs">
          <thead><tr className="border-b border-border"><th className="p-2">Decision</th>{report.directions.map(d => <th key={d.key} className="p-2">{d.label}</th>)}</tr></thead>
          <tbody>
            {rows.map(row => <tr key={row} className="border-b border-border/60"><td className="p-2 font-bold uppercase tracking-widest text-muted-foreground">{row}</td>{report.directions.map(d => <td key={d.key} className="p-2 text-foreground">{d.matrix[row]}</td>)}</tr>)}
          </tbody>
        </table>
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-muted-foreground">{report.changedSummary}</div>
      </CardContent>
    </Card>
  );
}