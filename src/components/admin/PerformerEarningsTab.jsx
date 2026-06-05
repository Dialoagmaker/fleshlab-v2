import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, CheckCircle, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AdminEarningsTab({ performerId, performerName }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newLineItem, setNewLineItem] = useState({
    source_type: "video_platform",
    source_platform: "xhamster",
    description: "",
    gross_amount_usd: 0,
    performer_share_percent: 70,
    notes: ""
  });

  const queryClient = useQueryClient();

  // Fetch line items for this performer and period
  const { data: lineItemsData, isLoading } = useQuery({
    queryKey: ['performer-line-items', performerId, selectedMonth],
    queryFn: async () => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'get_line_items',
        performer_id: performerId,
        period_month: selectedMonth
      });
      return res.data;
    },
    enabled: !!performerId
  });

  const lineItems = lineItemsData?.line_items || [];

  // Calculate totals
  const totals = lineItems.reduce((acc, item) => {
    acc.gross += item.gross_amount_usd || 0;
    acc.performer += item.performer_amount_usd || 0;
    acc.studio += item.studio_amount_usd || 0;
    return acc;
  }, { gross: 0, performer: 0, studio: 0 });

  // Mutations
  const addLineItemMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'add_line_item',
        ...data
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performer-line-items'] });
      setIsAddModalOpen(false);
      toast.success('Line item added successfully');
      setNewLineItem({
        source_type: "video_platform",
        source_platform: "xhamster",
        description: "",
        gross_amount_usd: 0,
        performer_share_percent: 70,
        notes: ""
      });
    }
  });

  const updateLineItemMutation = useMutation({
    mutationFn: async ({ line_item_id, data }) => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'update_line_item',
        line_item_id,
        ...data
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performer-line-items'] });
      setIsEditModalOpen(false);
      setEditingItem(null);
      toast.success('Line item updated successfully');
    }
  });

  const deleteLineItemMutation = useMutation({
    mutationFn: async (line_item_id) => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'delete_line_item',
        line_item_id
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performer-line-items'] });
      toast.success('Line item deleted successfully');
    }
  });

  const createCloseoutMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'create_monthly_closeout',
        performer_id: performerId,
        period_month: selectedMonth,
        platform: 'all'
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['performer-line-items'] });
      toast.success(`Created ${data.video_revenue_count} video revenue line items`);
    }
  });

  const approveCloseoutMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'approve_closeout',
        performer_id: performerId,
        period_month: selectedMonth
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['performer-line-items'] });
      toast.success(`Approved ${data.approved_count} line items`);
    }
  });

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'mark_closeout_paid',
        performer_id: performerId,
        period_month: selectedMonth
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['performer-line-items'] });
      toast.success(`Marked ${data.paid_count} line items as paid`);
    }
  });

  const handleAddLineItem = () => {
    const performerAmount = (newLineItem.gross_amount_usd * newLineItem.performer_share_percent) / 100;
    const studioAmount = newLineItem.gross_amount_usd - performerAmount;

    addLineItemMutation.mutate({
      performer_id: performerId,
      period_month: selectedMonth,
      ...newLineItem,
      performer_amount_usd: performerAmount,
      studio_amount_usd: studioAmount,
      currency: 'usd',
      exchange_rate: 1,
      status: 'estimated'
    });
  };

  const handleUpdateLineItem = () => {
    const performerAmount = (editingItem.gross_amount_usd * editingItem.performer_share_percent) / 100;
    const studioAmount = editingItem.gross_amount_usd - performerAmount;

    updateLineItemMutation.mutate({
      line_item_id: editingItem.id,
      data: {
        ...editingItem,
        performer_amount_usd: performerAmount,
        studio_amount_usd: studioAmount
      }
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'approved': return 'default';
      case 'paid': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.gross.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {lineItems.length} line items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performer Share</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totals.performer.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total performer earnings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Studio Share</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.studio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Studio revenue share
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Earnings Line Items</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage income for {performerName || performerId} - {selectedMonth}
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const monthStr = date.toISOString().slice(0, 7);
                    return <option key={monthStr} value={monthStr}>{monthStr}</option>;
                  })}
                </SelectContent>
              </Select>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Income Line Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Source Type</Label>
                      <Select 
                        value={newLineItem.source_type} 
                        onValueChange={(value) => setNewLineItem({...newLineItem, source_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video_platform">Video Platform Revenue</SelectItem>
                          <SelectItem value="livecam">Livecam Income</SelectItem>
                          <SelectItem value="fanclub">Fanclub Subscription</SelectItem>
                          <SelectItem value="custom_content">Custom Content</SelectItem>
                          <SelectItem value="bonus">Bonus</SelectItem>
                          <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                          <SelectItem value="deduction">Deduction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Source Platform</Label>
                      <Select 
                        value={newLineItem.source_platform} 
                        onValueChange={(value) => setNewLineItem({...newLineItem, source_platform: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="xhamster">xHamster</SelectItem>
                          <SelectItem value="faphouse">FapHouse</SelectItem>
                          <SelectItem value="chaturbate">Chaturbate</SelectItem>
                          <SelectItem value="stripchat">Stripchat</SelectItem>
                          <SelectItem value="bongacams">BongaCams</SelectItem>
                          <SelectItem value="livejasmin">LiveJasmin</SelectItem>
                          <SelectItem value="internal">Internal</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea 
                        value={newLineItem.description}
                        onChange={(e) => setNewLineItem({...newLineItem, description: e.target.value})}
                        placeholder="e.g., xHamster revenue - June 2026"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Gross Amount (USD)</Label>
                        <Input 
                          type="number"
                          value={newLineItem.gross_amount_usd}
                          onChange={(e) => setNewLineItem({...newLineItem, gross_amount_usd: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <Label>Performer Share (%)</Label>
                        <Input 
                          type="number"
                          value={newLineItem.performer_share_percent}
                          onChange={(e) => setNewLineItem({...newLineItem, performer_share_percent: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea 
                        value={newLineItem.notes}
                        onChange={(e) => setNewLineItem({...newLineItem, notes: e.target.value})}
                        placeholder="Optional notes"
                      />
                    </div>
                    <Button 
                      onClick={handleAddLineItem}
                      disabled={addLineItemMutation.isPending}
                      className="w-full"
                    >
                      {addLineItemMutation.isPending ? 'Adding...' : 'Add Line Item'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => createCloseoutMutation.mutate()}
                disabled={createCloseoutMutation.isPending}
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Closeout
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => approveCloseoutMutation.mutate()}
                disabled={approveCloseoutMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                size="sm"
                onClick={() => markPaidMutation.mutate()}
                disabled={markPaidMutation.isPending}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Mark Paid
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading line items...</p>
          ) : lineItems.length === 0 ? (
            <div className="bg-muted rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground">No line items for {selectedMonth}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Click "Create Closeout" to auto-generate from VideoStatSnapshot, or "Add Line Item" for manual entry
              </p>
            </div>
          ) : (
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
                          onClick={() => {
                            setEditingItem(item);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteLineItemMutation.mutate(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Line Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gross Amount (USD)</Label>
                  <Input 
                    type="number"
                    value={editingItem.gross_amount_usd}
                    onChange={(e) => setEditingItem({...editingItem, gross_amount_usd: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Performer Share (%)</Label>
                  <Input 
                    type="number"
                    value={editingItem.performer_share_percent}
                    onChange={(e) => setEditingItem({...editingItem, performer_share_percent: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={editingItem.notes}
                  onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                />
              </div>
              <Button 
                onClick={handleUpdateLineItem}
                disabled={updateLineItemMutation.isPending}
                className="w-full"
              >
                {updateLineItemMutation.isPending ? 'Updating...' : 'Update Line Item'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}