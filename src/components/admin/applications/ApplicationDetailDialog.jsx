import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import InfoTab from "./tabs/InfoTab";
import MediaTab from "./tabs/MediaTab";
import IDTab from "./tabs/IDTab";
import WorkflowTab from "./tabs/WorkflowTab";
import NotesTab from "./tabs/NotesTab";
import ContactTab from "./tabs/ContactTab";
import ApplicationReadinessSummary from "./ApplicationReadinessSummary";

export default function ApplicationDetailDialog({ isOpen, onClose, selectedApp, updateMutation, handleStatusUpdate }) {
  if (!selectedApp) return null;

  const canApprove = ['reviewing', 'contacted', 'more_info_requested'].includes(selectedApp.status);
  const canRequestMoreInfo = ['reviewing', 'pending', 'media_pending'].includes(selectedApp.status);
  const canReject = !['rejected', 'active', 'contract_signed', 'performer_created', 'user_linked'].includes(selectedApp.status);
  
  // Sync button: Only show if contract exists, is signed, but application not synced
  const showSyncButton = selectedApp.contract_id && 
                         selectedApp.contract_status !== 'signed' &&
                         ['contract_pending', 'contract_sent'].includes(selectedApp.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle>Application: {selectedApp.applicant_name}</DialogTitle>
            <div className="flex gap-2">
              {canRequestMoreInfo && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      const event = new CustomEvent('open-more-info-modal');
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                >
                  Request Info
                </Button>
              )}
              {canApprove && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedApp.id, 'approved')}
                >
                  Approve
                </Button>
              )}
              {canReject && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      const event = new CustomEvent('open-reject-modal');
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                >
                  Reject
                </Button>
              )}
              {showSyncButton && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const event = new CustomEvent('sync-contract-status', { detail: selectedApp });
                    window.dispatchEvent(event);
                  }}
                  title="Sync application status with signed contract"
                >
                  Sync Signed Contract
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        {/* Upload Readiness Summary - Top of Dialog */}
        <ApplicationReadinessSummary application={selectedApp} />
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="id">ID Documents</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="mt-4">
            <InfoTab application={selectedApp} />
          </TabsContent>
          
          <TabsContent value="media" className="mt-4">
            <MediaTab application={selectedApp} />
          </TabsContent>
          
          <TabsContent value="id" className="mt-4">
            <IDTab application={selectedApp} />
          </TabsContent>
          
          <TabsContent value="workflow" className="mt-4">
            <WorkflowTab 
              application={selectedApp} 
              handleStatusUpdate={handleStatusUpdate}
            />
          </TabsContent>
          
          <TabsContent value="notes" className="mt-4">
            <NotesTab application={selectedApp} updateMutation={updateMutation} />
          </TabsContent>
          
          <TabsContent value="contact" className="mt-4">
            <ContactTab application={selectedApp} updateMutation={updateMutation} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}