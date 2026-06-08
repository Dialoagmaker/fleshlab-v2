import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, Link as LinkIcon, Zap } from "lucide-react";

export default function WorkflowTab({ selectedApp, handleStatusUpdate, setIsCreatePerformerOpen, setIsLinkUserOpen }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Workflow Actions</h3>
      <div className="flex flex-wrap gap-2">
        {selectedApp.status === 'approved' && (
          <Button size="sm" onClick={() => handleStatusUpdate(selectedApp.id, 'contract_pending')}>Mark Contract Pending</Button>
        )}
        {selectedApp.status === 'contract_pending' && (
          <Button size="sm" onClick={() => handleStatusUpdate(selectedApp.id, 'contract_sent')}>Mark Contract Sent</Button>
        )}
        {selectedApp.status === 'contract_sent' && (
          <Button size="sm" onClick={() => handleStatusUpdate(selectedApp.id, 'contract_signed')}>Mark Contract Signed</Button>
        )}
        {selectedApp.status === 'contract_signed' && !selectedApp.performer_id && (
          <Button size="sm" onClick={() => setIsCreatePerformerOpen(true)}><UserPlus className="w-4 h-4 mr-2" />Create Performer</Button>
        )}
        {selectedApp.performer_id && (
            <div className="text-xs text-green-400">Performer created: {selectedApp.performer_id}</div>
        )}
        {selectedApp.status === 'performer_created' && (
          <Button size="sm" onClick={() => setIsLinkUserOpen(true)}><LinkIcon className="w-4 h-4 mr-2" />Link User</Button>
        )}
        {selectedApp.status === 'user_linked' && (
          <Button size="sm" onClick={() => handleStatusUpdate(selectedApp.id, 'active')}><Zap className="w-4 h-4 mr-2" />Activate Performer</Button>
        )}
      </div>
      <h4 className="font-semibold pt-4 border-t border-border">Status History</h4>
      <div className="text-xs font-mono bg-secondary p-2 rounded max-h-60 overflow-y-auto">
        {selectedApp.status_history?.map((item, index) => {
          try {
            const log = JSON.parse(item);
            return <div key={index}>{log.timestamp}: {log.action}</div>
          } catch (e) {
            return <div key={index}>{item}</div>
          }
        }) || 'No history'}
      </div>
    </div>
  );
}