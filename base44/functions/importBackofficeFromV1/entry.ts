import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * IMPORT BACKOFFICE DATA FROM V1
 * 
 * Imports GuestProductionApplication, Contract, and ComplianceRecord entities from V1 exports.
 * Requires uploaded JSON files from V1 export.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const {
      applications_file_url,
      contracts_file_url,
      compliance_file_url,
      dry_run = true,
    } = payload;

    const results = {
      mode: dry_run ? 'DRY RUN' : 'LIVE IMPORT',
      stages: {},
      summary: {
        total_imported: 0,
        total_skipped: 0,
        total_errors: 0,
      },
      errors: [],
    };

    // Build v1_id to v2_id mapping for performers
    const performers = await base44.entities.Performer.list();
    const performerV1ToV2Map = new Map();
    performers.forEach(p => {
      if (p.v1_id) {
        performerV1ToV2Map.set(p.v1_id, p.id);
      }
    });

    // STAGE 1: Import GuestProductionApplication
    if (applications_file_url) {
      try {
        const response = await fetch(applications_file_url);
        const applicationsData = await response.json();
        const applications = Array.isArray(applicationsData) ? applicationsData : [];
        
        const imported = [];
        const skipped = [];
        const errors = [];

        for (const app of applications) {
          try {
            // Map V1 status to V2 status
            const statusMap = {
              'pending': 'pending',
              'reviewing': 'reviewing',
              'approved': 'approved',
              'rejected': 'rejected',
            };
            
            const v2Data = {
              applicant_name: app.applicant_name || app.name,
              email: app.email,
              phone: app.phone,
              nationality: app.nationality,
              message: app.message,
              package_interest: app.package_interest,
              id_document_url: app.id_document_url,
              status: statusMap[app.status] || 'pending',
              submitted_at: app.submitted_at || new Date().toISOString(),
              v1_id: app.id || app.v1_id,
            };

            if (dry_run) {
              imported.push(v2Data);
            } else {
              const created = await base44.entities.GuestProductionApplication.create(v2Data);
              imported.push(created);
            }
          } catch (err) {
            errors.push({ record: app, error: err.message });
          }
        }

        results.stages.applications = {
          source_file: applications_file_url,
          exported_count: applications.length,
          imported_count: imported.length,
          skipped_count: skipped.length,
          errors: errors,
        };
        results.summary.total_imported += imported.length;
        results.summary.total_errors += errors.length;

      } catch (error) {
        results.errors.push(`Failed to process applications file: ${error.message}`);
      }
    }

    // STAGE 2: Import Contracts
    if (contracts_file_url) {
      try {
        const response = await fetch(contracts_file_url);
        const contractsData = await response.json();
        const contracts = Array.isArray(contractsData) ? contractsData : [];
        
        const imported = [];
        const skipped = [];
        const errors = [];

        for (const contract of contracts) {
          try {
            // Map V1 performer_id to V2 performer_id
            const v2PerformerId = performerV1ToV2Map.get(contract.performer_id) || contract.performer_id;
            
            // Map V1 status to V2 status
            const statusMap = {
              'draft': 'draft',
              'sent': 'sent',
              'signed': 'signed',
              'expired': 'expired',
              'cancelled': 'cancelled',
            };

            // Merge signature data if available
            const signedAt = contract.signed_at || contract.signature?.signed_at;
            const documentUrl = contract.document_url || contract.signed_contract_url || contract.contract_document_url;

            const v2Data = {
              performer_id: v2PerformerId,
              contract_type: 'performer',
              title: contract.title || `Contract - ${contract.performer_id}`,
              status: statusMap[contract.status] || 'draft',
              signed_at: signedAt,
              expires_at: contract.expires_at,
              document_url: documentUrl,
              notes: contract.notes,
              v1_id: contract.id || contract.v1_id,
            };

            if (dry_run) {
              imported.push(v2Data);
            } else {
              const created = await base44.entities.Contract.create(v2Data);
              imported.push(created);
            }
          } catch (err) {
            errors.push({ record: contract, error: err.message });
          }
        }

        results.stages.contracts = {
          source_file: contracts_file_url,
          exported_count: contracts.length,
          imported_count: imported.length,
          skipped_count: skipped.length,
          errors: errors,
          note: 'performer_id mapped via v1_id lookup',
        };
        results.summary.total_imported += imported.length;
        results.summary.total_errors += errors.length;

      } catch (error) {
        results.errors.push(`Failed to process contracts file: ${error.message}`);
      }
    }

    // STAGE 3: Import ComplianceRecords
    if (compliance_file_url) {
      try {
        const response = await fetch(compliance_file_url);
        const complianceData = await response.json();
        const complianceRecords = Array.isArray(complianceData) ? complianceData : [];
        
        const imported = [];
        const skipped = [];
        const errors = [];

        for (const record of complianceRecords) {
          try {
            // Map V1 performer_id to V2 performer_id
            const v2PerformerId = performerV1ToV2Map.get(record.performer_id) || record.performer_id;
            
            // Map V1 document_type to V2 enum
            const typeMap = {
              'id': 'id',
              'identification': 'id',
              'medical': 'medical_test',
              'medical_test': 'medical_test',
              'std_test': 'std_test',
              'std': 'std_test',
              'background': 'background_check',
              'background_check': 'background_check',
              'work_permit': 'work_permit',
              'permit': 'work_permit',
              'other': 'other',
            };

            // Map V1 status to V2 status
            const statusMap = {
              'valid': 'valid',
              'active': 'valid',
              'expiring': 'expiring_soon',
              'expiring_soon': 'expiring_soon',
              'expired': 'expired',
              'revoked': 'revoked',
              'cancelled': 'revoked',
            };

            const v2Data = {
              performer_id: v2PerformerId,
              video_id: record.video_id,
              document_type: typeMap[record.document_type] || 'other',
              document_url: record.document_url,
              issued_at: record.issued_at || record.issue_date,
              expires_at: record.expires_at || record.expiry_date,
              status: statusMap[record.status] || 'valid',
              issuing_authority: record.issuing_authority,
              notes: record.notes,
              v1_id: record.id || record.v1_id,
            };

            if (dry_run) {
              imported.push(v2Data);
            } else {
              const created = await base44.entities.ComplianceRecord.create(v2Data);
              imported.push(created);
            }
          } catch (err) {
            errors.push({ record: record, error: err.message });
          }
        }

        results.stages.compliance = {
          source_file: compliance_file_url,
          exported_count: complianceRecords.length,
          imported_count: imported.length,
          skipped_count: skipped.length,
          errors: errors,
          note: 'performer_id mapped via v1_id lookup',
        };
        results.summary.total_imported += imported.length;
        results.summary.total_errors += errors.length;

      } catch (error) {
        results.errors.push(`Failed to process compliance file: ${error.message}`);
      }
    }

    // VALIDATION
    if (!dry_run) {
      const [finalApplications, finalContracts, finalCompliance] = await Promise.all([
        base44.entities.GuestProductionApplication.list(),
        base44.entities.Contract.list(),
        base44.entities.ComplianceRecord.list(),
      ]);

      results.validation = {
        guest_applications_total: finalApplications.length,
        contracts_total: finalContracts.length,
        compliance_records_total: finalCompliance.length,
      };
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});