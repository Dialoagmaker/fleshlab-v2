import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileSignature, 
  Copy, 
  ExternalLink, 
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LifecycleStep, ValidationSummary, ContractDetailsCard } from "../WorkflowComponents";

export default function WorkflowTab({ application, onRefresh }) {
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const queryClient = useQueryClient();

  // Fetch contract data
  const { data: contractData } = useQuery({
    queryKey: ['contract', application.contract_id],
    queryFn: async () => {
      if (!application.contract_id) return null;
      return await base44.entities.Contract.get(application.contract_id);
    },
    enabled: !!application.contract_id,
  });

  // Fetch performer profile
  const { data: performerProfile } = useQuery({
    queryKey: ['performerProfile', application.performer_id],
    queryFn: async () => {
      if (!application.performer_id) return null;
      const profiles = await base44.entities.PerformerProfilePrivate.filter({ 
        performer_id: application.performer_id 
      });
      return profiles?.[0] || null;
    },
    enabled: !!application.performer_id,
  });

  // Fetch compliance records
  const { data: complianceRecords } = useQuery({
    queryKey: ['complianceRecords', application.performer_id],
    queryFn: async () => {
      if (!application.performer_id) return [];
      return await base44.entities.ComplianceRecord.filter({ 
        performer_id: application.performer_id 
      });
    },
    enabled: !!application.performer_id,
  });

  // Validation checks
  const validation = useMemo(() => {
    const checks = [];
    const errors = [];

    if (application.media_upload_status === 'complete') {
      checks.push('Media uploads complete');
    } else {
      errors.push('Media uploads incomplete');
    }

    if (application.compliance_upload_status !== 'none') {
      checks.push('ID documents uploaded');
    } else {
      errors.push('ID documents not uploaded');
    }

    if (application.work_type && ['solo', 'pair', 'both'].includes(application.work_type)) {
      checks.push(`Work type: ${application.work_type}`);
    } else {
      errors.push('Work type missing or invalid');
    }

    if (application.preferred_revenue_model && application.preferred_revenue_model !== 'undecided') {
      checks.push(`Revenue model: ${application.preferred_revenue_model.replace(/_/g, ' ')}`);
    } else {
      errors.push('Revenue model undecided');
    }

    if (application.performer_id) {
      checks.push('Performer record exists');
    } else {
      errors.push('Performer not created');
    }

    if (performerProfile && (performerProfile.address_line_1 || performerProfile.city || performerProfile.country)) {
      checks.push('Address complete');
    } else if (performerProfile) {
      errors.push('Missing full residential address');
    }

    if (application.legal_name || application.email) {
      checks.push('Contact information present');
    } else {
      errors.push('Legal name or email missing');
    }

    return { checks, errors };
  }, [application, performerProfile]);

  const canGenerateContract = !contractData && 
                             application.performer_id && 
                             validation.errors.length === 0;

  const handleGenerateContract = async () => {
    setIsGeneratingContract(true);
    try {
      const response = await base44.functions.invoke('contractService', {
        action: 'create_from_application',
        application_id: application.id,
      });
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      const updates = {
        contract_id: response.contract_id,
        contract_status: 'draft',
        status: 'contract_pending',
        contract_generated_at: new Date().toISOString(),
      };
      
      await base44.entities.GuestProductionApplication.update(application.id, updates);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      if (onRefresh) onRefresh();
      
      toast.success(`Contract generated for "${application.applicant_name}"`);
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setIsGeneratingContract(false);
    }
  };

  const handleCopySigningLink = async () => {
    if (!contractData?.signing_url) return;
    try {
      await navigator.clipboard.writeText(contractData.signing_url);
      toast.success('Signing link copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleOpenSigningPage = () => {
    if (!contractData?.signing_url) return;
    window.open(contractData.signing_url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Workflow Lifecycle</h3>
          <p className="text-sm text-muted-foreground">Application onboarding progress</p>
        </div>
        <Badge variant={application.status === 'active' ? 'default' : 'outline'}>
          {application.status}
        </Badge>
      </div>

      {/* Blocking Issues */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Cannot generate contract:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {validation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Lifecycle Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lifecycle Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <LifecycleStep 
              step={{
                title: '1. Uploads Complete',
                status: application.media_upload_status === 'complete' ? 'complete' : 'pending',
                description: application.media_upload_status === 'complete' ? 'All media uploaded' : 'Waiting for uploads',
                badge: application.media_upload_status,
              }}
              isLast={false}
            />
            <LifecycleStep 
              step={{
                title: '2. Application Review',
                status: ['approved', 'contract_pending', 'contract_sent', 'contract_signed', 'performer_created', 'user_linked', 'active'].includes(application.status) ? 'complete' : 'pending',
                description: 'Pending admin review',
                badge: application.status,
              }}
              isLast={false}
            />
            <LifecycleStep 
              step={{
                title: '3. Performer Record',
                status: application.performer_id ? 'complete' : 'pending',
                description: application.performer_id ? 'Performer created' : 'Not created',
                badge: application.performer_id ? 'Created' : 'Missing',
              }}
              isLast={false}
            />
            <LifecycleStep 
              step={{
                title: '4. Private Profile',
                status: performerProfile && (performerProfile.address_line_1 || performerProfile.city) ? 'complete' : (performerProfile ? 'blocked' : 'pending'),
                description: performerProfile ? 'Address details' : 'Profile not created',
                badge: performerProfile ? (performerProfile.address_line_1 ? 'Complete' : 'Incomplete') : 'Missing',
              }}
              isLast={false}
            />
            <LifecycleStep 
              step={{
                title: '5. Compliance',
                status: complianceRecords && complianceRecords.length > 0 ? 'complete' : 'pending',
                description: complianceRecords?.length > 0 ? `${complianceRecords.length} record(s)` : 'No records',
                badge: complianceRecords?.length || 'Missing',
              }}
              isLast={false}
            />
            <LifecycleStep 
              step={{
                title: '6. Contract',
                status: contractData ? (contractData.status === 'signed' ? 'complete' : 'pending') : 'pending',
                description: contractData ? `Status: ${contractData.status}` : 'Not generated',
                badge: contractData ? contractData.status : 'None',
              }}
              isLast={false}
            />
            <LifecycleStep 
              step={{
                title: '7. User Account',
                status: application.linked_user_id ? 'complete' : 'pending',
                description: application.linked_user_id ? 'User linked' : 'Not linked',
                badge: application.linked_user_id ? 'Linked' : 'Missing',
              }}
              isLast={false}
            />
            <LifecycleStep 
              step={{
                title: '8. Dashboard Access',
                status: (application.linked_user_id && contractData?.status === 'signed') ? 'complete' : 'blocked',
                description: 'Blocked until user linked + contract signed',
                badge: (application.linked_user_id && contractData?.status === 'signed') ? 'Ready' : 'Blocked',
              }}
              isLast={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Validation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ValidationSummary checks={validation.checks} errors={validation.errors} />
        </CardContent>
      </Card>

      {/* Contract Details */}
      {contractData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSignature className="w-4 h-4" />
              Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContractDetailsCard 
              contract={contractData}
              onCopyLink={handleCopySigningLink}
              onOpenLink={handleOpenSigningPage}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!contractData ? (
            <Button 
              className="w-full" 
              onClick={handleGenerateContract}
              disabled={!canGenerateContract || isGeneratingContract}
            >
              {isGeneratingContract ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileSignature className="w-4 h-4 mr-2" />
                  Generate Contract
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" onClick={handleCopySigningLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button className="flex-1" variant="outline" onClick={handleOpenSigningPage}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
            </div>
          )}

          {!canGenerateContract && !contractData && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Cannot generate: {validation.errors[0] || 'Validation failed'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Status History */}
      {application.status_history && application.status_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {application.status_history.map((entry, idx) => {
                try {
                  const parsed = typeof entry === 'string' ? JSON.parse(entry) : entry;
                  return (
                    <div key={idx} className="text-xs text-muted-foreground p-2 bg-secondary rounded">
                      <span className="font-mono">
                        {new Date(parsed.timestamp).toLocaleString()}
                      </span>
                      : {parsed.action}
                    </div>
                  );
                } catch {
                  return null;
                }
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}