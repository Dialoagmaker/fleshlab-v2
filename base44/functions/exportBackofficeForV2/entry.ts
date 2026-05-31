import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * EXPORT BACKOFFICE DATA FOR V2 MIGRATION
 * 
 * This function prepares V1 backoffice data for migration to V2.
 * NOTE: V1 API does not expose backoffice endpoints via REST.
 * This function expects V1 data to be provided as uploaded files (CSV/JSON).
 * 
 * Usage:
 * 1. Export V1 data manually from V1 admin panel/database
 * 2. Upload files to V2 (performer-applications.json, performer-contracts.json, compliance-documents.json)
 * 3. Call this function to transform and validate data
 * 4. Run importBackofficeFromV1 to complete migration
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // This is a placeholder - actual implementation requires V1 data files
    // For now, return migration plan and requirements
    
    return Response.json({
      status: 'READY_FOR_EXPORT',
      message: 'V1 API does not expose backoffice endpoints. Manual data export required.',
      required_files: [
        {
          name: 'performer-applications.json',
          description: 'V1 PerformerApplication records',
          v2_mapping: 'GuestProductionApplication',
          required_fields: ['applicant_name', 'email', 'status', 'submitted_at'],
        },
        {
          name: 'performer-contracts.json',
          description: 'V1 PerformerContract records',
          v2_mapping: 'Contract',
          required_fields: ['performer_id', 'contract_type', 'status', 'signed_at'],
        },
        {
          name: 'compliance-documents.json',
          description: 'V1 PartnerComplianceDocument records',
          v2_mapping: 'ComplianceRecord',
          required_fields: ['performer_id', 'document_type', 'document_url', 'issued_at'],
        },
      ],
      export_instructions: {
        step_1: 'Export V1 data from V1 admin panel or database',
        step_2: 'Format as JSON arrays with consistent field names',
        step_3: 'Upload files to V2 using UploadFile integration',
        step_4: 'Call importBackofficeFromV1 with file URLs',
      },
      validation_checks: [
        'All performer_id values must match V1 performer IDs (will be mapped to V2 via v1_id)',
        'All file URLs must be accessible (may require R2 migration)',
        'Date fields must be ISO 8601 format',
        'Status values must be mapped to V2 enum values',
      ],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});