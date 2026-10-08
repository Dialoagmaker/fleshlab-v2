import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

export default function LineItemsTable({ 
  lineItems, 
  onEdit, 
  onDelete,
  isLoading 
}) {
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'approved': return 'default';
      case 'paid': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading line items...</p>;
  }

  if (lineItems.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center">
        <p className="text-sm text-muted-foreground">No line items for this period</p>
        <p className="text-xs text-muted-foreground mt-2">
          Click "Create Closeout" to auto-generate from VideoStatSnapshot, or "Add Line Item" for manual entry
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source Type</TableHead>
          <TableHead>Platform</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Gross</TableHead>
          <TableHead>Performer %</TableHead>
          <TableHead>Performer Amt</TableHead>
          <TableHead>Studio Amt</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lineItems.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <Badge variant="outline">{item.source_type}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{item.source_platform}</Badge>
            </TableCell>
            <TableCell className="max-w-[200px] truncate">
              {item.description}
            </TableCell>
            <TableCell className="font-medium">
              ${item.gross_amount_usd?.toFixed(2)}
            </TableCell>
            <TableCell>{item.performer_share_percent}%</TableCell>
            <TableCell className="font-medium text-green-500">
              ${item.performer_amount_usd?.toFixed(2)}
            </TableCell>
            <TableCell className="font-medium">
              ${item.studio_amount_usd?.toFixed(2)}
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(item.status)}>
                {item.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}