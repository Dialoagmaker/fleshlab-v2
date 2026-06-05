import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export default function AddLineItemModal({ 
  isOpen, 
  onOpenChange, 
  newLineItem, 
  setNewLineItem, 
  onAdd, 
  isPending 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            onClick={onAdd}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Adding...' : 'Add Line Item'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}