import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, CheckCircle, DollarSign, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminEarnings() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedPerformer, setSelectedPerformer] = useState("");
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

  // Fetch performers
  const { data: performers } = useQuery({
    queryKey: ['performers-list'],
    queryFn: () => base44.entities.Performer.list()
  });

  // Fetch line items
  const { data: lineItemsData, isLoading } = useQuery({
    queryKey: ['admin-line-items', selectedPerformer, selectedMonth],
    queryFn: async () => {
      if (!selectedPerformer) return { line_items: [] };
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'get_line_items',
        performer_id: selectedPerformer,
        period_month: selectedMonth
      });
      return res.data;
    },
    enabled: !!selectedPerformer
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
      queryClient.invalidateQueries({ queryKey: ['admin-line-items'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-line-items'] });
      setIsEditModalOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ['admin-line-items'] });
      toast.success('Line item deleted successfully');
    }
  });

  const createCloseoutMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'create_monthly_closeout',
        performer_id: selectedPerformer,
        period_month: selectedMonth
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-line-items'] });
      toast.success(`Created ${data.video_revenue_count} line items from video revenue`);
    }
  });

  const approveCloseoutMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'approve_closeout',
        performer_id: selectedPerformer,
        period_month: selectedMonth
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-line-items'] });
      toast.success(`Approved ${data.approved_count} line items`);
    }
  });

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('performerEarningLineItemService', {
        action: 'mark_closeout_paid',
        performer_id: selectedPerformer,
        period_month: selectedMonth
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-line-items'] });
      toast.success(`Marked ${data.paid_count} line items as paid`);
    }
  });

  const handleAddLineItem = () => {
    const performerAmount = newLineItem.gross_amount_usd * (newLineItem.performer_share_percent / 100);
    const studioAmount = newLineItem.gross_amount_usd - performerAmount;
    
    addLineItemMutation.mutate({
      performer_id: selectedPerformer,
      period_month: selectedMonth,
      ...newLineItem,
      performer_amount_usd: performerAmount,
      studio_amount_usd: studioAmount
    });
  };

  const handleUpdateLineItem = () => {
    const performerAmount = editingItem.gross_amount_usd * (editingItem.performer_share_percent / 100);
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

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performer Earnings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage income line items and monthly closeout</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Performer</Label>
              <Select value={selectedPerformer} onValueChange={setSelectedPerformer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select performer" />
                </SelectTrigger>
                <SelectContent>
                  {performers?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Period Month</Label>
              <Input 
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {selectedPerformer && lineItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totals.gross.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total gross revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performer Share</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${totals.performer.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total performer earnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Studio Share</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totals.studio.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Studio revenue share</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      {selectedPerformer && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => createCloseoutMutation.mutate()}
                disabled={!selectedMonth}
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Monthly Closeout
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => approveCloseoutMutation.mutate()}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Closeout
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => markPaidMutation.mutate()}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line Items Table */}
      {selectedPerformer && (
        <Card>
          <CardHeader>
            <CardTitle>Line Items ({lineItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading line items...</p>
            ) : lineItems.length === 0 ? (
              <div className="bg-muted rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">No line items for this period</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Click "Create Monthly Closeout" to auto-generate from VideoStatSnapshot, or "Add Line Item" for manual entry
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Source Type</th>
                      <th className="text-left p-2">Platform</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Gross</th>
                      <th className="text-right p-2">Performer %</th>
                      <th className="text-right p-2">Performer Amt</th>
                      <th className="text-right p-2">Studio Amt</th>
                      <th className="text-center p-2">Status</th>
                      <th className="text-center p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{item.source_type}</td>
                        <td className="p-2">
                          <span className="text-xs bg-secondary px-2 py-1 rounded">{item.source_platform}</span>
                        </td>
                        <td className="p-2 max-w-[200px] truncate">{item.description}</td>
                        <td className="text-right p-2 font-medium">${item.gross_amount_usd?.toFixed(2)}</td>
                        <td className="text-right p-2">{item.performer_share_percent}%</td>
                        <td className="text-right p-2 font-medium text-green-500">${item.performer_amount_usd?.toFixed(2)}</td>
                        <td className="text-right p-2 font-medium">${item.studio_amount_usd?.toFixed(2)}</td>
                        <td className="text-center p-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            item.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                            item.status === 'paid' ? 'bg-blue-500/10 text-blue-500' :
                            item.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="text-center p-2">
                          <div className="flex justify-center gap-1">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Line Item Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
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

      {/* Edit Line Item Modal */}
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
                  value={editingItem.notes || ''}
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